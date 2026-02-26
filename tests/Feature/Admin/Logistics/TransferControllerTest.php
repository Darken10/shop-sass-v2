<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Enums\TransferStatus;
use App\Enums\TransferType;
use App\Enums\WarehouseStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Shop;
use App\Models\Logistics\ShopStock;
use App\Models\Logistics\Transfer;
use App\Models\Logistics\TransferItem;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Permission;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use App\Models\Role;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;

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

    $this->category = ProductCategory::withoutGlobalScopes()->create([
        'name' => 'Category',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $this->product = Product::withoutGlobalScopes()->create([
        'name' => 'Test Product',
        'code' => 'PRD-00001',
        'price' => 100,
        'stock' => 50,
        'unity' => 'piece',
        'status' => 'active',
        'category_id' => $this->category->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $this->warehouseA = Warehouse::withoutGlobalScopes()->create([
        'name' => 'Entrepôt A',
        'code' => 'WH-A01',
        'status' => WarehouseStatus::Active,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $this->warehouseB = Warehouse::withoutGlobalScopes()->create([
        'name' => 'Entrepôt B',
        'code' => 'WH-B01',
        'status' => WarehouseStatus::Active,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    WarehouseStock::withoutGlobalScopes()->create([
        'quantity' => 100,
        'stock_alert' => 10,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouseA->id,
        'company_id' => $this->company->id,
    ]);

    $this->shop = Shop::withoutGlobalScopes()->create([
        'name' => 'Magasin Test',
        'code' => 'SHP-001',
        'status' => 'active',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);
});

// --- Authorization ---

it('forbids unauthenticated users from accessing transfers', function () {
    $this->get('/admin/logistics/transfers')->assertRedirect('/login');
});

// --- CRUD ---

it('lists transfers', function () {
    actingAs($this->admin)
        ->get('/admin/logistics/transfers')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/logistics/transfers/index'));
});

it('creates a warehouse-to-warehouse transfer', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/transfers', [
            'type' => TransferType::WarehouseToWarehouse->value,
            'source_warehouse_id' => $this->warehouseA->id,
            'destination_warehouse_id' => $this->warehouseB->id,
            'destination_shop_id' => null,
            'vehicle_id' => null,
            'notes' => 'Transfert test',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity_requested' => 20,
                ],
            ],
        ])
        ->assertRedirect();

    assertDatabaseHas('transfers', [
        'type' => TransferType::WarehouseToWarehouse->value,
        'status' => TransferStatus::Pending->value,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_warehouse_id' => $this->warehouseB->id,
        'company_id' => $this->company->id,
    ]);

    $transfer = Transfer::withoutGlobalScopes()->latest()->first();
    assertDatabaseHas('transfer_items', [
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 20,
    ]);
});

it('creates a draft transfer without stock validation', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/transfers', [
            'type' => TransferType::WarehouseToWarehouse->value,
            'source_warehouse_id' => $this->warehouseA->id,
            'destination_warehouse_id' => $this->warehouseB->id,
            'notes' => 'Draft test',
            'is_draft' => true,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity_requested' => 9999,
                ],
            ],
        ])
        ->assertRedirect();

    assertDatabaseHas('transfers', [
        'status' => TransferStatus::Draft->value,
        'company_id' => $this->company->id,
    ]);
});

it('creates a transfer with company_bears_costs and charges', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/transfers', [
            'type' => TransferType::WarehouseToWarehouse->value,
            'source_warehouse_id' => $this->warehouseA->id,
            'destination_warehouse_id' => $this->warehouseB->id,
            'company_bears_costs' => true,
            'driver_name' => 'Jean Dupont',
            'driver_phone' => '0612345678',
            'items' => [
                ['product_id' => $this->product->id, 'quantity_requested' => 10],
            ],
            'charges' => [
                ['label' => 'Carburant', 'type' => 'fuel', 'amount' => 5000],
            ],
        ])
        ->assertRedirect();

    $transfer = Transfer::withoutGlobalScopes()->latest()->first();

    expect($transfer->company_bears_costs)->toBeTrue()
        ->and($transfer->driver_name)->toBe('Jean Dupont');

    assertDatabaseHas('logistic_charges', [
        'transfer_id' => $transfer->id,
        'label' => 'Carburant',
        'amount' => 5000,
    ]);
});

it('shows a transfer', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-TESTABCD',
        'type' => TransferType::WarehouseToWarehouse,
        'status' => TransferStatus::Pending,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_warehouse_id' => $this->warehouseB->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->get("/admin/logistics/transfers/{$transfer->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/logistics/transfers/show'));
});

it('approves a transfer', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-APPVABCD',
        'type' => TransferType::WarehouseToWarehouse,
        'status' => TransferStatus::Pending,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_warehouse_id' => $this->warehouseB->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/approve")
        ->assertRedirect();

    assertDatabaseHas('transfers', [
        'id' => $transfer->id,
        'status' => TransferStatus::Approved->value,
    ]);
});

it('prevents accessing transfers from another company', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-OTHERABCD',
        'type' => TransferType::WarehouseToWarehouse,
        'status' => TransferStatus::Pending,
        'source_warehouse_id' => $this->warehouseA->id,
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get("/admin/logistics/transfers/{$transfer->id}")
        ->assertNotFound();
});

// --- Ship ---

it('shipping an approved transfer sets quantity_delivered and marks in_transit', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-SHIP01',
        'type' => TransferType::WarehouseToShop,
        'status' => TransferStatus::Approved,
        'approved_at' => now(),
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_shop_id' => $this->shop->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $item = TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 30,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/ship")
        ->assertRedirect();

    expect($transfer->fresh()->status)->toBe(TransferStatus::InTransit);
    expect($item->fresh()->quantity_delivered)->toBe(30);
});

// --- Deliver ---

it('delivering a transfer marks it as delivered without moving stock', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-DLVR01',
        'type' => TransferType::WarehouseToShop,
        'status' => TransferStatus::InTransit,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_shop_id' => $this->shop->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 30,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/deliver")
        ->assertRedirect();

    expect($transfer->fresh()->status)->toBe(TransferStatus::Delivered);

    // Stock should NOT change on deliver (it happens on receive)
    $warehouseStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseA->id)
        ->first();

    expect($warehouseStock->quantity)->toBe(100);
});

// --- Receive ---

it('receiving a warehouse-to-shop transfer decrements warehouse stock and adds to shop stock', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-RCVSHOP01',
        'type' => TransferType::WarehouseToShop,
        'status' => TransferStatus::Delivered,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_shop_id' => $this->shop->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $item = TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 30,
        'quantity_delivered' => 30,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/receive", [
            'items' => [
                [
                    'item_id' => $item->id,
                    'quantity_received' => 30,
                    'discrepancy_note' => null,
                ],
            ],
        ])
        ->assertRedirect();

    // Entrepôt source : 100 - 30 = 70
    $warehouseStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseA->id)
        ->first();

    expect($warehouseStock->quantity)->toBe(70);

    // Magasin destination : 0 + 30 = 30
    $shopStock = ShopStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('shop_id', $this->shop->id)
        ->first();

    expect($shopStock)->not->toBeNull();
    expect($shopStock->quantity)->toBe(30);

    expect($transfer->fresh()->status)->toBe(TransferStatus::Received);
});

it('receiving a warehouse-to-warehouse transfer updates both warehouse stocks', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-RCVWWH01',
        'type' => TransferType::WarehouseToWarehouse,
        'status' => TransferStatus::InTransit,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_warehouse_id' => $this->warehouseB->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $item = TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 25,
        'quantity_delivered' => 25,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/receive", [
            'items' => [
                [
                    'item_id' => $item->id,
                    'quantity_received' => 25,
                    'discrepancy_note' => null,
                ],
            ],
        ])
        ->assertRedirect();

    $sourceStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseA->id)
        ->first();

    expect($sourceStock->quantity)->toBe(75);

    $destStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseB->id)
        ->first();

    expect($destStock)->not->toBeNull();
    expect($destStock->quantity)->toBe(25);

    expect($transfer->fresh()->status)->toBe(TransferStatus::Received);
});

it('receiving a transfer creates stock movement records', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-RCVMOV01',
        'type' => TransferType::WarehouseToShop,
        'status' => TransferStatus::Delivered,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_shop_id' => $this->shop->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $item = TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 10,
        'quantity_delivered' => 10,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/receive", [
            'items' => [
                [
                    'item_id' => $item->id,
                    'quantity_received' => 10,
                    'discrepancy_note' => null,
                ],
            ],
        ])
        ->assertRedirect();

    assertDatabaseHas('stock_movements', [
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity' => 10,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_shop_id' => $this->shop->id,
    ]);
});

it('receiving with discrepancy requires a mandatory note', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-DISC01',
        'type' => TransferType::WarehouseToShop,
        'status' => TransferStatus::Delivered,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_shop_id' => $this->shop->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $item = TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 30,
        'quantity_delivered' => 30,
    ]);

    // Without discrepancy note — should fail
    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/receive", [
            'items' => [
                [
                    'item_id' => $item->id,
                    'quantity_received' => 25,
                    'discrepancy_note' => null,
                ],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasErrors();

    expect($transfer->fresh()->status)->toBe(TransferStatus::Delivered);
});

it('receiving with discrepancy succeeds when note is provided', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-DISC02',
        'type' => TransferType::WarehouseToShop,
        'status' => TransferStatus::Delivered,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_shop_id' => $this->shop->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $item = TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 30,
        'quantity_delivered' => 30,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/receive", [
            'items' => [
                [
                    'item_id' => $item->id,
                    'quantity_received' => 25,
                    'discrepancy_note' => '5 articles endommagés pendant le transport',
                ],
            ],
        ])
        ->assertRedirect();

    expect($transfer->fresh()->status)->toBe(TransferStatus::Received);

    $item->refresh();
    expect($item->quantity_received)->toBe(25)
        ->and($item->discrepancy_note)->toBe('5 articles endommagés pendant le transport');

    // Stock uses received qty (25), not delivered (30)
    $warehouseStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseA->id)
        ->first();

    expect($warehouseStock->quantity)->toBe(75);
});

// --- Submit draft ---

it('submits a draft transfer to pending', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-DRAFT01',
        'type' => TransferType::WarehouseToWarehouse,
        'status' => TransferStatus::Draft,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_warehouse_id' => $this->warehouseB->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 10,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/submit")
        ->assertRedirect();

    expect($transfer->fresh()->status)->toBe(TransferStatus::Pending);
});

it('prevents submitting a draft when stock is insufficient', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-DRAFT02',
        'type' => TransferType::WarehouseToWarehouse,
        'status' => TransferStatus::Draft,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_warehouse_id' => $this->warehouseB->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 9999,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/submit")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($transfer->fresh()->status)->toBe(TransferStatus::Draft);
});

it('prevents creating a transfer when stock is insufficient', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/transfers', [
            'type' => TransferType::WarehouseToShop->value,
            'source_warehouse_id' => $this->warehouseA->id,
            'destination_shop_id' => $this->shop->id,
            'notes' => 'Too much',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity_requested' => 300,
                ],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('items');

    expect(Transfer::withoutGlobalScopes()->count())->toBe(0);
});
