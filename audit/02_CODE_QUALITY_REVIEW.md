# 02 — REVUE QUALITÉ DU CODE

## Problèmes détectés fichier par fichier

---

### `app/Concerns/BelongsToCompany.php`

**Gravité : CRITIQUE**

1. **Global scope fragile** : `auth()->user()` retourne `null` en CLI/queue. Le scope ne s'applique pas → fuite cross-tenant silencieuse.
2. **Boot creating** : assigne `company_id` automatiquement — peut masquer des bugs où le développeur oublie de passer un `company_id`.
3. **Pas de vérification que le user a bien un `company_id`** lors de la création — si un super admin sans company crée un produit, `company_id` sera `null`.

```php
// PROBLÈME
static::creating(function ($model) {
    $user = auth()->user();
    if ($user && $user->company_id && ! $model->company_id) {
        $model->company_id = $user->company_id;
    }
});

// SOLUTION : être explicite
// Supprimer l'auto-fill et toujours passer company_id explicitement.
// Valider au niveau Data/Request que company_id est toujours présent.
```

---

### `app/Models/Company/Company.php`

1. **`$casts` en propriété au lieu de méthode `casts()`** : incohérence avec les autres modèles qui utilisent la méthode.
2. **`getLogoAttribute()` accessor** : transforme l'URL en Storage URL. Cela signifie que `$company->logo` en DB retourne le chemin brut, mais le modèle retourne l'URL complète. **Problème** : dans `CompanyController::update()`, on fait `$company->logo` pour récupérer la valeur actuelle, mais on obtient l'URL complète au lieu du chemin. C'est un **bug subtil** — seul `getRawOriginal('logo')` fonctionne (comme fait pour Product). **Non fait pour Company.**

```php
// BUG dans CompanyController::update()
$logo = $company->logo; // Retourne Storage::url($value) au lieu du path brut !

// CORRECTION
$logo = $company->getRawOriginal('logo');
```

3. **Manque de relation `users()`** : pas de `hasMany(User::class)` — impossible de faire `$company->users`.

---

### `app/Models/User.php`

1. **`productCategories()` relation** : utilise `created_by` comme clé étrangère. C'est fonctionnel mais questionnable — un User n'a pas de catégories, il en crée. La relation devrait s'appeler `createdProductCategories()`.
2. **Pas de relation `company()`** typée avec return type** : manque `: BelongsTo`.
3. **`MustVerifyEmail` commenté** : l'interface est commentée alors que `email_verified_at` est castée et que `verified` middleware est utilisé. Cela signifie que la vérification d'email n'est pas vraiment enforced côté Laravel.

---

### `app/Models/Logistics/StockMovement.php`

1. **Modèle obèse** : 12 relations `BelongsTo` + 2 `HasMany`. Ce modèle est un fourre-tout qui connecte tout à tout. Signe d'un manque de bounded contexts.
2. **Pas de méthode métier** : aucune logique de calcul, aucun scope nommé, aucun helper. Modèle purement anémique.

---

### `app/Models/Logistics/SupplyRequestItem.php`

1. **Pas de `BelongsToCompany` trait** : contrairement à `SupplyRequest`. Si on requête les items directement, pas de filtrage par company. Incohérence de design.
2. **Pas de SoftDeletes** : si la SupplyRequest est soft-deleted, les items restent. Pas de cascade.

---

### `app/Models/Logistics/TransferItem.php`

1. **Même problème que SupplyRequestItem** : pas de `BelongsToCompany`, pas de `HasFactory`.
2. **SoftDeletes présent** mais pas sur `SupplyRequestItem` : incohérence entre les deux concepts parallèles.

---

## Code dupliqué

### Duplication #1 : Logique de stock (CRITIQUE)

Trois implémentations distinctes de la même logique :

**`SupplyRequestController::applyTransferStock()`** (lignes 130-155) :
```php
private function applyTransferStock(StockMovement $movement): void
{
    if ($movement->source_warehouse_id) {
        $sourceStock = WarehouseStock::withoutGlobalScopes()
            ->where('product_id', $movement->product_id)
            ->where('warehouse_id', $movement->source_warehouse_id)
            ->first();
        if ($sourceStock) {
            $sourceStock->decrement('quantity', min($movement->quantity, $sourceStock->quantity));
        }
    }
    // + destination_warehouse_id increment
}
```

**`TransferController::deliver()`** (inline, 50 lignes) : même logique + ShopStock.

**`StockMovementController::applyStockUpdate()`** + `incrementStock()` + `decrementStock()` : même logique, plus structurée.

**Impact** : Un bug corrigé dans un endroit ne l'est pas dans les deux autres.

### Duplication #2 : Requêtes dropdown dans les controllers

Pattern répété dans 8+ contrôleurs :
```php
Warehouse::query()->select(['id', 'name', 'code'])->orderBy('name')->get()
Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get()
```
Pas de méthode réutilisable, pas de scope, pas de cache.

### Duplication #3 : StoreProductRequest vs UpdateProductRequest

95% des règles de validation identiques. Seule différence : `Rule::unique()->ignore()`.

```php
// SOLUTION : utiliser une base commune
abstract class BaseProductRequest extends FormRequest
{
    protected function baseRules(): array { /* règles communes */ }
}

class StoreProductRequest extends BaseProductRequest
{
    public function rules(): array
    {
        return array_merge($this->baseRules(), [
            'code' => [..., Rule::unique('products', 'code')],
        ]);
    }
}
```

### Duplication #4 : Policies

Toutes les policies logistiques ont le même pattern :
```php
public function viewAny(User $user): bool
{
    return $user->hasPermissionTo(PermissionEnum::ReadXxx->value);
}
public function view(User $user, Model $model): bool
{
    return $user->hasPermissionTo(PermissionEnum::ReadXxx->value)
        && $user->company_id === $model->company_id;
}
// ... create, update, delete identiques
```
15 policies avec le même squelette. Un trait ou une policy abstraite éliminerait 80% du code.

### Duplication #5 : UUID boilerplate dans chaque modèle

Chaque modèle répète :
```php
use HasUuids;
protected $keyType = 'string';
public $incrementing = false;
```
Devrait être un trait ou un modèle de base.

---

## Violations SOLID

### Single Responsibility Principle (SRP) — 6 violations

| Fichier | Responsabilités mélangées |
|---------|--------------------------|
| `SupplyRequestController` | HTTP, validation, autorisation, logique livraison, gestion stock |
| `TransferController` | HTTP, validation, autorisation, logique transfert, gestion stock warehouse + shop |
| `StockMovementController` | HTTP, validation, logique stock, routage par type de mouvement |
| `CompanyController` | HTTP, upload fichier, construction payload |
| `ProductController` | HTTP, upload fichier, gestion tags |
| `UserController` | HTTP, validation, envoi notification |

### Open/Closed Principle (OCP) — 3 violations

1. `StockMovementController::applyStockUpdate()` : un `switch` implicite par type de mouvement. Ajouter un nouveau type = modifier la méthode.
2. `TransferController::deliver()` : `if/elseif` par type de transfert. Non extensible.
3. `RolePermissionSeeder` : permission assignment par `str_contains()`. Fragile et non extensible.

### Liskov Substitution Principle (LSP) — 1 violation

`SupplyRequestItem` n'a pas `BelongsToCompany` alors que `SupplyRequest` l'a. Un code qui traite une collection de modèles "company-scoped" ne peut pas inclure `SupplyRequestItem` uniformément.

### Interface Segregation Principle (ISP) — pas de violation notable

### Dependency Inversion Principle (DIP) — 2 violations

1. Les contrôleurs dépendent directement des modèles Eloquent concrets. Pas d'interface, pas d'injection de service.
2. `auth()->user()` appelé directement dans le trait `BelongsToCompany` au lieu d'être injecté.

---

## Code smells

### 1. Magic strings dans le seeder
```php
// RolePermissionSeeder.php
$gestionnairePerms = $permissions->filter(function ($perm) {
    return ! str_contains($perm->name, 'user');
});
```
Filtre les permissions par `str_contains()` sur le nom. Si une permission s'appelle "user preferences read", elle sera exclue par erreur. **Fragile.**

### 2. `auth()->id()` répété partout
```php
'created_by' => auth()->id(),
```
Présent dans 15+ méthodes de contrôleur. Devrait être centralisé (middleware, observer, ou trait).

### 3. Génération de référence non garantie unique
```php
'reference' => 'SR-'.strtoupper(Str::random(8)),
```
`Str::random(8)` = 36^8 possibilités. Avec beaucoup de données, collision possible. Pas de contrainte unique en DB (non visible dans les migrations examinées). **Bug potentiel en production à grande échelle.**

### 4. `authorize` retourne `true` dans les FormRequest
```php
class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // L'autorisation est dans le contrôleur
    }
}
```
L'autorisation est gérée dans le contrôleur avec `$this->authorize()`. Le `authorize()` du FormRequest est redondant et confusant. Devrait être consolidé.

### 5. Incohérence de nommage des Enums

| Enum | Convention |
|------|-----------|
| `CompanyStatusEnum` | Suffixe `Enum` |
| `CompanyTypeEnum` | Suffixe `Enum` |
| `ProductStatus` | Pas de suffixe |
| `ProductUnity` | Pas de suffixe |
| `ShopStatus` | Pas de suffixe |
| `WarehouseStatus` | Pas de suffixe |
| `RoleEnum` | Suffixe `Enum` |
| `PermissionEnum` | Suffixe `Enum` |

Pas de convention claire. Certains ont `Enum`, d'autres non.

### 6. Incohérence de casing dans les Enums

| Enum | Casing des cas |
|------|---------------|
| `CompanyTypeEnum` | `ALIMENTATION`, `BOUTIQUE` (SCREAMING_CASE) |
| `ProductStatus` | `ACTIVE`, `INACTIVE` (SCREAMING_CASE) |
| `WarehouseStatus` | `Active`, `Inactive` (TitleCase) |
| `TransferStatus` | `Pending`, `Approved` (TitleCase) |

Mélange de conventions. Les guidelines Laravel recommandent TitleCase.

---

## Code mort / inutilisé

1. **`PermissionEnum` contient des permissions non utilisées** :
   - `CreateOrder`, `ReadOrder`, `UpdateOrder`, `DeleteOrder`, `ApproveOrder`
   - `ManageCash`, `ViewTransactions`
   - `ManageInventory`, `ViewInventory`
   - `ManageDelivery`, `ViewDelivery`
   - `ViewReports`, `ViewSales`
   
   Aucun contrôleur, aucune policy n'utilise ces permissions. Elles sont créées en DB mais jamais vérifiées. **Bruit inutile.**

2. **`User::productCategories()`** : relation définie mais jamais appelée dans aucun contrôleur ou test.

3. **`something()` dans `tests/Pest.php`** : fonction vide inutile.

---

## Return types manquants

| Fichier | Méthode | Return type manquant |
|---------|---------|---------------------|
| `User.php` | `company()` | `: BelongsTo` |
| `User.php` | `productCategories()` | `: HasMany` |
| `CompanyFactory.php` | `active()` | `: static` |
| `CompanyFactory.php` | `inactive()` | `: static` |
