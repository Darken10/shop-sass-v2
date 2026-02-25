<?php

use App\Enums\CashRegisterSessionStatus;
use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Enums\SaleStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Shop;
use App\Models\Logistics\ShopStock;
use App\Models\Permission;
use App\Models\Pos\CashRegisterSession;
use App\Models\Pos\Sale;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
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

    $this->shop = Shop::factory()->active()->create([
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $this->category = ProductCategory::withoutGlobalScopes()->create([
        'name' => 'Test Category',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $this->product = Product::withoutGlobalScopes()->create([
        'name' => 'Test Product',
        'code' => 'TP-001',
        'price' => 1000,
        'cost_price' => 500,
        'stock' => 100,
        'unity' => 'piece',
        'status' => 'active',
        'category_id' => $this->category->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    ShopStock::withoutGlobalScopes()->create([
        'quantity' => 50,
        'stock_alert' => 5,
        'product_id' => $this->product->id,
        'shop_id' => $this->shop->id,
        'company_id' => $this->company->id,
    ]);

    $this->session = CashRegisterSession::withoutGlobalScopes()->create([
        'session_number' => 'CS-TEST-001',
        'status' => CashRegisterSessionStatus::Open,
        'opening_amount' => 25000,
        'shop_id' => $this->shop->id,
        'cashier_id' => $this->admin->id,
        'company_id' => $this->company->id,
        'opened_at' => now(),
    ]);
});

// --- Authorization ---

it('forbids unauthenticated users from accessing POS terminal', function () {
    $this->get('/pos/terminal')->assertRedirect('/login');
});

it('shows terminal when session is open', function () {
    actingAs($this->admin)
        ->get('/pos/terminal')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pos/terminal')
            ->has('session')
            ->has('shopStocks')
        );
});

// --- Store sale ---

it('creates a sale with cash payment', function () {
    actingAs($this->admin)
        ->post('/pos/sales', [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 3,
                    'promotion_id' => null,
                ],
            ],
            'payments' => [
                [
                    'method' => 'cash',
                    'amount' => 3000,
                    'reference' => null,
                    'notes' => null,
                ],
            ],
            'customer_id' => null,
            'notes' => null,
        ])
        ->assertRedirect();

    assertDatabaseHas('sales', [
        'total' => 3000,
        'amount_paid' => 3000,
        'amount_due' => 0,
        'status' => SaleStatus::Completed->value,
        'company_id' => $this->company->id,
        'cashier_id' => $this->admin->id,
    ]);

    // Stock should be decremented
    $stock = ShopStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('shop_id', $this->shop->id)
        ->first();
    expect($stock->quantity)->toBe(47);
});

it('creates a partial payment sale as partially paid', function () {
    actingAs($this->admin)
        ->post('/pos/sales', [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 5,
                    'promotion_id' => null,
                ],
            ],
            'payments' => [
                [
                    'method' => 'cash',
                    'amount' => 2000,
                    'reference' => null,
                    'notes' => null,
                ],
            ],
            'customer_id' => null,
            'notes' => null,
        ])
        ->assertRedirect();

    $sale = Sale::withoutGlobalScopes()->latest()->first();
    expect($sale->status)->toBe(SaleStatus::PartiallyPaid);
    expect((float) $sale->amount_due)->toBe(3000.0);
});

it('creates a sale with multiple payment methods', function () {
    actingAs($this->admin)
        ->post('/pos/sales', [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                    'promotion_id' => null,
                ],
            ],
            'payments' => [
                [
                    'method' => 'cash',
                    'amount' => 1000,
                    'reference' => null,
                    'notes' => null,
                ],
                [
                    'method' => 'mobile_money',
                    'amount' => 1000,
                    'reference' => 'MM-123',
                    'notes' => null,
                ],
            ],
            'customer_id' => null,
            'notes' => null,
        ])
        ->assertRedirect();

    $sale = Sale::withoutGlobalScopes()->latest()->first();
    expect($sale->status)->toBe(SaleStatus::Completed);
    expect($sale->payments()->count())->toBe(2);
});

it('prevents sale when stock is insufficient', function () {
    actingAs($this->admin)
        ->post('/pos/sales', [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 999,
                    'promotion_id' => null,
                ],
            ],
            'payments' => [
                ['method' => 'cash', 'amount' => 999000, 'reference' => null, 'notes' => null],
            ],
            'customer_id' => null,
            'notes' => null,
        ])
        ->assertRedirect();

    expect(Sale::withoutGlobalScopes()->count())->toBe(0);
});

// --- Sales list ---

it('shows sales index', function () {
    actingAs($this->admin)
        ->get('/pos/sales')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('pos/sales/index'));
});

// --- Receipt ---

it('shows receipt for a sale', function () {
    // Create a sale first
    actingAs($this->admin)->post('/pos/sales', [
        'items' => [['product_id' => $this->product->id, 'quantity' => 1, 'promotion_id' => null]],
        'payments' => [['method' => 'cash', 'amount' => 1000, 'reference' => null, 'notes' => null]],
        'customer_id' => null,
        'notes' => null,
    ]);

    $sale = Sale::withoutGlobalScopes()->latest()->first();

    actingAs($this->admin)
        ->get("/pos/sales/{$sale->id}/receipt")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pos/receipt')
            ->has('sale')
            ->where('sale.id', $sale->id)
        );
});

// --- QR verification ---

it('verifies a sale via QR token', function () {
    actingAs($this->admin)->post('/pos/sales', [
        'items' => [['product_id' => $this->product->id, 'quantity' => 1, 'promotion_id' => null]],
        'payments' => [['method' => 'cash', 'amount' => 1000, 'reference' => null, 'notes' => null]],
        'customer_id' => null,
        'notes' => null,
    ]);

    $sale = Sale::withoutGlobalScopes()->latest()->first();

    $this->getJson("/pos/verify/{$sale->qr_code_token}")
        ->assertSuccessful()
        ->assertJson(['verified' => true]);
});

// --- Credits ---

it('shows credits page', function () {
    actingAs($this->admin)
        ->get('/pos/sales/credits')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('pos/sales/credits'));
});
