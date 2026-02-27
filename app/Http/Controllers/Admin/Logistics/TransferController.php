<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\TransferData;
use App\Enums\LogisticChargeType;
use App\Enums\StockMovementType;
use App\Enums\TransferStatus;
use App\Enums\TransferType;
use App\Http\Controllers\Controller;
use App\Models\Logistics\LogisticCharge;
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
use Illuminate\Http\Request;
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
            'chargeTypes' => collect(LogisticChargeType::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    public function store(TransferData $data): RedirectResponse
    {
        $this->authorize('create', Transfer::class);

        $isDraft = $data->is_draft;
        $status = $isDraft ? TransferStatus::Draft : TransferStatus::Pending;

        // Stock validation only for non-draft
        if (! $isDraft) {
            $insufficientItems = $this->validateStockAvailability($data->items, $data->source_warehouse_id);

            if (! empty($insufficientItems)) {
                return back()
                    ->withInput()
                    ->withErrors(['items' => 'Stock insuffisant pour : '.implode(', ', $insufficientItems)]);
            }
        }

        $transfer = Transfer::create([
            'reference' => 'TRF-'.strtoupper(Str::random(8)),
            'type' => $data->type,
            'status' => $status,
            'notes' => $data->notes,
            'company_bears_costs' => $data->company_bears_costs,
            'driver_name' => $data->driver_name,
            'driver_phone' => $data->driver_phone,
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

        // Save logistic charges if company bears costs
        if ($data->company_bears_costs && ! empty($data->charges)) {
            foreach ($data->charges as $charge) {
                LogisticCharge::create([
                    'label' => $charge['label'],
                    'type' => $charge['type'],
                    'amount' => $charge['amount'],
                    'notes' => $charge['notes'] ?? null,
                    'transfer_id' => $transfer->id,
                    'created_by' => auth()->id(),
                ]);
            }
        }

        $message = $isDraft
            ? 'Brouillon enregistré avec succès.'
            : 'Transfert créé avec succès.';

        return to_route('admin.logistics.transfers.show', $transfer)
            ->with('success', $message);
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
            'receivedBy:id,name',
            'createdBy:id,name',
            'items.product:id,name,code',
            'logisticCharges',
            'fuelLogs.vehicle:id,name,registration_number',
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

        if ($transfer->status !== TransferStatus::Approved) {
            return back()->with('error', 'Ce transfert doit être approuvé avant expédition.');
        }

        $transfer->load('items');

        DB::transaction(function () use ($transfer) {
            foreach ($transfer->items as $item) {
                $item->update(['quantity_delivered' => $item->quantity_requested]);
            }

            $transfer->update([
                'status' => TransferStatus::InTransit,
                'shipped_at' => now(),
            ]);
        });

        return back()->with('success', 'Transfert expédié avec succès.');
    }

    /**
     * Show the receive form page for a transfer.
     */
    public function showReceive(Transfer $transfer): Response
    {
        $this->authorize('update', $transfer);

        if (! in_array($transfer->status, [TransferStatus::InTransit, TransferStatus::Delivered])) {
            return to_route('admin.logistics.transfers.show', $transfer);
        }

        $transfer->load([
            'sourceWarehouse:id,name,code',
            'destinationWarehouse:id,name,code',
            'destinationShop:id,name,code',
            'items.product:id,name,code',
            'createdBy:id,name',
        ]);

        return Inertia::render('admin/logistics/transfers/receive', [
            'transfer' => $transfer,
        ]);
    }

    /**
     * Receive a transfer at the destination.
     * Records actual received quantities, mandatory discrepancy notes, and updates stock.
     */
    public function receive(Transfer $transfer, Request $request): RedirectResponse
    {
        $this->authorize('update', $transfer);

        if (! in_array($transfer->status, [TransferStatus::InTransit, TransferStatus::Delivered])) {
            return back()->with('error', 'Ce transfert doit être en transit ou livré avant réception.');
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'uuid'],
            'items.*.quantity_received' => ['required', 'integer', 'min:0'],
            'items.*.discrepancy_note' => ['nullable', 'string'],
        ]);

        $transfer->load('items.product');

        // Validate: discrepancy note is mandatory when quantities differ
        $errors = [];
        foreach ($validated['items'] as $idx => $receivedItem) {
            $transferItem = $transfer->items->firstWhere('id', $receivedItem['item_id']);

            if (! $transferItem) {
                $errors["items.{$idx}.item_id"] = 'Article introuvable.';

                continue;
            }

            $delivered = $transferItem->quantity_delivered ?? $transferItem->quantity_requested;

            if ((int) $receivedItem['quantity_received'] !== $delivered && empty($receivedItem['discrepancy_note'])) {
                $errors["items.{$idx}.discrepancy_note"] = "Une explication est requise pour l'écart sur {$transferItem->product->name}.";
            }
        }

        if (! empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        DB::transaction(function () use ($transfer, $validated) {
            foreach ($validated['items'] as $receivedItem) {
                $transferItem = $transfer->items->firstWhere('id', $receivedItem['item_id']);

                if (! $transferItem) {
                    continue;
                }

                $qty = (int) $receivedItem['quantity_received'];

                $transferItem->update([
                    'quantity_received' => $qty,
                    'discrepancy_note' => $receivedItem['discrepancy_note'] ?? null,
                ]);

                // Decrement source warehouse stock
                $sourceStock = WarehouseStock::withoutGlobalScopes()
                    ->where('product_id', $transferItem->product_id)
                    ->where('warehouse_id', $transfer->source_warehouse_id)
                    ->first();

                if ($sourceStock) {
                    $sourceStock->decrement('quantity', $qty);
                }

                // Increment destination stock
                if ($transfer->type === TransferType::WarehouseToShop && $transfer->destination_shop_id) {
                    $destStock = ShopStock::withoutGlobalScopes()
                        ->firstOrCreate(
                            [
                                'product_id' => $transferItem->product_id,
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
                                'product_id' => $transferItem->product_id,
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
                    'reason' => "Réception transfert {$transfer->reference}",
                    'product_id' => $transferItem->product_id,
                    'source_warehouse_id' => $transfer->source_warehouse_id,
                    'destination_warehouse_id' => $transfer->destination_warehouse_id,
                    'destination_shop_id' => $transfer->destination_shop_id,
                    'transfer_id' => $transfer->id,
                    'company_id' => $transfer->company_id,
                    'created_by' => auth()->id(),
                ]);
            }

            $transfer->update([
                'status' => TransferStatus::Received,
                'received_at' => now(),
                'received_by' => auth()->id(),
            ]);
        });

        return to_route('admin.logistics.transfers.show', $transfer)
            ->with('success', 'Transfert réceptionné avec succès.');
    }

    /**
     * Mark as delivered (expedition confirmed at destination).
     * Stock is now managed in receive() instead.
     */
    public function deliver(Transfer $transfer): RedirectResponse
    {
        $this->authorize('update', $transfer);

        if (! in_array($transfer->status, [TransferStatus::Approved, TransferStatus::InTransit])) {
            return back()->with('error', 'Ce transfert doit être approuvé ou en transit avant livraison.');
        }

        $transfer->update([
            'status' => TransferStatus::Delivered,
            'delivered_at' => now(),
        ]);

        return back()->with('success', 'Transfert marqué comme livré.');
    }

    public function reject(Transfer $transfer): RedirectResponse
    {
        $this->authorize('approve', $transfer);

        $transfer->update([
            'status' => TransferStatus::Rejected,
        ]);

        return back()->with('success', 'Transfert rejeté.');
    }

    /**
     * Submit a draft transfer as pending.
     */
    public function submit(Transfer $transfer): RedirectResponse
    {
        $this->authorize('update', $transfer);

        if ($transfer->status !== TransferStatus::Draft) {
            return back()->with('error', 'Seul un brouillon peut être soumis.');
        }

        $transfer->load('items');

        $insufficientItems = [];
        foreach ($transfer->items as $item) {
            $sourceStock = WarehouseStock::withoutGlobalScopes()
                ->where('product_id', $item->product_id)
                ->where('warehouse_id', $transfer->source_warehouse_id)
                ->first();

            $availableQty = $sourceStock?->quantity ?? 0;

            if ($availableQty < $item->quantity_requested) {
                $product = Product::withoutGlobalScopes()->find($item->product_id);
                $insufficientItems[] = "{$product?->name} (demandé: {$item->quantity_requested}, disponible: {$availableQty})";
            }
        }

        if (! empty($insufficientItems)) {
            return back()->with('error', 'Stock insuffisant pour : '.implode(', ', $insufficientItems));
        }

        $transfer->update(['status' => TransferStatus::Pending]);

        return back()->with('success', 'Transfert soumis avec succès.');
    }

    /**
     * @return array<string>
     */
    private function validateStockAvailability(array $items, string $sourceWarehouseId): array
    {
        $insufficientItems = [];

        foreach ($items as $item) {
            $sourceStock = WarehouseStock::withoutGlobalScopes()
                ->where('product_id', $item['product_id'])
                ->where('warehouse_id', $sourceWarehouseId)
                ->first();

            $availableQty = $sourceStock?->quantity ?? 0;
            $requestedQty = (int) $item['quantity_requested'];

            if ($availableQty < $requestedQty) {
                $product = Product::withoutGlobalScopes()->find($item['product_id']);
                $productName = $product?->name ?? $item['product_id'];
                $insufficientItems[] = "{$productName} (demandé: {$requestedQty}, disponible: {$availableQty})";
            }
        }

        return $insufficientItems;
    }
}
