<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Enums\SupplyRequestStatus;
use App\Enums\SupplyType;
use App\Enums\WarehouseStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Supplier;
use App\Models\Logistics\SupplyRequest;
use App\Models\Logistics\SupplyRequestItem;
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

    $this->admin = User::factory()->create(['company_id' => $this->company->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->category = ProductCategory::withoutGlobalScopes()->create([
        'name' => 'Category',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $this->product = Product::withoutGlobalScopes()->create([
        'name' => 'Test Product',
        'code' => 'PRD-SR001',
        'price' => 100,
        'stock' => 50,
        'unity' => 'piece',
        'status' => 'active',
        'category_id' => $this->category->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $this->sourceWarehouse = Warehouse::withoutGlobalScopes()->create([
        'name' => 'Source',
        'code' => 'WH-SRC',
        'status' => WarehouseStatus::Active,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $this->destWarehouse = Warehouse::withoutGlobalScopes()->create([
        'name' => 'Destination',
        'code' => 'WH-DST',
        'status' => WarehouseStatus::Active,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    WarehouseStock::withoutGlobalScopes()->create([
        'quantity' => 200,
        'stock_alert' => 10,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->sourceWarehouse->id,
        'company_id' => $this->company->id,
    ]);

    $this->supplier = Supplier::withoutGlobalScopes()->create([
        'name' => 'Fournisseur Test',
        'code' => 'SUP-001',
        'is_active' => true,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);
});

it('creates a warehouse-to-warehouse supply request with items', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/supply-requests', [
            'type' => SupplyType::WarehouseToWarehouse->value,
            'notes' => 'Ravitaillement entrepôt',
            'source_warehouse_id' => $this->sourceWarehouse->id,
            'destination_warehouse_id' => $this->destWarehouse->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity_requested' => 50,
                ],
            ],
        ])
        ->assertRedirect();

    assertDatabaseHas('supply_requests', [
        'type' => SupplyType::WarehouseToWarehouse->value,
        'status' => SupplyRequestStatus::Pending->value,
        'company_id' => $this->company->id,
    ]);

    assertDatabaseHas('supply_request_items', [
        'product_id' => $this->product->id,
        'quantity_requested' => 50,
    ]);
});

it('creates a supplier-to-warehouse supply request', function () {
    actingAs($this->admin)
        ->post('/admin/logistics/supply-requests', [
            'type' => SupplyType::SupplierToWarehouse->value,
            'notes' => 'Commande fournisseur',
            'supplier_id' => $this->supplier->id,
            'destination_warehouse_id' => $this->destWarehouse->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity_requested' => 100,
                ],
            ],
        ])
        ->assertRedirect();

    assertDatabaseHas('supply_requests', [
        'type' => SupplyType::SupplierToWarehouse->value,
        'status' => SupplyRequestStatus::Pending->value,
        'supplier_id' => $this->supplier->id,
        'destination_warehouse_id' => $this->destWarehouse->id,
    ]);
});

it('approves a pending supply request', function () {
    $supplyRequest = SupplyRequest::withoutGlobalScopes()->create([
        'reference' => 'SR-TEST01',
        'type' => SupplyType::WarehouseToWarehouse,
        'status' => SupplyRequestStatus::Pending,
        'source_warehouse_id' => $this->sourceWarehouse->id,
        'destination_warehouse_id' => $this->destWarehouse->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/supply-requests/{$supplyRequest->id}/approve")
        ->assertRedirect();

    $supplyRequest->refresh();
    expect($supplyRequest->status)->toBe(SupplyRequestStatus::Approved);
    expect($supplyRequest->approved_by)->toBe($this->admin->id);
});

it('delivers an approved warehouse-to-warehouse supply request and updates stocks', function () {
    $supplyRequest = SupplyRequest::withoutGlobalScopes()->create([
        'reference' => 'SR-DELIV1',
        'type' => SupplyType::WarehouseToWarehouse,
        'status' => SupplyRequestStatus::Approved,
        'approved_at' => now(),
        'approved_by' => $this->admin->id,
        'source_warehouse_id' => $this->sourceWarehouse->id,
        'destination_warehouse_id' => $this->destWarehouse->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    SupplyRequestItem::create([
        'supply_request_id' => $supplyRequest->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 40,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/supply-requests/{$supplyRequest->id}/deliver")
        ->assertRedirect();

    $supplyRequest->refresh();
    expect($supplyRequest->status)->toBe(SupplyRequestStatus::Delivered);

    $sourceStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->sourceWarehouse->id)
        ->first();

    $destStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->destWarehouse->id)
        ->first();

    expect($sourceStock->quantity)->toBe(160)
        ->and($destStock->quantity)->toBe(40);
});

it('delivers a supplier-to-warehouse supply request and increases destination stock only', function () {
    $supplyRequest = SupplyRequest::withoutGlobalScopes()->create([
        'reference' => 'SR-SUPDELIV',
        'type' => SupplyType::SupplierToWarehouse,
        'status' => SupplyRequestStatus::Approved,
        'approved_at' => now(),
        'approved_by' => $this->admin->id,
        'supplier_id' => $this->supplier->id,
        'destination_warehouse_id' => $this->destWarehouse->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    SupplyRequestItem::create([
        'supply_request_id' => $supplyRequest->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 100,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/supply-requests/{$supplyRequest->id}/deliver")
        ->assertRedirect();

    $supplyRequest->refresh();
    expect($supplyRequest->status)->toBe(SupplyRequestStatus::Delivered);

    $destStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->destWarehouse->id)
        ->first();

    expect($destStock)->not->toBeNull();
    expect($destStock->quantity)->toBe(100);

    $sourceStock = WarehouseStock::withoutGlobalScopes()
        ->where('product_id', $this->product->id)
        ->where('warehouse_id', $this->sourceWarehouse->id)
        ->first();
    expect($sourceStock->quantity)->toBe(200);
});

it('prevents delivery when stock is insufficient for warehouse-to-warehouse supply', function () {
    $supplyRequest = SupplyRequest::withoutGlobalScopes()->create([
        'reference' => 'SR-INSUFF1',
        'type' => SupplyType::WarehouseToWarehouse,
        'status' => SupplyRequestStatus::Approved,
        'approved_at' => now(),
        'approved_by' => $this->admin->id,
        'source_warehouse_id' => $this->sourceWarehouse->id,
        'destination_warehouse_id' => $this->destWarehouse->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    SupplyRequestItem::create([
        'supply_request_id' => $supplyRequest->id,
        'product_id' => $this->product->id,
        'quantity_requested' => 500,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/supply-requests/{$supplyRequest->id}/deliver")
        ->assertRedirect()
        ->assertSessionHas('error');

    $supplyRequest->refresh();
    expect($supplyRequest->status)->toBe(SupplyRequestStatus::Approved);
});

it('rejects a pending supply request', function () {
    $supplyRequest = SupplyRequest::withoutGlobalScopes()->create([
        'reference' => 'SR-REJT01',
        'type' => SupplyType::WarehouseToWarehouse,
        'status' => SupplyRequestStatus::Pending,
        'source_warehouse_id' => $this->sourceWarehouse->id,
        'destination_warehouse_id' => $this->destWarehouse->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/supply-requests/{$supplyRequest->id}/reject")
        ->assertRedirect();

    $supplyRequest->refresh();
    expect($supplyRequest->status)->toBe(SupplyRequestStatus::Rejected);
});

it('cannot deliver a non-approved supply request', function () {
    $supplyRequest = SupplyRequest::withoutGlobalScopes()->create([
        'reference' => 'SR-NAPRV1',
        'type' => SupplyType::WarehouseToWarehouse,
        'status' => SupplyRequestStatus::Pending,
        'source_warehouse_id' => $this->sourceWarehouse->id,
        'destination_warehouse_id' => $this->destWarehouse->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->post("/admin/logistics/supply-requests/{$supplyRequest->id}/deliver")
        ->assertRedirect()
        ->assertSessionHas('error');
});
