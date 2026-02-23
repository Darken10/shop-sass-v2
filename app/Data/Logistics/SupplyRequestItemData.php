<?php

namespace App\Data\Logistics;

use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SupplyRequestItemData extends Data
{
    public function __construct(
        #[Required, Uuid]
        public string $product_id,

        #[Required, IntegerType, Min(1)]
        public int $quantity_requested,
    ) {}
}
