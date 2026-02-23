<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\LogisticChargeData;
use App\Enums\LogisticChargeType;
use App\Http\Controllers\Controller;
use App\Models\Logistics\LogisticCharge;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LogisticChargeController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', LogisticCharge::class);

        $charges = LogisticCharge::query()
            ->with(['stockMovement:id,reference', 'supplyRequest:id,reference', 'createdBy:id,name'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/logistics/charges/index', [
            'charges' => $charges,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', LogisticCharge::class);

        return Inertia::render('admin/logistics/charges/create', [
            'chargeTypes' => LogisticChargeType::cases(),
        ]);
    }

    public function store(LogisticChargeData $data): RedirectResponse
    {
        $this->authorize('create', LogisticCharge::class);

        LogisticCharge::create([
            ...$data->toArray(),
            'created_by' => auth()->id(),
        ]);

        return to_route('admin.logistics.charges.index')
            ->with('success', 'Charge logistique enregistrée avec succès.');
    }

    public function show(LogisticCharge $charge): Response
    {
        $this->authorize('view', $charge);

        $charge->load([
            'stockMovement:id,reference',
            'supplyRequest:id,reference',
            'createdBy:id,name',
        ]);

        return Inertia::render('admin/logistics/charges/show', [
            'charge' => $charge,
        ]);
    }
}
