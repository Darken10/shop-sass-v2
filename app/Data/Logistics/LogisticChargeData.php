<?php

namespace App\Data\Logistics;

use App\Enums\LogisticChargeType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class LogisticChargeData extends Data
{
    public function __construct(
        #[Required, StringType, Max(255)]
        public string $label,

        #[Required, Enum(LogisticChargeType::class)]
        public LogisticChargeType $type,

        #[Required, Numeric]
        public float $amount,

        #[Nullable, StringType]
        public ?string $notes,

        #[Nullable, Uuid]
        public ?string $stock_movement_id,

        #[Nullable, Uuid]
        public ?string $supply_request_id,
    ) {}
}
