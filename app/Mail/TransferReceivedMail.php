<?php

namespace App\Mail;

use App\Models\Logistics\Transfer;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TransferReceivedMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public readonly User $notifiable,
        public readonly Transfer $transfer,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Transfert réceptionné — {$this->transfer->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.transfer-received',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
