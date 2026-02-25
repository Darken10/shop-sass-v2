<?php

namespace App\Data\Pos;

use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CustomerData extends Data
{
    public function __construct(
        #[Required, StringType, Max(255)]
        public string $name,

        #[Nullable, StringType, Max(50)]
        public ?string $phone,

        #[Nullable, Email, Max(255)]
        public ?string $email,

        #[Nullable, StringType, Max(255)]
        public ?string $address,

        #[Nullable, StringType, Max(100)]
        public ?string $city,
    ) {}
}
