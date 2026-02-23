<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Logistics\Vehicle;
use App\Models\User;

class VehiclePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadVehicle->value);
    }

    public function view(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo(PermissionEnum::ReadVehicle->value)
            && $user->company_id === $vehicle->company_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(PermissionEnum::CreateVehicle->value);
    }

    public function update(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo(PermissionEnum::UpdateVehicle->value)
            && $user->company_id === $vehicle->company_id;
    }

    public function delete(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteVehicle->value)
            && $user->company_id === $vehicle->company_id;
    }

    public function restore(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo(PermissionEnum::DeleteVehicle->value)
            && $user->company_id === $vehicle->company_id;
    }

    public function forceDelete(User $user, Vehicle $vehicle): bool
    {
        return $user->isSuperAdmin()
            && $user->company_id === $vehicle->company_id;
    }
}
