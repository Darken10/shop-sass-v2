<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Catalog\CatalogProduct;
use App\Services\CatalogProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogProductController extends Controller
{
    public function __construct(private readonly CatalogProductService $catalogService) {}

    /**
     * Affiche le catalogue global (page Inertia).
     */
    public function index(): Response
    {
        $products = CatalogProduct::query()
            ->when(request('search'), fn ($q, $search) => $q
                ->where('barcode', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%")
                ->orWhere('brand', 'like', "%{$search}%")
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/catalog/index', [
            'products' => $products,
            'filters' => request()->only('search'),
        ]);
    }

    /**
     * Recherche des produits dans le catalogue (endpoint JSON pour autocomplete).
     *
     * @return JsonResponse<array<string, mixed>>
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $results = $this->catalogService->search($request->string('q')->value(), 15);

        return response()->json([
            'data' => $results->map(fn (CatalogProduct $product) => [
                'id' => $product->id,
                'barcode' => $product->barcode,
                'name' => $product->name,
                'brand' => $product->brand,
                'image_url' => $product->image_url,
                'category' => $product->category,
                'unity' => $product->unity?->value,
                'source' => $product->source,
            ]),
        ]);
    }

    /**
     * Retourne les détails d'une entrée du catalogue (pour pré-remplir le
     * formulaire de création de produit).
     *
     * @return JsonResponse<array<string, mixed>>
     */
    public function show(CatalogProduct $catalogProduct): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $catalogProduct->id,
                'barcode' => $catalogProduct->barcode,
                'name' => $catalogProduct->name,
                'brand' => $catalogProduct->brand,
                'description' => $catalogProduct->description,
                'image_url' => $catalogProduct->image_url,
                'category' => $catalogProduct->category,
                'unity' => $catalogProduct->unity?->value,
                'source' => $catalogProduct->source,
            ],
        ]);
    }
}
