<?php

namespace Database\Seeders;

use App\Models\Company\Company;
use App\Services\AccountingIntegrationService;
use Illuminate\Database\Seeder;

class SystemAccountsSeeder extends Seeder
{
    /**
     * Initialize system accounts for all active companies.
     */
    public function run(): void
    {
        $companies = Company::withoutGlobalScopes()->where('status', 'active')->get();

        foreach ($companies as $company) {
            AccountingIntegrationService::initializeSystemAccounts(
                companyId: $company->id,
                createdBy: $company->created_by,
            );

            $this->command->info("System accounts initialized for: {$company->name}");
        }
    }
}
