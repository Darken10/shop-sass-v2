<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Pos\CashRegisterSession;
use App\Models\User;

class CashRegisterSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ManageCash->value);
    }

    public function view(User $user, CashRegisterSession $session): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ManageCash->value)
            && $user->company_id === $session->company_id;
    }

    public function open(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::OpenCashRegister->value);
    }

    public function close(User $user, CashRegisterSession $session): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CloseCashRegister->value)
            && $user->company_id === $session->company_id
            && $user->id === $session->cashier_id;
    }
}
