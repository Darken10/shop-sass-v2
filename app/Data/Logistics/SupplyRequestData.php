<?php

namespace App\Data\Logistics;

use App\Enums\SupplyType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SupplyRequestData extends Data
{
    public function __construct(
        #[Required, Enum(SupplyType::class)]
        public string $type,

        #[Nullable, StringType]
        public ?string $notes,

        #[Nullable, Uuid]
        public ?string $source_warehouse_id,

        #[Nullable, Uuid]
        public ?string $destination_warehouse_id,

        #[Nullable, Uuid]
        public ?string $supplier_id,

        /** @var SupplyRequestItemData[] */
        public array $items,
    ) {}
}
