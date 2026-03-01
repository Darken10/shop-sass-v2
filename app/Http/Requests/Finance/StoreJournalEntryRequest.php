<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJournalEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'shop_id' => ['nullable', 'uuid', Rule::exists('shops', 'id')],
            'warehouse_id' => ['nullable', 'uuid', Rule::exists('warehouses', 'id')],
            'lines' => ['required', 'array', 'min:2'],
            'lines.*.account_id' => ['required', 'uuid', Rule::exists('accounts', 'id')],
            'lines.*.debit' => ['required', 'numeric', 'min:0'],
            'lines.*.credit' => ['required', 'numeric', 'min:0'],
            'lines.*.description' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'date.required' => 'La date est obligatoire.',
            'description.required' => 'La description est obligatoire.',
            'lines.required' => 'Au moins deux lignes sont requises.',
            'lines.min' => 'Au moins deux lignes sont requises.',
            'lines.*.account_id.required' => 'Le compte est obligatoire pour chaque ligne.',
            'lines.*.account_id.exists' => 'Le compte sélectionné est invalide.',
        ];
    }
}
