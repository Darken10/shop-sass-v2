<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\CompanyStatusEnum;
use App\Enums\CompanyTypeEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            // Step 1: User information
            ...$this->profileRules(),
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => $this->passwordRules(),

            // Step 2: Company information
            'company_name' => ['required', 'string', 'max:255'],
            'company_type' => ['required', new Enum(CompanyTypeEnum::class)],
            'company_address' => ['nullable', 'string', 'max:255'],
            'company_phone' => ['nullable', 'string', 'max:20'],
            'company_email' => ['nullable', 'string', 'email', 'max:255'],
            'company_city' => ['nullable', 'string', 'max:255'],
            'company_country' => ['nullable', 'string', 'max:255'],
            'company_currency' => ['nullable', 'string', 'max:10'],
            'company_description' => ['nullable', 'string', 'max:1000'],

            // Step 3: Terms acceptance
            'terms_accepted' => ['accepted'],
            'privacy_accepted' => ['accepted'],
        ], [
            'terms_accepted.accepted' => 'Vous devez accepter les conditions d\'adhésion.',
            'privacy_accepted.accepted' => 'Vous devez accepter la politique de confidentialité.',
            'company_name.required' => 'Le nom de l\'entreprise est obligatoire.',
            'company_type.required' => 'Le type d\'activité est obligatoire.',
        ])->validate();

        return DB::transaction(function () use ($input): User {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            $company = Company::create([
                'name' => $input['company_name'],
                'type' => $input['company_type'],
                'address' => $input['company_address'] ?? null,
                'phone' => $input['company_phone'] ?? null,
                'email' => $input['company_email'] ?? null,
                'city' => $input['company_city'] ?? null,
                'country' => $input['company_country'] ?? null,
                'description' => $input['company_description'] ?? null,
                'status' => CompanyStatusEnum::Active,
                'created_by' => $user->id,
            ]);

            $user->update(['company_id' => $company->id]);
            $user->assignRole(RoleEnum::Admin);

            return $user;
        });
    }
}
