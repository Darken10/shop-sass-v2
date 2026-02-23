<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\StockMovementData;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Shop;
use App\Models\Logistics\StockMovement;
use App\Models\Logistics\Supplier;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Product\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', StockMovement::class);

        $movements = StockMovement::query()
            ->with([
                'product:id,name,code',
                'sourceWarehouse:id,name,code',
                'destinationWarehouse:id,name,code',
                'createdBy:id,name',
            ])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/logistics/movements/index', [
            'movements' => $movements,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', StockMovement::class);

        return Inertia::render('admin/logistics/movements/create', [
            'warehouses' => Warehouse::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'shops' => Shop::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'suppliers' => Supplier::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'products' => Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'movementTypes' => StockMovementType::cases(),
        ]);
    }

    public function store(StockMovementData $data): RedirectResponse
    {
        $this->authorize('create', StockMovement::class);

        $movement = StockMovement::create([
            ...$data->toArray(),
            'reference' => 'MOV-'.strtoupper(Str::random(8)),
            'created_by' => auth()->id(),
        ]);

        $this->applyStockUpdate($movement);

        return to_route('admin.logistics.movements.index')
            ->with('success', 'Mouvement de stock enregistré avec succès.');
    }

    public function show(StockMovement $movement): Response
    {
        $this->authorize('view', $movement);

        $movement->load([
            'product:id,name,code',
            'sourceWarehouse:id,name,code',
            'destinationWarehouse:id,name,code',
            'createdBy:id,name',
            'fuelLogs',
            'logisticCharges',
        ]);

        return Inertia::render('admin/logistics/movements/show', [
            'movement' => $movement,
        ]);
    }

    private function applyStockUpdate(StockMovement $movement): void
    {
        $companyId = $movement->company_id;

        if ($movement->type->isEntry() && $movement->destination_warehouse_id) {
            $this->incrementStock(
                $movement->product_id,
                $movement->destination_warehouse_id,
                $companyId,
                $movement->quantity
            );
        }

        if ($movement->type->isExit() && $movement->source_warehouse_id) {
            $this->decrementStock(
                $movement->product_id,
                $movement->source_warehouse_id,
                $companyId,
                $movement->quantity
            );
        }

        if ($movement->type === StockMovementType::WarehouseToWarehouse) {
            if ($movement->source_warehouse_id) {
                $this->decrementStock(
                    $movement->product_id,
                    $movement->source_warehouse_id,
                    $companyId,
                    $movement->quantity
                );
            }

            if ($movement->destination_warehouse_id) {
                $this->incrementStock(
                    $movement->product_id,
                    $movement->destination_warehouse_id,
                    $companyId,
                    $movement->quantity
                );
            }
        }
    }

    private function incrementStock(string $productId, string $warehouseId, string $companyId, int $quantity): void
    {
        $stock = WarehouseStock::withoutGlobalScopes()
            ->firstOrCreate(
                ['product_id' => $productId, 'warehouse_id' => $warehouseId],
                ['company_id' => $companyId, 'quantity' => 0]
            );

        $stock->increment('quantity', $quantity);
    }

    private function decrementStock(string $productId, string $warehouseId, string $companyId, int $quantity): void
    {
        $stock = WarehouseStock::withoutGlobalScopes()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->first();

        if ($stock) {
            $stock->decrement('quantity', min($quantity, $stock->quantity));
        }
    }
}
