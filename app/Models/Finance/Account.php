<?php

namespace App\Models\Finance;

use App\Concerns\BelongsToCompany;
use App\Enums\AccountType;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Account extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'code',
        'type',
        'description',
        'balance',
        'is_active',
        'is_system',
        'category_id',
        'company_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => AccountType::class,
            'balance' => 'decimal:2',
            'is_active' => 'boolean',
            'is_system' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AccountCategory::class, 'category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function journalEntryLines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function debit(float $amount): void
    {
        if ($this->type === AccountType::Asset || $this->type === AccountType::Expense) {
            $this->increment('balance', $amount);
        } else {
            $this->decrement('balance', $amount);
        }
    }

    public function credit(float $amount): void
    {
        if ($this->type === AccountType::Asset || $this->type === AccountType::Expense) {
            $this->decrement('balance', $amount);
        } else {
            $this->increment('balance', $amount);
        }
    }
}
