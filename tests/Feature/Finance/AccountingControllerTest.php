<?php

use App\Enums\AccountType;
use App\Enums\JournalEntryStatus;
use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Finance\Account;
use App\Models\Finance\JournalEntry;
use App\Models\Finance\JournalEntryLine;
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

    $this->cashAccount = Account::create([
        'name' => 'Caisse',
        'code' => '530000',
        'type' => AccountType::Asset,
        'balance' => 0,
        'is_active' => true,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $this->expenseAccount = Account::create([
        'name' => 'Fournitures',
        'code' => '606000',
        'type' => AccountType::Expense,
        'balance' => 0,
        'is_active' => true,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);
});

// ── Chart of Accounts ──────────────────────────────────────

it('renders the accounts page', function () {
    actingAs($this->admin)
        ->get('/finance/accounting/accounts')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/accounting/accounts')
            ->has('accounts')
            ->has('accountTypes')
            ->has('categories')
        );
});

it('can create an account', function () {
    actingAs($this->admin)
        ->post('/finance/accounting/accounts', [
            'name' => 'Banque',
            'code' => '512000',
            'type' => 'asset',
            'is_active' => true,
        ])
        ->assertRedirect();

    assertDatabaseHas('accounts', [
        'name' => 'Banque',
        'code' => '512000',
        'company_id' => $this->company->id,
    ]);
});

it('validates unique account code', function () {
    actingAs($this->admin)
        ->post('/finance/accounting/accounts', [
            'name' => 'Caisse duplicate',
            'code' => '530000',
            'type' => 'asset',
        ])
        ->assertSessionHasErrors('code');
});

// ── Journal Entries ────────────────────────────────────────

it('renders the journal page', function () {
    actingAs($this->admin)
        ->get('/finance/accounting/journal')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/accounting/journal')
            ->has('entries')
        );
});

it('renders the journal create page', function () {
    actingAs($this->admin)
        ->get('/finance/accounting/journal/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/accounting/journal-create')
            ->has('accounts')
        );
});

it('can create a balanced journal entry', function () {
    actingAs($this->admin)
        ->post('/finance/accounting/journal', [
            'date' => '2025-06-15',
            'description' => 'Achat fournitures',
            'lines' => [
                ['account_id' => $this->expenseAccount->id, 'debit' => 10000, 'credit' => 0, 'description' => 'Fournitures'],
                ['account_id' => $this->cashAccount->id, 'debit' => 0, 'credit' => 10000, 'description' => 'Paiement espèces'],
            ],
        ])
        ->assertRedirect('/finance/accounting/journal');

    assertDatabaseHas('journal_entries', [
        'description' => 'Achat fournitures',
        'company_id' => $this->company->id,
        'status' => JournalEntryStatus::Draft->value,
    ]);
});

it('can view a journal entry', function () {
    $entry = JournalEntry::create([
        'reference' => 'JE-000001',
        'date' => '2025-06-15',
        'description' => 'Test entry',
        'status' => JournalEntryStatus::Draft,
        'total_debit' => 10000,
        'total_credit' => 10000,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    JournalEntryLine::create([
        'journal_entry_id' => $entry->id,
        'account_id' => $this->expenseAccount->id,
        'debit' => 10000,
        'credit' => 0,
    ]);

    JournalEntryLine::create([
        'journal_entry_id' => $entry->id,
        'account_id' => $this->cashAccount->id,
        'debit' => 0,
        'credit' => 10000,
    ]);

    actingAs($this->admin)
        ->get("/finance/accounting/journal/{$entry->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/accounting/journal-show')
            ->has('entry')
        );
});

it('can post a draft journal entry', function () {
    $entry = JournalEntry::create([
        'reference' => 'JE-000002',
        'date' => '2025-06-15',
        'description' => 'Test post',
        'status' => JournalEntryStatus::Draft,
        'total_debit' => 5000,
        'total_credit' => 5000,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    JournalEntryLine::create([
        'journal_entry_id' => $entry->id,
        'account_id' => $this->expenseAccount->id,
        'debit' => 5000,
        'credit' => 0,
    ]);

    JournalEntryLine::create([
        'journal_entry_id' => $entry->id,
        'account_id' => $this->cashAccount->id,
        'debit' => 0,
        'credit' => 5000,
    ]);

    actingAs($this->admin)
        ->post("/finance/accounting/journal/{$entry->id}/post")
        ->assertRedirect();

    $entry->refresh();
    expect($entry->status)->toBe(JournalEntryStatus::Posted);

    $this->cashAccount->refresh();
    $this->expenseAccount->refresh();

    // Asset accounts: debit increases, credit decreases → cashAccount was credited 5000 → balance = -5000
    expect((float) $this->cashAccount->balance)->toBe(-5000.0);
    // Expense accounts: debit increases → expenseAccount was debited 5000 → balance = 5000
    expect((float) $this->expenseAccount->balance)->toBe(5000.0);
});

// ── Balance Sheet ──────────────────────────────────────────

it('renders the balance sheet page', function () {
    actingAs($this->admin)
        ->get('/finance/accounting/balance-sheet')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/accounting/balance-sheet')
            ->has('balanceSheet')
        );
});

// ── General Ledger ────────────────────────────────────────

it('renders the ledger page', function () {
    actingAs($this->admin)
        ->get('/finance/accounting/ledger')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/accounting/ledger')
            ->has('accounts')
        );
});

it('shows ledger entries for a selected account', function () {
    actingAs($this->admin)
        ->get("/finance/accounting/ledger?account_id={$this->cashAccount->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/accounting/ledger')
            ->has('selectedAccount')
            ->has('ledgerEntries')
        );
});

// ── Reports ───────────────────────────────────────────────

it('renders the reports index page', function () {
    actingAs($this->admin)
        ->get('/finance/reports')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/reports/index')
            ->has('reports')
        );
});

it('renders the report create page', function () {
    actingAs($this->admin)
        ->get('/finance/reports/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/reports/create')
            ->has('reportTypes')
        );
});

it('can generate a profit-loss report', function () {
    actingAs($this->admin)
        ->post('/finance/reports', [
            'type' => 'profit_loss',
            'period_start' => '2025-01-01',
            'period_end' => '2025-06-30',
        ])
        ->assertRedirect();

    assertDatabaseHas('financial_reports', [
        'type' => 'profit_loss',
        'company_id' => $this->company->id,
    ]);
});
