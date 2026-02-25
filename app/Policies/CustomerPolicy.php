<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Pos\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadCustomer->value);
    }

    public function view(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadCustomer->value)
            && $user->company_id === $customer->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateCustomer->value);
    }

    public function update(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateCustomer->value)
            && $user->company_id === $customer->company_id;
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteCustomer->value)
            && $user->company_id === $customer->company_id;
    }
}
