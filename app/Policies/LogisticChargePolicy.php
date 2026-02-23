<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\LogisticCharge;
use App\Models\User;

class LogisticChargePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadLogisticCharge->value);
    }

    public function view(User $user, LogisticCharge $charge): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadLogisticCharge->value)
            && $user->company_id === $charge->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateLogisticCharge->value);
    }
}
