<?php

namespace App\Data\Logistics;

use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class WarehouseStockData extends Data
{
    public function __construct(
        #[Required, IntegerType, Min(0)]
        public int $quantity,

        #[Nullable, IntegerType, Min(0)]
        public ?int $stock_alert,

        #[Required, Uuid]
        public string $product_id,

        #[Required, Uuid]
        public string $warehouse_id,
    ) {}
}
