<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum CompanyStatusEnum: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';

    public static function all(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
