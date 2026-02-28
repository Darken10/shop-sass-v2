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
     * Show the company notification settings page.
     */
    public function edit(Request $request): Response
    {
        $company = $request->user()->company;

        abort_unless($company, 403, 'Aucune entreprise associée à votre compte.');

        return Inertia::render('settings/company', [
            'company' => $company->only(['id', 'name', 'notification_settings']),
        ]);
    }

    /**
     * Update the company notification settings.
     */
    public function update(CompanySettingsUpdateRequest $request): RedirectResponse
    {
        $company = $request->user()->company;

        abort_unless($company, 403, 'Aucune entreprise associée à votre compte.');

        $company->update([
            'notification_settings' => $request->validated()['notification_settings'],
        ]);

        return to_route('company-settings.edit')
            ->with('success', 'Paramètres de notifications mis à jour.');
    }
}
