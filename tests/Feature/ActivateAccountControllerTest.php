<?php

use App\Models\User;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

// --- Show activation form ---

it('shows activation form with valid signed URL', function () {
    $user = User::factory()->create(['password' => null, 'email_verified_at' => null]);

    $url = URL::temporarySignedRoute('account.activate', now()->addHours(24), ['user' => $user->id]);

    $this->get($url)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/activate-account')
            ->has('user')
            ->where('user.id', $user->id),
        );
});

it('rejects activation with invalid signature', function () {
    $user = User::factory()->create(['password' => null]);

    $this->get("/activate/{$user->id}")
        ->assertForbidden();
});

it('redirects to login if account already activated', function () {
    $user = User::factory()->create(); // has password

    $url = URL::temporarySignedRoute('account.activate', now()->addHours(24), ['user' => $user->id]);

    $this->get($url)
        ->assertRedirect('/login');
});

// --- Store (set password) ---

it('activates account with valid password', function () {
    $user = User::factory()->create(['password' => null, 'email_verified_at' => null]);

    $url = URL::temporarySignedRoute('account.activate.store', now()->addHours(24), ['user' => $user->id]);

    $this->post($url, [
        'password' => 'securepassword',
        'password_confirmation' => 'securepassword',
    ])->assertRedirect('/login');

    $user->refresh();
    expect($user->password)->not->toBeNull();
    expect($user->email_verified_at)->not->toBeNull();
});

it('validates password on activation', function () {
    $user = User::factory()->create(['password' => null, 'email_verified_at' => null]);

    $url = URL::temporarySignedRoute('account.activate.store', now()->addHours(24), ['user' => $user->id]);

    $this->post($url, [
        'password' => 'short',
        'password_confirmation' => 'short',
    ])->assertInvalid(['password']);
});

it('validates password confirmation on activation', function () {
    $user = User::factory()->create(['password' => null, 'email_verified_at' => null]);

    $url = URL::temporarySignedRoute('account.activate.store', now()->addHours(24), ['user' => $user->id]);

    $this->post($url, [
        'password' => 'securepassword',
        'password_confirmation' => 'different',
    ])->assertInvalid(['password']);
});

it('rejects store with invalid signature', function () {
    $user = User::factory()->create(['password' => null]);

    $this->post("/activate/{$user->id}", [
        'password' => 'securepassword',
        'password_confirmation' => 'securepassword',
    ])->assertForbidden();
});
