<?php

namespace App\Notifications;

use App\Models\Logistics\Transfer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TransferReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Transfer $transfer) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        $settings = $notifiable->company?->notification_settings ?? [];

        if (! empty($settings['email_enabled'])) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $transfer = $this->transfer;

        return (new MailMessage)
            ->subject("Transfert réceptionné — {$transfer->reference}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Le transfert **{$transfer->reference}** a été réceptionné avec succès.")
            ->line('**Détails de la réception :**')
            ->line("- Référence : {$transfer->reference}")
            ->line("- Type : {$transfer->type->label()}")
            ->line('- Réceptionné le : '.($transfer->received_at?->format('d/m/Y H:i') ?? 'N/A'))
            ->line('Veuillez vous connecter pour consulter les détails complets.')
            ->line('Merci d\'utiliser notre plateforme.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Transfert réceptionné',
            'message' => "Le transfert {$this->transfer->reference} a été réceptionné.",
            'transfer_id' => $this->transfer->id,
            'reference' => $this->transfer->reference,
            'received_at' => $this->transfer->received_at?->toISOString(),
        ];
    }
}
