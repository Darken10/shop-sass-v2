<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Pos\Sale;
use App\Models\User;

class SalePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadSale->value);
    }

    public function view(User $user, Sale $sale): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadSale->value)
            && $user->company_id === $sale->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateSale->value);
    }

    public function cancel(User $user, Sale $sale): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CancelSale->value)
            && $user->company_id === $sale->company_id;
    }

    public function processCreditPayment(User $user, Sale $sale): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ProcessCreditPayment->value)
            && $user->company_id === $sale->company_id;
    }
}
