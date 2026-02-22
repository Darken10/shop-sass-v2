<?php

namespace App\Data;

use App\Enums\CompanyStatusEnum;
use App\Enums\CompanyTypeEnum;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CompanyData extends Data
{
    public function __construct(
        #[Required, StringType, Max(255)]
        public string $name,

        #[Nullable, Email, Max(255)]
        public ?string $email,

        #[Nullable, StringType, Max(50)]
        public ?string $phone,

        #[Nullable, StringType, Max(255)]
        public ?string $address,

        #[Required, Enum(CompanyTypeEnum::class)]
        public CompanyTypeEnum $type,

        #[Required, Enum(CompanyStatusEnum::class)]
        public CompanyStatusEnum $status,

        #[Nullable, StringType, Max(100)]
        public ?string $city,

        #[Nullable, StringType, Max(100)]
        public ?string $state,

        #[Nullable, StringType, Max(20)]
        public ?string $postal_code,

        #[Nullable, StringType, Max(100)]
        public ?string $country,

        #[Nullable, Url, Max(255)]
        public ?string $website,

        #[Nullable, StringType]
        public ?string $description,

        #[Nullable, StringType, Max(255)]
        public ?string $logo,
    ) {}
}
