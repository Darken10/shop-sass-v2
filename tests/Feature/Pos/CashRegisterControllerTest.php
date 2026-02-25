<?php

use App\Enums\CashRegisterSessionStatus;
use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Logistics\Shop;
use App\Models\Permission;
use App\Models\Pos\CashRegisterSession;
use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;

beforeEach(function () {
    foreach (PermissionEnum::cases() as $perm) {
        Permission::firstOrCreate(['name' => $perm->value, 'guard_name' => 'web']);
    }

    $adminRole = Role::firstOrCreate(['name' => RoleEnum::Admin->value, 'guard_name' => 'web']);
    $adminRole->syncPermissions(Permission::all());

    $caissierRole = Role::firstOrCreate(['name' => RoleEnum::Caissier->value, 'guard_name' => 'web']);
    $caissierRole->syncPermissions(
        Permission::where('name', 'like', '%cash%')
            ->orWhere('name', 'like', '%sale%')
            ->orWhere('name', 'like', '%customer%')
            ->orWhere('name', 'like', '%promotion%')
            ->orWhere('name', 'read product')
            ->get()
    );

    $this->company = Company::factory()->create();
    $this->companyB = Company::factory()->create();

    $this->admin = User::factory()->create(['company_id' => $this->company->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->caissier = User::factory()->create(['company_id' => $this->company->id]);
    $this->caissier->assignRole(RoleEnum::Caissier->value);

    $this->shop = Shop::factory()->active()->create([
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);
});

// --- Authorization ---

it('forbids unauthenticated users from accessing POS', function () {
    $this->get('/pos')->assertRedirect('/login');
});

it('allows admin to access POS index', function () {
    actingAs($this->admin)
        ->get('/pos')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('pos/index'));
});

it('allows caissier to access POS index', function () {
    actingAs($this->caissier)
        ->get('/pos')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('pos/index'));
});

// --- Open session ---

it('opens a cash register session', function () {
    actingAs($this->admin)
        ->post('/pos/open', [
            'opening_amount' => 50000,
            'shop_id' => $this->shop->id,
        ])
        ->assertRedirect('/pos');

    assertDatabaseHas('cash_register_sessions', [
        'shop_id' => $this->shop->id,
        'cashier_id' => $this->admin->id,
        'company_id' => $this->company->id,
        'status' => CashRegisterSessionStatus::Open->value,
    ]);
});

it('prevents opening a second session', function () {
    CashRegisterSession::withoutGlobalScopes()->create([
        'session_number' => 'CS-00001',
        'status' => CashRegisterSessionStatus::Open,
        'opening_amount' => 10000,
        'shop_id' => $this->shop->id,
        'cashier_id' => $this->admin->id,
        'company_id' => $this->company->id,
        'opened_at' => now(),
    ]);

    actingAs($this->admin)
        ->post('/pos/open', [
            'opening_amount' => 50000,
            'shop_id' => $this->shop->id,
        ])
        ->assertRedirect();

    expect(CashRegisterSession::withoutGlobalScopes()
        ->where('cashier_id', $this->admin->id)
        ->where('status', CashRegisterSessionStatus::Open)
        ->count())->toBe(1);
});

// --- Close session ---

it('closes a cash register session', function () {
    $session = CashRegisterSession::withoutGlobalScopes()->create([
        'session_number' => 'CS-00010',
        'status' => CashRegisterSessionStatus::Open,
        'opening_amount' => 10000,
        'shop_id' => $this->shop->id,
        'cashier_id' => $this->admin->id,
        'company_id' => $this->company->id,
        'opened_at' => now(),
    ]);

    actingAs($this->admin)
        ->post("/pos/sessions/{$session->id}/close", [
            'closing_notes' => 'Fin de journée.',
        ])
        ->assertRedirect('/pos');

    expect($session->fresh()->status)->toBe(CashRegisterSessionStatus::Closed);
    expect($session->fresh()->closed_at)->not->toBeNull();
});

// --- Sessions list ---

it('lists all cash register sessions', function () {
    CashRegisterSession::withoutGlobalScopes()->create([
        'session_number' => 'CS-00030',
        'status' => CashRegisterSessionStatus::Open,
        'opening_amount' => 10000,
        'shop_id' => $this->shop->id,
        'cashier_id' => $this->admin->id,
        'company_id' => $this->company->id,
        'opened_at' => now(),
    ]);

    CashRegisterSession::withoutGlobalScopes()->create([
        'session_number' => 'CS-00031',
        'status' => CashRegisterSessionStatus::Closed,
        'opening_amount' => 5000,
        'closing_amount' => 15000,
        'shop_id' => $this->shop->id,
        'cashier_id' => $this->admin->id,
        'company_id' => $this->company->id,
        'opened_at' => now()->subHours(8),
        'closed_at' => now()->subHours(1),
    ]);

    actingAs($this->admin)
        ->get('/pos/sessions')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pos/sessions/index')
            ->has('sessions.data', 2)
        );
});

it('does not show sessions from other companies', function () {
    $otherShop = Shop::factory()->active()->create([
        'company_id' => $this->companyB->id,
        'created_by' => $this->admin->id,
    ]);

    $otherUser = User::factory()->create(['company_id' => $this->companyB->id]);

    CashRegisterSession::withoutGlobalScopes()->create([
        'session_number' => 'CS-00040',
        'status' => CashRegisterSessionStatus::Open,
        'opening_amount' => 5000,
        'shop_id' => $otherShop->id,
        'cashier_id' => $otherUser->id,
        'company_id' => $this->companyB->id,
        'opened_at' => now(),
    ]);

    actingAs($this->admin)
        ->get('/pos/sessions')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pos/sessions/index')
            ->has('sessions.data', 0)
        );
});

// --- Session detail ---

it('shows session detail with stats', function () {
    $session = CashRegisterSession::withoutGlobalScopes()->create([
        'session_number' => 'CS-00020',
        'status' => CashRegisterSessionStatus::Open,
        'opening_amount' => 10000,
        'shop_id' => $this->shop->id,
        'cashier_id' => $this->admin->id,
        'company_id' => $this->company->id,
        'opened_at' => now(),
    ]);

    actingAs($this->admin)
        ->get("/pos/sessions/{$session->id}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pos/sessions/show')
            ->has('session')
            ->has('stats')
            ->where('session.id', $session->id)
            ->where('stats.totalSales', 0)
            ->where('stats.salesCount', 0)
        );
});
