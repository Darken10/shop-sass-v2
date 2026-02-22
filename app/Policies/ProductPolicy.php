<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Product\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadProduct->value);
    }

    public function view(User $user, Product $product): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadProduct->value)
            && $user->company_id === $product->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateProduct->value);
    }

    public function update(User $user, Product $product): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateProduct->value)
            && $user->company_id === $product->company_id;
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteProduct->value)
            && $user->company_id === $product->company_id;
    }

    public function restore(User $user, Product $product): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteProduct->value)
            && $user->company_id === $product->company_id;
    }

    public function forceDelete(User $user, Product $product): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $product->company_id;
    }
}
