<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\Transfer;
use App\Models\User;

class TransferPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadTransfer->value);
    }

    public function view(User $user, Transfer $transfer): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadTransfer->value)
            && $user->company_id === $transfer->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateTransfer->value);
    }

    public function update(User $user, Transfer $transfer): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateTransfer->value)
            && $user->company_id === $transfer->company_id;
    }

    public function approve(User $user, Transfer $transfer): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ApproveTransfer->value)
            && $user->company_id === $transfer->company_id;
    }

    public function delete(User $user, Transfer $transfer): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $transfer->company_id;
    }

    public function restore(User $user, Transfer $transfer): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $transfer->company_id;
    }

    public function forceDelete(User $user, Transfer $transfer): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $transfer->company_id;
    }
}
