<?php

namespace App\Enums;

enum ProductUnity: string
{
    case PIECE = 'piece';
    case KILOGRAM = 'kilogram';
    case LITER = 'liter';
    case METER = 'meter';
    case SQUARE_METER = 'square_meter';
    case CUBIC_METER = 'cubic_meter';
    case PACK = 'pack';
    case BOX = 'box';

    public function label(): string
    {
        return match ($this) {
            self::PIECE => 'Piece',
            self::KILOGRAM => 'Kilogram',
            self::LITER => 'Liter',
            self::METER => 'Meter',
            self::SQUARE_METER => 'Square Meter',
            self::CUBIC_METER => 'Cubic Meter',
            self::PACK => 'Pack',
            self::BOX => 'Box',
        };
    }
}
