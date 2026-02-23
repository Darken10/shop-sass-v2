<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\FuelLogData;
use App\Http\Controllers\Controller;
use App\Models\Logistics\FuelLog;
use App\Models\Logistics\Vehicle;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FuelLogController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', FuelLog::class);

        $fuelLogs = FuelLog::query()
            ->with(['vehicle:id,name,registration_number', 'createdBy:id,name'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/logistics/fuel-logs/index', [
            'fuelLogs' => $fuelLogs,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', FuelLog::class);

        return Inertia::render('admin/logistics/fuel-logs/create', [
            'vehicles' => Vehicle::query()->select(['id', 'name', 'registration_number'])->orderBy('name')->get(),
        ]);
    }

    public function store(FuelLogData $data): RedirectResponse
    {
        $this->authorize('create', FuelLog::class);

        FuelLog::create([
            ...$data->toArray(),
            'created_by' => auth()->id(),
        ]);

        return to_route('admin.logistics.fuel-logs.index')
            ->with('success', 'Ravitaillement enregistré avec succès.');
    }

    public function show(FuelLog $fuelLog): Response
    {
        $this->authorize('view', $fuelLog);

        $fuelLog->load([
            'vehicle:id,name,registration_number,type',
            'stockMovement',
            'createdBy:id,name',
        ]);

        return Inertia::render('admin/logistics/fuel-logs/show', [
            'fuelLog' => $fuelLog,
        ]);
    }
}
