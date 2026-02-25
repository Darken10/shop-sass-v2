<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum SupplyType: string
{
    case SupplierToWarehouse = 'supplier_to_warehouse';
    case WarehouseToWarehouse = 'warehouse_to_warehouse';

    public function label(): string
    {
        return match ($this) {
            self::SupplierToWarehouse => 'Fournisseur → Entrepôt',
            self::WarehouseToWarehouse => 'Entrepôt → Entrepôt',
        };
    }

    public static function all(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
