<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\WarehouseStock;
use App\Models\User;

class WarehouseStockPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadStock->value);
    }

    public function view(User $user, WarehouseStock $stock): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadStock->value)
            && $user->company_id === $stock->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateStock->value);
    }

    public function update(User $user, WarehouseStock $stock): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateStock->value)
            && $user->company_id === $stock->company_id;
    }

    public function delete(User $user, WarehouseStock $stock): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteStock->value)
            && $user->company_id === $stock->company_id;
    }
}
