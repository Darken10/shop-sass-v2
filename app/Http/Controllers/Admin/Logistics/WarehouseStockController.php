<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\WarehouseStockData;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Product\Product;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseStockController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', WarehouseStock::class);

        $stocks = WarehouseStock::query()
            ->with(['product:id,name,code', 'warehouse:id,name,code'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/logistics/stocks/index', [
            'stocks' => $stocks,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', WarehouseStock::class);

        return Inertia::render('admin/logistics/stocks/create', [
            'warehouses' => Warehouse::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'products' => Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
        ]);
    }

    public function store(WarehouseStockData $data): RedirectResponse
    {
        $this->authorize('create', WarehouseStock::class);

        $stock = WarehouseStock::updateOrCreate(
            [
                'product_id' => $data->product_id,
                'warehouse_id' => $data->warehouse_id,
            ],
            [
                'quantity' => $data->quantity,
                'stock_alert' => $data->stock_alert ?? 0,
            ]
        );

        return to_route('admin.logistics.stocks.index')
            ->with('success', 'Stock enregistré avec succès.');
    }

    public function update(WarehouseStockData $data, WarehouseStock $stock): RedirectResponse
    {
        $this->authorize('update', $stock);

        $stock->update([
            'quantity' => $data->quantity,
            'stock_alert' => $data->stock_alert ?? 0,
        ]);

        return to_route('admin.logistics.stocks.index')
            ->with('success', 'Stock mis à jour avec succès.');
    }

    public function destroy(WarehouseStock $stock): RedirectResponse
    {
        $this->authorize('delete', $stock);

        $stock->delete();

        return to_route('admin.logistics.stocks.index')
            ->with('success', 'Stock supprimé avec succès.');
    }
}
