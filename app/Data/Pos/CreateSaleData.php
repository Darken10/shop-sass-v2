<?php

namespace App\Data\Pos;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CreateSaleData extends Data
{
    /**
     * @param  array<SaleItemData>  $items
     * @param  array<PaymentData>  $payments
     */
    public function __construct(
        #[Required]
        #[DataCollectionOf(SaleItemData::class)]
        public array $items,

        #[Required]
        #[DataCollectionOf(PaymentData::class)]
        public array $payments,

        #[Nullable, Uuid]
        public ?string $customer_id = null,

        #[Nullable, Numeric, Min(0)]
        public ?float $amount_given = null,

        #[Nullable, StringType]
        public ?string $change_action = null,

        #[Nullable, StringType]
        public ?string $notes = null,
    ) {}
}
