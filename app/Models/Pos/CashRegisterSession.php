<?php

namespace App\Models\Pos;

use App\Concerns\BelongsToCompany;
use App\Enums\CashRegisterSessionStatus;
use App\Models\Logistics\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashRegisterSession extends Model
{
    /** @use HasFactory<\Database\Factories\Pos\CashRegisterSessionFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'session_number',
        'status',
        'opening_amount',
        'closing_amount',
        'total_sales',
        'total_cash',
        'total_mobile_money',
        'total_bank_card',
        'total_bank_transfer',
        'total_credit',
        'closing_notes',
        'opened_at',
        'closed_at',
        'shop_id',
        'cashier_id',
        'company_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => CashRegisterSessionStatus::class,
            'opening_amount' => 'decimal:2',
            'closing_amount' => 'decimal:2',
            'total_sales' => 'decimal:2',
            'total_cash' => 'decimal:2',
            'total_mobile_money' => 'decimal:2',
            'total_bank_card' => 'decimal:2',
            'total_bank_transfer' => 'decimal:2',
            'total_credit' => 'decimal:2',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'session_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class, 'session_id');
    }

    public function isOpen(): bool
    {
        return $this->status === CashRegisterSessionStatus::Open;
    }

    public function isClosed(): bool
    {
        return $this->status === CashRegisterSessionStatus::Closed;
    }
}
