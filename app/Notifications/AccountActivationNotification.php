<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class AccountActivationNotification extends Notification implements ShouldQueue
{
    use Queueable;

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
            ->subject('Activez votre compte')
            ->greeting("Bonjour {$notifiable->name},")
            ->line('Un compte a été créé pour vous. Veuillez cliquer sur le bouton ci-dessous pour définir votre mot de passe et activer votre compte.')
            ->action('Activer mon compte', $activationUrl)
            ->line('Ce lien est valide pendant 24 heures.')
            ->line('Si vous n\'avez pas demandé de compte, aucune action n\'est nécessaire.');
    }
}
