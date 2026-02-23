<?php

namespace App\Models\Logistics;

use App\Concerns\BelongsToCompany;
use App\Enums\StockMovementType;
use App\Models\Product\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockMovement extends Model
{
    /** @use HasFactory<\Database\Factories\Logistics\StockMovementFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'reference',
        'type',
        'quantity',
        'reason',
        'notes',
        'product_id',
        'source_warehouse_id',
        'destination_warehouse_id',
        'supply_request_id',
        'supplier_id',
        'source_shop_id',
        'destination_shop_id',
        'transfer_id',
        'company_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => StockMovementType::class,
            'quantity' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function sourceWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'source_warehouse_id');
    }

    public function destinationWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'destination_warehouse_id');
    }

    public function supplyRequest(): BelongsTo
    {
        return $this->belongsTo(SupplyRequest::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function sourceShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'source_shop_id');
    }

    public function destinationShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'destination_shop_id');
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function fuelLogs(): HasMany
    {
        return $this->hasMany(FuelLog::class);
    }

    public function logisticCharges(): HasMany
    {
        return $this->hasMany(LogisticCharge::class);
    }
}
