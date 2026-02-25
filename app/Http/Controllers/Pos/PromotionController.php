<?php

namespace App\Http\Controllers\Pos;

use App\Data\Pos\PromotionData;
use App\Enums\PromotionType;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Shop;
use App\Models\Pos\Promotion;
use App\Models\Product\Product;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Promotion::class);

        $promotions = Promotion::query()
            ->with(['shop:id,name', 'products:id,name', 'createdBy:id,name'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('pos/promotions/index', [
            'promotions' => $promotions,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Promotion::class);

        return Inertia::render('pos/promotions/create', [
            'shops' => Shop::query()->where('status', 'active')->select(['id', 'name'])->orderBy('name')->get(),
            'products' => Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'promotionTypes' => PromotionType::cases(),
        ]);
    }

    public function store(PromotionData $data): RedirectResponse
    {
        $this->authorize('create', Promotion::class);

        $promotion = Promotion::create([
            'name' => $data->name,
            'type' => $data->type,
            'value' => $data->value,
            'starts_at' => $data->starts_at,
            'ends_at' => $data->ends_at,
            'is_active' => $data->is_active,
            'description' => $data->description,
            'shop_id' => $data->shop_id,
            'created_by' => auth()->id(),
        ]);

        if (! empty($data->product_ids)) {
            $promotion->products()->attach($data->product_ids);
        }

        return to_route('pos.promotions.index')
            ->with('success', 'Promotion créée avec succès.');
    }

    public function edit(Promotion $promotion): Response
    {
        $this->authorize('update', $promotion);

        $promotion->load('products:id,name');

        return Inertia::render('pos/promotions/edit', [
            'promotion' => $promotion,
            'shops' => Shop::query()->where('status', 'active')->select(['id', 'name'])->orderBy('name')->get(),
            'products' => Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'promotionTypes' => PromotionType::cases(),
        ]);
    }

    public function update(PromotionData $data, Promotion $promotion): RedirectResponse
    {
        $this->authorize('update', $promotion);

        $promotion->update([
            'name' => $data->name,
            'type' => $data->type,
            'value' => $data->value,
            'starts_at' => $data->starts_at,
            'ends_at' => $data->ends_at,
            'is_active' => $data->is_active,
            'description' => $data->description,
            'shop_id' => $data->shop_id,
        ]);

        $promotion->products()->sync($data->product_ids);

        return to_route('pos.promotions.index')
            ->with('success', 'Promotion mise à jour avec succès.');
    }

    public function destroy(Promotion $promotion): RedirectResponse
    {
        $this->authorize('delete', $promotion);

        $promotion->delete();

        return to_route('pos.promotions.index')
            ->with('success', 'Promotion supprimée avec succès.');
    }
}
