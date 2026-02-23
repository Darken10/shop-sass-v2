<?php

namespace App\Data\Logistics;

use App\Enums\StockMovementType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class StockMovementData extends Data
{
    public function __construct(
        #[Required, Enum(StockMovementType::class)]
        public StockMovementType $type,

        #[Required, IntegerType, Min(1)]
        public int $quantity,

        #[Nullable, StringType]
        public ?string $reason,

        #[Nullable, StringType]
        public ?string $notes,

        #[Required, Uuid]
        public string $product_id,

        #[Nullable, Uuid]
        public ?string $source_warehouse_id,

        #[Nullable, Uuid]
        public ?string $destination_warehouse_id,

        #[Nullable, Uuid]
        public ?string $supply_request_id,
    ) {}
}
