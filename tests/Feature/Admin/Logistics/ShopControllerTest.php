<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Enums\ShopStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Shop;
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
            ->orWhere('name', 'like', '%shop%')
            ->orWhere('name', 'like', '%stock%')
            ->orWhere('name', 'like', '%supply request%')
            ->orWhere('name', 'like', '%supplier%')
            ->orWhere('name', 'like', '%transfer%')
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

it('forbids unauthenticated users from accessing shops', function () {
    $this->get('/admin/logistics/shops')->assertRedirect('/login');
});

it('forbids caissier from creating shops', function () {
    actingAs($this->caissier)
        ->get('/admin/logistics/shops/create')
        ->assertForbidden();
});

it('allows logisticien to access shops', function () {
    actingAs($this->logisticien)
        ->get('/admin/logistics/shops')
        ->assertOk();
});

// --- CRUD ---

it('lists shops for the current company only', function () {
    $shopA = Shop::withoutGlobalScopes()->create([
        'name' => 'Magasin A',
        'code' => 'SHP-A001',
        'status' => ShopStatus::Active,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    $shopB = Shop::withoutGlobalScopes()->create([
        'name' => 'Magasin B',
        'code' => 'SHP-B001',
        'status' => ShopStatus::Active,
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get('/admin/logistics/shops')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/logistics/shops/index')
            ->has('shops.data', 1)
            ->where('shops.data.0.name', 'Magasin A')
        );
});

it('creates a shop', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/shops', [
            'name' => 'Nouveau Magasin',
            'code' => 'SHP-NEW01',
            'address' => '456 Avenue Principale',
            'city' => 'Bamako',
            'phone' => '+223 70 00 00 00',
            'status' => ShopStatus::Active->value,
            'description' => 'Un point de vente principal',
        ])
        ->assertRedirect();

    assertDatabaseHas('shops', [
        'name' => 'Nouveau Magasin',
        'code' => 'SHP-NEW01',
        'company_id' => $this->companyA->id,
    ]);
});

it('updates a shop', function () {
    $shop = Shop::withoutGlobalScopes()->create([
        'name' => 'Old Name',
        'code' => 'SHP-UPD01',
        'status' => ShopStatus::Active,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->put("/admin/logistics/shops/{$shop->id}", [
            'name' => 'Updated Name',
            'code' => 'SHP-UPD01',
            'status' => ShopStatus::Inactive->value,
        ])
        ->assertRedirect();

    assertDatabaseHas('shops', [
        'id' => $shop->id,
        'name' => 'Updated Name',
        'status' => ShopStatus::Inactive->value,
    ]);
});

it('soft deletes a shop', function () {
    $shop = Shop::withoutGlobalScopes()->create([
        'name' => 'To Delete',
        'code' => 'SHP-DEL01',
        'status' => ShopStatus::Active,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->delete("/admin/logistics/shops/{$shop->id}")
        ->assertRedirect();

    assertSoftDeleted('shops', ['id' => $shop->id]);
});

it('prevents accessing shops from another company', function () {
    $shop = Shop::withoutGlobalScopes()->create([
        'name' => 'Other Company',
        'code' => 'SHP-OTH01',
        'status' => ShopStatus::Active,
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get("/admin/logistics/shops/{$shop->id}")
        ->assertNotFound();
});
