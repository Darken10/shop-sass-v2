<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum SaleStatus: string
{
    case Completed = 'completed';
    case PartiallyPaid = 'partially_paid';
    case Unpaid = 'unpaid';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Completed => 'Payée',
            self::PartiallyPaid => 'Partiellement payée',
            self::Unpaid => 'Non payée',
            self::Cancelled => 'Annulée',
        };
    }

    public static function all(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
