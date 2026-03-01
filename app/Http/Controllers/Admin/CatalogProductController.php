<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProductStatus;
use App\Enums\ProductUnity;
use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\ImportCatalogProductRequest;
use App\Models\Catalog\CatalogProduct;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use App\Services\CatalogProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
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

        // Barcode des produits déjà importés par cette entreprise
        $importedBarcodes = Product::query()
            ->whereNotNull('catalog_product_id')
            ->pluck('code')
            ->all();

        return Inertia::render('admin/catalog/index', [
            'products' => $products,
            'filters' => request()->only('search'),
            'importedBarcodes' => $importedBarcodes,
            'categories' => ProductCategory::query()->select(['id', 'name'])->orderBy('name')->get(),
            'unities' => array_map(fn ($u) => ['value' => $u->value, 'label' => $u->label()], ProductUnity::cases()),
            'statuses' => array_map(fn ($s) => ['value' => $s->value, 'label' => $s->label()], ProductStatus::cases()),
        ]);
    }

    /**
     * Importe un produit du catalogue global dans la boutique de l'entreprise.
     */
    public function importToCompany(ImportCatalogProductRequest $request, CatalogProduct $catalogProduct): RedirectResponse
    {
        $this->authorize('create', Product::class);

        $alreadyImported = Product::withoutGlobalScopes()
            ->where('company_id', $request->user()->company_id)
            ->where('code', $catalogProduct->barcode)
            ->exists();

        if ($alreadyImported) {
            return back()->with('error', 'Ce produit est déjà dans votre catalogue d\'entreprise.');
        }

        $validated = $request->validated();

        Product::create([
            'name' => $catalogProduct->name,
            'code' => $catalogProduct->barcode,
            'description' => $catalogProduct->description,
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'] ?? null,
            'stock' => $validated['stock'],
            'stock_alert' => $validated['stock_alert'] ?? 0,
            'unity' => $validated['unity'],
            'status' => $validated['status'],
            'image' => $catalogProduct->image_url,
            'category_id' => $validated['category_id'],
            'catalog_product_id' => $catalogProduct->id,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', "\"{$catalogProduct->name}\" a été ajouté à votre catalogue.");
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
