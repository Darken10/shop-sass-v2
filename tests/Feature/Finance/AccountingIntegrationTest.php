<?php

use App\Enums\ExpenseStatus;
use App\Enums\JournalEntryStatus;
use App\Enums\LogisticChargeType;
use App\Enums\PaymentMethod;
use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Enums\SaleStatus;
use App\Enums\StockMovementType;
use App\Models\Company\Company;
use App\Models\Finance\Account;
use App\Models\Finance\Expense;
use App\Models\Finance\ExpenseCategory;
use App\Models\Finance\JournalEntry;
use App\Models\Finance\JournalEntryLine;
use App\Models\Logistics\FuelLog;
use App\Models\Logistics\LogisticCharge;
use App\Models\Logistics\Shop;
use App\Models\Logistics\StockMovement;
use App\Models\Logistics\Supplier;
use App\Models\Logistics\SupplyRequest;
use App\Models\Logistics\Vehicle;
use App\Models\Logistics\Warehouse;
use App\Models\Permission;
use App\Models\Pos\CashRegisterSession;
use App\Models\Pos\Sale;
use App\Models\Pos\SaleItem;
use App\Models\Pos\SalePayment;
use App\Models\Product\Product;
use App\Models\Role;
use App\Models\User;
use App\Services\AccountingIntegrationService;

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

    $this->shop = Shop::factory()->create(['company_id' => $this->company->id]);
    $this->warehouse = Warehouse::factory()->create(['company_id' => $this->company->id]);

    // Initialize system accounts for the company
    AccountingIntegrationService::initializeSystemAccounts($this->company->id, $this->admin->id);

    $this->service = app(AccountingIntegrationService::class);
});

// ── System Account Initialization ─────────────────────────────

it('initializes system accounts for a company', function () {
    $accountCount = Account::withoutGlobalScopes()
        ->where('company_id', $this->company->id)
        ->where('is_system', true)
        ->count();

    expect($accountCount)->toBe(14);

    assertDatabaseHas('accounts', [
        'code' => '571000',
        'company_id' => $this->company->id,
        'name' => 'Caisse',
        'is_system' => true,
    ]);

    assertDatabaseHas('accounts', [
        'code' => '701000',
        'company_id' => $this->company->id,
        'name' => 'Ventes de marchandises',
    ]);
});

it('initializes expense categories for a company', function () {
    $categoryCount = ExpenseCategory::withoutGlobalScopes()
        ->where('company_id', $this->company->id)
        ->count();

    expect($categoryCount)->toBe(4);

    assertDatabaseHas('expense_categories', [
        'code' => 'purchases',
        'company_id' => $this->company->id,
    ]);

    assertDatabaseHas('expense_categories', [
        'code' => 'fuel',
        'company_id' => $this->company->id,
    ]);
});

it('does not duplicate system accounts on repeated initialization', function () {
    // Initialize again
    AccountingIntegrationService::initializeSystemAccounts($this->company->id, $this->admin->id);

    $accountCount = Account::withoutGlobalScopes()
        ->where('company_id', $this->company->id)
        ->where('is_system', true)
        ->count();

    expect($accountCount)->toBe(14);
});

// ── Sale Recording ────────────────────────────────────────────

it('records a cash sale as a journal entry', function () {
    $product = Product::factory()->create([
        'company_id' => $this->company->id,
        'price' => 5000,
        'cost_price' => 3000,
    ]);

    $session = CashRegisterSession::factory()->create([
        'company_id' => $this->company->id,
        'shop_id' => $this->shop->id,
    ]);

    $sale = Sale::factory()->create([
        'company_id' => $this->company->id,
        'shop_id' => $this->shop->id,
        'session_id' => $session->id,
        'cashier_id' => $this->admin->id,
        'subtotal' => 10000,
        'discount_total' => 0,
        'total' => 10000,
        'amount_paid' => 10000,
        'amount_due' => 0,
        'status' => SaleStatus::Completed,
    ]);

    SaleItem::factory()->create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 2,
        'unit_price' => 5000,
        'subtotal' => 10000,
    ]);

    SalePayment::factory()->create([
        'sale_id' => $sale->id,
        'session_id' => $session->id,
        'method' => PaymentMethod::Cash,
        'amount' => 10000,
    ]);

    $entry = $this->service->recordSale($sale);

    expect($entry)->not->toBeNull();
    expect($entry->reference)->toStartWith('JE-VTE');
    expect($entry->status)->toBe(JournalEntryStatus::Posted);
    expect($entry->source_type)->toBe('sale');
    expect((float) $entry->total_debit)->toBe((float) $entry->total_credit);

    // Verify lines: cash debit + revenue credit + COGS debit + inventory credit
    $lines = JournalEntryLine::where('journal_entry_id', $entry->id)->get();
    expect($lines)->toHaveCount(4);

    // Cash account should have been debited
    $cashAccount = Account::withoutGlobalScopes()
        ->where('code', '571000')
        ->where('company_id', $this->company->id)
        ->first();

    expect((float) $cashAccount->balance)->toBe(10000.00);
});

it('records a credit sale with receivables', function () {
    $product = Product::factory()->create([
        'company_id' => $this->company->id,
        'price' => 20000,
        'cost_price' => 12000,
    ]);

    $session = CashRegisterSession::factory()->create([
        'company_id' => $this->company->id,
        'shop_id' => $this->shop->id,
    ]);

    $sale = Sale::factory()->create([
        'company_id' => $this->company->id,
        'shop_id' => $this->shop->id,
        'session_id' => $session->id,
        'cashier_id' => $this->admin->id,
        'subtotal' => 20000,
        'discount_total' => 0,
        'total' => 20000,
        'amount_paid' => 5000,
        'amount_due' => 15000,
        'status' => SaleStatus::PartiallyPaid,
    ]);

    SaleItem::factory()->create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'unit_price' => 20000,
        'subtotal' => 20000,
    ]);

    SalePayment::factory()->create([
        'sale_id' => $sale->id,
        'session_id' => $session->id,
        'method' => PaymentMethod::Cash,
        'amount' => 5000,
    ]);

    $entry = $this->service->recordSale($sale);

    expect($entry)->not->toBeNull();

    // Should have: cash debit (5k) + receivables debit (15k) + revenue credit (20k) + COGS debit + inventory credit
    $lines = JournalEntryLine::where('journal_entry_id', $entry->id)->get();
    expect($lines->count())->toBeGreaterThanOrEqual(4);

    // Receivables should be debited 15k
    $receivablesAccount = Account::withoutGlobalScopes()
        ->where('code', '411000')
        ->where('company_id', $this->company->id)
        ->first();

    expect((float) $receivablesAccount->balance)->toBe(15000.00);
});

// ── Credit Payment Recording ──────────────────────────────────

it('records a credit payment and reduces receivables', function () {
    // First set up a credit sale
    $product = Product::factory()->create([
        'company_id' => $this->company->id,
        'cost_price' => 5000,
    ]);

    $session = CashRegisterSession::factory()->create([
        'company_id' => $this->company->id,
        'shop_id' => $this->shop->id,
    ]);

    $sale = Sale::factory()->create([
        'company_id' => $this->company->id,
        'shop_id' => $this->shop->id,
        'session_id' => $session->id,
        'cashier_id' => $this->admin->id,
        'subtotal' => 10000,
        'total' => 10000,
        'amount_paid' => 5000,
        'amount_due' => 5000,
        'status' => SaleStatus::PartiallyPaid,
    ]);

    SaleItem::factory()->create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'unit_price' => 10000,
        'subtotal' => 10000,
    ]);

    SalePayment::factory()->create([
        'sale_id' => $sale->id,
        'session_id' => $session->id,
        'method' => PaymentMethod::Cash,
        'amount' => 5000,
    ]);

    // Record the initial sale first
    $this->service->recordSale($sale);

    // Now record a credit payment
    $payment = SalePayment::factory()->create([
        'sale_id' => $sale->id,
        'session_id' => $session->id,
        'method' => PaymentMethod::MobileMoney,
        'amount' => 3000,
    ]);

    $this->actingAs($this->admin);
    $entry = $this->service->recordCreditPayment($payment, $sale);

    expect($entry)->not->toBeNull();
    expect($entry->reference)->toStartWith('JE-VTE');

    // Receivables should be reduced: started at 5000, reduced by 3000 = 2000
    $receivablesAccount = Account::withoutGlobalScopes()
        ->where('code', '411000')
        ->where('company_id', $this->company->id)
        ->first();

    expect((float) $receivablesAccount->balance)->toBe(2000.00);
});

// ── Fuel Log Recording ────────────────────────────────────────

it('records a fuel log as journal entry and expense', function () {
    $this->actingAs($this->admin);

    $vehicle = Vehicle::factory()->create(['company_id' => $this->company->id]);

    $fuelLog = FuelLog::factory()->create([
        'company_id' => $this->company->id,
        'vehicle_id' => $vehicle->id,
        'cost' => 25000,
        'quantity_liters' => 50,
        'fueled_at' => now(),
        'created_by' => $this->admin->id,
    ]);

    $entry = $this->service->recordFuelLog($fuelLog);

    expect($entry)->not->toBeNull();
    expect($entry->reference)->toStartWith('JE-CBR');
    expect($entry->status)->toBe(JournalEntryStatus::Posted);

    // Fuel expense account should be debited
    $fuelAccount = Account::withoutGlobalScopes()
        ->where('code', '624100')
        ->where('company_id', $this->company->id)
        ->first();

    expect((float) $fuelAccount->balance)->toBe(25000.00);

    // An auto-expense should have been created
    $expense = Expense::withoutGlobalScopes()
        ->where('company_id', $this->company->id)
        ->where('journal_entry_id', $entry->id)
        ->first();

    expect($expense)->not->toBeNull();
    expect($expense->reference)->toStartWith('DEP-AUTO-');
    expect($expense->status)->toBe(ExpenseStatus::Approved);
    expect((float) $expense->amount)->toBe(25000.00);
});

// ── Stock Movement Recording ──────────────────────────────────

it('records a stock loss as journal entry and expense', function () {
    $this->actingAs($this->admin);

    $product = Product::factory()->create([
        'company_id' => $this->company->id,
        'cost_price' => 2000,
    ]);

    $movement = StockMovement::factory()->create([
        'company_id' => $this->company->id,
        'product_id' => $product->id,
        'type' => StockMovementType::Loss,
        'quantity' => 5,
        'source_warehouse_id' => $this->warehouse->id,
        'created_by' => $this->admin->id,
    ]);

    $entry = $this->service->recordStockMovement($movement);

    expect($entry)->not->toBeNull();
    expect($entry->reference)->toStartWith('JE-STK');

    // Loss amount = 2000 × 5 = 10000
    $lossAccount = Account::withoutGlobalScopes()
        ->where('code', '658000')
        ->where('company_id', $this->company->id)
        ->first();

    expect((float) $lossAccount->balance)->toBe(10000.00);

    // Inventory should be reduced
    $inventoryAccount = Account::withoutGlobalScopes()
        ->where('code', '310000')
        ->where('company_id', $this->company->id)
        ->first();

    // Assets decrease on credit, balance should be -10000
    expect((float) $inventoryAccount->balance)->toBe(-10000.00);

    // Auto-expense should exist
    $expense = Expense::withoutGlobalScopes()
        ->where('company_id', $this->company->id)
        ->where('journal_entry_id', $entry->id)
        ->first();

    expect($expense)->not->toBeNull();
    expect((float) $expense->amount)->toBe(10000.00);
});

it('ignores stock movements that are not loss or adjustment', function () {
    $this->actingAs($this->admin);

    $product = Product::factory()->create([
        'company_id' => $this->company->id,
        'cost_price' => 2000,
    ]);

    $movement = StockMovement::factory()->create([
        'company_id' => $this->company->id,
        'product_id' => $product->id,
        'type' => StockMovementType::PurchaseEntry,
        'quantity' => 5,
        'source_warehouse_id' => $this->warehouse->id,
    ]);

    $entry = $this->service->recordStockMovement($movement);

    expect($entry)->toBeNull();
});

// ── Logistic Charge Recording ─────────────────────────────────

it('records a standalone logistic charge as journal entry and expense', function () {
    $this->actingAs($this->admin);

    $charge = LogisticCharge::factory()->create([
        'company_id' => $this->company->id,
        'supply_request_id' => null,
        'transfer_id' => null,
        'amount' => 15000,
        'type' => LogisticChargeType::Handling,
        'label' => 'Livraison locale',
        'created_by' => $this->admin->id,
    ]);

    $entry = $this->service->recordLogisticCharge($charge);

    expect($entry)->not->toBeNull();
    expect($entry->reference)->toStartWith('JE-LOG');

    $logisticsAccount = Account::withoutGlobalScopes()
        ->where('code', '613000')
        ->where('company_id', $this->company->id)
        ->first();

    expect((float) $logisticsAccount->balance)->toBe(15000.00);

    // Auto-expense should exist
    $expense = Expense::withoutGlobalScopes()
        ->where('company_id', $this->company->id)
        ->where('journal_entry_id', $entry->id)
        ->first();

    expect($expense)->not->toBeNull();
    expect((float) $expense->amount)->toBe(15000.00);
});

it('skips logistic charges linked to supply requests', function () {
    $this->actingAs($this->admin);

    $supplier = Supplier::factory()->create(['company_id' => $this->company->id]);

    $supplyRequest = SupplyRequest::factory()->create([
        'company_id' => $this->company->id,
        'supplier_id' => $supplier->id,
    ]);

    $charge = LogisticCharge::factory()->create([
        'company_id' => $this->company->id,
        'supply_request_id' => $supplyRequest->id,
        'transfer_id' => null,
        'amount' => 15000,
    ]);

    $entry = $this->service->recordLogisticCharge($charge);

    expect($entry)->toBeNull();
});

// ── Approved Expense Recording ────────────────────────────────

it('records a manually approved expense as a journal entry', function () {
    $this->actingAs($this->admin);

    $category = ExpenseCategory::withoutGlobalScopes()
        ->where('code', 'logistics')
        ->where('company_id', $this->company->id)
        ->first();

    // Link the category to the logistics account
    $logisticsAccount = Account::withoutGlobalScopes()
        ->where('code', '613000')
        ->where('company_id', $this->company->id)
        ->first();

    $category->update(['account_id' => $logisticsAccount->id]);

    $expense = Expense::create([
        'reference' => 'DEP-TEST-001',
        'label' => 'Frais de livraison test',
        'amount' => 8000,
        'date' => now(),
        'status' => ExpenseStatus::Approved,
        'payment_method' => PaymentMethod::Cash,
        'category_id' => $category->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
        'approved_by' => $this->admin->id,
    ]);

    $entry = $this->service->recordApprovedExpense($expense);

    expect($entry)->not->toBeNull();
    expect($entry->reference)->toStartWith('JE-DEP');

    // Expense should now be linked to the journal entry
    $expense->refresh();
    expect($expense->journal_entry_id)->toBe($entry->id);

    // Logistics account should be debited
    $logisticsAccount->refresh();
    expect((float) $logisticsAccount->balance)->toBe(8000.00);
});

it('skips auto-created expenses that already have a journal entry', function () {
    $this->actingAs($this->admin);

    // Create a dummy journal entry
    $dummyEntry = JournalEntry::withoutGlobalScopes()->create([
        'reference' => 'JE-TEST-001',
        'date' => now(),
        'description' => 'Test',
        'status' => JournalEntryStatus::Posted,
        'total_debit' => 1000,
        'total_credit' => 1000,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $expense = Expense::create([
        'reference' => 'DEP-AUTO-TEST',
        'label' => 'Expense already linked',
        'amount' => 5000,
        'date' => now(),
        'status' => ExpenseStatus::Approved,
        'journal_entry_id' => $dummyEntry->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $entry = $this->service->recordApprovedExpense($expense);

    expect($entry)->toBeNull();
});

// ── No System Accounts → Graceful Fallback ────────────────────

it('returns null when company has no system accounts', function () {
    $otherCompany = Company::factory()->create();

    $sale = Sale::factory()->create([
        'company_id' => $otherCompany->id,
    ]);

    $entry = $this->service->recordSale($sale);

    expect($entry)->toBeNull();
});

// ── Balanced Entries ──────────────────────────────────────────

it('always creates balanced journal entries', function () {
    $this->actingAs($this->admin);

    $vehicle = Vehicle::factory()->create(['company_id' => $this->company->id]);

    $fuelLog = FuelLog::factory()->create([
        'company_id' => $this->company->id,
        'vehicle_id' => $vehicle->id,
        'cost' => 30000,
        'quantity_liters' => 60,
        'fueled_at' => now(),
        'created_by' => $this->admin->id,
    ]);

    $entry = $this->service->recordFuelLog($fuelLog);

    expect($entry)->not->toBeNull();
    expect((float) $entry->total_debit)->toBe((float) $entry->total_credit);
});
