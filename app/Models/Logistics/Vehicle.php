<?php

namespace App\Models\Logistics;

use App\Concerns\BelongsToCompany;
use App\Enums\VehicleStatus;
use App\Enums\VehicleType;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    /** @use HasFactory<\Database\Factories\Logistics\VehicleFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'type',
        'registration_number',
        'load_capacity',
        'average_consumption',
        'status',
        'notes',
        'company_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => VehicleType::class,
            'status' => VehicleStatus::class,
            'load_capacity' => 'decimal:2',
            'average_consumption' => 'decimal:2',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function fuelLogs(): HasMany
    {
        return $this->hasMany(FuelLog::class);
    }
}
