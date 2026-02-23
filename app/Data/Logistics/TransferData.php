<?php

namespace App\Data\Logistics;

use App\Enums\TransferType;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class TransferData extends Data
{
    public function __construct(
        #[Required, Enum(TransferType::class)]
        public TransferType $type,

        #[Nullable, StringType]
        public ?string $notes,

        #[Required, Uuid]
        public string $source_warehouse_id,

        #[Nullable, Uuid]
        public ?string $destination_warehouse_id,

        #[Nullable, Uuid]
        public ?string $destination_shop_id,

        #[Nullable, Uuid]
        public ?string $vehicle_id,

        /** @var array<int, mixed> */
        #[Required, ArrayType, Min(1)]
        public array $items,
    ) {}
}
