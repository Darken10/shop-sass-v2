<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum TransferStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Approved = 'approved';
    case InTransit = 'in_transit';
    case Delivered = 'delivered';
    case Received = 'received';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Pending => 'En attente',
            self::Approved => 'Approuvé',
            self::InTransit => 'En transit',
            self::Delivered => 'Livré',
            self::Received => 'Réceptionné',
            self::Rejected => 'Rejeté',
            self::Cancelled => 'Annulé',
        };
    }

    public static function all(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
