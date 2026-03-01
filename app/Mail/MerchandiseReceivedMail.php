<?php

namespace App\Mail;

use App\Models\Logistics\SupplyRequest;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MerchandiseReceivedMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public readonly User $notifiable,
        public readonly SupplyRequest $supplyRequest,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Marchandises réceptionnées — {$this->supplyRequest->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.merchandise-received',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
