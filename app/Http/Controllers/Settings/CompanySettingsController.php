<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\CompanySettingsUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingsController extends Controller
{
    /**
     * Show the company settings page.
     */
    public function edit(Request $request): Response
    {
        $company = $request->user()->company;

        abort_unless($company, 403, 'Aucune entreprise associée à votre compte.');

        return Inertia::render('settings/company', [
            'company' => $company->only([
                'id',
                'name',
                'email',
                'phone',
                'website',
                'address',
                'city',
                'state',
                'postal_code',
                'country',
                'description',
                'notification_settings',
                'settings',
            ]),
        ]);
    }

    /**
     * Update the company settings.
     */
    public function update(CompanySettingsUpdateRequest $request): RedirectResponse
    {
        $company = $request->user()->company;

        abort_unless($company, 403, 'Aucune entreprise associée à votre compte.');

        $validated = $request->validated();

        $company->update([
            'notification_settings' => $validated['notification_settings'] ?? $company->notification_settings,
            'settings' => $validated['settings'] ?? $company->settings,
        ]);

        return to_route('company-settings.edit')
            ->with('success', 'Paramètres de l\'entreprise mis à jour.');
    }
}
