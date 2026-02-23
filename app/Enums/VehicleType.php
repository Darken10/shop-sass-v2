<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum VehicleType: string
{
    case Truck = 'truck';
    case Tricycle = 'tricycle';
    case Van = 'van';
    case Pickup = 'pickup';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Truck => 'Camion',
            self::Tricycle => 'Tricycle',
            self::Van => 'Fourgon',
            self::Pickup => 'Pick-up',
            self::Other => 'Autre',
        };
    }

    public static function all(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
