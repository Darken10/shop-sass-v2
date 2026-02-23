<?php

namespace App\Data\Logistics;

use App\Enums\VehicleStatus;
use App\Enums\VehicleType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class VehicleData extends Data
{
    public function __construct(
        #[Required, StringType, Max(255)]
        public string $name,

        #[Required, Enum(VehicleType::class)]
        public VehicleType $type,

        #[Required, StringType, Max(50)]
        public string $registration_number,

        #[Nullable, Numeric]
        public ?float $load_capacity,

        #[Nullable, Numeric]
        public ?float $average_consumption,

        #[Required, Enum(VehicleStatus::class)]
        public VehicleStatus $status,

        #[Nullable, StringType]
        public ?string $notes,
    ) {}
}
