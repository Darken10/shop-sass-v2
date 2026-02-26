<?php

namespace App\Models\Logistics;

use App\Concerns\BelongsToCompany;
use App\Enums\LogisticChargeType;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LogisticCharge extends Model
{
    /** @use HasFactory<\Database\Factories\Logistics\LogisticChargeFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'label',
        'type',
        'amount',
        'notes',
        'stock_movement_id',
        'supply_request_id',
        'transfer_id',
        'company_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => LogisticChargeType::class,
            'amount' => 'decimal:2',
        ];
    }

    public function stockMovement(): BelongsTo
    {
        return $this->belongsTo(StockMovement::class);
    }

    public function supplyRequest(): BelongsTo
    {
        return $this->belongsTo(SupplyRequest::class);
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
