<?php

namespace App\Notifications;

use App\Mail\AccountActivationMail;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class AccountActivationNotification extends Notification
{
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): AccountActivationMail
    {
        $activationUrl = URL::temporarySignedRoute(
            'account.activate',
            now()->addHours(24),
            ['user' => $notifiable->id],
        );

        return new AccountActivationMail($notifiable, $activationUrl);
    }
}
