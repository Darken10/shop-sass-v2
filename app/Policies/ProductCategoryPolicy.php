<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Product\ProductCategory;
use App\Models\User;

class ProductCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadProductCategory->value);
    }

    public function view(User $user, ProductCategory $productCategory): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadProductCategory->value)
            && $user->company_id === $productCategory->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateProductCategory->value);
    }

    public function update(User $user, ProductCategory $productCategory): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateProductCategory->value)
            && $user->company_id === $productCategory->company_id;
    }

    public function delete(User $user, ProductCategory $productCategory): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteProductCategory->value)
            && $user->company_id === $productCategory->company_id;
    }

    public function restore(User $user, ProductCategory $productCategory): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteProductCategory->value)
            && $user->company_id === $productCategory->company_id;
    }

    public function forceDelete(User $user, ProductCategory $productCategory): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $productCategory->company_id;
    }
}
