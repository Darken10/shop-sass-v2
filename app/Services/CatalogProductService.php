<?php

namespace App\Services;

use App\Models\Catalog\CatalogProduct;
use App\Models\Product\Product;
use Illuminate\Support\Arr;

class CatalogProductService
{
    /**
     * Résout (ou crée) une entrée dans le catalogue global à partir des données
     * d'un produit d'entreprise, puis retourne son identifiant.
     *
     * @param  array<string, mixed>  $productData
     */
    public function resolveOrCreate(array $productData): ?CatalogProduct
    {
        $barcode = Arr::get($productData, 'code');

        if (empty($barcode)) {
            return null;
        }

        return CatalogProduct::firstOrCreate(
            ['barcode' => $barcode],
            [
                'name' => Arr::get($productData, 'name'),
                'brand' => null,
                'description' => Arr::get($productData, 'description'),
                'image_url' => null,
                'category' => null,
                'unity' => Arr::get($productData, 'unity', 'piece'),
                'source' => 'manual',
            ]
        );
    }

    /**
     * Recherche dans le catalogue les produits dont le code-barres ou le nom
     * correspond à la requête.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, CatalogProduct>
     */
    public function search(string $query, int $limit = 15)
    {
        return CatalogProduct::query()
            ->where(function ($q) use ($query) {
                $q->where('barcode', 'like', "%{$query}%")
                    ->orWhere('name', 'like', "%{$query}%")
                    ->orWhere('brand', 'like', "%{$query}%");
            })
            ->limit($limit)
            ->get();
    }

    /**
     * Indique si un code-barres est déjà utilisé par une autre entreprise.
     */
    public function barcodeUsedByOtherCompany(string $barcode, string $companyId): bool
    {
        return Product::query()
            ->whereHas('catalogProduct', fn ($q) => $q->where('barcode', $barcode))
            ->where('company_id', '!=', $companyId)
            ->exists();
    }
}
