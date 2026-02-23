<?php

namespace App\Concerns;

use App\Models\Company\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToCompany
{
    public static function bootBelongsToCompany(): void
    {
        static::addGlobalScope('company', function (Builder $builder) {
            $user = auth()->user();

            if ($user && $user->company_id) {
                $builder->where($builder->getModel()->getTable().'.company_id', $user->company_id);
            }
        });

        static::creating(function ($model) {
            $user = auth()->user();

            if ($user && $user->company_id && ! $model->company_id) {
                $model->company_id = $user->company_id;
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
