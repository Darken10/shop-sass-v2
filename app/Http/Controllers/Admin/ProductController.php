<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProductStatus;
use App\Enums\ProductUnity;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use App\Models\Product\ProductTag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::query()
            ->with(['category:id,name', 'tags:id,name', 'createdBy:id,name'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/products/index', [
            'products' => $products,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('admin/products/create', [
            'categories' => ProductCategory::query()->select(['id', 'name'])->orderBy('name')->get(),
            'tags' => ProductTag::query()->select(['id', 'name'])->orderBy('name')->get(),
            'statuses' => ProductStatus::cases(),
            'unities' => ProductUnity::cases(),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $this->authorize('create', Product::class);

        $validated = $request->validated();

        $image = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image')->store('products', 'public');
        }

        $product = Product::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'] ?? null,
            'stock' => $validated['stock'],
            'stock_alert' => $validated['stock_alert'] ?? 0,
            'unity' => $validated['unity'],
            'status' => $validated['status'],
            'image' => $image,
            'category_id' => $validated['category_id'],
            'created_by' => $request->user()->id,
        ]);

        if (! empty($validated['tags'])) {
            $product->tags()->attach($validated['tags']);
        }

        return to_route('admin.products.show', $product)
            ->with('success', 'Produit créé avec succès.');
    }

    public function show(Product $product): Response
    {
        $this->authorize('view', $product);

        $product->load(['category:id,name', 'tags:id,name', 'createdBy:id,name']);

        return Inertia::render('admin/products/show', [
            'product' => $product,
        ]);
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        $product->load(['tags:id,name']);

        return Inertia::render('admin/products/edit', [
            'product' => $product,
            'categories' => ProductCategory::query()->select(['id', 'name'])->orderBy('name')->get(),
            'tags' => ProductTag::query()->select(['id', 'name'])->orderBy('name')->get(),
            'statuses' => ProductStatus::cases(),
            'unities' => ProductUnity::cases(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        $validated = $request->validated();

        $image = $product->getRawOriginal('image');
        if ($request->hasFile('image')) {
            $image = $request->file('image')->store('products', 'public');
        }

        $product->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'] ?? null,
            'stock' => $validated['stock'],
            'stock_alert' => $validated['stock_alert'] ?? 0,
            'unity' => $validated['unity'],
            'status' => $validated['status'],
            'image' => $image,
            'category_id' => $validated['category_id'],
        ]);

        if (isset($validated['tags'])) {
            $product->tags()->sync($validated['tags']);
        }

        return to_route('admin.products.show', $product)
            ->with('success', 'Produit mis à jour avec succès.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('products', 'code')],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'unity' => ['required', 'string', Rule::in(array_column(ProductUnity::cases(), 'value'))],
            'category_id' => ['required', 'uuid', Rule::exists('product_categories', 'id')],
        ], [
            'name.required' => 'Le nom du produit est obligatoire.',
            'code.required' => 'Le code du produit est obligatoire.',
            'code.unique' => 'Ce code est déjà utilisé.',
            'price.required' => 'Le prix est obligatoire.',
            'price.min' => 'Le prix doit être positif.',
            'category_id.required' => 'La catégorie est obligatoire.',
            'category_id.exists' => 'La catégorie sélectionnée est invalide.',
        ]);

        $product = Product::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'] ?? null,
            'stock' => 0,
            'stock_alert' => 0,
            'unity' => $validated['unity'],
            'status' => ProductStatus::ACTIVE,
            'category_id' => $validated['category_id'],
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
            ],
        ], 201);
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        $product->delete();

        return to_route('admin.products.index')
            ->with('success', 'Produit supprimé avec succès.');
    }
}
