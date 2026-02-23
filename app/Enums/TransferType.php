<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum TransferType: string
{
    case WarehouseToShop = 'warehouse_to_shop';
    case WarehouseToWarehouse = 'warehouse_to_warehouse';

    public function label(): string
    {
        return match ($this) {
            self::WarehouseToShop => 'Entrepôt → Magasin',
            self::WarehouseToWarehouse => 'Entrepôt → Entrepôt',
        };
    }

    public static function all(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
