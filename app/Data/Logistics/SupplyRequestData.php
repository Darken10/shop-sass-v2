<?php

namespace App\Data\Logistics;

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
        #[Nullable, StringType]
        public ?string $notes,

        #[Required, Uuid]
        public string $source_warehouse_id,

        #[Nullable, Uuid]
        public ?string $destination_warehouse_id,

        /** @var SupplyRequestItemData[] */
        public array $items,
    ) {}
}
