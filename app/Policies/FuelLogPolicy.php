<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\FuelLog;
use App\Models\User;

class FuelLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadFuelLog->value);
    }

    public function view(User $user, FuelLog $fuelLog): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadFuelLog->value)
            && $user->company_id === $fuelLog->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateFuelLog->value);
    }
}
