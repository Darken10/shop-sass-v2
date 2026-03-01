<?php

namespace App\Notifications;

use App\Mail\MerchandiseReceivedMail;
use App\Models\Logistics\SupplyRequest;
use Illuminate\Notifications\Notification;

class MerchandiseReceivedNotification extends Notification
{
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

    public function toMail(object $notifiable): MerchandiseReceivedMail
    {
        return (new MerchandiseReceivedMail($notifiable, $this->supplyRequest))
            ->to($notifiable->email, $notifiable->name);
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
