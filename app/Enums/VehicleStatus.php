<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum VehicleStatus: string
{
    case Active = 'active';
    case InMaintenance = 'in_maintenance';
    case OutOfService = 'out_of_service';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Actif',
            self::InMaintenance => 'En maintenance',
            self::OutOfService => 'Hors service',
        };
    }

    public static function all(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
