# 01 — REVUE D'ARCHITECTURE

## Pattern identifié

**MVC classique Laravel** avec tentative de structuration en sous-domaines (Product, Logistics, Company).

L'architecture n'est ni DDD, ni Clean Architecture, ni Hexagonale. C'est du Laravel MVC standard avec :
- Contrôleurs = orchestrateurs + logique métier + persistance
- Modèles = Eloquent (anémiques, presque aucun comportement métier)
- Pas de couche Service
- Pas de couche Repository
- Pas de concepts Domain Events, Value Objects, ou Aggregates

---

## Diagramme logique (textuel)

```
┌─────────────────────────────────────────────────────────────┐
│                      ROUTES                                  │
│  web.php → admin.php → logistics.php → settings.php         │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE                                  │
│  auth, verified, role:super admin|admin                       │
│  HandleInertiaRequests (share user + roles + permissions)     │
│  HandleAppearance                                             │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                   CONTROLLERS (Fat)                            │
│  Admin/*Controller      →  Logique métier DEDANS              │
│  Logistics/*Controller  →  Logique stock DEDANS               │
│  Settings/*Controller   →  CRUD basique                       │
└──────┬───────────┬───────────┬───────────────────────────────┘
       │           │           │
       ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│ Policies │ │ Data DTOs│ │ FormRequests │
│ (authz)  │ │ (valid.) │ │ (valid.)     │
└──────────┘ └──────────┘ └──────────────┘
       │           │           │
       ▼           ▼           ▼
┌──────────────────────────────────────────────────────────────┐
│                   ELOQUENT MODELS                              │
│  User, Company, Product, Warehouse, Shop, Transfer, etc.      │
│  + BelongsToCompany trait (global scope)                      │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite/MySQL)                      │
│  UUIDs, SoftDeletes, timestamps                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Multi-tenancy : approche et faiblesses

### Approche actuelle
Le multi-tenancy est implémenté via :
1. `BelongsToCompany` trait avec global scope filtrant par `company_id`
2. Vérification `$user->company_id === $model->company_id` dans les policies

### Faiblesses critiques

**1. Global scope dépendant de `auth()->user()`**
```php
// BelongsToCompany.php
static::addGlobalScope('company', function (Builder $builder) {
    $user = auth()->user();
    if ($user && $user->company_id) {
        $builder->where(... 'company_id', $user->company_id);
    }
});
```
**Problème** : En contexte CLI (artisan), queue worker, ou seeder, `auth()->user()` est `null`. Le scope ne s'applique pas → toutes les données de toutes les entreprises sont visibles. C'est pourquoi le code utilise `withoutGlobalScopes()` dans 12+ endroits (seeders, controllers). Si un développeur oublie de remettre le scope, il y a fuite cross-tenant.

**2. SuperAdmin sans company_id**
Un super admin n'a potentiellement pas de `company_id`. Le global scope ne filtre donc rien pour lui. C'est voulu mais non documenté, et c'est une bombe si le super admin crée des ressources sans `company_id` assigné.

**3. CompanyPolicy ne scope pas par company**
```php
public function view(User $user, Company $company): bool
{
    return $user->hasAnyRole([RoleEnum::SuperAdmin->value, RoleEnum::Admin->value]);
}
```
Un admin de la Company A peut voir/modifier/supprimer la Company B. **Faille d'isolation majeure.**

---

## Points faibles architecturaux

### 1. Fat Controllers — Violation du SRP
Les contrôleurs contiennent :
- Validation (via Data DTOs — OK)
- Autorisation (via policies — OK)
- **Logique métier** (NON OK)
- **Persistance directe** (NON OK)
- **Mise à jour stock** (NON OK)

Exemples concrets :
- `SupplyRequestController::deliver()` : 40 lignes de logique de livraison, création de mouvements, mise à jour de stock
- `TransferController::deliver()` : 50+ lignes dans une transaction avec logique complexe de routage stock
- `StockMovementController::applyStockUpdate()` : logique de routage stock par type de mouvement

Ces logiques devraient être dans des services dédiés (`StockService`, `TransferService`, `SupplyService`).

### 2. Duplication de logique stock
`applyTransferStock()` existe dans **deux contrôleurs** différents avec des implémentations quasi-identiques :
- `SupplyRequestController::applyTransferStock()`
- `TransferController::deliver()` (inline)
- `StockMovementController::applyStockUpdate()` (variante)

Trois implémentations de la même chose. Si une est corrigée, les autres restent cassées.

### 3. Pas de couche Service
Aucun `app/Services/` n'existe. Toute la logique est dans les contrôleurs. Conséquences :
- **Impossible de réutiliser** : si une commande Artisan doit livrer un transfert, il faut dupliquer le code du contrôleur
- **Impossible de tester unitairement** : les tests feature passent par HTTP, ce qui est lent et couple au routing
- **Impossible d'écouter des events** : pas de domain events pour déclencher des actions transverses (notifications, logs d'audit, etc.)

### 4. Pas de Domain Events
Aucun `app/Events/` n'existe. Des événements métier critiques comme :
- `StockTransferred`
- `SupplyRequestDelivered`
- `TransferApproved`
- `UserActivated`

...ne déclenchent aucun event. Impossible d'ajouter des listeners sans modifier les contrôleurs (violation Open/Closed Principle).

### 5. Pas de couche Repository
Les contrôleurs font directement `Model::query()->...`. Pas de problème pour du CRUD simple, mais pour la logique stock, c'est insuffisant :
- Pas de `lockForUpdate()` → race conditions
- Pas de méthodes métier nommées → le code lit comme du SQL plutôt que du métier

### 6. Validation incohérente
Deux approches de validation coexistent sans raison claire :
- **Spatie Data DTOs** : `WarehouseData`, `TransferData`, etc. (validation via attributs)
- **FormRequests** : `StoreProductRequest`, `UpdateProductRequest` (validation classique)

Le choix entre les deux semble arbitraire. Les contrôleurs de produits utilisent des FormRequests, tandis que tout le module logistique utilise des Data DTOs. Pas de cohérence.

### 7. Organisation des routes fragmentée
Les routes sont réparties dans 4 fichiers (`web.php`, `admin.php`, `logistics.php`, `settings.php`), mais :
- `admin.php` a deux groupes de middleware différents (un avec `role:super admin|admin`, un sans restriction de rôle)
- `logistics.php` n'a **aucune restriction de rôle** — tout utilisateur authentifié peut accéder aux routes logistiques (la protection repose uniquement sur les policies)

### 8. Aucune API versionnée
Pas de `routes/api.php`. Tout passe par Inertia. Si demain il faut une app mobile ou une intégration tierce, il faut tout refaire.

---

## Scalabilité

### Ce qui ne scale PAS :
1. **SQLite par défaut** dans `.env.example` — ne supporte pas le concurrentiel
2. **Sessions en DB** — chaque requête = une requête SQL supplémentaire
3. **Cache en DB** — chaque appel `cache()` = une requête SQL
4. **Queue en DB** — 100k jobs = table `jobs` ingérable
5. **Pas de cache applicatif** — les dropdowns (warehouses, products, etc.) sont requêtées à chaque affichage de formulaire
6. **Pas d'index composites** visibles dans les migrations
7. **Opérations stock sans `SELECT FOR UPDATE`** — données corrompues sous charge

### Ce qui scale :
1. UUIDs — prêt pour le sharding éventuel
2. Architecture Inertia/React — le frontend est rendu côté client
3. Multi-tenant par company_id — concept correct même si l'implémentation est fragile

---

## Recommandations structurelles

| Priorité | Recommandation                                              |
|----------|-------------------------------------------------------------|
| P0       | Extraire la logique stock dans un `StockService`            |
| P0       | Ajouter des DB transactions + `lockForUpdate()` partout     |
| P0       | Fixer `CompanyPolicy` pour scoper par company               |
| P1       | Créer une couche `app/Services/` pour toute logique métier  |
| P1       | Introduire des Domain Events pour les actions critiques     |
| P1       | Uniformiser la validation (Data DTOs partout OU FormRequests partout)|
| P2       | Migrer vers MySQL/PostgreSQL pour la production             |
| P2       | Migrer sessions/cache/queue vers Redis                      |
| P2       | Ajouter une couche API si des clients mobiles sont prévus    |
| P3       | Envisager un package multi-tenant dédié (ex: `stancl/tenancy`)|
