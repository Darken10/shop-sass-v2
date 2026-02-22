<?php

namespace Database\Seeders;

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer toutes les permissions
        foreach (PermissionEnum::cases() as $permission) {
            Permission::firstOrCreate(['name' => $permission->value]);
        }

        // Créer les rôles et assigner les permissions
        $permissions = Permission::all();

        // Super Admin - accès complet
        $superAdmin = Role::firstOrCreate(['name' => RoleEnum::SuperAdmin->value]);
        $superAdmin->syncPermissions($permissions);

        // Admin - accès quasi complet
        $admin = Role::firstOrCreate(['name' => RoleEnum::Admin->value]);
        $admin->syncPermissions($permissions);

        // Gestionnaire - gestion complète sauf utilisateurs
        $gestionnaire = Role::firstOrCreate(['name' => RoleEnum::Gestionnaire->value]);
        $gestionnairePerms = $permissions->filter(function ($perm) {
            return ! str_contains($perm->name, 'user');
        });
        $gestionnaire->syncPermissions($gestionnairePerms);

        // Caissier - gestion de caisse et commandes (PAS de création produits/catégories/tags)
        $caissier = Role::firstOrCreate(['name' => RoleEnum::Caissier->value]);
        $caissierPerms = $permissions->filter(function ($perm) {
            return str_contains($perm->name, 'cash') ||
                   str_contains($perm->name, 'transaction') ||
                   str_contains($perm->name, 'order') ||
                   $perm->name === 'read product' ||
                   $perm->name === 'read product category' ||
                   $perm->name === 'read product tag';
        });
        $caissier->syncPermissions($caissierPerms);

        // Logisticien - gestion livraison, inventaire, produits, catégories, tags
        $logisticien = Role::firstOrCreate(['name' => RoleEnum::Logisticien->value]);
        $logisticienPerms = $permissions->filter(function ($perm) {
            return str_contains($perm->name, 'delivery') ||
                   str_contains($perm->name, 'inventory') ||
                   str_contains($perm->name, 'order') ||
                   str_contains($perm->name, 'product');
        });
        $logisticien->syncPermissions($logisticienPerms);

        // Magasinier - gestion inventaire
        $magasinier = Role::firstOrCreate(['name' => RoleEnum::Magasinier->value]);
        $magasinierPerms = $permissions->filter(function ($perm) {
            return str_contains($perm->name, 'inventory') ||
                   str_contains($perm->name, 'product');
        });
        $magasinier->syncPermissions($magasinierPerms);
    }
}
