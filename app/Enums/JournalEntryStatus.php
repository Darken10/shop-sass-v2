<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum JournalEntryStatus: string
{
    case Draft = 'draft';
    case Posted = 'posted';
    case Voided = 'voided';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Posted => 'Validée',
            self::Voided => 'Annulée',
        };
    }

    /**
     * @return array<string>
     */
    public static function all(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
