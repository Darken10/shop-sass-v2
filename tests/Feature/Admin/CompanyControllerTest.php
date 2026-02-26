<?php

use App\Enums\CompanyStatusEnum;
use App\Enums\CompanyTypeEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertSoftDeleted;

beforeEach(function () {
    Role::firstOrCreate(['name' => RoleEnum::SuperAdmin->value, 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => RoleEnum::Admin->value, 'guard_name' => 'web']);

    $this->superAdmin = User::factory()->create();
    $this->superAdmin->assignRole(RoleEnum::SuperAdmin->value);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->guest = User::factory()->create();
});

// --- Authorization ---

it('forbids unauthenticated users from accessing companies', function () {
    $this->get('/admin/companies')->assertRedirect('/login');
});

it('forbids users without admin role from accessing companies', function () {
    actingAs($this->guest)
        ->get('/admin/companies')
        ->assertForbidden();
});

it('allows admin to access the companies index', function () {
    actingAs($this->admin)
        ->get('/admin/companies')
        ->assertInertia(fn (Assert $page) => $page->component('admin/companies/index'));
});

it('allows super admin to access the companies index', function () {
    actingAs($this->superAdmin)
        ->get('/admin/companies')
        ->assertInertia(fn (Assert $page) => $page->component('admin/companies/index'));
});

// --- Index ---

it('admin only sees companies they created', function () {
    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole(RoleEnum::Admin->value);

    Company::factory(2)->create(['created_by' => $this->admin->id]);
    Company::factory(3)->create(['created_by' => $otherAdmin->id]);

    actingAs($this->admin)
        ->get('/admin/companies')
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('admin/companies/index')
                ->has('companies.data', 2),
        );
});

it('super admin sees all companies', function () {
    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole(RoleEnum::Admin->value);

    Company::factory(2)->create(['created_by' => $this->admin->id]);
    Company::factory(3)->create(['created_by' => $otherAdmin->id]);

    actingAs($this->superAdmin)
        ->get('/admin/companies')
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('admin/companies/index')
                ->has('companies.data', 5),
        );
});

it('lists companies with pagination', function () {
    Company::factory(3)->create(['created_by' => $this->admin->id]);

    actingAs($this->admin)
        ->get('/admin/companies')
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('admin/companies/index')
                ->has('companies.data', 3),
        );
});

// --- Create ---

it('shows the create form to admin', function () {
    actingAs($this->admin)
        ->get('/admin/companies/create')
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('admin/companies/create')
                ->has('types'),
        );
});

// --- Store ---

it('creates a company with valid data', function () {
    $payload = [
        'name' => 'Acme Corp',
        'type' => CompanyTypeEnum::BOUTIQUE->value,
        'status' => CompanyStatusEnum::Active->value,
        'email' => 'contact@acme.com',
        'phone' => '+33 1 23 45 67 89',
        'city' => 'Paris',
        'country' => 'France',
    ];

    actingAs($this->admin)
        ->post('/admin/companies', $payload)
        ->assertRedirect();

    assertDatabaseHas('companies', [
        'name' => 'Acme Corp',
        'type' => CompanyTypeEnum::BOUTIQUE->value,
        'created_by' => $this->admin->id,
    ]);
});

it('validates required fields on store', function () {
    actingAs($this->admin)
        ->post('/admin/companies', [])
        ->assertInvalid(['name', 'type', 'status']);
});

it('validates email format on store', function () {
    actingAs($this->admin)
        ->post('/admin/companies', [
            'name' => 'Test',
            'type' => CompanyTypeEnum::SERVICE->value,
            'status' => CompanyStatusEnum::Active->value,
            'email' => 'not-an-email',
        ])
        ->assertInvalid(['email']);
});

// --- Show ---

it('shows a company to admin who created it', function () {
    $company = Company::factory()->create(['created_by' => $this->admin->id]);

    actingAs($this->admin)
        ->get("/admin/companies/{$company->id}")
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('admin/companies/show')
                ->has('company'),
        );
});

it('forbids admin from viewing a company they did not create', function () {
    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole(RoleEnum::Admin->value);
    $company = Company::factory()->create(['created_by' => $otherAdmin->id]);

    actingAs($this->admin)
        ->get("/admin/companies/{$company->id}")
        ->assertForbidden();
});

it('allows super admin to view any company', function () {
    $company = Company::factory()->create(['created_by' => $this->admin->id]);

    actingAs($this->superAdmin)
        ->get("/admin/companies/{$company->id}")
        ->assertInertia(
            fn (Assert $page) => $page->component('admin/companies/show'),
        );
});

it('forbids non-admin from viewing a company', function () {
    $company = Company::factory()->create();

    actingAs($this->guest)
        ->get("/admin/companies/{$company->id}")
        ->assertForbidden();
});

// --- Edit ---

it('shows the edit form to admin who created the company', function () {
    $company = Company::factory()->create(['created_by' => $this->admin->id]);

    actingAs($this->admin)
        ->get("/admin/companies/{$company->id}/edit")
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('admin/companies/edit')
                ->has('company')
                ->has('types'),
        );
});

it('forbids admin from editing a company they did not create', function () {
    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole(RoleEnum::Admin->value);
    $company = Company::factory()->create(['created_by' => $otherAdmin->id]);

    actingAs($this->admin)
        ->get("/admin/companies/{$company->id}/edit")
        ->assertForbidden();
});

it('allows super admin to edit any company', function () {
    $company = Company::factory()->create(['created_by' => $this->admin->id]);

    actingAs($this->superAdmin)
        ->get("/admin/companies/{$company->id}/edit")
        ->assertInertia(
            fn (Assert $page) => $page->component('admin/companies/edit'),
        );
});

// --- Update ---

it('updates a company with valid data', function () {
    $company = Company::factory()->create(['created_by' => $this->admin->id]);

    actingAs($this->admin)
        ->put("/admin/companies/{$company->id}", [
            'name' => 'Updated Name',
            'type' => CompanyTypeEnum::RESTAURANT->value,
            'status' => CompanyStatusEnum::Inactive->value,
        ])
        ->assertRedirect();

    assertDatabaseHas('companies', [
        'id' => $company->id,
        'name' => 'Updated Name',
        'type' => CompanyTypeEnum::RESTAURANT->value,
    ]);
});

it('forbids non-admin from updating a company', function () {
    $company = Company::factory()->create();

    actingAs($this->guest)
        ->put("/admin/companies/{$company->id}", ['name' => 'Hack'])
        ->assertForbidden();
});

it('forbids admin from updating a company they did not create', function () {
    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole(RoleEnum::Admin->value);
    $company = Company::factory()->create(['created_by' => $otherAdmin->id]);

    actingAs($this->admin)
        ->put("/admin/companies/{$company->id}", [
            'name' => 'Hack',
            'type' => CompanyTypeEnum::BOUTIQUE->value,
            'status' => CompanyStatusEnum::Active->value,
        ])
        ->assertForbidden();
});

it('allows super admin to update any company', function () {
    $company = Company::factory()->create(['created_by' => $this->admin->id]);

    actingAs($this->superAdmin)
        ->put("/admin/companies/{$company->id}", [
            'name' => 'Updated by SuperAdmin',
            'type' => CompanyTypeEnum::SERVICE->value,
            'status' => CompanyStatusEnum::Active->value,
        ])
        ->assertRedirect();

    assertDatabaseHas('companies', [
        'id' => $company->id,
        'name' => 'Updated by SuperAdmin',
    ]);
});

it('soft-deletes a company created by admin', function () {
    $company = Company::factory()->create(['created_by' => $this->admin->id]);

    actingAs($this->admin)
        ->delete("/admin/companies/{$company->id}")
        ->assertRedirect('/admin/companies');

    assertSoftDeleted('companies', ['id' => $company->id]);
});

it('forbids admin from deleting a company they did not create', function () {
    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole(RoleEnum::Admin->value);
    $company = Company::factory()->create(['created_by' => $otherAdmin->id]);

    actingAs($this->admin)
        ->delete("/admin/companies/{$company->id}")
        ->assertForbidden();
});

it('allows super admin to delete any company', function () {
    $company = Company::factory()->create(['created_by' => $this->admin->id]);

    actingAs($this->superAdmin)
        ->delete("/admin/companies/{$company->id}")
        ->assertRedirect('/admin/companies');

    assertSoftDeleted('companies', ['id' => $company->id]);
});

it('forbids non-admin from deleting a company', function () {
    $company = Company::factory()->create();

    actingAs($this->guest)
        ->delete("/admin/companies/{$company->id}")
        ->assertForbidden();
});
