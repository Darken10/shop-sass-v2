<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\TransferData;
use App\Enums\StockMovementType;
use App\Enums\TransferStatus;
use App\Enums\TransferType;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Shop;
use App\Models\Logistics\ShopStock;
use App\Models\Logistics\StockMovement;
use App\Models\Logistics\Transfer;
use App\Models\Logistics\TransferItem;
use App\Models\Logistics\Vehicle;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Product\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TransferController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Transfer::class);

        $transfers = Transfer::query()
            ->with([
                'sourceWarehouse:id,name,code',
                'destinationWarehouse:id,name,code',
                'destinationShop:id,name,code',
                'createdBy:id,name',
            ])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/logistics/transfers/index', [
            'transfers' => $transfers,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Transfer::class);

        return Inertia::render('admin/logistics/transfers/create', [
            'warehouses' => Warehouse::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'shops' => Shop::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'products' => Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'vehicles' => Vehicle::query()->select(['id', 'name', 'registration_number'])->orderBy('name')->get(),
            'transferTypes' => TransferType::cases(),
        ]);
    }

    public function store(TransferData $data): RedirectResponse
    {
        $this->authorize('create', Transfer::class);

        $insufficientItems = [];

        foreach ($data->items as $item) {
            $sourceStock = WarehouseStock::withoutGlobalScopes()
                ->where('product_id', $item['product_id'])
                ->where('warehouse_id', $data->source_warehouse_id)
                ->first();

            $availableQty = $sourceStock?->quantity ?? 0;
            $requestedQty = (int) $item['quantity_requested'];

            if ($availableQty < $requestedQty) {
                $product = Product::withoutGlobalScopes()->find($item['product_id']);
                $productName = $product?->name ?? $item['product_id'];
                $insufficientItems[] = "{$productName} (demandé: {$requestedQty}, disponible: {$availableQty})";
            }
        }

        if (! empty($insufficientItems)) {
            return back()
                ->withInput()
                ->withErrors(['items' => 'Stock insuffisant pour : '.implode(', ', $insufficientItems)]);
        }

        $transfer = Transfer::create([
            'reference' => 'TRF-'.strtoupper(Str::random(8)),
            'type' => $data->type,
            'status' => TransferStatus::Pending,
            'notes' => $data->notes,
            'source_warehouse_id' => $data->source_warehouse_id,
            'destination_warehouse_id' => $data->destination_warehouse_id,
            'destination_shop_id' => $data->destination_shop_id,
            'vehicle_id' => $data->vehicle_id,
            'created_by' => auth()->id(),
        ]);

        foreach ($data->items as $item) {
            TransferItem::create([
                'product_id' => $item['product_id'],
                'quantity_requested' => $item['quantity_requested'],
                'transfer_id' => $transfer->id,
            ]);
        }

        return to_route('admin.logistics.transfers.show', $transfer)
            ->with('success', 'Transfert créé avec succès.');
    }

    public function show(Transfer $transfer): Response
    {
        $this->authorize('view', $transfer);

        $transfer->load([
            'sourceWarehouse:id,name,code',
            'destinationWarehouse:id,name,code',
            'destinationShop:id,name,code',
            'vehicle:id,name,registration_number',
            'approvedBy:id,name',
            'createdBy:id,name',
            'items.product:id,name,code',
        ]);

        return Inertia::render('admin/logistics/transfers/show', [
            'transfer' => $transfer,
        ]);
    }

    public function approve(Transfer $transfer): RedirectResponse
    {
        $this->authorize('approve', $transfer);

        $transfer->update([
            'status' => TransferStatus::Approved,
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return back()->with('success', 'Transfert approuvé avec succès.');
    }

    public function ship(Transfer $transfer): RedirectResponse
    {
        $this->authorize('update', $transfer);

        $transfer->update([
            'status' => TransferStatus::InTransit,
            'shipped_at' => now(),
        ]);

        return back()->with('success', 'Transfert expédié avec succès.');
    }

    public function deliver(Transfer $transfer): RedirectResponse
    {
        $this->authorize('update', $transfer);

        if (! in_array($transfer->status, [TransferStatus::Approved, TransferStatus::InTransit])) {
            return back()->with('error', 'Ce transfert doit être approuvé ou en transit avant livraison.');
        }

        $transfer->load('items.product');

        $insufficientItems = [];

        foreach ($transfer->items as $item) {
            $sourceStock = WarehouseStock::withoutGlobalScopes()
                ->where('product_id', $item->product_id)
                ->where('warehouse_id', $transfer->source_warehouse_id)
                ->first();

            $availableQty = $sourceStock?->quantity ?? 0;

            if ($availableQty < $item->quantity_requested) {
                $insufficientItems[] = "{$item->product->name} (demandé: {$item->quantity_requested}, disponible: {$availableQty})";
            }
        }

        if (! empty($insufficientItems)) {
            return back()->with('error', 'Stock insuffisant pour : '.implode(', ', $insufficientItems));
        }

        DB::transaction(function () use ($transfer) {
            foreach ($transfer->items as $item) {
                $qty = $item->quantity_requested;

                $sourceStock = WarehouseStock::withoutGlobalScopes()
                    ->where('product_id', $item->product_id)
                    ->where('warehouse_id', $transfer->source_warehouse_id)
                    ->first();

                if ($sourceStock) {
                    $sourceStock->decrement('quantity', $qty);
                }

                if ($transfer->type === TransferType::WarehouseToShop && $transfer->destination_shop_id) {
                    $destStock = ShopStock::withoutGlobalScopes()
                        ->firstOrCreate(
                            [
                                'product_id' => $item->product_id,
                                'shop_id' => $transfer->destination_shop_id,
                            ],
                            [
                                'company_id' => $transfer->company_id,
                                'quantity' => 0,
                            ]
                        );
                    $destStock->increment('quantity', $qty);
                } elseif ($transfer->type === TransferType::WarehouseToWarehouse && $transfer->destination_warehouse_id) {
                    $destStock = WarehouseStock::withoutGlobalScopes()
                        ->firstOrCreate(
                            [
                                'product_id' => $item->product_id,
                                'warehouse_id' => $transfer->destination_warehouse_id,
                            ],
                            [
                                'company_id' => $transfer->company_id,
                                'quantity' => 0,
                            ]
                        );
                    $destStock->increment('quantity', $qty);
                }

                StockMovement::create([
                    'reference' => 'MOV-'.strtoupper(Str::random(8)),
                    'type' => $transfer->type === TransferType::WarehouseToShop
                        ? StockMovementType::WarehouseToShop
                        : StockMovementType::WarehouseToWarehouse,
                    'quantity' => $qty,
                    'reason' => "Transfert {$transfer->reference}",
                    'product_id' => $item->product_id,
                    'source_warehouse_id' => $transfer->source_warehouse_id,
                    'destination_warehouse_id' => $transfer->destination_warehouse_id,
                    'destination_shop_id' => $transfer->destination_shop_id,
                    'transfer_id' => $transfer->id,
                    'company_id' => $transfer->company_id,
                    'created_by' => auth()->id(),
                ]);

                $item->update(['quantity_delivered' => $qty]);
            }

            $transfer->update([
                'status' => TransferStatus::Delivered,
                'delivered_at' => now(),
            ]);
        });

        return back()->with('success', 'Transfert livré avec succès.');
    }

    public function reject(Transfer $transfer): RedirectResponse
    {
        $this->authorize('approve', $transfer);

        $transfer->update([
            'status' => TransferStatus::Rejected,
        ]);

        return back()->with('success', 'Transfert rejeté.');
    }
}
