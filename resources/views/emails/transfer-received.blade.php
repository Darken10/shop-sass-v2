@extends('emails.layout')

@section('subject', "Transfert réceptionné — {$transfer->reference}")
@section('badge', 'Réception transfert')
@php $badgeType = 'success'; @endphp

@section('content')
    <p class="greeting">Bonjour {{ $notifiable->name }},</p>

    <div class="content">
        <p>
            Le transfert <strong>{{ $transfer->reference }}</strong> a été
            <strong style="color: #059669;">réceptionné avec succès</strong>.
        </p>

        <div class="info-card">
            <div class="info-row">
                <span class="info-label">Référence</span>
                <span class="info-value">{{ $transfer->reference }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Type</span>
                <span class="info-value">{{ $transfer->type->label() }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Réceptionné le</span>
                <span class="info-value">
                    {{ $transfer->received_at?->format('d/m/Y à H:i') ?? 'N/A' }}
                </span>
            </div>
        </div>

        <p>
            Connectez-vous à votre espace pour consulter les détails complets de ce transfert.
        </p>
    </div>
@endsection
