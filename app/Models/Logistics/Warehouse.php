<?php

namespace App\Models\Logistics;

use App\Concerns\BelongsToCompany;
use App\Enums\WarehouseStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    /** @use HasFactory<\Database\Factories\Logistics\WarehouseFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'code',
        'address',
        'city',
        'phone',
        'status',
        'description',
        'company_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => WarehouseStatus::class,
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(WarehouseStock::class);
    }

    public function outgoingMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'source_warehouse_id');
    }

    public function incomingMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'destination_warehouse_id');
    }

    public function supplyRequestsAsSource(): HasMany
    {
        return $this->hasMany(SupplyRequest::class, 'source_warehouse_id');
    }

    public function supplyRequestsAsDestination(): HasMany
    {
        return $this->hasMany(SupplyRequest::class, 'destination_warehouse_id');
    }
}
