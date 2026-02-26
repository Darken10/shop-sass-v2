<?php

namespace App\Models\Logistics;

use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplyRequestItem extends Model
{
    /** @use HasFactory<\Database\Factories\Logistics\SupplyRequestItemFactory> */
    use HasFactory, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'quantity_requested',
        'quantity_delivered',
        'quantity_received',
        'discrepancy_note',
        'supply_request_id',
        'product_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity_requested' => 'integer',
            'quantity_delivered' => 'integer',
            'quantity_received' => 'integer',
        ];
    }

    public function supplyRequest(): BelongsTo
    {
        return $this->belongsTo(SupplyRequest::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
