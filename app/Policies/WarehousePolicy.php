<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\Warehouse;
use App\Models\User;

class WarehousePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadWarehouse->value);
    }

    public function view(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadWarehouse->value)
            && $user->company_id === $warehouse->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateWarehouse->value);
    }

    public function update(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateWarehouse->value)
            && $user->company_id === $warehouse->company_id;
    }

    public function delete(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteWarehouse->value)
            && $user->company_id === $warehouse->company_id;
    }

    public function restore(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteWarehouse->value)
            && $user->company_id === $warehouse->company_id;
    }

    public function forceDelete(User $user, Warehouse $warehouse): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $warehouse->company_id;
    }
}
