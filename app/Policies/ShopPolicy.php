<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\Shop;
use App\Models\User;

class ShopPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadShop->value);
    }

    public function view(User $user, Shop $shop): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadShop->value)
            && $user->company_id === $shop->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateShop->value);
    }

    public function update(User $user, Shop $shop): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateShop->value)
            && $user->company_id === $shop->company_id;
    }

    public function delete(User $user, Shop $shop): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteShop->value)
            && $user->company_id === $shop->company_id;
    }

    public function restore(User $user, Shop $shop): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteShop->value)
            && $user->company_id === $shop->company_id;
    }

    public function forceDelete(User $user, Shop $shop): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $shop->company_id;
    }
}
