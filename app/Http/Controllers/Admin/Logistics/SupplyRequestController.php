<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\SupplyRequestData;
use App\Enums\StockMovementType;
use App\Enums\SupplyRequestStatus;
use App\Enums\SupplyType;
use App\Http\Controllers\Controller;
use App\Models\Logistics\StockMovement;
use App\Models\Logistics\Supplier;
use App\Models\Logistics\SupplyRequest;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SupplyRequestController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', SupplyRequest::class);

        $requests = SupplyRequest::query()
            ->with([
                'sourceWarehouse:id,name,code',
                'destinationWarehouse:id,name,code',
                'supplier:id,name,code',
                'createdBy:id,name',
                'approvedBy:id,name',
            ])
            ->withCount('items')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/logistics/supply-requests/index', [
            'supplyRequests' => $requests,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', SupplyRequest::class);

        return Inertia::render('admin/logistics/supply-requests/create', [
            'warehouses' => Warehouse::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'suppliers' => Supplier::query()->select(['id', 'name', 'code'])->where('is_active', true)->orderBy('name')->get(),
            'products' => Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'categories' => ProductCategory::query()->select(['id', 'name'])->orderBy('name')->get(),
            'supplyTypes' => SupplyType::cases(),
        ]);
    }

    public function store(SupplyRequestData $data): RedirectResponse
    {
        $this->authorize('create', SupplyRequest::class);

        $type = SupplyType::from($data->type);

        if ($type === SupplyType::SupplierToWarehouse && ! $data->supplier_id) {
            return back()->withErrors(['supplier_id' => 'Le fournisseur est requis pour ce type d\'approvisionnement.']);
        }

        if ($type === SupplyType::SupplierToWarehouse && ! $data->destination_warehouse_id) {
            return back()->withErrors(['destination_warehouse_id' => 'L\'entrepôt destination est requis.']);
        }

        if ($type === SupplyType::WarehouseToWarehouse && ! $data->source_warehouse_id) {
            return back()->withErrors(['source_warehouse_id' => 'L\'entrepôt source est requis.']);
        }

        if ($type === SupplyType::WarehouseToWarehouse && ! $data->destination_warehouse_id) {
            return back()->withErrors(['destination_warehouse_id' => 'L\'entrepôt destination est requis.']);
        }

        $supplyRequest = SupplyRequest::create([
            'reference' => 'SR-'.strtoupper(Str::random(8)),
            'type' => $type,
            'status' => SupplyRequestStatus::Pending,
            'notes' => $data->notes,
            'source_warehouse_id' => $type === SupplyType::WarehouseToWarehouse ? $data->source_warehouse_id : null,
            'destination_warehouse_id' => $data->destination_warehouse_id,
            'supplier_id' => $type === SupplyType::SupplierToWarehouse ? $data->supplier_id : null,
            'created_by' => auth()->id(),
        ]);

        foreach ($data->items as $item) {
            $supplyRequest->items()->create([
                'product_id' => $item->product_id,
                'quantity_requested' => $item->quantity_requested,
            ]);
        }

        return to_route('admin.logistics.supply-requests.show', $supplyRequest)
            ->with('success', 'Demande d\'approvisionnement créée avec succès.');
    }

    public function show(SupplyRequest $supplyRequest): Response
    {
        $this->authorize('view', $supplyRequest);

        $supplyRequest->load([
            'sourceWarehouse:id,name,code',
            'destinationWarehouse:id,name,code',
            'supplier:id,name,code',
            'createdBy:id,name',
            'approvedBy:id,name',
            'items.product:id,name,code',
            'stockMovements',
            'logisticCharges',
        ]);

        return Inertia::render('admin/logistics/supply-requests/show', [
            'supplyRequest' => $supplyRequest,
        ]);
    }

    public function approve(SupplyRequest $supplyRequest): RedirectResponse
    {
        $this->authorize('approve', $supplyRequest);

        if ($supplyRequest->status !== SupplyRequestStatus::Pending) {
            return back()->with('error', 'Cette demande ne peut pas être approuvée.');
        }

        $supplyRequest->update([
            'status' => SupplyRequestStatus::Approved,
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return back()->with('success', 'Demande approuvée avec succès.');
    }

    public function deliver(SupplyRequest $supplyRequest): RedirectResponse
    {
        $this->authorize('approve', $supplyRequest);

        if ($supplyRequest->status !== SupplyRequestStatus::Approved) {
            return back()->with('error', 'Cette demande doit être approuvée avant livraison.');
        }

        $supplyRequest->load('items.product');

        if ($supplyRequest->type === SupplyType::WarehouseToWarehouse) {
            $insufficientItems = [];

            foreach ($supplyRequest->items as $item) {
                $sourceStock = WarehouseStock::withoutGlobalScopes()
                    ->where('product_id', $item->product_id)
                    ->where('warehouse_id', $supplyRequest->source_warehouse_id)
                    ->first();

                $availableQty = $sourceStock?->quantity ?? 0;

                if ($availableQty < $item->quantity_requested) {
                    $insufficientItems[] = "{$item->product->name} (demandé: {$item->quantity_requested}, disponible: {$availableQty})";
                }
            }

            if (! empty($insufficientItems)) {
                return back()->with('error', 'Stock insuffisant pour : '.implode(', ', $insufficientItems));
            }
        }

        DB::transaction(function () use ($supplyRequest) {
            foreach ($supplyRequest->items as $item) {
                $movementType = $supplyRequest->type === SupplyType::SupplierToWarehouse
                    ? StockMovementType::PurchaseEntry
                    : StockMovementType::WarehouseToWarehouse;

                $movement = StockMovement::create([
                    'reference' => 'MOV-'.strtoupper(Str::random(8)),
                    'type' => $movementType,
                    'quantity' => $item->quantity_requested,
                    'reason' => "Approvisionnement {$supplyRequest->reference}",
                    'product_id' => $item->product_id,
                    'source_warehouse_id' => $supplyRequest->source_warehouse_id,
                    'destination_warehouse_id' => $supplyRequest->destination_warehouse_id,
                    'supplier_id' => $supplyRequest->supplier_id,
                    'supply_request_id' => $supplyRequest->id,
                    'company_id' => $supplyRequest->company_id,
                    'created_by' => auth()->id(),
                ]);

                $this->applySupplyStock($movement, $supplyRequest->type);

                $item->update(['quantity_delivered' => $item->quantity_requested]);
            }

            $supplyRequest->update([
                'status' => SupplyRequestStatus::Delivered,
                'delivered_at' => now(),
            ]);
        });

        return back()->with('success', 'Approvisionnement livré avec succès.');
    }

    public function reject(SupplyRequest $supplyRequest): RedirectResponse
    {
        $this->authorize('approve', $supplyRequest);

        if ($supplyRequest->status !== SupplyRequestStatus::Pending) {
            return back()->with('error', 'Cette demande ne peut pas être rejetée.');
        }

        $supplyRequest->update([
            'status' => SupplyRequestStatus::Rejected,
        ]);

        return back()->with('success', 'Demande rejetée.');
    }

    private function applySupplyStock(StockMovement $movement, SupplyType $type): void
    {
        if ($type === SupplyType::WarehouseToWarehouse && $movement->source_warehouse_id) {
            $sourceStock = WarehouseStock::withoutGlobalScopes()
                ->where('product_id', $movement->product_id)
                ->where('warehouse_id', $movement->source_warehouse_id)
                ->first();

            if ($sourceStock) {
                $sourceStock->decrement('quantity', $movement->quantity);
            }
        }

        if ($movement->destination_warehouse_id) {
            $destStock = WarehouseStock::withoutGlobalScopes()
                ->firstOrCreate(
                    [
                        'product_id' => $movement->product_id,
                        'warehouse_id' => $movement->destination_warehouse_id,
                    ],
                    [
                        'company_id' => $movement->company_id,
                        'quantity' => 0,
                    ]
                );

            $destStock->increment('quantity', $movement->quantity);
        }
    }
}
