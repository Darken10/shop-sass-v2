<?php

namespace App\Data;

use App\Enums\CompanyStatusEnum;
use App\Enums\CompanyTypeEnum;
use Spatie\LaravelData\Data;


class CompanyData extends Data
{
    public function __construct(

        public string $name,
        public ?string $email,
        public ?string $phone,
        public ?string $address,
        public CompanyTypeEnum $type,
        public CompanyStatusEnum $status,
        public ?string $city,
        public ?string $state,
        public ?string $postal_code,
        public ?string $country,
        public ?string $website,
        public ?string $description,
        public ?string $logo,
    ) {}
}
