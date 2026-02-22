<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a company
        $company = \App\Models\Company\Company::factory()->create();

        // Create a user and associate it with the company
        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        // Optionally, you can assign roles or permissions to the user here
    }
}
