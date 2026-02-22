<?php

use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Role;
use App\Models\User;
use App\Notifications\AccountActivationNotification;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;

beforeEach(function () {
    // Ensure roles exist
    foreach (RoleEnum::all() as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->company = Company::factory()->create();

    $this->superAdmin = User::factory()->create();
    $this->superAdmin->assignRole(RoleEnum::SuperAdmin->value);

    $this->admin = User::factory()->create(['company_id' => $this->company->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->guest = User::factory()->create();
});

// --- Authorization ---

it('forbids unauthenticated users from accessing users', function () {
    $this->get('/admin/users')->assertRedirect('/login');
});

it('forbids users without admin role from accessing users', function () {
    actingAs($this->guest)
        ->get('/admin/users')
        ->assertForbidden();
});

it('allows admin to access the users index', function () {
    actingAs($this->admin)
        ->get('/admin/users')
        ->assertInertia(fn (Assert $page) => $page->component('admin/users/index'));
});

it('allows super admin to access the users index', function () {
    actingAs($this->superAdmin)
        ->get('/admin/users')
        ->assertInertia(fn (Assert $page) => $page->component('admin/users/index'));
});

// --- Index: Company Scoping ---

it('super admin sees all users', function () {
    $otherCompany = Company::factory()->create();
    User::factory()->create(['company_id' => $this->company->id]);
    User::factory()->create(['company_id' => $otherCompany->id]);

    $totalUsers = User::count();

    actingAs($this->superAdmin)
        ->get('/admin/users')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('users.total', $totalUsers),
        );
});

it('admin only sees users from their company', function () {
    $otherCompany = Company::factory()->create();
    User::factory()->create(['company_id' => $this->company->id]);
    User::factory()->create(['company_id' => $otherCompany->id]);

    actingAs($this->admin)
        ->get('/admin/users')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            // admin + 1 same-company user = 2
            ->where('users.total', 2),
        );
});

// --- Create ---

it('shows the create form to admin', function () {
    actingAs($this->admin)
        ->get('/admin/users/create')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/create')
            ->has('roles')
            ->has('companies'),
        );
});

it('super admin sees all roles in create form', function () {
    actingAs($this->superAdmin)
        ->get('/admin/users/create')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/create')
            ->where('roles', RoleEnum::all()),
        );
});

it('admin sees only assignable roles (no super admin or admin)', function () {
    actingAs($this->admin)
        ->get('/admin/users/create')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/create')
            ->where('roles', function ($roles) {
                $arr = $roles instanceof \Illuminate\Support\Collection ? $roles->toArray() : (array) $roles;

                return ! in_array('super admin', $arr) && ! in_array('admin', $arr);
            }),
        );
});

// --- Store ---

it('creates a user with valid data and sends activation email', function () {
    Notification::fake();

    $payload = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'role' => RoleEnum::Gestionnaire->value,
        'company_id' => $this->company->id,
    ];

    actingAs($this->superAdmin)
        ->post('/admin/users', $payload)
        ->assertRedirect('/admin/users');

    assertDatabaseHas('users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'company_id' => $this->company->id,
    ]);

    $user = User::where('email', 'john@example.com')->first();
    expect($user->password)->toBeNull();
    expect($user->hasRole(RoleEnum::Gestionnaire->value))->toBeTrue();

    Notification::assertSentTo($user, AccountActivationNotification::class);
});

it('admin auto-assigns their company_id on store', function () {
    Notification::fake();

    actingAs($this->admin)
        ->post('/admin/users', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'role' => RoleEnum::Caissier->value,
        ])
        ->assertRedirect('/admin/users');

    assertDatabaseHas('users', [
        'email' => 'jane@example.com',
        'company_id' => $this->company->id,
    ]);
});

it('validates required fields on store', function () {
    actingAs($this->superAdmin)
        ->post('/admin/users', [])
        ->assertInvalid(['name', 'email', 'role', 'company_id']);
});

it('validates unique email on store', function () {
    actingAs($this->superAdmin)
        ->post('/admin/users', [
            'name' => 'Duplicate',
            'email' => $this->admin->email,
            'role' => RoleEnum::Gestionnaire->value,
            'company_id' => $this->company->id,
        ])
        ->assertInvalid(['email']);
});

it('validates role in assignable roles', function () {
    actingAs($this->admin)
        ->post('/admin/users', [
            'name' => 'Hacker',
            'email' => 'hacker@example.com',
            'role' => RoleEnum::SuperAdmin->value,
        ])
        ->assertInvalid(['role']);
});

// --- Edit ---

it('shows edit form for admin user in same company', function () {
    $user = User::factory()->create(['company_id' => $this->company->id]);

    actingAs($this->admin)
        ->get("/admin/users/{$user->id}/edit")
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/edit')
            ->has('user')
            ->has('roles')
            ->has('companies'),
        );
});

it('admin cannot edit user from another company', function () {
    $otherCompany = Company::factory()->create();
    $user = User::factory()->create(['company_id' => $otherCompany->id]);

    actingAs($this->admin)
        ->get("/admin/users/{$user->id}/edit")
        ->assertForbidden();
});

// --- Update ---

it('updates a user with valid data', function () {
    $user = User::factory()->gestionnaire()->create(['company_id' => $this->company->id]);

    actingAs($this->superAdmin)
        ->put("/admin/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'role' => RoleEnum::Caissier->value,
            'company_id' => $this->company->id,
        ])
        ->assertRedirect('/admin/users');

    assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
    ]);

    expect($user->fresh()->hasRole(RoleEnum::Caissier->value))->toBeTrue();
    expect($user->fresh()->hasRole(RoleEnum::Gestionnaire->value))->toBeFalse();
});

it('admin cannot update user from another company', function () {
    $otherCompany = Company::factory()->create();
    $user = User::factory()->create(['company_id' => $otherCompany->id]);

    actingAs($this->admin)
        ->put("/admin/users/{$user->id}", ['name' => 'Hack'])
        ->assertForbidden();
});

// --- Destroy ---

it('deletes a user', function () {
    $user = User::factory()->create(['company_id' => $this->company->id]);

    actingAs($this->superAdmin)
        ->delete("/admin/users/{$user->id}")
        ->assertRedirect('/admin/users');

    expect(User::find($user->id))->toBeNull();
});

it('cannot delete yourself', function () {
    actingAs($this->superAdmin)
        ->delete("/admin/users/{$this->superAdmin->id}")
        ->assertForbidden();
});

it('admin cannot delete user from another company', function () {
    $otherCompany = Company::factory()->create();
    $user = User::factory()->create(['company_id' => $otherCompany->id]);

    actingAs($this->admin)
        ->delete("/admin/users/{$user->id}")
        ->assertForbidden();
});

// --- Resend Activation ---

it('resends activation email for non-activated user', function () {
    Notification::fake();

    $user = User::factory()->create([
        'company_id' => $this->company->id,
        'password' => null,
    ]);

    actingAs($this->superAdmin)
        ->post("/admin/users/{$user->id}/resend-activation")
        ->assertRedirect();

    Notification::assertSentTo($user, AccountActivationNotification::class);
});

it('refuses to resend activation for already activated user', function () {
    $user = User::factory()->create(['company_id' => $this->company->id]);

    actingAs($this->superAdmin)
        ->post("/admin/users/{$user->id}/resend-activation")
        ->assertRedirect()
        ->assertSessionHas('error');
});
