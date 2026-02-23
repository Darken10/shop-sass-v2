<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Enums\TransferStatus;
use App\Enums\TransferType;
use App\Enums\WarehouseStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Transfer;
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
