<?php

use App\Enums\LogisticChargeType;
use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
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
});

it('lists logistic charges', function () {
    actingAs($this->admin)
        ->get('/admin/logistics/charges')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/logistics/charges/index'));
});

it('creates a logistic charge', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/charges', [
            'label' => 'Frais de chargement',
            'type' => LogisticChargeType::Loading->value,
            'amount' => 15000.00,
            'notes' => 'Chargement marchandises',
            'stock_movement_id' => null,
            'supply_request_id' => null,
        ])
        ->assertRedirect();

    assertDatabaseHas('logistic_charges', [
        'label' => 'Frais de chargement',
        'company_id' => $this->company->id,
    ]);
});
