<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\WarehouseData;
use App\Enums\WarehouseStatus;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Warehouse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Warehouse::class);

        $warehouses = Warehouse::query()
            ->with(['createdBy:id,name'])
            ->withCount('stocks')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/logistics/warehouses/index', [
            'warehouses' => $warehouses,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Warehouse::class);

        return Inertia::render('admin/logistics/warehouses/create', [
            'statuses' => WarehouseStatus::cases(),
        ]);
    }

    public function store(WarehouseData $data): RedirectResponse
    {
        $this->authorize('create', Warehouse::class);

        $warehouse = Warehouse::create([
            ...$data->toArray(),
            'created_by' => auth()->id(),
        ]);

        return to_route('admin.logistics.warehouses.show', $warehouse)
            ->with('success', 'Entrepôt créé avec succès.');
    }

    public function show(Warehouse $warehouse): Response
    {
        $this->authorize('view', $warehouse);

        $warehouse->load([
            'createdBy:id,name',
            'stocks' => fn ($q) => $q->with('product:id,name,code')->latest(),
        ]);

        return Inertia::render('admin/logistics/warehouses/show', [
            'warehouse' => $warehouse,
        ]);
    }

    public function edit(Warehouse $warehouse): Response
    {
        $this->authorize('update', $warehouse);

        return Inertia::render('admin/logistics/warehouses/edit', [
            'warehouse' => $warehouse,
            'statuses' => WarehouseStatus::cases(),
        ]);
    }

    public function update(WarehouseData $data, Warehouse $warehouse): RedirectResponse
    {
        $this->authorize('update', $warehouse);

        $warehouse->update($data->toArray());

        return to_route('admin.logistics.warehouses.show', $warehouse)
            ->with('success', 'Entrepôt mis à jour avec succès.');
    }

    public function destroy(Warehouse $warehouse): RedirectResponse
    {
        $this->authorize('delete', $warehouse);

        $warehouse->delete();

        return to_route('admin.logistics.warehouses.index')
            ->with('success', 'Entrepôt supprimé avec succès.');
    }
}
