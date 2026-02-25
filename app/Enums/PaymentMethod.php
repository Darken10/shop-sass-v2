<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum PaymentMethod: string
{
    case Cash = 'cash';
    case MobileMoney = 'mobile_money';
    case BankCard = 'bank_card';
    case BankTransfer = 'bank_transfer';
    case CustomerCredit = 'customer_credit';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Espèces',
            self::MobileMoney => 'Mobile Money',
            self::BankCard => 'Carte bancaire',
            self::BankTransfer => 'Virement',
            self::CustomerCredit => 'Crédit client',
        };
    }

    public static function all(): array
    {
        return array_map(fn (self $method) => $method->value, self::cases());
    }
}
