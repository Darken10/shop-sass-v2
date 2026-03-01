<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum AccountType: string
{
    case Asset = 'asset';
    case Liability = 'liability';
    case Equity = 'equity';
    case Revenue = 'revenue';
    case Expense = 'expense';

    public function label(): string
    {
        return match ($this) {
            self::Asset => 'Actif',
            self::Liability => 'Passif',
            self::Equity => 'Capitaux propres',
            self::Revenue => 'Produit',
            self::Expense => 'Charge',
        };
    }

    /**
     * @return array<string>
     */
    public static function all(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
