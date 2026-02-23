<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Enums\WarehouseStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Warehouse;
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

    $logisticienRole = Role::firstOrCreate(['name' => RoleEnum::Logisticien->value, 'guard_name' => 'web']);
    $logisticienRole->syncPermissions(
        Permission::where('name', 'like', '%warehouse%')
            ->orWhere('name', 'like', '%stock%')
            ->orWhere('name', 'like', '%supply request%')
            ->orWhere('name', 'like', '%vehicle%')
            ->orWhere('name', 'like', '%fuel log%')
            ->orWhere('name', 'like', '%logistic charge%')
            ->orWhere('name', 'like', '%product%')
            ->orWhere('name', 'like', '%inventory%')
            ->orWhere('name', 'like', '%delivery%')
            ->get()
    );

    $caissierRole = Role::firstOrCreate(['name' => RoleEnum::Caissier->value, 'guard_name' => 'web']);
    $caissierRole->syncPermissions(
        Permission::where('name', 'like', '%cash%')
            ->orWhere('name', 'like', '%transaction%')
            ->get()
    );

    $this->companyA = Company::factory()->create();
    $this->companyB = Company::factory()->create();

    $this->admin = User::factory()->create(['company_id' => $this->companyA->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->logisticien = User::factory()->create(['company_id' => $this->companyA->id]);
    $this->logisticien->assignRole(RoleEnum::Logisticien->value);

    $this->caissier = User::factory()->create(['company_id' => $this->companyA->id]);
    $this->caissier->assignRole(RoleEnum::Caissier->value);

    $this->adminB = User::factory()->create(['company_id' => $this->companyB->id]);
    $this->adminB->assignRole(RoleEnum::Admin->value);
});

// --- Authorization ---

it('forbids unauthenticated users from accessing warehouses', function () {
    $this->get('/admin/logistics/warehouses')->assertRedirect('/login');
});

it('forbids caissier from creating warehouses', function () {
    actingAs($this->caissier)
        ->get('/admin/logistics/warehouses/create')
        ->assertForbidden();
});

it('allows logisticien to access warehouses', function () {
    actingAs($this->logisticien)
        ->get('/admin/logistics/warehouses')
        ->assertOk();
});

// --- CRUD ---

it('lists warehouses for the current company only', function () {
    $warehouseA = Warehouse::withoutGlobalScopes()->create([
        'name' => 'Entrepôt A',
        'code' => 'WH-A001',
        'status' => WarehouseStatus::Active,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    $warehouseB = Warehouse::withoutGlobalScopes()->create([
        'name' => 'Entrepôt B',
        'code' => 'WH-B001',
        'status' => WarehouseStatus::Active,
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get('/admin/logistics/warehouses')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/logistics/warehouses/index')
            ->has('warehouses.data', 1)
            ->where('warehouses.data.0.name', 'Entrepôt A')
        );
});

it('creates a warehouse', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/warehouses', [
            'name' => 'Nouvel Entrepôt',
            'code' => 'WH-NEW01',
            'address' => '123 Rue Principale',
            'city' => 'Bamako',
            'phone' => '+223 70 00 00 00',
            'status' => WarehouseStatus::Active->value,
            'description' => 'Un entrepôt principal',
        ])
        ->assertRedirect();

    assertDatabaseHas('warehouses', [
        'name' => 'Nouvel Entrepôt',
        'code' => 'WH-NEW01',
        'company_id' => $this->companyA->id,
    ]);
});

it('updates a warehouse', function () {
    $warehouse = Warehouse::withoutGlobalScopes()->create([
        'name' => 'Old Name',
        'code' => 'WH-UPD01',
        'status' => WarehouseStatus::Active,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->put("/admin/logistics/warehouses/{$warehouse->id}", [
            'name' => 'Updated Name',
            'code' => 'WH-UPD01',
            'status' => WarehouseStatus::Inactive->value,
        ])
        ->assertRedirect();

    assertDatabaseHas('warehouses', [
        'id' => $warehouse->id,
        'name' => 'Updated Name',
        'status' => WarehouseStatus::Inactive->value,
    ]);
});

it('soft deletes a warehouse', function () {
    $warehouse = Warehouse::withoutGlobalScopes()->create([
        'name' => 'To Delete',
        'code' => 'WH-DEL01',
        'status' => WarehouseStatus::Active,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->delete("/admin/logistics/warehouses/{$warehouse->id}")
        ->assertRedirect();

    assertSoftDeleted('warehouses', ['id' => $warehouse->id]);
});

it('prevents accessing warehouses from another company', function () {
    $warehouse = Warehouse::withoutGlobalScopes()->create([
        'name' => 'Other Company',
        'code' => 'WH-OTH01',
        'status' => WarehouseStatus::Active,
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get("/admin/logistics/warehouses/{$warehouse->id}")
        ->assertNotFound();
});
