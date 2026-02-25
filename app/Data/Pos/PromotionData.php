<?php

namespace App\Data\Pos;

use App\Enums\PromotionType;
use Spatie\LaravelData\Attributes\Validation\AfterOrEqual;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\DateFormat;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class PromotionData extends Data
{
    public function __construct(
        #[Required, StringType, Max(255)]
        public string $name,

        #[Required, Enum(PromotionType::class)]
        public PromotionType $type,

        #[Required, Numeric, Min(0)]
        public float $value,

        #[Required, DateFormat('Y-m-d')]
        public string $starts_at,

        #[Required, DateFormat('Y-m-d'), AfterOrEqual('starts_at')]
        public string $ends_at,

        #[Required, BooleanType]
        public bool $is_active,

        #[Nullable, StringType]
        public ?string $description = null,

        #[Nullable, Uuid]
        public ?string $shop_id = null,

        /** @var array<string> */
        public array $product_ids = [],
    ) {}
}
