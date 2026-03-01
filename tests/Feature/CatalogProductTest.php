<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Catalog\CatalogProduct;
use App\Models\Company\Company;
use App\Models\Permission;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use App\Models\Role;
use App\Models\User;
use App\Services\CatalogProductService;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;

beforeEach(function () {
    foreach (PermissionEnum::cases() as $perm) {
        Permission::firstOrCreate(['name' => $perm->value, 'guard_name' => 'web']);
    }

    $adminRole = Role::firstOrCreate(['name' => RoleEnum::Admin->value, 'guard_name' => 'web']);
    $adminRole->syncPermissions(Permission::all());

    $this->company = Company::factory()->create();
    $this->user = User::factory()->create(['company_id' => $this->company->id]);
    $this->user->assignRole(RoleEnum::Admin->value);

    $this->category = ProductCategory::withoutGlobalScopes()->create([
        'name' => 'Test',
        'company_id' => $this->company->id,
        'created_by' => $this->user->id,
    ]);
});

// --- CatalogProductService ---

it('creates a catalog product when none exists for the given barcode', function () {
    $service = app(CatalogProductService::class);

    $catalog = $service->resolveOrCreate([
        'code' => '3017620425035',
        'name' => 'Nutella',
        'unity' => 'piece',
    ]);

    expect($catalog)->not->toBeNull();
    expect($catalog->barcode)->toBe('3017620425035');
    expect($catalog->name)->toBe('Nutella');

    assertDatabaseHas('catalog_products', [
        'barcode' => '3017620425035',
        'name' => 'Nutella',
        'source' => 'manual',
    ]);
});

it('returns the existing catalog product when the barcode already exists', function () {
    $existing = CatalogProduct::factory()->create(['barcode' => '3017620425035']);

    $service = app(CatalogProductService::class);

    $catalog = $service->resolveOrCreate([
        'code' => '3017620425035',
        'name' => 'Another Name',
    ]);

    expect($catalog->id)->toBe($existing->id);
    expect(CatalogProduct::where('barcode', '3017620425035')->count())->toBe(1);
});

it('returns null when no barcode is provided', function () {
    $service = app(CatalogProductService::class);

    $catalog = $service->resolveOrCreate(['name' => 'No barcode product']);

    expect($catalog)->toBeNull();
});

it('searches catalog products by name', function () {
    CatalogProduct::factory()->create(['name' => 'Coca-Cola Classic', 'barcode' => '5449000000996']);
    CatalogProduct::factory()->create(['name' => 'Pepsi Max', 'barcode' => '4008400403052']);

    $service = app(CatalogProductService::class);
    $results = $service->search('coca');

    expect($results)->toHaveCount(1);
    expect($results->first()->name)->toBe('Coca-Cola Classic');
});

// --- ProductController integration ---

it('auto-links product to catalog when created with a new barcode', function () {
    actingAs($this->user);

    $this->post('/admin/products', [
        'name' => 'Sprite',
        'code' => '5000112602791',
        'price' => 1.50,
        'cost_price' => 0.80,
        'stock' => 100,
        'stock_alert' => 10,
        'unity' => 'piece',
        'status' => 'active',
        'category_id' => $this->category->id,
    ]);

    assertDatabaseHas('catalog_products', [
        'barcode' => '5000112602791',
        'name' => 'Sprite',
    ]);

    $product = Product::where('code', '5000112602791')->first();
    expect($product->catalog_product_id)->not->toBeNull();
});

it('reuses an existing catalog product when the barcode is already in catalog', function () {
    $catalog = CatalogProduct::factory()->create(['barcode' => '5000112602791', 'name' => 'Sprite (global)']);

    actingAs($this->user);

    $this->post('/admin/products', [
        'name' => 'Sprite',
        'code' => '5000112602791',
        'price' => 1.50,
        'cost_price' => 0.80,
        'stock' => 100,
        'stock_alert' => 10,
        'unity' => 'piece',
        'status' => 'active',
        'category_id' => $this->category->id,
    ]);

    expect(CatalogProduct::where('barcode', '5000112602791')->count())->toBe(1);

    $product = Product::where('code', '5000112602791')->first();
    expect($product->catalog_product_id)->toBe($catalog->id);
});

// --- Catalog search endpoint ---

it('returns matching catalog products via search endpoint', function () {
    CatalogProduct::factory()->create(['name' => 'Fanta Orange', 'barcode' => '5449000054227']);
    CatalogProduct::factory()->create(['name' => 'Fanta Citron', 'barcode' => '5449000054234']);
    CatalogProduct::factory()->create(['name' => 'Evian', 'barcode' => '3068320114070']);

    actingAs($this->user);

    $response = $this->getJson('/admin/catalog/search?q=fanta');

    $response->assertOk();
    $response->assertJsonCount(2, 'data');
});

it('rejects search queries shorter than 2 characters', function () {
    actingAs($this->user);

    $this->getJson('/admin/catalog/search?q=a')->assertUnprocessable();
});

it('returns catalog product details by id', function () {
    $catalog = CatalogProduct::factory()->create([
        'barcode' => '3017620425035',
        'name' => 'Nutella',
        'brand' => 'Ferrero',
    ]);

    actingAs($this->user);

    $this->getJson("/admin/catalog/{$catalog->id}")
        ->assertOk()
        ->assertJsonPath('data.barcode', '3017620425035')
        ->assertJsonPath('data.name', 'Nutella')
        ->assertJsonPath('data.brand', 'Ferrero');
});

// --- importToCompany ---

it('imports a catalog product into the company product list', function () {
    $catalog = CatalogProduct::factory()->create([
        'barcode' => '5000112602791',
        'name' => 'Sprite',
    ]);

    actingAs($this->user);

    $this->post("/admin/catalog/{$catalog->id}/import", [
        'price' => 1.50,
        'cost_price' => 0.80,
        'stock' => 50,
        'stock_alert' => 5,
        'unity' => 'piece',
        'status' => 'active',
        'category_id' => $this->category->id,
    ])->assertRedirect();

    assertDatabaseHas('products', [
        'code' => '5000112602791',
        'name' => 'Sprite',
        'company_id' => $this->company->id,
        'catalog_product_id' => $catalog->id,
    ]);
});

it('prevents importing the same catalog product twice into the same company', function () {
    $catalog = CatalogProduct::factory()->create(['barcode' => '5000112602791', 'name' => 'Sprite']);

    // Create the product already in the company
    Product::create([
        'name' => 'Sprite',
        'code' => '5000112602791',
        'price' => 1.50,
        'cost_price' => 0.80,
        'stock' => 50,
        'stock_alert' => 5,
        'unity' => 'piece',
        'status' => 'active',
        'company_id' => $this->company->id,
        'category_id' => $this->category->id,
        'catalog_product_id' => $catalog->id,
        'created_by' => $this->user->id,
    ]);

    actingAs($this->user);

    $this->post("/admin/catalog/{$catalog->id}/import", [
        'price' => 1.50,
        'cost_price' => 0.80,
        'stock' => 50,
        'stock_alert' => 5,
        'unity' => 'piece',
        'status' => 'active',
        'category_id' => $this->category->id,
    ])->assertRedirect()->assertSessionHas('error');

    expect(Product::withoutGlobalScopes()->where('code', '5000112602791')->count())->toBe(1);
});
