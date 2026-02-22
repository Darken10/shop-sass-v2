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

        // Caissier - gestion de caisse et commandes
        $caissier = Role::firstOrCreate(['name' => RoleEnum::Caissier->value]);
        $caissierPerms = $permissions->filter(function ($perm) {
            return str_contains($perm->name, 'cash') ||
                   str_contains($perm->name, 'transaction') ||
                   str_contains($perm->name, 'order');
        });
        $caissier->syncPermissions($caissierPerms);

        // Logisticien - gestion livraison et inventaire
        $logisticien = Role::firstOrCreate(['name' => RoleEnum::Logisticien->value]);
        $logisticienPerms = $permissions->filter(function ($perm) {
            return str_contains($perm->name, 'delivery') ||
                   str_contains($perm->name, 'inventory') ||
                   str_contains($perm->name, 'order');
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
