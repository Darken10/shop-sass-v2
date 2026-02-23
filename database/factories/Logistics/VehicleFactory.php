<?php

namespace Database\Factories\Logistics;

use App\Enums\VehicleStatus;
use App\Enums\VehicleType;
use App\Models\Company\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\Vehicle>
 */
class VehicleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->word().' '.fake()->randomNumber(3),
            'type' => fake()->randomElement(VehicleType::cases()),
            'registration_number' => fake()->unique()->numerify('AB-####-CD'),
            'load_capacity' => fake()->randomFloat(2, 500, 20000),
            'average_consumption' => fake()->randomFloat(2, 5, 30),
            'status' => fake()->randomElement(VehicleStatus::cases()),
            'notes' => fake()->optional()->sentence(),
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => VehicleStatus::Active,
        ]);
    }

    public function truck(): static
    {
        return $this->state(fn () => [
            'type' => VehicleType::Truck,
        ]);
    }

    public function tricycle(): static
    {
        return $this->state(fn () => [
            'type' => VehicleType::Tricycle,
        ]);
    }
}
