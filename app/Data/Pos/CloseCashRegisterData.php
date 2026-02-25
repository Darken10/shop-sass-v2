<?php

namespace App\Data\Pos;

use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CloseCashRegisterData extends Data
{
    public function __construct(
        #[Nullable, StringType]
        public ?string $closing_notes = null,
    ) {}
}
