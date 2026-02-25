# 06 — ROADMAP DE REFACTORING

## Vue d'ensemble

Ce roadmap est organisé en 3 phases progressives. Chaque phase peut être déployée indépendamment et apporte une valeur immédiate. L'ordre est dicté par le ratio impact/effort.

**Effort total estimé : 4-6 semaines** (1 développeur senior)

---

## PHASE 1 — CORRECTIONS CRITIQUES (Semaine 1-2)

> Objectif : Éliminer les risques de corruption de données et les failles de sécurité.

### 1.1 Fix CompanyPolicy — Isolation tenant (30 min)

**Fichier** : `app/Policies/CompanyPolicy.php`

```php
// AVANT
public function view(User $user, Company $company): bool
{
    return $user->hasPermissionTo(PermissionEnum::ViewCompany);
}

// APRÈS
public function view(User $user, Company $company): bool
{
    return $user->company_id === $company->id
        && $user->hasPermissionTo(PermissionEnum::ViewCompany);
}
```

Appliquer le même pattern à `update()`, `delete()`, `restore()`, `forceDelete()`.

### 1.2 Fix bug accessor logo Company (5 min)

**Fichier** : `app/Http/Controllers/Admin/CompanyController.php`

```php
// AVANT
$logo = $company->logo; // ← retourne l'URL transformée par l'accessor

// APRÈS
$logo = $company->getRawOriginal('logo'); // ← retourne le path brut en DB
```

### 1.3 Ajouter transactions + locks sur toutes les opérations stock (1-2 jours)

**SupplyRequestController::deliver()** :
```php
public function deliver(SupplyRequest $supplyRequest): RedirectResponse
{
    return DB::transaction(function () use ($supplyRequest) {
        $supplyRequest->lockForUpdate();
        
        if ($supplyRequest->status !== SupplyRequestStatus::Pending) {
            abort(409, 'Commande déjà traitée.');
        }

        $supplyRequest->update(['status' => SupplyRequestStatus::Delivered]);

        foreach ($supplyRequest->items as $item) {
            $stock = WarehouseStock::lockForUpdate()
                ->firstOrCreate(
                    ['product_id' => $item->product_id, 'warehouse_id' => $supplyRequest->warehouse_id],
                    ['quantity' => 0]
                );
            $stock->increment('quantity', $item->quantity);
        }

        return redirect()->back();
    });
}
```

**StockMovementController::store()** :
```php
DB::transaction(function () use ($validated) {
    $stock = WarehouseStock::lockForUpdate()
        ->where('product_id', $validated->product_id)
        ->where('warehouse_id', $validated->warehouse_id)
        ->firstOrFail();
    // ... logique de mise à jour
});
```

### 1.4 Ajouter les index composites (1 heure)

```php
// Migration
Schema::table('warehouse_stocks', function (Blueprint $table) {
    $table->unique(['product_id', 'warehouse_id']);
});

Schema::table('shop_stocks', function (Blueprint $table) {
    $table->unique(['product_id', 'shop_id']);
});

Schema::table('supply_request_items', function (Blueprint $table) {
    $table->index(['supply_request_id', 'product_id']);
});

Schema::table('transfer_items', function (Blueprint $table) {
    $table->index(['transfer_id', 'product_id']);
});

Schema::table('stock_movements', function (Blueprint $table) {
    $table->index(['product_id', 'warehouse_id', 'created_at']);
});
```

### 1.5 Activer MustVerifyEmail (5 min)

**Fichier** : `app/Models/User.php`

```php
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
```

### 1.6 Ajouter rate limiting sur activation de compte (30 min)

**Fichier** : `routes/web.php`

```php
Route::get('/activate/{user}', [AccountActivationController::class, 'activate'])
    ->name('activation.activate')
    ->middleware(['signed', 'throttle:6,1']);
```

### 1.7 Ajouter middleware de rôle sur logistics routes (15 min)

**Fichier** : `routes/logistics.php`

```php
Route::middleware(['auth', 'verified', 'role:Admin|Super Admin|Logistics Manager|Stock Manager'])
    ->prefix('logistics')
    ->group(function () {
        // ... routes existantes
    });
```

### Checkpoint Phase 1

- [ ] Tests existants passent toujours
- [ ] Nouveau test : un admin ne peut pas accéder à une autre company
- [ ] Nouveau test : double livraison retourne 409
- [ ] Nouveaux index en migration
- [ ] MustVerifyEmail activé
- [ ] Rate limiting sur activation

---

## PHASE 2 — SERVICE LAYER + ARCHITECTURE (Semaine 2-4)

> Objectif : Extraire la logique métier des contrôleurs, unifier les conventions.

### 2.1 Créer StockService (2-3 jours)

```php
// app/Services/StockService.php
class StockService
{
    public function incrementWarehouseStock(
        string $productId,
        string $warehouseId,
        int $quantity,
        StockMovementType $type,
        ?string $reference = null,
    ): WarehouseStock {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $type, $reference) {
            $stock = WarehouseStock::lockForUpdate()->firstOrCreate(
                ['product_id' => $productId, 'warehouse_id' => $warehouseId],
                ['quantity' => 0]
            );

            $stock->increment('quantity', $quantity);

            StockMovement::create([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'quantity' => $quantity,
                'type' => $type,
                'reference' => $reference ?? $this->generateReference(),
            ]);

            StockUpdated::dispatch($stock); // Domain event

            return $stock;
        });
    }

    public function decrementWarehouseStock(
        string $productId,
        string $warehouseId,
        int $quantity,
        StockMovementType $type,
        ?string $reference = null,
    ): WarehouseStock {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $type, $reference) {
            $stock = WarehouseStock::lockForUpdate()
                ->where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->firstOrFail();

            if ($stock->quantity < $quantity) {
                throw new InsufficientStockException($stock, $quantity);
            }

            $stock->decrement('quantity', $quantity);

            StockMovement::create([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'quantity' => $quantity,
                'type' => $type,
                'reference' => $reference ?? $this->generateReference(),
            ]);

            StockUpdated::dispatch($stock);

            return $stock;
        });
    }

    public function transferStock(Transfer $transfer): void
    {
        DB::transaction(function () use ($transfer) {
            $transfer->lockForUpdate();

            foreach ($transfer->items as $item) {
                // Décrémente source
                $this->decrementWarehouseStock(
                    $item->product_id,
                    $transfer->source_warehouse_id,
                    $item->quantity,
                    StockMovementType::TransferOut,
                    $transfer->reference,
                );

                // Incrémente destination
                $this->incrementWarehouseStock(
                    $item->product_id,
                    $transfer->destination_warehouse_id,
                    $item->quantity,
                    StockMovementType::TransferIn,
                    $transfer->reference,
                );
            }

            $transfer->update(['status' => TransferStatus::Completed]);
        });
    }

    private function generateReference(): string
    {
        do {
            $reference = 'STK-' . strtoupper(Str::random(8));
        } while (StockMovement::where('reference', $reference)->exists());

        return $reference;
    }
}
```

### 2.2 Introduire des Domain Events (1-2 jours)

```php
// app/Events/StockUpdated.php
class StockUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public WarehouseStock|ShopStock $stock,
    ) {}
}

// app/Events/SupplyRequestDelivered.php
class SupplyRequestDelivered
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public SupplyRequest $supplyRequest,
    ) {}
}

// app/Listeners/LogStockChange.php
class LogStockChange
{
    public function handle(StockUpdated $event): void
    {
        Log::channel('stock')->info('Stock updated', [
            'stock_type' => get_class($event->stock),
            'product_id' => $event->stock->product_id,
            'new_quantity' => $event->stock->quantity,
        ]);
    }
}
```

### 2.3 Refactorer BelongsToCompany avec un TenantContext (2 jours)

```php
// app/Services/TenantContext.php
class TenantContext
{
    private static ?string $companyId = null;

    public static function set(string $companyId): void
    {
        self::$companyId = $companyId;
    }

    public static function get(): ?string
    {
        return self::$companyId ?? auth()->user()?->company_id;
    }

    public static function clear(): void
    {
        self::$companyId = null;
    }
}

// Usage dans middleware
class SetTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($user = $request->user()) {
            TenantContext::set($user->company_id);
        }

        return $next($request);
    }
}

// Usage dans BelongsToCompany (refactoré)
protected static function bootBelongsToCompany(): void
{
    static::addGlobalScope('company', function (Builder $builder) {
        if ($companyId = TenantContext::get()) {
            $builder->where($builder->getModel()->getTable() . '.company_id', $companyId);
        }
    });

    static::creating(function (Model $model) {
        if (empty($model->company_id)) {
            $model->company_id = TenantContext::get();
        }
    });
}
```

### 2.4 Empêcher le lazy loading (15 min)

```php
// app/Providers/AppServiceProvider.php
public function boot(): void
{
    Model::preventLazyLoading(! app()->isProduction());
    Model::preventSilentlyDiscardingAttributes(! app()->isProduction());
}
```

### 2.5 Unifier validation — migrer les FormRequests vers Data DTOs (1-2 jours)

Convertir `StoreProductRequest` et `UpdateProductRequest` en Data DTOs (comme le pattern existant dans `app/Data/Logistics/`) pour uniformiser l'approche de validation.

### 2.6 Nettoyer les fichiers orphelins (1 heure)

```php
// Dans CompanyController::update()
if ($request->hasFile('logo')) {
    if ($company->getRawOriginal('logo')) {
        Storage::disk('public')->delete($company->getRawOriginal('logo'));
    }
    $validated['logo'] = $request->file('logo')->store('logos', 'public');
}

// Observer pour suppression soft-delete
class CompanyObserver
{
    public function deleting(Company $company): void
    {
        if ($company->getRawOriginal('logo')) {
            Storage::disk('public')->delete($company->getRawOriginal('logo'));
        }
    }
}
```

### 2.7 Créer une base Policy abstraite (1 heure)

```php
// app/Policies/BasePolicy.php
abstract class BasePolicy
{
    protected function belongsToSameCompany(User $user, Model $model): bool
    {
        return $user->company_id === $model->company_id;
    }

    protected function hasPermissionInCompany(User $user, Model $model, PermissionEnum $permission): bool
    {
        return $this->belongsToSameCompany($user, $model)
            && $user->hasPermissionTo($permission);
    }
}
```

### 2.8 Ajouter validation FK dans les Data DTOs (1 heure)

```php
// app/Data/Logistics/StockMovementData.php
public static function rules(): array
{
    return [
        'product_id' => ['required', 'uuid', Rule::exists('products', 'id')],
        'warehouse_id' => ['required', 'uuid', Rule::exists('warehouses', 'id')],
        // ...
    ];
}
```

### Checkpoint Phase 2

- [ ] Tous les contrôleurs injecte `StockService` au lieu de logique inline
- [ ] Domain events émis pour stock et livraisons
- [ ] Lazy loading interdit en dev
- [ ] Fichiers orphelins nettoyés
- [ ] Tests mis à jour et passent

---

## PHASE 3 — SCALABILITÉ & OPTIMISATION (Semaine 4-6)

> Objectif : Préparer le système pour 1M+ utilisateurs et une charge élevée.

### 3.1 Migrer de SQLite vers PostgreSQL (1 jour)

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=shop_v2
DB_USERNAME=shop
DB_PASSWORD=secret
```

Avantages : locks row-level natifs, JSONB, full-text search, performances à grande échelle, support CTE.

### 3.2 Migrer sessions/cache/queue vers Redis (2 heures)

```env
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

### 3.3 Ajouter une couche cache sur les lectures fréquentes (1-2 jours)

```php
// Exemple : lister les produits avec cache invalidé par tags
public function index(): Response
{
    $products = Cache::tags(['products', 'company:' . TenantContext::get()])
        ->remember('products:page:' . request('page', 1), 3600, function () {
            return Product::with(['category', 'tags'])
                ->paginate(25);
        });

    return Inertia::render('Admin/Products/Index', [
        'products' => ProductResource::collection($products),
    ]);
}
```

### 3.4 Batch operations pour les livraisons en masse (1 jour)

```php
// StockService — méthode de batch
public function bulkIncrementWarehouseStock(Collection $items, string $warehouseId, string $reference): void
{
    DB::transaction(function () use ($items, $warehouseId, $reference) {
        $productIds = $items->pluck('product_id');

        $stocks = WarehouseStock::lockForUpdate()
            ->where('warehouse_id', $warehouseId)
            ->whereIn('product_id', $productIds)
            ->get()
            ->keyBy('product_id');

        $movementsToInsert = [];

        foreach ($items as $item) {
            $stock = $stocks->get($item->product_id);
            if ($stock) {
                $stock->increment('quantity', $item->quantity);
            } else {
                WarehouseStock::create([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $warehouseId,
                    'quantity' => $item->quantity,
                ]);
            }

            $movementsToInsert[] = [
                'id' => Str::uuid(),
                'product_id' => $item->product_id,
                'warehouse_id' => $warehouseId,
                'quantity' => $item->quantity,
                'type' => StockMovementType::In,
                'reference' => $reference,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        StockMovement::insert($movementsToInsert);
    });
}
```

### 3.5 Ajouter un audit log (1-2 jours)

```php
// Package recommandé : spatie/laravel-activitylog
// OU trait custom :
trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(fn ($model) => AuditLog::record('created', $model));
        static::updated(fn ($model) => AuditLog::record('updated', $model));
        static::deleted(fn ($model) => AuditLog::record('deleted', $model));
    }
}
```

### 3.6 Supprimer les permissions mortes (30 min)

```php
// Migration
PermissionEnum::cases()
    ->filter(fn ($p) => str_starts_with($p->value, 'view orders') 
        || str_starts_with($p->value, 'manage cash')
        // ... etc
    )
    ->each(fn ($p) => Permission::where('name', $p->value)->delete());
```

### 3.7 Extraire un trait UuidModel ou un modèle de base (30 min)

```php
// app/Models/Concerns/HasUuidPrimaryKey.php
trait HasUuidPrimaryKey
{
    use HasUuids;

    public function getKeyType(): string
    {
        return 'string';
    }

    public function getIncrementing(): bool
    {
        return false;
    }
}
```

### 3.8 Ajouter Eloquent API Resources (1-2 jours)

Pour préparer l'API :
```php
// app/Http/Resources/ProductResource.php
class ProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'reference' => $this->reference,
            'price' => $this->price,
            'category' => new ProductCategoryResource($this->whenLoaded('category')),
            'tags' => ProductTagResource::collection($this->whenLoaded('tags')),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
```

### 3.9 Ajouter des tests edge-case robustes (2 jours)

```php
it('prevents stock from going negative', function () {
    $stock = WarehouseStock::factory()->create(['quantity' => 5]);

    expect(fn () => app(StockService::class)->decrementWarehouseStock(
        $stock->product_id,
        $stock->warehouse_id,
        10,
        StockMovementType::Out,
    ))->toThrow(InsufficientStockException::class);
});

it('handles concurrent deliveries safely', function () {
    $supplyRequest = SupplyRequest::factory()->create();
    
    // Simuler 2 livraisons simultanées
    $results = collect([1, 2])->map(fn () => 
        rescue(fn () => app(SupplyRequestService::class)->deliver($supplyRequest))
    );
    
    expect($results->filter()->count())->toBe(1); // Une seule réussit
});
```

### Checkpoint Phase 3

- [ ] PostgreSQL en production
- [ ] Redis pour cache/session/queue
- [ ] Cache tags par tenant fonctionnel
- [ ] Audit log actif
- [ ] Permissions mortes supprimées
- [ ] Tests edge-case stock couverts

---

## Planning résumé

```
Semaine 1  │ Phase 1 : Fixes critiques (sécurité, transactions, index)
Semaine 2  │ Phase 1 fin + Phase 2 début (StockService, events)
Semaine 3  │ Phase 2 : TenantContext, cleanup, BasePolicy, validations
Semaine 4  │ Phase 2 fin + Phase 3 début (PostgreSQL, Redis)
Semaine 5  │ Phase 3 : Cache, batch ops, audit logging
Semaine 6  │ Phase 3 fin : Tests edge-case, API Resources, cleanup
```

## Métriques de succès post-refactoring

| Métrique | Avant | Objectif |
|----------|-------|----------|
| Failles sécurité critiques | 3 | 0 |
| Race conditions stock | 3 points | 0 |
| Duplication logique stock | 3 impléments | 1 (StockService) |
| Temps de réponse moyen | Non mesuré | < 200ms |
| Couverture tests edge-case stock | 0% | > 90% |
| Fichiers orphelins générés | Illimité | 0 |
| Index composites manquants | 5 | 0 |
