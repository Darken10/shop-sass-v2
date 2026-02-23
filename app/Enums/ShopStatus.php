<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum ShopStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case UnderMaintenance = 'under_maintenance';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Actif',
            self::Inactive => 'Inactif',
            self::UnderMaintenance => 'En maintenance',
        };
    }

    public static function all(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
