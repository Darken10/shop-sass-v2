<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Logistics\Supplier;
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
        Permission::where('name', 'like', '%supplier%')
            ->orWhere('name', 'like', '%warehouse%')
            ->orWhere('name', 'like', '%stock%')
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

it('forbids unauthenticated users from accessing suppliers', function () {
    $this->get('/admin/logistics/suppliers')->assertRedirect('/login');
});

it('forbids caissier from creating suppliers', function () {
    actingAs($this->caissier)
        ->get('/admin/logistics/suppliers/create')
        ->assertForbidden();
});

it('allows logisticien to access suppliers', function () {
    actingAs($this->logisticien)
        ->get('/admin/logistics/suppliers')
        ->assertOk();
});

// --- CRUD ---

it('lists suppliers for the current company only', function () {
    $supplierA = Supplier::withoutGlobalScopes()->create([
        'name' => 'Fournisseur A',
        'code' => 'SUP-A001',
        'is_active' => true,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    $supplierB = Supplier::withoutGlobalScopes()->create([
        'name' => 'Fournisseur B',
        'code' => 'SUP-B001',
        'is_active' => true,
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get('/admin/logistics/suppliers')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/logistics/suppliers/index')
            ->has('suppliers.data', 1)
            ->where('suppliers.data.0.name', 'Fournisseur A')
        );
});

it('creates a supplier', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/suppliers', [
            'name' => 'Nouveau Fournisseur',
            'code' => 'SUP-NEW01',
            'contact_name' => 'Jean Dupont',
            'email' => 'jean@example.com',
            'phone' => '+223 70 11 11 11',
            'address' => '789 Rue Commerce',
            'city' => 'Bamako',
            'notes' => 'Fournisseur principal',
            'is_active' => true,
        ])
        ->assertRedirect();

    assertDatabaseHas('suppliers', [
        'name' => 'Nouveau Fournisseur',
        'code' => 'SUP-NEW01',
        'company_id' => $this->companyA->id,
    ]);
});

it('updates a supplier', function () {
    $supplier = Supplier::withoutGlobalScopes()->create([
        'name' => 'Old Name',
        'code' => 'SUP-UPD01',
        'is_active' => true,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->put("/admin/logistics/suppliers/{$supplier->id}", [
            'name' => 'Updated Name',
            'code' => 'SUP-UPD01',
            'is_active' => false,
        ])
        ->assertRedirect();

    assertDatabaseHas('suppliers', [
        'id' => $supplier->id,
        'name' => 'Updated Name',
        'is_active' => false,
    ]);
});

it('soft deletes a supplier', function () {
    $supplier = Supplier::withoutGlobalScopes()->create([
        'name' => 'To Delete',
        'code' => 'SUP-DEL01',
        'is_active' => true,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->delete("/admin/logistics/suppliers/{$supplier->id}")
        ->assertRedirect();

    assertSoftDeleted('suppliers', ['id' => $supplier->id]);
});

it('prevents accessing suppliers from another company', function () {
    $supplier = Supplier::withoutGlobalScopes()->create([
        'name' => 'Other Company',
        'code' => 'SUP-OTH01',
        'is_active' => true,
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get("/admin/logistics/suppliers/{$supplier->id}")
        ->assertNotFound();
});
