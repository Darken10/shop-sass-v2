<?php

use App\Enums\CompanyStatusEnum;
use App\Enums\CompanyTypeEnum;
use App\Enums\RoleEnum;
use App\Models\Company\Company;
use App\Models\Role;
use App\Models\User;

beforeEach(function () {
    Role::firstOrCreate(['name' => RoleEnum::Admin->value, 'guard_name' => 'web']);
});

function validRegistrationData(array $overrides = []): array
{
    return array_merge([
        'name' => 'Jean Dupont',
        'email' => 'jean@exemple.com',
        'phone' => '+225 01 02 03 04',
        'password' => 'SecureP@ss1234',
        'password_confirmation' => 'SecureP@ss1234',
        'company_name' => 'Ma Boutique',
        'company_type' => CompanyTypeEnum::BOUTIQUE->value,
        'company_address' => '123 Rue du Commerce',
        'company_phone' => '+225 05 06 07 08',
        'company_email' => 'contact@maboutique.com',
        'company_city' => 'Abidjan',
        'company_country' => 'Côte d\'Ivoire',
        'company_currency' => 'XOF',
        'company_description' => 'Une boutique de prêt-à-porter',
        'terms_accepted' => true,
        'privacy_accepted' => true,
    ], $overrides);
}

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('registration screen passes company types', function () {
    $response = $this->get(route('register'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/register')
            ->has('companyTypes', count(CompanyTypeEnum::cases()))
        );
});

test('new user can register with all three steps data', function () {
    $this->post(route('register.store'), validRegistrationData())
        ->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticated();

    $user = User::where('email', 'jean@exemple.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->name)->toBe('Jean Dupont')
        ->and($user->company_id)->not->toBeNull();

    $company = Company::find($user->company_id);

    expect($company)->not->toBeNull()
        ->and($company->name)->toBe('Ma Boutique')
        ->and($company->type)->toBe(CompanyTypeEnum::BOUTIQUE)
        ->and($company->status)->toBe(CompanyStatusEnum::Active)
        ->and($company->created_by)->toBe($user->id)
        ->and($company->city)->toBe('Abidjan')
        ->and($company->country)->toBe('Côte d\'Ivoire');
});

test('registered user becomes admin of their company', function () {
    $this->post(route('register.store'), validRegistrationData());

    $user = User::where('email', 'jean@exemple.com')->first();

    expect($user->hasRole(RoleEnum::Admin->value))->toBeTrue();
});

test('company is created with active status', function () {
    $this->post(route('register.store'), validRegistrationData());

    $user = User::where('email', 'jean@exemple.com')->first();
    $company = Company::find($user->company_id);

    expect($company->status)->toBe(CompanyStatusEnum::Active);
});

test('registration fails without user name', function () {
    $this->post(route('register.store'), validRegistrationData(['name' => '']))
        ->assertSessionHasErrors('name');

    $this->assertGuest();
});

test('registration fails without email', function () {
    $this->post(route('register.store'), validRegistrationData(['email' => '']))
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('registration fails with invalid email', function () {
    $this->post(route('register.store'), validRegistrationData(['email' => 'invalid-email']))
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('registration fails without password', function () {
    $this->post(route('register.store'), validRegistrationData(['password' => '', 'password_confirmation' => '']))
        ->assertSessionHasErrors('password');

    $this->assertGuest();
});

test('registration fails when password confirmation does not match', function () {
    $this->post(route('register.store'), validRegistrationData([
        'password' => 'SecureP@ss1234',
        'password_confirmation' => 'DifferentP@ss',
    ]))->assertSessionHasErrors('password');

    $this->assertGuest();
});

test('registration fails without company name', function () {
    $this->post(route('register.store'), validRegistrationData(['company_name' => '']))
        ->assertSessionHasErrors('company_name');

    $this->assertGuest();
});

test('registration fails without company type', function () {
    $this->post(route('register.store'), validRegistrationData(['company_type' => '']))
        ->assertSessionHasErrors('company_type');

    $this->assertGuest();
});

test('registration fails with invalid company type', function () {
    $this->post(route('register.store'), validRegistrationData(['company_type' => 'invalid']))
        ->assertSessionHasErrors('company_type');

    $this->assertGuest();
});

test('registration fails without terms acceptance', function () {
    $this->post(route('register.store'), validRegistrationData(['terms_accepted' => false]))
        ->assertSessionHasErrors('terms_accepted');

    $this->assertGuest();
});

test('registration fails without privacy acceptance', function () {
    $this->post(route('register.store'), validRegistrationData(['privacy_accepted' => false]))
        ->assertSessionHasErrors('privacy_accepted');

    $this->assertGuest();
});

test('registration fails with duplicate email', function () {
    User::factory()->create(['email' => 'jean@exemple.com']);

    $this->post(route('register.store'), validRegistrationData())
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('registration with minimal company data succeeds', function () {
    $this->post(route('register.store'), validRegistrationData([
        'company_address' => '',
        'company_phone' => '',
        'company_email' => '',
        'company_city' => '',
        'company_country' => '',
        'company_currency' => '',
        'company_description' => '',
        'phone' => '',
    ]))->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticated();

    $user = User::where('email', 'jean@exemple.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->company_id)->not->toBeNull();
});

test('no user or company is created on validation failure', function () {
    $userCountBefore = User::count();
    $companyCountBefore = Company::count();

    $this->post(route('register.store'), validRegistrationData(['terms_accepted' => false]));

    expect(User::count())->toBe($userCountBefore)
        ->and(Company::count())->toBe($companyCountBefore);
});

test('all company types are valid for registration', function (CompanyTypeEnum $type) {
    $email = 'user-'.$type->value.'@exemple.com';

    $this->post(route('register.store'), validRegistrationData([
        'email' => $email,
        'company_type' => $type->value,
    ]))->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', $email)->first();
    $company = Company::find($user->company_id);

    expect($company->type)->toBe($type);
})->with(CompanyTypeEnum::cases());
