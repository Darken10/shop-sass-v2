<?php

use App\Enums\ExpenseStatus;
use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Finance\Expense;
use App\Models\Finance\ExpenseCategory;
use App\Models\Permission;
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

    $this->company = Company::factory()->create();

    $this->admin = User::factory()->create(['company_id' => $this->company->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->category = ExpenseCategory::create([
        'name' => 'Fournitures',
        'code' => 'FOUR',
        'company_id' => $this->company->id,
    ]);
});

it('renders the expenses index page', function () {
    actingAs($this->admin)
        ->get('/finance/expenses')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/expenses/index')
            ->has('expenses')
            ->has('categories')
            ->has('shops')
            ->has('warehouses')
        );
});

it('renders the create expense page', function () {
    actingAs($this->admin)
        ->get('/finance/expenses/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/expenses/create')
            ->has('categories')
            ->has('shops')
        );
});

it('can create an expense', function () {
    actingAs($this->admin)
        ->post('/finance/expenses', [
            'label' => 'Achat papier',
            'amount' => 15000,
            'date' => '2025-06-15',
            'payment_method' => 'cash',
            'category_id' => $this->category->id,
        ])
        ->assertRedirect('/finance/expenses');

    assertDatabaseHas('expenses', [
        'label' => 'Achat papier',
        'amount' => 15000,
        'company_id' => $this->company->id,
    ]);
});

it('validates required fields when creating an expense', function () {
    actingAs($this->admin)
        ->post('/finance/expenses', [])
        ->assertSessionHasErrors(['label', 'amount', 'date']);
});

it('can view an expense', function () {
    $expense = Expense::create([
        'reference' => 'DEP-000001',
        'label' => 'Test dépense',
        'amount' => 5000,
        'date' => '2025-06-15',
        'status' => ExpenseStatus::Pending,
        'payment_method' => 'cash',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->get("/finance/expenses/{$expense->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/expenses/show')
            ->has('expense')
        );
});

it('can approve a pending expense', function () {
    $expense = Expense::create([
        'reference' => 'DEP-000002',
        'label' => 'Test approval',
        'amount' => 10000,
        'date' => '2025-06-15',
        'status' => ExpenseStatus::Pending,
        'payment_method' => 'cash',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->post("/finance/expenses/{$expense->id}/approve")
        ->assertRedirect();

    $expense->refresh();
    expect($expense->status)->toBe(ExpenseStatus::Approved);
});

it('can reject a pending expense', function () {
    $expense = Expense::create([
        'reference' => 'DEP-000003',
        'label' => 'Test rejection',
        'amount' => 10000,
        'date' => '2025-06-15',
        'status' => ExpenseStatus::Pending,
        'payment_method' => 'cash',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->post("/finance/expenses/{$expense->id}/reject")
        ->assertRedirect();

    $expense->refresh();
    expect($expense->status)->toBe(ExpenseStatus::Rejected);
});

it('can delete a pending expense', function () {
    $expense = Expense::create([
        'reference' => 'DEP-000004',
        'label' => 'Test delete',
        'amount' => 3000,
        'date' => '2025-06-15',
        'status' => ExpenseStatus::Pending,
        'payment_method' => 'cash',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->delete("/finance/expenses/{$expense->id}")
        ->assertRedirect('/finance/expenses');
});

it('cannot delete an approved expense', function () {
    $expense = Expense::create([
        'reference' => 'DEP-000005',
        'label' => 'Test approved',
        'amount' => 3000,
        'date' => '2025-06-15',
        'status' => ExpenseStatus::Approved,
        'payment_method' => 'cash',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->delete("/finance/expenses/{$expense->id}")
        ->assertRedirect()
        ->assertSessionHas('error');
});
