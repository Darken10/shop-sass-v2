<?php

use App\Models\Company\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->user = User::factory()->create(['company_id' => $this->company->id]);
    $this->userWithoutCompany = User::factory()->create(['company_id' => null]);
});

it('redirects unauthenticated users to login', function () {
    $this->get('/settings/company')->assertRedirect('/login');
});

it('returns 403 for users without a company', function () {
    actingAs($this->userWithoutCompany)
        ->get('/settings/company')
        ->assertForbidden();
});

it('renders the company settings page for users with a company', function () {
    actingAs($this->user)
        ->get('/settings/company')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('settings/company')
                ->has('company')
                ->where('company.id', $this->company->id)
        );
});

it('updates company settings successfully', function () {
    actingAs($this->user)
        ->patch('/settings/company', [
            'settings' => [
                'currency' => 'EUR',
                'language' => 'fr',
                'default_tax_rate' => '20',
                'fiscal_year_start_month' => '1',
                'max_discount_percent' => '15',
                'low_stock_threshold' => '10',
                'auto_track_stock' => true,
                'receipt_header' => 'Mon entreprise',
                'receipt_footer' => 'Merci de votre visite',
            ],
        ])
        ->assertRedirect('/settings/company');

    $this->company->refresh();

    expect($this->company->settings['currency'])->toBe('EUR')
        ->and($this->company->settings['language'])->toBe('fr')
        ->and($this->company->settings['max_discount_percent'])->toBe('15');
});

it('updates notification settings successfully', function () {
    actingAs($this->user)
        ->patch('/settings/company', [
            'notification_settings' => [
                'email_enabled' => true,
                'email_recipients' => 'admin@test.com',
            ],
        ])
        ->assertRedirect('/settings/company');

    $this->company->refresh();

    expect($this->company->notification_settings['email_enabled'])->toBeTrue()
        ->and($this->company->notification_settings['email_recipients'])->toBe('admin@test.com');
});

it('rejects invalid settings values', function () {
    actingAs($this->user)
        ->patch('/settings/company', [
            'settings' => [
                'currency' => 'TOOLONGCURRENCY',
                'default_tax_rate' => '200',
                'fiscal_year_start_month' => '13',
                'max_discount_percent' => '-5',
            ],
        ])
        ->assertSessionHasErrors([
            'settings.currency',
            'settings.default_tax_rate',
            'settings.fiscal_year_start_month',
            'settings.max_discount_percent',
        ]);
});
