<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\ShopData;
use App\Enums\ShopStatus;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Shop;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Shop::class);

        $shops = Shop::query()
            ->with(['createdBy:id,name'])
            ->withCount('stocks')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/logistics/shops/index', [
            'shops' => $shops,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Shop::class);

        return Inertia::render('admin/logistics/shops/create', [
            'statuses' => ShopStatus::cases(),
        ]);
    }

    public function store(ShopData $data): RedirectResponse
    {
        $this->authorize('create', Shop::class);

        $shop = Shop::create([
            ...$data->toArray(),
            'created_by' => auth()->id(),
        ]);

        return to_route('admin.logistics.shops.show', $shop)
            ->with('success', 'Magasin créé avec succès.');
    }

    public function show(Shop $shop): Response
    {
        $this->authorize('view', $shop);

        $shop->load([
            'createdBy:id,name',
            'stocks' => fn ($q) => $q->with('product:id,name,code')->latest(),
        ]);

        return Inertia::render('admin/logistics/shops/show', [
            'shop' => $shop,
        ]);
    }

    public function edit(Shop $shop): Response
    {
        $this->authorize('update', $shop);

        return Inertia::render('admin/logistics/shops/edit', [
            'shop' => $shop,
            'statuses' => ShopStatus::cases(),
        ]);
    }

    public function update(ShopData $data, Shop $shop): RedirectResponse
    {
        $this->authorize('update', $shop);

        $shop->update($data->toArray());

        return to_route('admin.logistics.shops.show', $shop)
            ->with('success', 'Magasin mis à jour avec succès.');
    }

    public function destroy(Shop $shop): RedirectResponse
    {
        $this->authorize('delete', $shop);

        $shop->delete();

        return to_route('admin.logistics.shops.index')
            ->with('success', 'Magasin supprimé avec succès.');
    }
}
