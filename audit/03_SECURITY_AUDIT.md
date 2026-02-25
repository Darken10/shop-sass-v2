# 03 — AUDIT SÉCURITÉ

---

## Vulnérabilité #1 : Race condition sur les opérations de stock

**Gravité : CRITIQUE**  
**Fichiers** : `SupplyRequestController.php`, `TransferController.php`, `StockMovementController.php`

### Description
La méthode `deliver()` de `SupplyRequestController` n'utilise **aucune transaction DB**. Chaque item est traité séquentiellement : lecture du stock, décrémentation, incrémentation. Entre la lecture et l'écriture, un autre processus peut modifier la même ligne.

```php
// SupplyRequestController::deliver() — PAS DE TRANSACTION
foreach ($supplyRequest->items as $item) {
    $movement = StockMovement::create([...]);
    $this->applyTransferStock($movement); // ← Race condition ici
    $item->update([...]);
}
```

### Scénario d'attaque
1. Utilisateur A clique "Livrer" sur la demande SR-001 (10 unités de produit X)
2. Utilisateur B clique "Livrer" sur la même demande SR-001 au même moment
3. Les deux requêtes lisent `status = Approved` → les deux passent la vérification
4. Les deux déduisent 10 unités du stock source et créditent 10 unités au stock destination
5. Résultat : 20 unités déduites, 20 unités créditées au lieu de 10. Stock corrompu.

### Solution
```php
public function deliver(SupplyRequest $supplyRequest): RedirectResponse
{
    $this->authorize('approve', $supplyRequest);

    return DB::transaction(function () use ($supplyRequest) {
        // Verrouillage pessimiste
        $supplyRequest = SupplyRequest::lockForUpdate()->findOrFail($supplyRequest->id);
        
        if ($supplyRequest->status !== SupplyRequestStatus::Approved) {
            return back()->with('error', 'Cette demande doit être approuvée avant livraison.');
        }

        $supplyRequest->load('items.product');

        foreach ($supplyRequest->items as $item) {
            $sourceStock = WarehouseStock::withoutGlobalScopes()
                ->lockForUpdate()
                ->where('product_id', $item->product_id)
                ->where('warehouse_id', $supplyRequest->source_warehouse_id)
                ->first();
            
            if (!$sourceStock || $sourceStock->quantity < $item->quantity_requested) {
                throw new InsufficientStockException(...);
            }
            
            // ... reste de la logique
        }
        
        $supplyRequest->update([
            'status' => SupplyRequestStatus::Delivered,
            'delivered_at' => now(),
        ]);
        
        return back()->with('success', 'Livré.');
    });
}
```

---

## Vulnérabilité #2 : Isolation multi-tenant cassée dans CompanyPolicy

**Gravité : CRITIQUE**  
**Fichier** : `app/Policies/CompanyPolicy.php`

### Description
Toutes les méthodes de `CompanyPolicy` vérifient uniquement le rôle, pas l'appartenance à la company :

```php
public function view(User $user, Company $company): bool
{
    return $user->hasAnyRole([RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]);
}

public function update(User $user, Company $company): bool
{
    return $user->hasAnyRole([RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]);
}

public function delete(User $user, Company $company): bool
{
    return $user->hasAnyRole([RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]);
}
```

### Scénario d'attaque
Un admin de la Company A peut :
1. Accéder à `/admin/companies/{id_company_B}` → voit les détails de Company B
2. Modifier `/admin/companies/{id_company_B}/edit` → modifier le nom, email, etc.
3. Supprimer `/admin/companies/{id_company_B}` → supprimer la Company B

### Solution
```php
public function view(User $user, Company $company): bool
{
    if ($user->isSuperAdmin()) return true;
    return $user->isAdmin() && $user->company_id === $company->id;
}

public function update(User $user, Company $company): bool
{
    if ($user->isSuperAdmin()) return true;
    return $user->isAdmin() && $user->company_id === $company->id;
}

public function delete(User $user, Company $company): bool
{
    if ($user->isSuperAdmin()) return true;
    return $user->isAdmin() && $user->company_id === $company->id;
}
```

---

## Vulnérabilité #3 : Endpoint d'activation sans rate limiting

**Gravité : HAUTE**  
**Fichier** : `routes/web.php`, `ActivateAccountController.php`

### Description
Les routes d'activation de compte ne sont pas protégées par un rate limiter :

```php
Route::get('activate/{user}', [ActivateAccountController::class, 'show']);
Route::post('activate/{user}', [ActivateAccountController::class, 'store']);
```

L'URL signée expire après 24h, mais un attaquant ayant intercepté le lien peut faire autant de tentatives de mot de passe qu'il veut pendant cette fenêtre.

### Solution
```php
Route::post('activate/{user}', [ActivateAccountController::class, 'store'])
    ->middleware('throttle:5,1')  // 5 tentatives par minute
    ->name('account.activate.store');
```

---

## Vulnérabilité #4 : Exposition de données utilisateur sensibles via Inertia shared data

**Gravité : MOYENNE-HAUTE**  
**Fichier** : `app/Http/Middleware/HandleInertiaRequests.php`

### Description
```php
'auth' => [
    'user' => $request->user(), // ← LE MODÈLE ENTIER
    'roles' => $request->user()?->getRoleNames() ?? [],
    'permissions' => $request->user()?->getAllPermissions()->pluck('name')->toArray() ?? [],
],
```

Le modèle User **entier** est sérialisé et envoyé au frontend à chaque requête. Même si `$hidden` contient `password` et `two_factor_secret`, il y a des risques :
- Les relations lazy-loadées peuvent fuiter
- Le `remember_token` est dans `$hidden` mais toute donnée future ajoutée au modèle sera exposée par défaut
- L'email, company_id, et autres données sont visibles dans le JavaScript côté client

### Solution
```php
'auth' => [
    'user' => $request->user() ? [
        'id' => $request->user()->id,
        'name' => $request->user()->name,
        'email' => $request->user()->email,
        'email_verified_at' => $request->user()->email_verified_at,
    ] : null,
    'roles' => $request->user()?->getRoleNames() ?? [],
    'permissions' => $request->user()?->getAllPermissions()->pluck('name')->toArray() ?? [],
],
```

---

## Vulnérabilité #5 : Fichiers non supprimés lors de la mise à jour/suppression

**Gravité : MOYENNE**  
**Fichiers** : `CompanyController.php`, `ProductController.php`

### Description
Quand un logo de Company ou une image de Product est remplacé, l'ancien fichier n'est **jamais supprimé** du disque :

```php
// CompanyController::update()
if ($request->hasFile('logo_upload')) {
    $logo = $request->file('logo_upload')->store('logos', 'public');
    // L'ancien logo reste sur le disque indéfiniment
}
```

Quand une Company ou un Product est soft-deleted, les fichiers restent aussi.

### Impact
- Fuite de stockage (accumulation de fichiers orphelins)
- Les anciens logos/images restent accessibles publiquement via leur URL

### Solution
```php
if ($request->hasFile('logo_upload')) {
    // Supprimer l'ancien fichier
    $oldLogo = $company->getRawOriginal('logo');
    if ($oldLogo) {
        Storage::disk('public')->delete($oldLogo);
    }
    $logo = $request->file('logo_upload')->store('logos', 'public');
}
```

---

## Vulnérabilité #6 : Bug d'accessor logo sur Company

**Gravité : MOYENNE**  
**Fichier** : `CompanyController.php`, `Company.php`

### Description
Le modèle `Company` a un accessor `getLogoAttribute()` qui transforme le path en URL Storage. Dans `CompanyController::update()` :

```php
$logo = $company->logo; // Retourne "http://localhost/storage/logos/xxx.png"
                        // Au lieu de "logos/xxx.png"
```

Si aucun nouveau fichier n'est uploadé, `$logo` contient l'URL complète qui est ensuite sauvegardée en DB. Les appels suivants de `getLogoAttribute()` feront `Storage::url("http://localhost/storage/logos/xxx.png")` → URL cassée.

### Impact
Après la première mise à jour sans changement de logo, le logo est corrompu en DB.

**Note** : Ce bug est correctement évité dans `ProductController::update()` via `$product->getRawOriginal('image')`. Mais pas dans `CompanyController`.

---

## Vulnérabilité #7 : Endpoints logistiques sans restriction de rôle

**Gravité : MOYENNE**  
**Fichier** : `routes/logistics.php`

### Description
```php
Route::middleware(['auth', 'verified'])  // ← Pas de 'role:...'
    ->prefix('admin/logistics')
    ->group(function () {
        Route::resource('warehouses', WarehouseController::class);
        // ... 10+ resources
    });
```

Tout utilisateur authentifié et vérifié (y compris un simple caissier) peut accéder aux URLs logistiques. La protection repose uniquement sur les policies (`$this->authorize()` dans chaque méthode de contrôleur).

C'est une défense en profondeur insuffisante. Si un développeur oublie un `$this->authorize()` dans une nouvelle méthode, l'endpoint est ouvert à tous.

### Solution
Ajouter un middleware de rôle :
```php
Route::middleware(['auth', 'verified', 'role:super admin|admin|gestionnaire|logisticien|magasinier'])
```

Ou mieux, utiliser un middleware de permission :
```php
Route::middleware(['auth', 'verified', 'permission:read warehouse|read shop|...'])
```

---

## Vulnérabilité #8 : Pas de validation d'existence des FK dans les Data DTOs logistiques

**Gravité : MOYENNE**  
**Fichier** : `app/Data/Logistics/StockMovementData.php` et autres

### Description
Les Data DTOs logistiques valident que les IDs sont des UUIDs valides, mais ne vérifient pas que les entités existent en DB :

```php
#[Required, Uuid]
public string $product_id,      // UUID valide, mais le produit existe-t-il ?

#[Nullable, Uuid]
public ?string $source_warehouse_id,  // Même problème
```

Contrairement aux FormRequests de Product qui ont `Rule::exists('product_categories', 'id')`, les DTOs n'ont pas de `Rule::exists()`.

### Impact
Une requête avec un UUID valide mais inexistant passera la validation. Eloquent créera un `StockMovement` pointant vers un produit/entrepôt inexistant. Pas de FK constraint visible.

### Solution
Ajouter des règles `Exists` aux Data DTOs ou ajouter des FK constraints dans les migrations.

---

## Vulnérabilité #9 : `Gate::before()` contourne toutes les policies pour le super admin

**Gravité : BASSE (par design mais à documenter)**  
**Fichier** : `AppServiceProvider.php`

### Description
```php
Gate::before(function ($user, $ability) {
    if ($user->isSuperAdmin()) {
        return true;
    }
});
```

Le super admin bypasse **toutes** les policies, y compris des vérifications qui pourraient être importantes (ex: supprimer son propre compte). `UserPolicy::delete()` empêche de se supprimer soi-même, mais `Gate::before()` le permet quand même pour le super admin.

---

## Résumé sécurité

| # | Vulnérabilité | Gravité | OWASP | Status |
|---|--------------|---------|-------|--------|
| 1 | Race condition stock | CRITIQUE | A04:2021 | Non mitigée |
| 2 | Isolation tenant CompanyPolicy | CRITIQUE | A01:2021 | Non mitigée |
| 3 | Activation sans rate limit | HAUTE | A07:2021 | Non mitigée |
| 4 | Exposition données Inertia | MOYENNE-HAUTE | A01:2021 | Partiellement mitigée ($hidden) |
| 5 | Fichiers orphelins | MOYENNE | A05:2021 | Non mitigée |
| 6 | Bug accessor logo Company | MOYENNE | — | Bug actif |
| 7 | Routes logistiques ouvertes | MOYENNE | A01:2021 | Mitigée par policies |
| 8 | FK non validées dans DTOs | MOYENNE | A03:2021 | Non mitigée |
| 9 | Gate::before() super admin | BASSE | A01:2021 | Par design |

### Ce qui est bien fait
- CSRF protégé par Laravel automatiquement
- Mots de passe hashés via cast `hashed`
- Pas de `DB::raw()` ou requêtes SQL brutes → pas d'injection SQL
- Rate limiting sur login et 2FA
- URLs signées temporaires pour l'activation
- Permissions granulaires via Spatie
- Password strength enforced en production
