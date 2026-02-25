<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Logistics\Shop;
use App\Models\Permission;
use App\Models\Pos\Promotion;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
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

    $adminRole = Role::firstOrCreate(['name' => RoleEnum::Admin->value, 'guard_name' => 'web']);
    $adminRole->syncPermissions(Permission::all());

    $this->company = Company::factory()->create();

    $this->admin = User::factory()->create(['company_id' => $this->company->id]);
    $this->admin->assignRole(RoleEnum::Admin->value);

    $this->shop = Shop::factory()->active()->create([
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);
});

// --- Index ---

it('shows promotions list', function () {
    actingAs($this->admin)
        ->get('/pos/promotions')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('pos/promotions/index'));
});

// --- Create ---

it('shows promotion create form', function () {
    actingAs($this->admin)
        ->get('/pos/promotions/create')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('pos/promotions/create'));
});

// --- Store ---

it('creates a promotion', function () {
    $response = actingAs($this->admin)
        ->post('/pos/promotions', [
            'name' => 'Black Friday',
            'type' => 'percentage',
            'value' => 15,
            'starts_at' => now()->format('Y-m-d H:i:s'),
            'ends_at' => now()->addWeek()->format('Y-m-d H:i:s'),
            'is_active' => true,
            'description' => 'Soldes',
            'shop_id' => $this->shop->id,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    assertDatabaseHas('promotions', [
        'name' => 'Black Friday',
        'type' => 'percentage',
        'company_id' => $this->company->id,
    ]);
});

it('creates a promotion with products', function () {
    $category = ProductCategory::withoutGlobalScopes()->create([
        'name' => 'Cat',
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $product = Product::withoutGlobalScopes()->create([
        'name' => 'Test Product',
        'code' => 'PP-001',
        'price' => 500,
        'cost_price' => 200,
        'stock' => 10,
        'unity' => 'piece',
        'status' => 'active',
        'category_id' => $category->id,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $response = actingAs($this->admin)
        ->post('/pos/promotions', [
            'name' => 'Promo Produit',
            'type' => 'fixed_amount',
            'value' => 100,
            'starts_at' => now()->toDateTimeString(),
            'ends_at' => now()->addMonth()->toDateTimeString(),
            'is_active' => true,
            'product_ids' => [$product->id],
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $promo = Promotion::withoutGlobalScopes()->where('name', 'Promo Produit')->first();
    expect($promo->products)->toHaveCount(1);
});

// --- Update ---

it('updates a promotion', function () {
    $promo = Promotion::withoutGlobalScopes()->create([
        'name' => 'Original',
        'type' => 'percentage',
        'value' => 10,
        'starts_at' => now(),
        'ends_at' => now()->addWeek(),
        'is_active' => true,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    $response = actingAs($this->admin)
        ->put("/pos/promotions/{$promo->id}", [
            'name' => 'Updated',
            'type' => 'percentage',
            'value' => 20,
            'starts_at' => now()->toDateTimeString(),
            'ends_at' => now()->addMonth()->toDateTimeString(),
            'is_active' => false,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    expect($promo->fresh()->name)->toBe('Updated');
    expect((float) $promo->fresh()->value)->toBe(20.0);
});

// --- Delete ---

it('soft deletes a promotion', function () {
    $promo = Promotion::withoutGlobalScopes()->create([
        'name' => 'To Delete',
        'type' => 'percentage',
        'value' => 5,
        'starts_at' => now(),
        'ends_at' => now()->addWeek(),
        'is_active' => true,
        'company_id' => $this->company->id,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->delete("/pos/promotions/{$promo->id}")
        ->assertRedirect();

    assertSoftDeleted('promotions', ['id' => $promo->id]);
});
