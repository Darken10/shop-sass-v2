<?php

namespace App\Models\Logistics;

use App\Concerns\BelongsToCompany;
use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ShopStock extends Model
{
    /** @use HasFactory<\Database\Factories\Logistics\ShopStockFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'quantity',
        'stock_alert',
        'product_id',
        'shop_id',
        'company_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'stock_alert' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function isLowStock(): bool
    {
        return $this->quantity <= $this->stock_alert;
    }
}
