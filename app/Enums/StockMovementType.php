<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum StockMovementType: string
{
    case PurchaseEntry = 'purchase_entry';
    case SupplierReturn = 'supplier_return';
    case StoreTransfer = 'store_transfer';
    case Loss = 'loss';
    case InternalTransfer = 'internal_transfer';
    case Adjustment = 'adjustment';

    public function label(): string
    {
        return match ($this) {
            self::PurchaseEntry => 'Achat fournisseur',
            self::SupplierReturn => 'Retour fournisseur',
            self::StoreTransfer => 'Transfert vers magasin',
            self::Loss => 'Perte / casse',
            self::InternalTransfer => 'Transfert interne',
            self::Adjustment => 'Ajustement',
        };
    }

    public function isEntry(): bool
    {
        return in_array($this, [self::PurchaseEntry, self::SupplierReturn]);
    }

    public function isExit(): bool
    {
        return in_array($this, [self::StoreTransfer, self::Loss]);
    }

    public static function all(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
