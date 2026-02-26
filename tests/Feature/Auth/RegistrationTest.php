<?php

use App\Enums\CompanyTypeEnum;
use App\Enums\RoleEnum;
use App\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => RoleEnum::Admin->value, 'guard_name' => 'web']);
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'company_name' => 'Test Company',
        'company_type' => CompanyTypeEnum::BOUTIQUE->value,
        'terms_accepted' => true,
        'privacy_accepted' => true,
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});
