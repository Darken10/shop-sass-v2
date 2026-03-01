<?php

namespace App\Notifications;

use App\Models\Logistics\Transfer;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TransferReceivedNotification extends Notification
{
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
        return (new MailMessage)
            ->subject("Transfert réceptionné — {$this->transfer->reference}")
            ->view('emails.transfer-received', [
                'notifiable' => $notifiable,
                'transfer' => $this->transfer,
            ]);
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
