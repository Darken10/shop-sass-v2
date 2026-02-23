<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum StockMovementType: string
{
    case PurchaseEntry = 'purchase_entry';
    case SupplierReturn = 'supplier_return';
    case WarehouseToShop = 'warehouse_to_shop';
    case WarehouseToWarehouse = 'warehouse_to_warehouse';
    case ShopToCustomer = 'shop_to_customer';
    case Loss = 'loss';
    case Adjustment = 'adjustment';

    public function label(): string
    {
        return match ($this) {
            self::PurchaseEntry => 'Achat fournisseur → Entrepôt',
            self::SupplierReturn => 'Retour fournisseur',
            self::WarehouseToShop => 'Transfert Entrepôt → Magasin',
            self::WarehouseToWarehouse => 'Transfert Entrepôt → Entrepôt',
            self::ShopToCustomer => 'Vente Magasin → Client',
            self::Loss => 'Perte / Casse',
            self::Adjustment => 'Ajustement',
        };
    }

    public function isEntry(): bool
    {
        return in_array($this, [self::PurchaseEntry, self::SupplierReturn]);
    }

    public function isExit(): bool
    {
        return in_array($this, [self::WarehouseToShop, self::ShopToCustomer, self::Loss]);
    }

    public function isTransfer(): bool
    {
        return in_array($this, [self::WarehouseToShop, self::WarehouseToWarehouse]);
    }

    public static function all(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
