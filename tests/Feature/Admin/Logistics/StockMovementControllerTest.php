<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Enums\StockMovementType;
use App\Enums\WarehouseStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Permission;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use App\Models\Role;
use App\Models\User;

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
});

it('lists stock movements', function () {
    actingAs($this->admin)
        ->get('/admin/logistics/movements')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/logistics/movements/index'));
});

it('creates a purchase entry movement and increments stock', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/movements', [
            'type' => StockMovementType::PurchaseEntry->value,
            'quantity' => 50,
            'reason' => 'Achat fournisseur',
            'product_id' => $this->product->id,
            'destination_warehouse_id' => $this->warehouseA->id,
            'source_warehouse_id' => null,
            'supply_request_id' => null,
        ])
        ->assertRedirect();

    $stock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseA->id)
        ->first();

    expect($stock->quantity)->toBe(150);
});

it('creates an exit movement and decrements stock', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/movements', [
            'type' => StockMovementType::StoreTransfer->value,
            'quantity' => 30,
            'reason' => 'Transfert magasin',
            'product_id' => $this->product->id,
            'source_warehouse_id' => $this->warehouseA->id,
            'destination_warehouse_id' => null,
            'supply_request_id' => null,
        ])
        ->assertRedirect();

    $stock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseA->id)
        ->first();

    expect($stock->quantity)->toBe(70);
});

it('creates an internal transfer and updates both warehouse stocks', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/movements', [
            'type' => StockMovementType::InternalTransfer->value,
            'quantity' => 25,
            'reason' => 'Transfert interne',
            'product_id' => $this->product->id,
            'source_warehouse_id' => $this->warehouseA->id,
            'destination_warehouse_id' => $this->warehouseB->id,
            'supply_request_id' => null,
        ])
        ->assertRedirect();

    $stockA = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseA->id)
        ->first();

    $stockB = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseB->id)
        ->first();

    expect($stockA->quantity)->toBe(75)
        ->and($stockB->quantity)->toBe(25);
});

it('records a loss movement', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/movements', [
            'type' => StockMovementType::Loss->value,
            'quantity' => 10,
            'reason' => 'Casse en entrepôt',
            'product_id' => $this->product->id,
            'source_warehouse_id' => $this->warehouseA->id,
            'destination_warehouse_id' => null,
            'supply_request_id' => null,
        ])
        ->assertRedirect();

    $stock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->warehouseA->id)
        ->first();

    expect($stock->quantity)->toBe(90);
});
