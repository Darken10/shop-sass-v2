<?php

namespace App\Models\Pos;

use App\Concerns\BelongsToCompany;
use App\Enums\SaleStatus;
use App\Models\Logistics\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    /** @use HasFactory<\Database\Factories\Pos\SaleFactory> */
    use BelongsToCompany, HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'reference',
        'status',
        'subtotal',
        'discount_total',
        'total',
        'amount_paid',
        'amount_due',
        'change_given',
        'change_residue',
        'qr_code_token',
        'notes',
        'session_id',
        'shop_id',
        'customer_id',
        'cashier_id',
        'company_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => SaleStatus::class,
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'amount_due' => 'decimal:2',
            'change_given' => 'decimal:2',
            'change_residue' => 'decimal:2',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(CashRegisterSession::class, 'session_id');
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }

    public function isFullyPaid(): bool
    {
        return $this->status === SaleStatus::Completed;
    }

    public function isPartiallyPaid(): bool
    {
        return $this->status === SaleStatus::PartiallyPaid;
    }
}
