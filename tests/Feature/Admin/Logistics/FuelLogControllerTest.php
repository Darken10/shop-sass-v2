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

beforeEach(function () {
    foreach (PermissionEnum::cases() as $perm) {
        Permission::firstOrCreate(['name' => $perm->value, 'guard_name' => 'web']);
    }

    $adminRole = Role::firstOrCreate(['name' => RoleEnum::Admin->value, 'guard_name' => 'web']);
    $adminRole->syncPermissions(Permission::all());

    $this->company = Company::factory()->create();

    $this->admin = User::factory()->create(['company_id' => $this->company->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->vehicle = Vehicle::withoutGlobalScopes()->create([
        'name' => 'Test Vehicle',
        'type' => VehicleType::Truck,
        'registration_number' => 'BK-FUEL-ML',
        'status' => VehicleStatus::Active,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);
});

it('lists fuel logs', function () {
    actingAs($this->admin)
        ->get('/admin/logistics/fuel-logs')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/logistics/fuel-logs/index'));
});

it('creates a fuel log', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/fuel-logs', [
            'quantity_liters' => 50.00,
            'cost' => 25000.00,
            'odometer_reading' => 15000.50,
            'fueled_at' => '2026-02-23',
            'notes' => 'Plein de carburant',
            'vehicle_id' => $this->vehicle->id,
            'stock_movement_id' => null,
        ])
        ->assertRedirect();

    assertDatabaseHas('fuel_logs', [
        'vehicle_id' => $this->vehicle->id,
        'company_id' => $this->company->id,
    ]);
});
