<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Product\ProductTag;
use App\Models\User;

class ProductTagPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadProductTag->value);
    }

    public function view(User $user, ProductTag $productTag): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadProductTag->value)
            && $user->company_id === $productTag->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateProductTag->value);
    }

    public function update(User $user, ProductTag $productTag): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateProductTag->value)
            && $user->company_id === $productTag->company_id;
    }

    public function delete(User $user, ProductTag $productTag): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteProductTag->value)
            && $user->company_id === $productTag->company_id;
    }

    public function restore(User $user, ProductTag $productTag): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteProductTag->value)
            && $user->company_id === $productTag->company_id;
    }

    public function forceDelete(User $user, ProductTag $productTag): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $productTag->company_id;
    }
}
