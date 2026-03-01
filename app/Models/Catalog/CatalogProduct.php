<?php

namespace App\Models\Catalog;

use App\Enums\ProductUnity;
use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogProduct extends Model
{
    /** @use HasFactory<\Database\Factories\Catalog\CatalogProductFactory> */
    use HasFactory, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'barcode',
        'name',
        'brand',
        'description',
        'image_url',
        'category',
        'unity',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'unity' => ProductUnity::class,
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'catalog_product_id');
    }
}
