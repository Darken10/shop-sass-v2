<?php

namespace App\Data\Pos;

use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class OpenCashRegisterData extends Data
{
    public function __construct(
        #[Required, Numeric, Min(0)]
        public float $opening_amount,

        #[Required, Uuid]
        public string $shop_id,

        #[Nullable, StringType]
        public ?string $notes = null,
    ) {}
}
