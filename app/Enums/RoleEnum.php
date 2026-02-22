<?php

namespace App\Enums;

enum RoleEnum: string
{
    case SuperAdmin = 'super admin';
    case Admin = 'admin';
    case Gestionnaire = 'gestionnaire';
    case Caissier = 'caissier';
    case Logisticien = 'logisticien';
    case Magasinier = 'magasinier';

    public static function all(): array
    {
        return array_map(fn (self $role) => $role->value, self::cases());
    }
}
