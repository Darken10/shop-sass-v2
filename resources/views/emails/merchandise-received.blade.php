@extends('emails.layout')

@section('subject', "Marchandises réceptionnées — {$supplyRequest->reference}")
@section('badge', 'Réception marchandises')
@php $badgeType = 'success'; @endphp

@section('content')
    <p class="greeting">Bonjour {{ $notifiable->name }},</p>

    <div class="content">
        <p>
            La demande d'approvisionnement <strong>{{ $supplyRequest->reference }}</strong> a été
            <strong style="color: #059669;">réceptionnée avec succès</strong>.
        </p>

        <div class="info-card">
            <div class="info-row">
                <span class="info-label">Référence</span>
                <span class="info-value">{{ $supplyRequest->reference }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Type</span>
                <span class="info-value">{{ $supplyRequest->type->label() }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Réceptionné le</span>
                <span class="info-value">
                    {{ $supplyRequest->received_at?->format('d/m/Y à H:i') ?? 'N/A' }}
                </span>
            </div>
        </div>

        <p>
            Connectez-vous à votre espace pour consulter les détails complets de cette réception.
        </p>
    </div>
@endsection
