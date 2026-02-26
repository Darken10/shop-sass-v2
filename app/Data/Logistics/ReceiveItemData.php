<?php

namespace App\Data\Logistics;

use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class ReceiveItemData extends Data
{
    public function __construct(
        #[Required, Uuid]
        public string $item_id,

        #[Required, IntegerType, Min(0)]
        public int $quantity_received,

        #[Nullable, StringType]
        public ?string $discrepancy_note = null,
    ) {}
}
