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

// --- Delivery stock update ---

it('delivering a warehouse-to-shop transfer decrements warehouse stock and adds to shop stock', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-DLVSHOP01',
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

    // Statut du transfert mis à jour
    expect($transfer->fresh()->status)->toBe(TransferStatus::Delivered);
});

it('delivering a warehouse-to-warehouse transfer updates both warehouse stocks', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-DLVWWH01',
        'type' => TransferType::WarehouseToWarehouse,
        'status' => TransferStatus::InTransit,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_warehouse_id' => $this->warehouseB->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    TransferItem::withoutGlobalScopes()->create([
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 25,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/deliver")
        ->assertRedirect();

    // Entrepôt source : 100 - 25 = 75
    $sourceStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseA->id)
        ->first();

    expect($sourceStock->quantity)->toBe(75);

    // Entrepôt destination : 0 + 25 = 25
    $destStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseB->id)
        ->first();

    expect($destStock)->not->toBeNull();
    expect($destStock->quantity)->toBe(25);

    expect($transfer->fresh()->status)->toBe(TransferStatus::Delivered);
});

it('delivering a transfer creates stock movement records', function () {
    $transfer = Transfer::withoutGlobalScopes()->create([
        'reference' => 'TRF-DLVMOV01',
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
        'quantity_requested' => 10,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/transfers/{$transfer->id}/deliver")
        ->assertRedirect();

    assertDatabaseHas('stock_movements', [
        'transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity' => 10,
        'source_warehouse_id' => $this->warehouseA->id,
        'destination_shop_id' => $this->shop->id,
    ]);
});
