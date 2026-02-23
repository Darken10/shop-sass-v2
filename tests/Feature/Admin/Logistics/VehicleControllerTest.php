<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Enums\VehicleStatus;
use App\Enums\VehicleType;
use App\Models\Company\Company;
use App\Models\Logistics\Vehicle;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertSoftDeleted;

beforeEach(function () {
    foreach (PermissionEnum::cases() as $perm) {
        Permission::firstOrCreate(['name' => $perm->value, 'guard_name' => 'web']);
    }

    $adminRole = Role::firstOrCreate(['name' => RoleEnum::Admin->value, 'guard_name' => 'web']);
    $adminRole->syncPermissions(Permission::all());

    $this->company = Company::factory()->create();

    $this->admin = User::factory()->create(['company_id' => $this->company->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);
});

it('lists vehicles', function () {
    actingAs($this->admin)
        ->get('/admin/logistics/vehicles')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/logistics/vehicles/index'));
});

it('creates a vehicle', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/vehicles', [
            'name' => 'Camion 001',
            'type' => VehicleType::Truck->value,
            'registration_number' => 'BK-1234-ML',
            'load_capacity' => 5000.00,
            'average_consumption' => 15.50,
            'status' => VehicleStatus::Active->value,
            'notes' => 'Véhicule principal',
        ])
        ->assertRedirect();

    assertDatabaseHas('vehicles', [
        'name' => 'Camion 001',
        'registration_number' => 'BK-1234-ML',
        'company_id' => $this->company->id,
    ]);
});

it('updates a vehicle', function () {
    $vehicle = Vehicle::withoutGlobalScopes()->create([
        'name' => 'Old Vehicle',
        'type' => VehicleType::Truck,
        'registration_number' => 'BK-5678-ML',
        'status' => VehicleStatus::Active,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->put("/admin/logistics/vehicles/{$vehicle->id}", [
            'name' => 'Updated Vehicle',
            'type' => VehicleType::Van->value,
            'registration_number' => 'BK-5678-ML',
            'status' => VehicleStatus::InMaintenance->value,
        ])
        ->assertRedirect();

    assertDatabaseHas('vehicles', [
        'id' => $vehicle->id,
        'name' => 'Updated Vehicle',
        'status' => VehicleStatus::InMaintenance->value,
    ]);
});

it('soft deletes a vehicle', function () {
    $vehicle = Vehicle::withoutGlobalScopes()->create([
        'name' => 'To Delete',
        'type' => VehicleType::Tricycle,
        'registration_number' => 'BK-DEL-ML',
        'status' => VehicleStatus::Active,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->delete("/admin/logistics/vehicles/{$vehicle->id}")
        ->assertRedirect();

    assertSoftDeleted('vehicles', ['id' => $vehicle->id]);
});
