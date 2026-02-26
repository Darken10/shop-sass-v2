<?php

namespace App\Models\Logistics;

use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TransferItem extends Model
{
    use HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'quantity_requested',
        'quantity_delivered',
        'quantity_received',
        'discrepancy_note',
        'product_id',
        'transfer_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity_requested' => 'integer',
            'quantity_delivered' => 'integer',
            'quantity_received' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }
}
