<?php

namespace App\Http\Controllers\Admin;

use App\Data\CompanyData;
use App\Enums\CompanyTypeEnum;
use App\Http\Controllers\Controller;
use App\Models\Company\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Company::class);

        $companies = Company::query()
            ->with('creator:id,name')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/companies/index', [
            'companies' => $companies,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Company::class);

        return Inertia::render('admin/companies/create', [
            'types' => CompanyTypeEnum::cases(),
        ]);
    }

    public function store(CompanyData $data, Request $request): RedirectResponse
    {
        $this->authorize('create', Company::class);

        $logo = null;

        if ($request->hasFile('logo_upload')) {
            $logo = $request->file('logo_upload')->store('logos', 'public');
        }

        $company = Company::create([
            ...$data->all(),
            'logo' => $logo,
            'created_by' => $request->user()->id,
        ]);

        return to_route('admin.companies.show', $company)
            ->with('success', 'Entreprise créée avec succès.');
    }

    public function show(Company $company): Response
    {
        $this->authorize('view', $company);

        return Inertia::render('admin/companies/show', [
            'company' => CompanyData::from($company),
        ]);
    }

    public function edit(Company $company): Response
    {
        $this->authorize('update', $company);

        return Inertia::render('admin/companies/edit', [
            'company' => CompanyData::from($company),
            'types' => CompanyTypeEnum::cases(),
        ]);
    }

    public function update(CompanyData $data, Company $company, Request $request): RedirectResponse
    {
        $this->authorize('update', $company);

        $logo = $company->logo;

        if ($request->hasFile('logo_upload')) {
            $logo = $request->file('logo_upload')->store('logos', 'public');
        }

        $company->update([
            ...$data->all(),
            'logo' => $logo,
        ]);

        return to_route('admin.companies.show', $company)
            ->with('success', 'Entreprise mise à jour avec succès.');
    }

    public function destroy(Company $company): RedirectResponse
    {
        $this->authorize('delete', $company);

        $company->delete();

        return to_route('admin.companies.index')
            ->with('success', 'Entreprise supprimée avec succès.');
    }
}
