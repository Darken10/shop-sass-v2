<?php

namespace App\Policies;

use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\User;

class CompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]);
    }

    public function view(User $user, Company $company): bool
    {
        return $user->hasAnyRole([RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]);
    }

    public function update(User $user, Company $company): bool
    {
        return $user->hasAnyRole([RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]);
    }

    public function delete(User $user, Company $company): bool
    {
        return $user->hasAnyRole([RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]);
    }

    public function restore(User $user, Company $company): bool
    {
        return $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    public function forceDelete(User $user, Company $company): bool
    {
        return $user->hasRole(RoleEnum::SuperAdmin->value);
    }
}
