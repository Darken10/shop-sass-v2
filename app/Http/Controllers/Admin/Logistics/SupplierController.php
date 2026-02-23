<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\SupplierData;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Supplier;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Supplier::class);

        $suppliers = Supplier::query()
            ->with(['createdBy:id,name'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/logistics/suppliers/index', [
            'suppliers' => $suppliers,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Supplier::class);

        return Inertia::render('admin/logistics/suppliers/create');
    }

    public function store(SupplierData $data): RedirectResponse
    {
        $this->authorize('create', Supplier::class);

        $supplier = Supplier::create([
            ...$data->toArray(),
            'created_by' => auth()->id(),
        ]);

        return to_route('admin.logistics.suppliers.show', $supplier)
            ->with('success', 'Fournisseur créé avec succès.');
    }

    public function show(Supplier $supplier): Response
    {
        $this->authorize('view', $supplier);

        $supplier->load(['createdBy:id,name']);

        return Inertia::render('admin/logistics/suppliers/show', [
            'supplier' => $supplier,
        ]);
    }

    public function edit(Supplier $supplier): Response
    {
        $this->authorize('update', $supplier);

        return Inertia::render('admin/logistics/suppliers/edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(SupplierData $data, Supplier $supplier): RedirectResponse
    {
        $this->authorize('update', $supplier);

        $supplier->update($data->toArray());

        return to_route('admin.logistics.suppliers.show', $supplier)
            ->with('success', 'Fournisseur mis à jour avec succès.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $this->authorize('delete', $supplier);

        $supplier->delete();

        return to_route('admin.logistics.suppliers.index')
            ->with('success', 'Fournisseur supprimé avec succès.');
    }
}
