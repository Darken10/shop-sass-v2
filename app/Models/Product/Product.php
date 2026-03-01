<?php

namespace App\Models\Product;

use App\Concerns\BelongsToCompany;
use App\Enums\ProductStatus;
use App\Enums\ProductUnity;
use App\Models\Catalog\CatalogProduct;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\Product\ProductFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'code',
        'description',
        'price',
        'cost_price',
        'stock',
        'stock_alert',
        'unity',
        'status',
        'image',
        'category_id',
        'company_id',
        'catalog_product_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProductStatus::class,
            'unity' => ProductUnity::class,
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
        ];
    }

    public function getImageAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        // Remote URL (e.g. imported from global catalog) — return as-is.
        if (str_starts_with($value, 'http')) {
            return $value;
        }

        return Storage::url($value);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ProductTag::class, 'product_product_tag');
    }

    public function catalogProduct(): BelongsTo
    {
        return $this->belongsTo(CatalogProduct::class, 'catalog_product_id');
    }
}
