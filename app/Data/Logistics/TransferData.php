<?php

namespace App\Data\Logistics;

use App\Enums\TransferType;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
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

        #[Sometimes, Nullable, Uuid]
        public ?string $vehicle_id,

        #[Sometimes, BooleanType]
        public bool $company_bears_costs = false,

        #[Sometimes, Nullable, StringType, Max(255)]
        public ?string $driver_name = null,

        #[Sometimes, Nullable, StringType, Max(50)]
        public ?string $driver_phone = null,

        #[Sometimes]
        public bool $is_draft = false,

        /** @var array<int, mixed> */
        #[Required, ArrayType, Min(1)]
        public array $items = [],

        /** @var array<int, mixed> */
        #[Sometimes, Nullable, ArrayType]
        public ?array $charges = null,
    ) {}

    public static function rules(): array
    {
        return [
            'charges.*.label' => ['required', 'string', 'max:255'],
            'charges.*.type' => ['required', 'string'],
            'charges.*.amount' => ['required', 'numeric', 'min:0'],
            'charges.*.notes' => ['nullable', 'string'],
        ];
    }
}
