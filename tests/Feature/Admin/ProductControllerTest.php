<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Permission;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use App\Models\Product\ProductTag;
use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertSoftDeleted;

beforeEach(function () {
    foreach (PermissionEnum::cases() as $perm) {
        Permission::firstOrCreate(['name' => $perm->value, 'guard_name' => 'web']);
    }

    $superAdminRole = Role::firstOrCreate(['name' => RoleEnum::SuperAdmin->value, 'guard_name' => 'web']);
    $superAdminRole->syncPermissions(Permission::all());

    $adminRole = Role::firstOrCreate(['name' => RoleEnum::Admin->value, 'guard_name' => 'web']);
    $adminRole->syncPermissions(Permission::all());

    $gestionnaireRole = Role::firstOrCreate(['name' => RoleEnum::Gestionnaire->value, 'guard_name' => 'web']);
    $gestionnaireRole->syncPermissions(Permission::whereNot('name', 'like', '%user%')->get());

    $caissierRole = Role::firstOrCreate(['name' => RoleEnum::Caissier->value, 'guard_name' => 'web']);
    $caissierRole->syncPermissions(
        Permission::where('name', 'like', '%cash%')
            ->orWhere('name', 'like', '%transaction%')
            ->orWhere('name', 'like', '%order%')
            ->orWhere('name', 'read product')
            ->orWhere('name', 'read product category')
            ->get()
    );

    $this->companyA = Company::factory()->create();
    $this->companyB = Company::factory()->create();

    $this->admin = User::factory()->create(['company_id' => $this->companyA->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->gestionnaire = User::factory()->create(['company_id' => $this->companyA->id]);
    $this->gestionnaire->assignRole(RoleEnum::Gestionnaire->value);

    $this->caissier = User::factory()->create(['company_id' => $this->companyA->id]);
    $this->caissier->assignRole(RoleEnum::Caissier->value);

    $this->adminB = User::factory()->create(['company_id' => $this->companyB->id]);
    $this->adminB->assignRole(RoleEnum::Admin->value);

    $this->categoryA = ProductCategory::withoutGlobalScopes()->create([
        'name' => 'Catégorie A',
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    $this->categoryB = ProductCategory::withoutGlobalScopes()->create([
        'name' => 'Catégorie B',
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);
});

// --- Authorization ---

it('forbids unauthenticated users from accessing products', function () {
    $this->get('/admin/products')->assertRedirect('/login');
});

it('forbids caissier from creating products', function () {
    actingAs($this->caissier)
        ->get('/admin/products/create')
        ->assertForbidden();
});

it('allows admin to access product index', function () {
    actingAs($this->admin)
        ->get('/admin/products')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('admin/products/index'));
});

it('allows gestionnaire to create products', function () {
    actingAs($this->gestionnaire)
        ->get('/admin/products/create')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('admin/products/create'));
});

// --- Company isolation ---

it('only shows products from the same company', function () {
    Product::withoutGlobalScopes()->create([
        'name' => 'Product A',
        'code' => 'PA-001',
        'price' => 10,
        'stock' => 5,
        'category_id' => $this->categoryA->id,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    Product::withoutGlobalScopes()->create([
        'name' => 'Product B',
        'code' => 'PB-001',
        'price' => 20,
        'stock' => 3,
        'category_id' => $this->categoryB->id,
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get('/admin/products')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/products/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Product A')
        );
});

it('prevents accessing a product from another company', function () {
    $productB = Product::withoutGlobalScopes()->create([
        'name' => 'Product B',
        'code' => 'PB-002',
        'price' => 20,
        'stock' => 3,
        'category_id' => $this->categoryB->id,
        'company_id' => $this->companyB->id,
        'created_by' => $this->adminB->id,
    ]);

    actingAs($this->admin)
        ->get("/admin/products/{$productB->id}")
        ->assertNotFound();
});

// --- Store ---

it('creates a product with correct company', function () {
    actingAs($this->admin)
        ->post('/admin/products', [
            'name' => 'Nouveau Produit',
            'code' => 'NP-001',
            'price' => 15.50,
            'stock' => 100,
            'unity' => 'piece',
            'status' => 'active',
            'category_id' => $this->categoryA->id,
        ])
        ->assertRedirect();

    assertDatabaseHas('products', [
        'name' => 'Nouveau Produit',
        'code' => 'NP-001',
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);
});

it('creates a product with tags', function () {
    $tag = ProductTag::withoutGlobalScopes()->create([
        'name' => 'Promo',
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->post('/admin/products', [
            'name' => 'Produit avec tag',
            'code' => 'PT-001',
            'price' => 25,
            'stock' => 50,
            'unity' => 'piece',
            'status' => 'active',
            'category_id' => $this->categoryA->id,
            'tags' => [$tag->id],
        ])
        ->assertRedirect();

    $product = Product::withoutGlobalScopes()->where('code', 'PT-001')->first();
    expect($product->tags)->toHaveCount(1);
    expect($product->tags->first()->name)->toBe('Promo');
});

// --- Update ---

it('updates a product', function () {
    $product = Product::withoutGlobalScopes()->create([
        'name' => 'Original',
        'code' => 'OR-001',
        'price' => 10,
        'stock' => 5,
        'category_id' => $this->categoryA->id,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->put("/admin/products/{$product->id}", [
            'name' => 'Modifié',
            'code' => 'OR-001',
            'price' => 20,
            'stock' => 10,
            'unity' => 'piece',
            'status' => 'active',
            'category_id' => $this->categoryA->id,
        ])
        ->assertRedirect();

    expect($product->fresh()->name)->toBe('Modifié');
    expect($product->fresh()->price)->toBe('20.00');
});

// --- Delete ---

it('soft deletes a product', function () {
    $product = Product::withoutGlobalScopes()->create([
        'name' => 'To Delete',
        'code' => 'TD-001',
        'price' => 10,
        'stock' => 1,
        'category_id' => $this->categoryA->id,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->delete("/admin/products/{$product->id}")
        ->assertRedirect();

    assertSoftDeleted('products', ['id' => $product->id]);
});

// --- Category creation (inline modal) ---

it('creates a product category via JSON endpoint', function () {
    actingAs($this->admin)
        ->postJson('/admin/product-categories', [
            'name' => 'Nouvelle Catégorie',
            'description' => 'Test description',
        ])
        ->assertCreated()
        ->assertJsonFragment(['name' => 'Nouvelle Catégorie']);

    assertDatabaseHas('product_categories', [
        'name' => 'Nouvelle Catégorie',
        'company_id' => $this->companyA->id,
    ]);
});

it('forbids caissier from creating categories', function () {
    actingAs($this->caissier)
        ->postJson('/admin/product-categories', [
            'name' => 'Forbidden Category',
        ])
        ->assertForbidden();
});

// --- Tag creation ---

it('creates a product tag via JSON endpoint', function () {
    actingAs($this->admin)
        ->postJson('/admin/product-tags', [
            'name' => 'Nouveau Tag',
        ])
        ->assertCreated()
        ->assertJsonFragment(['name' => 'Nouveau Tag']);

    assertDatabaseHas('product_tags', [
        'name' => 'Nouveau Tag',
        'company_id' => $this->companyA->id,
    ]);
});

// --- Category isolation ---

it('only shows categories from the same company in create page', function () {
    actingAs($this->admin)
        ->get('/admin/products/create')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/products/create')
            ->has('categories', 1)
            ->where('categories.0.name', 'Catégorie A')
        );
});

// --- Code uniqueness (barcode = code) ---

it('rejects duplicate code', function () {
    Product::withoutGlobalScopes()->create([
        'name' => 'Existing',
        'code' => '9999999999999',
        'price' => 10,
        'stock' => 5,
        'category_id' => $this->categoryA->id,
        'company_id' => $this->companyA->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->post('/admin/products', [
            'name' => 'Duplicate Code',
            'code' => '9999999999999',
            'price' => 10,
            'stock' => 5,
            'unity' => 'piece',
            'status' => 'active',
            'category_id' => $this->categoryA->id,
        ])
        ->assertSessionHasErrors('code');
});
