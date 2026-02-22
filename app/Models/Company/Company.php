<?php

namespace App\Models\Company;

use App\Enums\CompanyStatusEnum;
use App\Enums\CompanyTypeEnum;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    /** @use HasFactory<\Database\Factories\Company\CompanyFactory> */
    use HasFactory,HasUuids,SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'website',
        'description',
        'logo',
        'type',
        'status',
        'created_by',
    ];

    protected $casts = [
        'type' => CompanyTypeEnum::class,
        'status' => CompanyStatusEnum::class,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
