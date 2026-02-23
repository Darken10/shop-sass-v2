<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\VehicleData;
use App\Enums\VehicleStatus;
use App\Enums\VehicleType;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Vehicle;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class VehicleController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Vehicle::class);

        $vehicles = Vehicle::query()
            ->with(['createdBy:id,name'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/logistics/vehicles/index', [
            'vehicles' => $vehicles,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Vehicle::class);

        return Inertia::render('admin/logistics/vehicles/create', [
            'vehicleTypes' => VehicleType::cases(),
            'vehicleStatuses' => VehicleStatus::cases(),
        ]);
    }

    public function store(VehicleData $data): RedirectResponse
    {
        $this->authorize('create', Vehicle::class);

        $vehicle = Vehicle::create([
            ...$data->toArray(),
            'created_by' => auth()->id(),
        ]);

        return to_route('admin.logistics.vehicles.show', $vehicle)
            ->with('success', 'Engin créé avec succès.');
    }

    public function show(Vehicle $vehicle): Response
    {
        $this->authorize('view', $vehicle);

        $vehicle->load([
            'createdBy:id,name',
            'fuelLogs' => fn ($q) => $q->latest()->limit(20),
        ]);

        return Inertia::render('admin/logistics/vehicles/show', [
            'vehicle' => $vehicle,
        ]);
    }

    public function edit(Vehicle $vehicle): Response
    {
        $this->authorize('update', $vehicle);

        return Inertia::render('admin/logistics/vehicles/edit', [
            'vehicle' => $vehicle,
            'vehicleTypes' => VehicleType::cases(),
            'vehicleStatuses' => VehicleStatus::cases(),
        ]);
    }

    public function update(VehicleData $data, Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('update', $vehicle);

        $vehicle->update($data->toArray());

        return to_route('admin.logistics.vehicles.show', $vehicle)
            ->with('success', 'Engin mis à jour avec succès.');
    }

    public function destroy(Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('delete', $vehicle);

        $vehicle->delete();

        return to_route('admin.logistics.vehicles.index')
            ->with('success', 'Engin supprimé avec succès.');
    }
}
