<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Permission;
use App\Models\Pos\Customer;
use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

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
    $this->companyB = Company::factory()->create();

    $this->admin = User::factory()->create(['company_id' => $this->company->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->adminB = User::factory()->create(['company_id' => $this->companyB->id]);
    $this->adminB->assignRole(RoleEnum::Admin->value);
});

// --- Index ---

it('shows customer list', function () {
    actingAs($this->admin)
        ->get('/pos/customers')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('pos/customers/index'));
});

// --- Store ---

it('creates a customer', function () {
    actingAs($this->admin)
        ->post('/pos/customers', [
            'name' => 'Jean Dupont',
            'phone' => '+22890001234',
            'email' => 'jean@example.com',
        ])
        ->assertRedirect();

    assertDatabaseHas('customers', [
        'name' => 'Jean Dupont',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);
});

// --- Quick store (JSON) ---

it('quick-creates a customer via JSON', function () {
    actingAs($this->admin)
        ->postJson('/pos/customers/quick-store', [
            'name' => 'Quick Client',
            'phone' => '99887766',
        ])
        ->assertCreated()
        ->assertJsonFragment(['name' => 'Quick Client']);
});

// --- Update ---

it('updates a customer', function () {
    $customer = Customer::withoutGlobalScopes()->create([
        'name' => 'Old Name',
        'phone' => '1234',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->put("/pos/customers/{$customer->id}", [
            'name' => 'New Name',
            'phone' => '5678',
        ])
        ->assertRedirect();

    expect($customer->fresh()->name)->toBe('New Name');
});

// --- Delete ---

it('soft deletes a customer', function () {
    $customer = Customer::withoutGlobalScopes()->create([
        'name' => 'To Delete',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->delete("/pos/customers/{$customer->id}")
        ->assertRedirect();

    assertSoftDeleted('customers', ['id' => $customer->id]);
});

// --- Company isolation ---

it('only shows customers from the same company', function () {
    Customer::withoutGlobalScopes()->create([
        'name' => 'My Client',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    Customer::withoutGlobalScopes()->create([
        'name' => 'Other Client',
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get('/pos/customers')
        ->assertInertia(fn (Assert $page) => $page
            ->component('pos/customers/index')
            ->has('customers.data', 1)
            ->where('customers.data.0.name', 'My Client')
        );
});
