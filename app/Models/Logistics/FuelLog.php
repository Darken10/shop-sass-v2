<?php

namespace App\Models\Logistics;

use App\Concerns\BelongsToCompany;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FuelLog extends Model
{
    /** @use HasFactory<\Database\Factories\Logistics\FuelLogFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'quantity_liters',
        'cost',
        'odometer_reading',
        'fueled_at',
        'notes',
        'vehicle_id',
        'stock_movement_id',
        'transfer_id',
        'company_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity_liters' => 'decimal:2',
            'cost' => 'decimal:2',
            'odometer_reading' => 'decimal:2',
            'fueled_at' => 'date',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function stockMovement(): BelongsTo
    {
        return $this->belongsTo(StockMovement::class);
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
