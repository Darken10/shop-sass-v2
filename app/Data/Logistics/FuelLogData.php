<?php

namespace App\Data\Logistics;

use Spatie\LaravelData\Attributes\Validation\DateFormat;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class FuelLogData extends Data
{
    public function __construct(
        #[Required, Numeric]
        public float $quantity_liters,

        #[Required, Numeric]
        public float $cost,

        #[Nullable, Numeric]
        public ?float $odometer_reading,

        #[Required, DateFormat('Y-m-d')]
        public string $fueled_at,

        #[Nullable, StringType]
        public ?string $notes,

        #[Required, Uuid]
        public string $vehicle_id,

        #[Nullable, Uuid]
        public ?string $stock_movement_id,
    ) {}
}
