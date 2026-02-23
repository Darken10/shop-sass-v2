<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\Supplier;
use App\Models\User;

class SupplierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadSupplier->value);
    }

    public function view(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadSupplier->value)
            && $user->company_id === $supplier->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateSupplier->value);
    }

    public function update(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateSupplier->value)
            && $user->company_id === $supplier->company_id;
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteSupplier->value)
            && $user->company_id === $supplier->company_id;
    }

    public function restore(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteSupplier->value)
            && $user->company_id === $supplier->company_id;
    }

    public function forceDelete(User $user, Supplier $supplier): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $supplier->company_id;
    }
}
