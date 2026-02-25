# 05 — DETTE TECHNIQUE

## Liste priorisée

---

### DT-01 : Logique métier stock dans les contrôleurs (pas de Service Layer)

**Gravité : CRITIQUE**  
**Impact long terme** : Impossible de réutiliser la logique stock dans des commandes Artisan, jobs en queue, API externe, ou tests unitaires. Chaque nouveau canal d'accès nécessitera de dupliquer le code.

**Fichiers concernés** :
- `SupplyRequestController::deliver()` + `applyTransferStock()`
- `TransferController::deliver()` (logique inline dans transaction)
- `StockMovementController::store()` + `applyStockUpdate()` + `incrementStock()` + `decrementStock()`

**Effort de correction** : 3-5 jours  
**Risque si non corrigé** : Corruption de données, bugs de régression, impossibilité de faire évoluer le système.

---

### DT-02 : Race conditions non gérées sur les opérations de stock

**Gravité : CRITIQUE**  
**Impact long terme** : Sous charge (même modérée), les données de stock deviennent incohérentes. Avec 2+ utilisateurs manipulant les mêmes entrepôts/produits, les montants de stock dérivent.

**Fichiers concernés** :
- `SupplyRequestController::deliver()` — **aucune transaction**
- `TransferController::deliver()` — transaction présente mais **pas de `lockForUpdate()`**
- `StockMovementController::store()` — **aucune transaction ni lock**

**Effort de correction** : 1-2 jours  
**Risque si non corrigé** : Perte financière directe, inventaire faux, impossibilité de réconcilier.

---

### DT-03 : CompanyPolicy non scopée — faille d'isolation tenant

**Gravité : CRITIQUE**  
**Impact long terme** : Un admin peut accéder et modifier les données d'autres entreprises. En SaaS, c'est rédhibitoire.

**Fichier** : `app/Policies/CompanyPolicy.php`

**Effort de correction** : 30 minutes  
**Risque si non corrigé** : Fuite de données client, violation RGPD, perte de confiance.

---

### DT-04 : `BelongsToCompany` global scope fragile

**Gravité : HAUTE**  
**Impact long terme** : Le scope ne s'applique pas en contexte CLI/queue. `withoutGlobalScopes()` dispersé en 12+ endroits masque le problème. Un oubli = fuite cross-tenant silencieuse.

**Fichier** : `app/Concerns/BelongsToCompany.php`

**Effort de correction** : 2-3 jours (refactoring du trait + contexte tenant)  
**Risque si non corrigé** : Bugs silencieux, fuites de données intermittentes.

---

### DT-05 : Bug accessor logo dans CompanyController

**Gravité : HAUTE**  
**Impact long terme** : Le logo de chaque Company est corrompu en DB après la première mise à jour sans changement de logo.

**Fichier** : `app/Http/Controllers/Admin/CompanyController.php` ligne `$logo = $company->logo;`

**Effort de correction** : 5 minutes  
**Risque si non corrigé** : Logos cassés pour toutes les companies mises à jour.

---

### DT-06 : Duplication logique stock (3 implémentations)

**Gravité : HAUTE**  
**Impact long terme** : Un fix dans une implémentation ne se propage pas aux deux autres. Source de bugs de régression.

**Fichiers** :
- `SupplyRequestController::applyTransferStock()`
- `TransferController::deliver()` (inline)
- `StockMovementController::incrementStock()` + `decrementStock()`

**Effort de correction** : 1-2 jours (extraire dans un StockService)  
**Risque si non corrigé** : Divergence des comportements, bugs incohérents.

---

### DT-07 : Pas de Domain Events

**Gravité : MOYENNE-HAUTE**  
**Impact long terme** : Impossible d'ajouter des side-effects (notifications, audit log, analytics) sans modifier les contrôleurs. Violation de l'Open/Closed Principle.

**Effort de correction** : 2-3 jours  
**Risque si non corrigé** : Chaque nouvelle feature transverse nécessite de modifier N contrôleurs.

---

### DT-08 : Permissions mortes dans PermissionEnum

**Gravité : MOYENNE**  
**Impact long terme** : 14 permissions créées en DB mais jamais utilisées (Orders, Cash, Inventory, Delivery, Reports). Confusion pour les admins qui voient des permissions sans effet.

**Fichier** : `app/Enums/PermissionEnum.php`

**Effort de correction** : 30 minutes + migration pour nettoyer  
**Risque si non corrigé** : Confusion, faux sentiment de sécurité.

---

### DT-09 : Fichiers orphelins non nettoyés

**Gravité : MOYENNE**  
**Impact long terme** : Accumulation de fichiers sur le disque de stockage. Avec 1000 mises à jour de logo/images, des GB de fichiers inutiles.

**Fichiers** : `CompanyController.php`, `ProductController.php`

**Effort de correction** : 1 heure  
**Risque si non corrigé** : Coût de stockage croissant, fichiers sensibles accessibles.

---

### DT-10 : Incohérence validation (FormRequest vs Data DTO)

**Gravité : MOYENNE**  
**Impact long terme** : Deux conventions dans la même codebase. Onboarding des développeurs ralenti. Choix arbitraire pour les nouvelles features.

**Effort de correction** : 2-3 jours (migrer les FormRequests vers Data DTOs ou inversement)  
**Risque si non corrigé** : Fragmentation du code, maintenance plus coûteuse.

---

### DT-11 : Pas d'index composites dans la DB

**Gravité : MOYENNE-HAUTE**  
**Impact long terme** : Performance dégradée avec la croissance des données. `warehouse_stocks` et `shop_stocks` sont requêtées par paire (product_id, warehouse_id) sans index.

**Effort de correction** : 1 heure  
**Risque si non corrigé** : Requêtes lentes, timeouts en production.

---

### DT-12 : MustVerifyEmail commenté

**Gravité : MOYENNE**  
**Impact long terme** : Le middleware `verified` est utilisé sur les routes, mais le modèle User n'implémente pas `MustVerifyEmail`. La vérification d'email n'est pas enforced côté Laravel.

**Fichier** : `app/Models/User.php`

**Effort de correction** : 5 minutes  
**Risque si non corrigé** : Les emails non vérifiés peuvent potentiellement passer.

---

### DT-13 : Pas de tests pour les edge cases stock

**Gravité : MOYENNE**  
**Impact long terme** : Les scénarios de stock négatif, livraison double, transfert vers entrepôt inexistant ne sont pas testés.

**Effort de correction** : 1-2 jours  
**Risque si non corrigé** : Bugs découverts en production.

---

### DT-14 : Références non garanties uniques

**Gravité : MOYENNE**  
**Impact long terme** : `Str::random(8)` pour les références de mouvements/transferts. Collision statistiquement possible avec un volume élevé.

**Effort de correction** : 1 heure (ajouter contrainte unique + retry logic)  
**Risque si non corrigé** : Références dupliquées, confusion dans les rapports.

---

### DT-15 : UUID boilerplate dupliqué dans chaque modèle

**Gravité : BASSE**  
**Impact long terme** : 3 lignes identiques dans 18 modèles = 54 lignes de code redondantes.

```php
use HasUuids;
protected $keyType = 'string';
public $incrementing = false;
```

**Effort de correction** : 1 heure (créer un trait ou modèle de base)  
**Risque si non corrigé** : Un modèle oublie une des 3 lignes → bug silencieux.

---

## Matrice dette technique

| ID | Gravité | Effort | Impact business | Priorité |
|----|---------|--------|-----------------|----------|
| DT-01 | CRITIQUE | 3-5j | Corruption données | P0 |
| DT-02 | CRITIQUE | 1-2j | Stock incohérent | P0 |
| DT-03 | CRITIQUE | 30min | Fuite données | P0 |
| DT-04 | HAUTE | 2-3j | Fuite intermittente | P0 |
| DT-05 | HAUTE | 5min | Logos cassés | P0 |
| DT-06 | HAUTE | 1-2j | Bugs régression | P1 |
| DT-07 | MOY-HAUTE | 2-3j | Rigidité code | P1 |
| DT-08 | MOYENNE | 30min | Confusion | P2 |
| DT-09 | MOYENNE | 1h | Coût stockage | P1 |
| DT-10 | MOYENNE | 2-3j | Onboarding lent | P2 |
| DT-11 | MOY-HAUTE | 1h | Perf dégradée | P1 |
| DT-12 | MOYENNE | 5min | Sécurité email | P1 |
| DT-13 | MOYENNE | 1-2j | Bugs production | P1 |
| DT-14 | MOYENNE | 1h | Doublons | P2 |
| DT-15 | BASSE | 1h | Maintenabilité | P3 |
