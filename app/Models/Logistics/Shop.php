<?php

namespace App\Models\Logistics;

use App\Concerns\BelongsToCompany;
use App\Enums\ShopStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shop extends Model
{
    /** @use HasFactory<\Database\Factories\Logistics\ShopFactory> */
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
            'status' => ShopStatus::class,
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(ShopStock::class);
    }

    public function incomingTransfers(): HasMany
    {
        return $this->hasMany(Transfer::class, 'destination_shop_id');
    }
}
