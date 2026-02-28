<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CompanySettingsUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // ── Paramètres généraux ──
            'settings' => ['nullable', 'array'],
            'settings.currency' => ['nullable', 'string', 'size:3'],
            'settings.timezone' => ['nullable', 'string', 'max:60'],
            'settings.language' => ['nullable', 'string', 'max:10'],
            'settings.tax_number' => ['nullable', 'string', 'max:100'],
            'settings.default_tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'settings.fiscal_year_start_month' => ['nullable', 'integer', 'min:1', 'max:12'],

            // ── Paramètres POS ──
            'settings.max_discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'settings.receipt_header' => ['nullable', 'string', 'max:500'],
            'settings.receipt_footer' => ['nullable', 'string', 'max:500'],

            // ── Paramètres stock ──
            'settings.low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'settings.auto_track_stock' => ['boolean'],

            // ── Notifications ──
            'notification_settings' => ['nullable', 'array'],
            'notification_settings.email_enabled' => ['boolean'],
            'notification_settings.email_recipients' => ['nullable', 'string'],
            'notification_settings.sms_enabled' => ['boolean'],
            'notification_settings.sms_provider' => ['nullable', 'string', 'max:100'],
            'notification_settings.sms_api_key' => ['nullable', 'string', 'max:500'],
            'notification_settings.sms_phone' => ['nullable', 'string', 'max:30'],
            'notification_settings.whatsapp_enabled' => ['boolean'],
            'notification_settings.whatsapp_provider' => ['nullable', 'string', 'max:100'],
            'notification_settings.whatsapp_api_key' => ['nullable', 'string', 'max:500'],
            'notification_settings.whatsapp_phone' => ['nullable', 'string', 'max:30'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'settings.currency.size' => 'La devise doit être un code ISO de 3 lettres (ex: XOF, EUR, USD).',
            'settings.default_tax_rate.max' => 'Le taux de TVA ne peut pas dépasser 100%.',
            'settings.max_discount_percent.max' => 'La remise maximale ne peut pas dépasser 100%.',
            'settings.fiscal_year_start_month.min' => 'Le mois de début d\'exercice doit être entre 1 et 12.',
            'settings.fiscal_year_start_month.max' => 'Le mois de début d\'exercice doit être entre 1 et 12.',
        ];
    }
}
