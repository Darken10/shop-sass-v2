<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

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

it('renders the financial overview page', function () {
    actingAs($this->admin)
        ->get('/finance')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/overview')
            ->has('kpis')
            ->has('revenueTimeSeries')
            ->has('revenueByShop')
            ->has('paymentBreakdown')
            ->has('expensesByCategory')
            ->has('topProducts')
            ->has('filters')
            ->has('shops')
            ->has('warehouses')
        );
});

it('renders the profit-loss page', function () {
    actingAs($this->admin)
        ->get('/finance/profit-loss')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/profit-loss')
            ->has('profitLoss')
            ->has('monthlyTrend')
            ->has('filters')
        );
});

it('renders the cash-flow page', function () {
    actingAs($this->admin)
        ->get('/finance/cash-flow')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/cash-flow')
            ->has('cashFlow')
            ->has('paymentBreakdown')
            ->has('filters')
        );
});

it('accepts date filters on overview', function () {
    actingAs($this->admin)
        ->get('/finance?start_date=2025-01-01&end_date=2025-01-31')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/overview')
            ->where('filters.start_date', '2025-01-01')
            ->where('filters.end_date', '2025-01-31')
        );
});

it('requires authentication', function () {
    $this->get('/finance')->assertRedirect('/login');
    $this->get('/finance/profit-loss')->assertRedirect('/login');
    $this->get('/finance/cash-flow')->assertRedirect('/login');
});
