<?php

namespace App\Data\Pos;

use App\Enums\PaymentMethod;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class PaymentData extends Data
{
    public function __construct(
        #[Required, Enum(PaymentMethod::class)]
        public PaymentMethod $method,

        #[Required, Numeric, Min(0)]
        public float $amount,

        #[Nullable, StringType]
        public ?string $reference = null,

        #[Nullable, StringType]
        public ?string $notes = null,
    ) {}
}
