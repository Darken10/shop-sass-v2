<?php

namespace App\Http\Controllers\Finance;

use App\Enums\AccountType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\StoreAccountRequest;
use App\Http\Requests\Finance\StoreJournalEntryRequest;
use App\Models\Finance\Account;
use App\Models\Finance\AccountCategory;
use App\Models\Finance\JournalEntry;
use App\Models\Logistics\Shop;
use App\Models\Logistics\Warehouse;
use App\Services\FinancialService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountingController extends Controller
{
    public function __construct(
        private FinancialService $financialService,
    ) {}

    // ── Chart of Accounts ──────────────────────────────────────────

    public function accounts(Request $request): Response
    {
        $query = Account::query()
            ->with(['category:id,name'])
            ->orderBy('code');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return Inertia::render('finance/accounting/accounts', [
            'accounts' => $query->paginate(30)->withQueryString(),
            'accountTypes' => collect(AccountType::cases())->map(fn (AccountType $t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'categories' => AccountCategory::query()->select('id', 'name', 'type')->orderBy('name')->get(),
            'filters' => $request->only(['type', 'is_active']),
        ]);
    }

    public function storeAccount(StoreAccountRequest $request): RedirectResponse
    {
        Account::create([
            ...$request->validated(),
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Compte créé avec succès.');
    }

    // ── Journal Entries ───────────────────────────────────────────

    public function journal(Request $request): Response
    {
        $query = JournalEntry::query()
            ->with(['creator:id,name', 'shop:id,name', 'warehouse:id,name'])
            ->latest('date');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('start_date')) {
            $query->where('date', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->where('date', '<=', $request->input('end_date'));
        }

        if ($request->filled('shop_id')) {
            $query->where('shop_id', $request->input('shop_id'));
        }

        return Inertia::render('finance/accounting/journal', [
            'entries' => $query->paginate(20)->withQueryString(),
            'accounts' => Account::query()->where('is_active', true)->select('id', 'code', 'name', 'type')->orderBy('code')->get(),
            'shops' => Shop::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'warehouses' => Warehouse::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'filters' => $request->only(['status', 'start_date', 'end_date', 'shop_id']),
        ]);
    }

    public function createJournalEntry(): Response
    {
        return Inertia::render('finance/accounting/journal-create', [
            'accounts' => Account::query()->where('is_active', true)->select('id', 'code', 'name', 'type')->orderBy('code')->get(),
            'shops' => Shop::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'warehouses' => Warehouse::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function storeJournalEntry(StoreJournalEntryRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $this->financialService->createJournalEntry(
            description: $data['description'],
            date: Carbon::parse($data['date']),
            lines: $data['lines'],
            shopId: $data['shop_id'] ?? null,
            warehouseId: $data['warehouse_id'] ?? null,
            notes: $data['notes'] ?? null,
        );

        return to_route('finance.accounting.journal')
            ->with('success', 'Écriture comptable créée avec succès.');
    }

    public function showJournalEntry(JournalEntry $journalEntry): Response
    {
        $journalEntry->load(['lines.account:id,code,name,type', 'creator:id,name', 'poster:id,name', 'shop:id,name', 'warehouse:id,name']);

        return Inertia::render('finance/accounting/journal-show', [
            'entry' => $journalEntry,
        ]);
    }

    public function postJournalEntry(JournalEntry $journalEntry): RedirectResponse
    {
        try {
            $this->financialService->postJournalEntry($journalEntry);

            return back()->with('success', 'Écriture validée et comptabilisée.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function voidJournalEntry(JournalEntry $journalEntry): RedirectResponse
    {
        try {
            $this->financialService->voidJournalEntry($journalEntry);

            return back()->with('success', 'Écriture annulée.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    // ── Balance Sheet ──────────────────────────────────────────────

    public function balanceSheet(): Response
    {
        $balanceSheet = $this->financialService->getBalanceSheet();

        return Inertia::render('finance/accounting/balance-sheet', [
            'balanceSheet' => $balanceSheet,
        ]);
    }

    // ── General Ledger ─────────────────────────────────────────────

    public function ledger(Request $request): Response
    {
        $accountId = $request->input('account_id');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        $accounts = Account::query()
            ->where('is_active', true)
            ->select('id', 'code', 'name', 'type', 'balance')
            ->orderBy('code')
            ->get();

        $ledgerEntries = collect();
        $selectedAccount = null;

        if ($accountId) {
            $selectedAccount = Account::find($accountId);

            $ledgerEntries = JournalEntry::query()
                ->join('journal_entry_lines', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
                ->where('journal_entry_lines.account_id', $accountId)
                ->where('journal_entries.status', 'posted')
                ->whereBetween('journal_entries.date', [$startDate, $endDate])
                ->select([
                    'journal_entries.id',
                    'journal_entries.reference',
                    'journal_entries.date',
                    'journal_entries.description',
                    'journal_entry_lines.debit',
                    'journal_entry_lines.credit',
                    'journal_entry_lines.description as line_description',
                ])
                ->orderBy('journal_entries.date')
                ->orderBy('journal_entries.reference')
                ->get()
                ->map(fn ($row) => [
                    'id' => $row->id,
                    'reference' => $row->reference,
                    'date' => Carbon::parse($row->date)->format('d/m/Y'),
                    'description' => $row->line_description ?? $row->description,
                    'debit' => (float) $row->debit,
                    'credit' => (float) $row->credit,
                ]);
        }

        return Inertia::render('finance/accounting/ledger', [
            'accounts' => $accounts,
            'ledgerEntries' => $ledgerEntries,
            'selectedAccount' => $selectedAccount ? [
                'id' => $selectedAccount->id,
                'code' => $selectedAccount->code,
                'name' => $selectedAccount->name,
                'type' => $selectedAccount->type->value,
                'balance' => (float) $selectedAccount->balance,
            ] : null,
            'filters' => [
                'account_id' => $accountId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
