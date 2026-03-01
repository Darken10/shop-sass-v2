@extends('emails.layout')

@section('subject', 'Activez votre compte')
@section('badge', 'Activation de compte')
@php $badgeType = 'info'; @endphp

@section('content')
    <p class="greeting">Bonjour {{ $user->name }},</p>

    <div class="content">
        <p>
            Un compte a été créé pour vous sur <strong>{{ config('app.name') }}</strong>.
            Pour commencer, veuillez cliquer sur le bouton ci-dessous afin de définir votre mot de passe et activer votre compte.
        </p>

        <div class="info-card">
            <div class="info-row">
                <span class="info-label">Adresse e-mail</span>
                <span class="info-value">{{ $user->email }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Lien valide jusqu'au</span>
                <span class="info-value">{{ now()->addHours(24)->format('d/m/Y à H:i') }}</span>
            </div>
        </div>

        <p>
            Ce lien expire dans <strong>24 heures</strong>. Passé ce délai, vous devrez contacter votre administrateur pour obtenir un nouveau lien.
        </p>
    </div>
@endsection

@section('action_url', $activationUrl)
@section('action_label', 'Activer mon compte')
