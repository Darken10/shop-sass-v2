<?php

namespace App\Models\Finance;

use App\Concerns\BelongsToCompany;
use App\Enums\FinancialReportType;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialReport extends Model
{
    use BelongsToCompany, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'title',
        'type',
        'period_start',
        'period_end',
        'filters',
        'data',
        'summary',
        'status',
        'company_id',
        'generated_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => FinancialReportType::class,
            'period_start' => 'date',
            'period_end' => 'date',
            'filters' => 'array',
            'data' => 'array',
            'summary' => 'array',
        ];
    }

    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
