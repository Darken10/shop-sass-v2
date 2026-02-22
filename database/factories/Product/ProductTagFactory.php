<?php

namespace Database\Factories\Product;

use App\Models\Company\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product\ProductTag>
 */
class ProductTagFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }
}
