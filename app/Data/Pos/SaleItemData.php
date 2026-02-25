<?php

namespace App\Data\Pos;

use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SaleItemData extends Data
{
    public function __construct(
        #[Required, Uuid]
        public string $product_id,

        #[Required, Numeric, Min(1)]
        public int $quantity,

        #[Nullable, Uuid]
        public ?string $promotion_id = null,
    ) {}
}
