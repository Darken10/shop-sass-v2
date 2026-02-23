<?php

namespace App\Models\Logistics;

use App\Concerns\BelongsToCompany;
use App\Enums\TransferStatus;
use App\Enums\TransferType;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transfer extends Model
{
    /** @use HasFactory<\Database\Factories\Logistics\TransferFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'reference',
        'type',
        'status',
        'notes',
        'approved_at',
        'shipped_at',
        'delivered_at',
        'source_warehouse_id',
        'destination_warehouse_id',
        'destination_shop_id',
        'vehicle_id',
        'approved_by',
        'company_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => TransferType::class,
            'status' => TransferStatus::class,
            'approved_at' => 'datetime',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function sourceWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'source_warehouse_id');
    }

    public function destinationWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'destination_warehouse_id');
    }

    public function destinationShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'destination_shop_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransferItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
