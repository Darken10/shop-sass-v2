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
            'notification_settings.email_recipients.string' => 'Les destinataires email doivent être une chaîne valide.',
            'notification_settings.sms_phone.max' => 'Le numéro SMS ne peut pas dépasser 30 caractères.',
            'notification_settings.whatsapp_phone.max' => 'Le numéro WhatsApp ne peut pas dépasser 30 caractères.',
        ];
    }
}
