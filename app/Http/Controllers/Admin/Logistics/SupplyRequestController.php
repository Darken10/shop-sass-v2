<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\SupplyRequestData;
use App\Enums\LogisticChargeType;
use App\Enums\StockMovementType;
use App\Enums\SupplyRequestStatus;
use App\Enums\SupplyType;
use App\Http\Controllers\Controller;
use App\Models\Logistics\LogisticCharge;
use App\Models\Logistics\StockMovement;
use App\Models\Logistics\Supplier;
use App\Models\Logistics\SupplyRequest;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'chargeTypes' => collect(LogisticChargeType::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    public function store(SupplyRequestData $data): RedirectResponse
    {
        $this->authorize('create', SupplyRequest::class);

        $type = SupplyType::from($data->type);
        $isDraft = $data->is_draft;
        $status = $isDraft ? SupplyRequestStatus::Draft : SupplyRequestStatus::Pending;

        if (! $isDraft) {
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
        }

        $supplyRequest = SupplyRequest::create([
            'reference' => 'SR-'.strtoupper(Str::random(8)),
            'type' => $type,
            'status' => $status,
            'notes' => $data->notes,
            'company_bears_costs' => $data->company_bears_costs,
            'driver_name' => $data->driver_name,
            'driver_phone' => $data->driver_phone,
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

        // Save logistic charges if company bears costs
        if ($data->company_bears_costs && ! empty($data->charges)) {
            foreach ($data->charges as $charge) {
                LogisticCharge::create([
                    'label' => $charge['label'],
                    'type' => $charge['type'],
                    'amount' => $charge['amount'],
                    'notes' => $charge['notes'] ?? null,
                    'supply_request_id' => $supplyRequest->id,
                    'created_by' => auth()->id(),
                ]);
            }
        }

        $message = $isDraft
            ? 'Brouillon enregistré avec succès.'
            : 'Demande d\'approvisionnement créée avec succès.';

        return to_route('admin.logistics.supply-requests.show', $supplyRequest)
            ->with('success', $message);
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
            'receivedBy:id,name',
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

    /**
     * Mark as delivered (shipped from source).
     */
    public function deliver(SupplyRequest $supplyRequest): RedirectResponse
    {
        $this->authorize('approve', $supplyRequest);

        if ($supplyRequest->status !== SupplyRequestStatus::Approved) {
            return back()->with('error', 'Cette demande doit être approuvée avant livraison.');
        }

        $supplyRequest->load('items');

        DB::transaction(function () use ($supplyRequest) {
            foreach ($supplyRequest->items as $item) {
                $item->update(['quantity_delivered' => $item->quantity_requested]);
            }

            $supplyRequest->update([
                'status' => SupplyRequestStatus::Delivered,
                'delivered_at' => now(),
            ]);
        });

        return back()->with('success', 'Approvisionnement marqué comme livré.');
    }

    /**
     * Receive a supply request at the destination.
     * Records actual received quantities, mandatory discrepancy notes, and updates stock.
     */
    public function receive(SupplyRequest $supplyRequest, Request $request): RedirectResponse
    {
        $this->authorize('approve', $supplyRequest);

        if (! in_array($supplyRequest->status, [SupplyRequestStatus::Approved, SupplyRequestStatus::Delivered])) {
            return back()->with('error', 'Cette demande doit être approuvée ou livrée avant réception.');
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'uuid'],
            'items.*.quantity_received' => ['required', 'integer', 'min:0'],
            'items.*.discrepancy_note' => ['nullable', 'string'],
        ]);

        $supplyRequest->load('items.product');

        // Validate: discrepancy note is mandatory when quantities differ
        $errors = [];
        foreach ($validated['items'] as $idx => $receivedItem) {
            $supplyItem = $supplyRequest->items->firstWhere('id', $receivedItem['item_id']);

            if (! $supplyItem) {
                $errors["items.{$idx}.item_id"] = 'Article introuvable.';

                continue;
            }

            $delivered = $supplyItem->quantity_delivered ?? $supplyItem->quantity_requested;

            if ((int) $receivedItem['quantity_received'] !== $delivered && empty($receivedItem['discrepancy_note'])) {
                $errors["items.{$idx}.discrepancy_note"] = "Une explication est requise pour l'écart sur {$supplyItem->product->name}.";
            }
        }

        if (! empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        // Stock validation for warehouse-to-warehouse
        if ($supplyRequest->type === SupplyType::WarehouseToWarehouse) {
            $insufficientItems = [];

            foreach ($validated['items'] as $receivedItem) {
                $supplyItem = $supplyRequest->items->firstWhere('id', $receivedItem['item_id']);

                if (! $supplyItem) {
                    continue;
                }

                $sourceStock = WarehouseStock::withoutGlobalScopes()
                    ->where('product_id', $supplyItem->product_id)
                    ->where('warehouse_id', $supplyRequest->source_warehouse_id)
                    ->first();

                $availableQty = $sourceStock?->quantity ?? 0;

                if ($availableQty < (int) $receivedItem['quantity_received']) {
                    $insufficientItems[] = "{$supplyItem->product->name} (reçu: {$receivedItem['quantity_received']}, disponible: {$availableQty})";
                }
            }

            if (! empty($insufficientItems)) {
                return back()->with('error', 'Stock insuffisant pour : '.implode(', ', $insufficientItems));
            }
        }

        DB::transaction(function () use ($supplyRequest, $validated) {
            foreach ($validated['items'] as $receivedItem) {
                $supplyItem = $supplyRequest->items->firstWhere('id', $receivedItem['item_id']);

                if (! $supplyItem) {
                    continue;
                }

                $qty = (int) $receivedItem['quantity_received'];

                $supplyItem->update([
                    'quantity_received' => $qty,
                    'discrepancy_note' => $receivedItem['discrepancy_note'] ?? null,
                ]);

                $movementType = $supplyRequest->type === SupplyType::SupplierToWarehouse
                    ? StockMovementType::PurchaseEntry
                    : StockMovementType::WarehouseToWarehouse;

                $movement = StockMovement::create([
                    'reference' => 'MOV-'.strtoupper(Str::random(8)),
                    'type' => $movementType,
                    'quantity' => $qty,
                    'reason' => "Réception approvisionnement {$supplyRequest->reference}",
                    'product_id' => $supplyItem->product_id,
                    'source_warehouse_id' => $supplyRequest->source_warehouse_id,
                    'destination_warehouse_id' => $supplyRequest->destination_warehouse_id,
                    'supplier_id' => $supplyRequest->supplier_id,
                    'supply_request_id' => $supplyRequest->id,
                    'company_id' => $supplyRequest->company_id,
                    'created_by' => auth()->id(),
                ]);

                $this->applySupplyStock($movement, $supplyRequest->type);
            }

            $supplyRequest->update([
                'status' => SupplyRequestStatus::Received,
                'received_at' => now(),
                'received_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Approvisionnement réceptionné avec succès.');
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

    /**
     * Submit a draft supply request as pending.
     */
    public function submit(SupplyRequest $supplyRequest): RedirectResponse
    {
        $this->authorize('update', $supplyRequest);

        if ($supplyRequest->status !== SupplyRequestStatus::Draft) {
            return back()->with('error', 'Seul un brouillon peut être soumis.');
        }

        $type = $supplyRequest->type;

        if ($type === SupplyType::SupplierToWarehouse && ! $supplyRequest->supplier_id) {
            return back()->with('error', 'Le fournisseur est requis.');
        }

        if (! $supplyRequest->destination_warehouse_id) {
            return back()->with('error', 'L\'entrepôt destination est requis.');
        }

        $supplyRequest->update(['status' => SupplyRequestStatus::Pending]);

        return back()->with('success', 'Demande soumise avec succès.');
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
