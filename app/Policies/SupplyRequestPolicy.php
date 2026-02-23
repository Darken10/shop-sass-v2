<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\SupplyRequest;
use App\Models\User;

class SupplyRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadSupplyRequest->value);
    }

    public function view(User $user, SupplyRequest $supplyRequest): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadSupplyRequest->value)
            && $user->company_id === $supplyRequest->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateSupplyRequest->value);
    }

    public function update(User $user, SupplyRequest $supplyRequest): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateSupplyRequest->value)
            && $user->company_id === $supplyRequest->company_id;
    }

    public function approve(User $user, SupplyRequest $supplyRequest): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ApproveSupplyRequest->value)
            && $user->company_id === $supplyRequest->company_id;
    }
}
