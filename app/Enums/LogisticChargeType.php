<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum LogisticChargeType: string
{
    case Fuel = 'fuel';
    case Handling = 'handling';
    case Loading = 'loading';
    case Unloading = 'unloading';
    case Toll = 'toll';
    case Packaging = 'packaging';
    case Insurance = 'insurance';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Fuel => 'Carburant',
            self::Handling => 'Manutention',
            self::Loading => 'Chargement',
            self::Unloading => 'Déchargement',
            self::Toll => 'Péage',
            self::Packaging => 'Emballage',
            self::Insurance => 'Assurance',
            self::Other => 'Autre',
        };
    }

    public static function all(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
