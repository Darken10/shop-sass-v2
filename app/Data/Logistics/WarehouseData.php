<?php

namespace App\Data\Logistics;

use App\Enums\WarehouseStatus;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class WarehouseData extends Data
{
    public function __construct(
        #[Required, StringType, Max(255)]
        public string $name,

        #[Required, StringType, Max(100)]
        public string $code,

        #[Nullable, StringType, Max(255)]
        public ?string $address,

        #[Nullable, StringType, Max(100)]
        public ?string $city,

        #[Nullable, StringType, Max(50)]
        public ?string $phone,

        #[Required, Enum(WarehouseStatus::class)]
        public WarehouseStatus $status,

        #[Nullable, StringType]
        public ?string $description,
    ) {}
}
