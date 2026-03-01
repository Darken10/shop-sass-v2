<?php

namespace App\Http\Requests\Finance;

use App\Enums\AccountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:20', Rule::unique('accounts', 'code')],
            'type' => ['required', 'string', Rule::in(AccountType::all())],
            'description' => ['nullable', 'string', 'max:1000'],
            'category_id' => ['nullable', 'uuid', Rule::exists('account_categories', 'id')],
            'is_active' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du compte est obligatoire.',
            'code.required' => 'Le code du compte est obligatoire.',
            'code.unique' => 'Ce code de compte est déjà utilisé.',
            'type.required' => 'Le type de compte est obligatoire.',
        ];
    }
}
