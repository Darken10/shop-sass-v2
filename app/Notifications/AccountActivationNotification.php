<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class AccountActivationNotification extends Notification
{
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $activationUrl = URL::temporarySignedRoute(
            'account.activate',
            now()->addHours(24),
            ['user' => $notifiable->id],
        );

        return (new MailMessage)
            ->subject('Activez votre compte — '.config('app.name'))
            ->view('emails.account-activation', [
                'user' => $notifiable,
                'activationUrl' => $activationUrl,
            ]);
    }
}
