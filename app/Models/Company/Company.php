<?php

namespace App\Models\Company;

use App\Enums\CompanyStatusEnum;
use App\Enums\CompanyTypeEnum;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    /** @use HasFactory<\Database\Factories\Company\CompanyFactory> */
    use HasFactory,HasUuids;


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
