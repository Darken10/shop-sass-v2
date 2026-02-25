# 00 — RÉSUMÉ GLOBAL DE L'AUDIT

**Projet** : Application SaaS de gestion de commerce et de stock multi-entreprise  
**Stack** : Laravel 12 + Inertia v2 + React 19 + Tailwind v4 + Spatie Permission  
**Date d'audit** : 24 février 2026  
**Auditeur** : Audit automatisé — Analyse exhaustive du codebase

---

## Scores

| Critère            | Score | Commentaire                                                              |
|--------------------|-------|--------------------------------------------------------------------------|
| **Qualité code**   | 6/10  | Structuré mais logique métier dans les contrôleurs, duplication massive  |
| **Sécurité**       | 5/10  | CSRF OK, mais race conditions stock, endpoints activation non protégés   |
| **Architecture**   | 5/10  | MVC basique sans couche service, fat controllers, couplage fort         |
| **Maintenabilité** | 6/10  | Tests présents mais architecture peu extensible                          |
| **Performance**    | 5/10  | Pas de cache, pas d'index explicites, opérations stock non atomiques     |

**Score global : 5.4/10**

---

## Niveau de risque global : **ÉLEVÉ**

L'application est fonctionnelle pour un MVP mais présente des risques critiques pour un passage en production à grande échelle :
- **Race conditions** sur les opérations de stock (livraisons, transferts)
- **Logique métier critique** dans les contrôleurs (non testable unitairement en isolation)
- **Aucune transaction** dans `SupplyRequestController::deliver()` — corruption de données possible
- **Fichiers non nettoyés** lors de la mise à jour/suppression (fuite de stockage)
- **Global scope** `BelongsToCompany` fragile — un utilisateur sans `company_id` casse tout

---

## Priorités critiques (P0)

1. **Race conditions stock** : `SupplyRequestController::deliver()` n'utilise pas de transaction DB. Si deux requêtes simultanées livrent la même demande, le stock sera déduit/crédité deux fois. **Impact** : données financières corrompues.

2. **Pas de vérification du stock disponible** : `applyTransferStock()` utilise `min($movement->quantity, $sourceStock->quantity)` mais ne bloque pas la livraison si le stock est insuffisant. **Impact** : stock négatif implicite, incohérence comptable.

3. **`ActivateAccountController` sans rate limiting** : un attaquant peut bruteforcer les mots de passe via les URLs signées (expiration 24h). **Impact** : compte compromis.

4. **`BelongsToCompany` global scope** : dépend de `auth()->user()` qui est `null` en contexte CLI/queue/seeder — contourné par `withoutGlobalScopes()` dans 12 endroits. **Impact** : fragilité massive, bugs silencieux.

5. **`CompanyPolicy`** : un admin peut voir/modifier/supprimer TOUTES les entreprises, pas seulement la sienne. **Impact** : fuite de données cross-tenant.

---

## Résumé des trouvailles

| Catégorie               | Nombre de problèmes |
|-------------------------|---------------------|
| Sécurité critique       | 7                   |
| Race conditions         | 4                   |
| Violations SOLID        | 12                  |
| Code dupliqué           | 8                   |
| Anti-patterns           | 6                   |
| Risques performance     | 9                   |
| Code mort/inutile       | 3                   |
| Tests manquants         | 5                   |
| Incohérences nommage    | 6                   |
| Dette technique         | 15                  |

---

## Points positifs

- Utilisation de UUIDs comme clés primaires (prêt pour le distribué)
- Permissions granulaires via Spatie + Enums PHP 8.1
- SoftDeletes sur les entités critiques
- Factories et seeders bien structurés
- Couverture de tests feature correcte pour un MVP
- Utilisation de Spatie Data pour la validation des DTOs
- `Gate::before()` pour le super admin — pattern standard
- `CarbonImmutable` par défaut — bonne pratique
- Mot de passe fort en production via `Password::defaults()`
- `DB::prohibitDestructiveCommands()` en production
