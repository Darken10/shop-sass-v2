<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum ExpenseStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'En attente',
            self::Approved => 'Approuvée',
            self::Rejected => 'Rejetée',
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
