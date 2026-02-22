<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum CompanyTypeEnum: string
{
    case ALIMENTATION = 'alimentation';
    case BOUTIQUE = 'boutique';
    case RESTAURANT = 'restaurant';
    case PHARMACY = 'pharmacy';
    case SERVICE = 'service';

    public static function all(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
