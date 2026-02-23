<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\SupplyRequestData;
use App\Enums\StockMovementType;
use App\Enums\SupplyRequestStatus;
use App\Http\Controllers\Controller;
use App\Models\Logistics\StockMovement;
use App\Models\Logistics\SupplyRequest;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Product\Product;
use Illuminate\Http\RedirectResponse;
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
            'products' => Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
        ]);
    }

    public function store(SupplyRequestData $data): RedirectResponse
    {
        $this->authorize('create', SupplyRequest::class);

        $supplyRequest = SupplyRequest::create([
            'reference' => 'SR-'.strtoupper(Str::random(8)),
            'status' => SupplyRequestStatus::Pending,
            'notes' => $data->notes,
            'source_warehouse_id' => $data->source_warehouse_id,
            'destination_warehouse_id' => $data->destination_warehouse_id,
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

        foreach ($supplyRequest->items as $item) {
            $movement = StockMovement::create([
                'reference' => 'MOV-'.strtoupper(Str::random(8)),
                'type' => StockMovementType::WarehouseToWarehouse,
                'quantity' => $item->quantity_requested,
                'reason' => "Approvisionnement {$supplyRequest->reference}",
                'product_id' => $item->product_id,
                'source_warehouse_id' => $supplyRequest->source_warehouse_id,
                'destination_warehouse_id' => $supplyRequest->destination_warehouse_id,
                'supply_request_id' => $supplyRequest->id,
                'company_id' => $supplyRequest->company_id,
                'created_by' => auth()->id(),
            ]);

            $this->applyTransferStock($movement);

            $item->update(['quantity_delivered' => $item->quantity_requested]);
        }

        $supplyRequest->update([
            'status' => SupplyRequestStatus::Delivered,
            'delivered_at' => now(),
        ]);

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

    private function applyTransferStock(StockMovement $movement): void
    {
        if ($movement->source_warehouse_id) {
            $sourceStock = WarehouseStock::withoutGlobalScopes()
                ->where('product_id', $movement->product_id)
                ->where('warehouse_id', $movement->source_warehouse_id)
                ->first();

            if ($sourceStock) {
                $sourceStock->decrement('quantity', min($movement->quantity, $sourceStock->quantity));
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
