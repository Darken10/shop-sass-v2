<?php

namespace App\Notifications;

use App\Models\Logistics\SupplyRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MerchandiseReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly SupplyRequest $supplyRequest) {}

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
        $supplyRequest = $this->supplyRequest;

        return (new MailMessage)
            ->subject("Marchandises réceptionnées — {$supplyRequest->reference}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("La demande d'approvisionnement **{$supplyRequest->reference}** a été réceptionnée avec succès.")
            ->line('**Détails de la réception :**')
            ->line("- Référence : {$supplyRequest->reference}")
            ->line("- Type : {$supplyRequest->type->label()}")
            ->line('- Réceptionné le : '.($supplyRequest->received_at?->format('d/m/Y H:i') ?? 'N/A'))
            ->line('Veuillez vous connecter pour consulter les détails complets.')
            ->line('Merci d\'utiliser notre plateforme.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Marchandises réceptionnées',
            'message' => "La demande {$this->supplyRequest->reference} a été réceptionnée.",
            'supply_request_id' => $this->supplyRequest->id,
            'reference' => $this->supplyRequest->reference,
            'received_at' => $this->supplyRequest->received_at?->toISOString(),
        ];
    }
}
