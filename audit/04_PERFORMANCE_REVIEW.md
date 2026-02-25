# 04 — REVUE PERFORMANCE

---

## Goulot #1 : Pas de cache applicatif

**Impact : ÉLEVÉ pour un usage à grande échelle**

### Description
Chaque formulaire de création/édition exécute des requêtes pour alimenter les dropdowns :

```php
// Dans SupplyRequestController::create(), TransferController::create(),
// StockMovementController::create(), etc.
'warehouses' => Warehouse::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
'products' => Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
'shops' => Shop::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
'vehicles' => Vehicle::query()->select(['id', 'name', 'registration_number'])->orderBy('name')->get(),
'suppliers' => Supplier::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
```

Avec 1000 produits, 50 entrepôts, et 10 utilisateurs simultanés, ça fait **50+ requêtes SQL/seconde** juste pour des données quasi-statiques.

### Solution
```php
// app/Services/DropdownService.php
class DropdownService
{
    public function warehouses(): Collection
    {
        return Cache::tags(['company-'.auth()->user()->company_id])
            ->remember('warehouses', 300, fn () =>
                Warehouse::query()->select(['id', 'name', 'code'])->orderBy('name')->get()
            );
    }
}
```

---

## Goulot #2 : N+1 potentiel dans les seeders et certaines requêtes

**Impact : MOYEN (développement/staging surtout)**

### Description
`ProductSeeder` :
```php
foreach ($companies as $company) {
    $creator = $company->creator; // ← N+1 : une requête par company
    $categories = ProductCategory::withoutGlobalScopes()
        ->where('company_id', $company->id)->get(); // ← N+1
    // ...
}
```

`LogisticsSeeder` :
```php
foreach ($companies as $company) {
    $users = $company->creator; // ← N+1
    $products = Product::withoutGlobalScopes()
        ->where('company_id', $company->id)->get(); // ← N+1
}
```

### Solution
```php
$companies = Company::withoutGlobalScopes()
    ->with(['creator'])
    ->get();
```

---

## Goulot #3 : Sérialisation User complète à chaque requête Inertia

**Impact : MOYEN**

### Description
`HandleInertiaRequests::share()` :
```php
'auth' => [
    'user' => $request->user(), // Modèle entier sérialisé
    'permissions' => $request->user()?->getAllPermissions()->pluck('name')->toArray() ?? [],
],
```

`getAllPermissions()` fait une requête DB pour charger les permissions à **chaque requête HTTP**. Avec Spatie Permission, c'est caché automatiquement, mais le cache est invalidé à chaque modification de rôle/permission.

Pour un super admin avec 50 permissions, ça représente un tableau de 50 chaînes sérialisé dans chaque réponse Inertia.

### Solution
Ne charger les permissions qu'une fois en session ou utiliser un cache par utilisateur.

---

## Goulot #4 : Pas d'index composites dans les migrations

**Impact : ÉLEVÉ à grande échelle**

### Description
Les tables `warehouse_stocks`, `shop_stocks`, `stock_movements`, et `supply_request_items` sont fréquemment requêtées par combinaisons de colonnes :

```php
WarehouseStock::withoutGlobalScopes()
    ->where('product_id', $movement->product_id)
    ->where('warehouse_id', $movement->source_warehouse_id)
    ->first();
```

Sans index composite `(product_id, warehouse_id)`, cette requête fait un full table scan. Avec 100k lignes de stock, c'est 100ms+ par requête.

### Solution
Migration à ajouter :
```php
Schema::table('warehouse_stocks', function (Blueprint $table) {
    $table->unique(['product_id', 'warehouse_id']);
});

Schema::table('shop_stocks', function (Blueprint $table) {
    $table->unique(['product_id', 'shop_id']);
});

Schema::table('stock_movements', function (Blueprint $table) {
    $table->index(['product_id', 'source_warehouse_id']);
    $table->index(['product_id', 'destination_warehouse_id']);
    $table->index(['company_id', 'created_at']);
});
```

---

## Goulot #5 : Pagination fixe à 15/20 sans option configurable

**Impact : FAIBLE mais impact UX**

### Description
Tous les index de contrôleurs utilisent `->paginate(15)` ou `->paginate(20)` en dur. Pas de paramètre `per_page` configurable.

Avec 10 000 produits, l'utilisateur doit naviguer 666 pages.

### Solution
```php
$perPage = min((int) $request->input('per_page', 15), 100);
$products = Product::query()->paginate($perPage);
```

---

## Goulot #6 : SQLite comme DB par défaut

**Impact : BLOQUANT pour la production**

### Description
`.env.example` utilise `DB_CONNECTION=sqlite`. SQLite :
- Ne supporte pas les locks `FOR UPDATE` (critique pour le stock)
- Une seule écriture à la fois (mutex global)
- Pas de connexions concurrentes performantes

### Solution
Migrer vers PostgreSQL ou MySQL pour la production. PostgreSQL recommandé pour les UUIDs natifs et le support `FOR UPDATE SKIP LOCKED`.

---

## Goulot #7 : Sessions, cache et queue en database

**Impact : ÉLEVÉ à grande échelle**

### Description
```dotenv
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

Chaque session = une ligne en DB. Chaque requête = une requête session. Avec 1000 utilisateurs simultanés = 1000 requêtes session supplémentaires par seconde. Le cache en DB annule complètement l'intérêt du cache.

### Solution
```dotenv
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
```

---

## Goulot #8 : Opérations stock en boucle séquentielle

**Impact : MOYEN à ÉLEVÉ**

### Description
`TransferController::deliver()` et `SupplyRequestController::deliver()` itèrent sur chaque item et font 3-4 requêtes par item :

```php
foreach ($transfer->items as $item) {
    // 1. SELECT stock source
    // 2. UPDATE stock source (decrement)
    // 3. SELECT OR INSERT stock destination
    // 4. UPDATE stock destination (increment)
    // 5. INSERT stock_movement
    // 6. UPDATE transfer_item
}
```

Pour un transfert de 50 items = 300 requêtes SQL.

### Solution
- Batch les insertions de StockMovement via `insert()`
- Utiliser des `UPDATE ... SET quantity = quantity - ? WHERE ...` en une requête
- Charger tous les stocks source en une seule requête avant la boucle

---

## Goulot #9 : Pas de lazy loading prevention

**Impact : MOYEN (détection en dev)**

### Description
Laravel offre `Model::preventLazyLoading()` qui lève une exception en dev quand un N+1 est détecté. Non activé dans ce projet.

### Solution
```php
// AppServiceProvider::boot()
Model::preventLazyLoading(!app()->isProduction());
```

---

## Résumé des optimisations

| # | Problème | Impact | Effort | Priorité |
|---|----------|--------|--------|----------|
| 1 | Pas de cache dropdowns | ÉLEVÉ | Faible | P1 |
| 2 | N+1 dans seeders | MOYEN | Faible | P2 |
| 3 | User sérialisé complet | MOYEN | Faible | P1 |
| 4 | Pas d'index composites | ÉLEVÉ | Faible | P0 |
| 5 | Pagination fixe | FAIBLE | Très faible | P3 |
| 6 | SQLite en production | BLOQUANT | Moyen | P0 |
| 7 | Session/cache/queue en DB | ÉLEVÉ | Moyen | P1 |
| 8 | Boucle stock séquentielle | MOYEN-ÉLEVÉ | Moyen | P1 |
| 9 | Pas de lazy loading prevention | MOYEN | Très faible | P2 |
