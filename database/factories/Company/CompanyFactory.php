<?php

namespace Database\Factories\Company;

use App\Enums\CompanyStatusEnum;
use App\Enums\CompanyTypeEnum;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Company\Company>
 */
class CompanyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),

            'name' => $this->faker->company(),

            'type' => $this->faker->randomElement(CompanyTypeEnum::all()),

            'description' => $this->faker->paragraph(),

            'logo' => $this->faker->imageUrl(200, 200, 'business'),

            'address' => $this->faker->streetAddress(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->companyEmail(),
            'website' => $this->faker->url(),

            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'postal_code' => $this->faker->postcode(),
            'country' => $this->faker->country(),

            'status' => $this->faker->randomElement(CompanyStatusEnum::all()),

            'created_by' => User::factory(),
        ];
    }

    public function active()
    {
        return $this->state(fn () => [
            'status' => CompanyStatusEnum::Active->value,
        ]);
    }

    public function inactive()
    {
        return $this->state(fn () => [
            'status' => CompanyStatusEnum::Inactive->value,
        ]);
    }
}
