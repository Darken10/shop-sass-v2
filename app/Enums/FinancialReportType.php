<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum FinancialReportType: string
{
    case ProfitLoss = 'profit_loss';
    case BalanceSheet = 'balance_sheet';
    case CashFlow = 'cash_flow';
    case ExpenseReport = 'expense_report';
    case RevenueReport = 'revenue_report';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::ProfitLoss => 'Compte de résultat',
            self::BalanceSheet => 'Bilan comptable',
            self::CashFlow => 'Flux de trésorerie',
            self::ExpenseReport => 'Rapport des dépenses',
            self::RevenueReport => 'Rapport des revenus',
            self::Custom => 'Rapport personnalisé',
        };
    }

    /**
     * @return array<string>
     */
    public static function all(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
