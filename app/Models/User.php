<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, HasUuids, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'company_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(RoleEnum::SuperAdmin->value);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(RoleEnum::Admin->value);
    }

    /**
     * Get the roles that this user can assign to others.
     *
     * @return array<string>
     */
    public function assignableRoles(): array
    {
        if ($this->isSuperAdmin()) {
            return RoleEnum::all();
        }

        if ($this->isAdmin()) {
            return array_values(array_filter(
                RoleEnum::all(),
                fn (string $role) => ! in_array($role, [RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]),
            ));
        }

        return [];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
