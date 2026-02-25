<?php

namespace App\Http\Controllers\Pos;

use App\Data\Pos\CustomerData;
use App\Http\Controllers\Controller;
use App\Models\Pos\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Customer::class);

        $customers = Customer::query()
            ->with('createdBy:id,name')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('pos/customers/index', [
            'customers' => $customers,
        ]);
    }

    public function store(CustomerData $data): RedirectResponse
    {
        $this->authorize('create', Customer::class);

        Customer::create([
            ...$data->toArray(),
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Client créé avec succès.');
    }

    public function quickStore(CustomerData $data): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $customer = Customer::create([
            ...$data->toArray(),
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'credit_balance' => $customer->credit_balance,
            ],
        ], 201);
    }

    public function update(CustomerData $data, Customer $customer): RedirectResponse
    {
        $this->authorize('update', $customer);

        $customer->update($data->toArray());

        return back()->with('success', 'Client mis à jour avec succès.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $this->authorize('delete', $customer);

        $customer->delete();

        return to_route('pos.customers.index')
            ->with('success', 'Client supprimé avec succès.');
    }
}
