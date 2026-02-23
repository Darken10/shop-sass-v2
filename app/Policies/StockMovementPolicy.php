<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\StockMovement;
use App\Models\User;

class StockMovementPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadStockMovement->value);
    }

    public function view(User $user, StockMovement $movement): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadStockMovement->value)
            && $user->company_id === $movement->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateStockMovement->value);
    }
}
