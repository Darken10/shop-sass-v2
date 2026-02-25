<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Pos\Promotion;
use App\Models\User;

class PromotionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadPromotion->value);
    }

    public function view(User $user, Promotion $promotion): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadPromotion->value)
            && $user->company_id === $promotion->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreatePromotion->value);
    }

    public function update(User $user, Promotion $promotion): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdatePromotion->value)
            && $user->company_id === $promotion->company_id;
    }

    public function delete(User $user, Promotion $promotion): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeletePromotion->value)
            && $user->company_id === $promotion->company_id;
    }
}
