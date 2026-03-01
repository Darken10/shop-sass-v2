<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>@yield('subject', config('app.name'))</title>
    <style>
        /* Reset */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: #f5f4fc;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.6;
            color: #1e1b2e;
            -webkit-font-smoothing: antialiased;
        }

        /* Wrapper */
        .wrapper {
            width: 100%;
            background-color: #f5f4fc;
            padding: 40px 16px;
        }

        /* Container */
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(91, 56, 209, 0.08);
        }

        /* Header */
        .header {
            background: linear-gradient(135deg, #5b38d1 0%, #7c3aed 100%);
            padding: 32px 40px;
            text-align: center;
        }
        .header .brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }
        .header .brand-icon {
            width: 38px;
            height: 38px;
            background-color: rgba(255,255,255,0.2);
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .header .brand-icon svg {
            width: 22px;
            height: 22px;
            fill: #ffffff;
        }
        .header .brand-name {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.3px;
        }

        /* Alert badge (optionnel) */
        .alert-badge {
            display: inline-block;
            margin-top: 16px;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .alert-badge.info    { background: rgba(255,255,255,0.2); color: #fff; }
        .alert-badge.success { background: rgba(52,211,153,0.25); color: #d1fae5; }
        .alert-badge.warning { background: rgba(251,191,36,0.25);  color: #fef3c7; }
        .alert-badge.danger  { background: rgba(248,113,113,0.25); color: #fee2e2; }

        /* Body */
        .body {
            padding: 36px 40px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1e1b2e;
            margin-bottom: 16px;
        }
        .content p {
            margin-bottom: 14px;
            color: #4b4567;
        }
        .content strong {
            color: #1e1b2e;
        }

        /* Info card */
        .info-card {
            background-color: #f5f4fc;
            border-left: 3px solid #7c3aed;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 20px 0;
        }
        .info-card .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid #e8e4f8;
            font-size: 13.5px;
        }
        .info-card .info-row:last-child {
            border-bottom: none;
        }
        .info-card .info-label {
            color: #7c6fa0;
            font-weight: 500;
        }
        .info-card .info-value {
            color: #1e1b2e;
            font-weight: 600;
            text-align: right;
        }

        /* CTA Button */
        .btn-wrapper {
            text-align: center;
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #5b38d1 0%, #7c3aed 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 13px 32px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.2px;
        }

        /* Divider */
        .divider {
            border: none;
            border-top: 1px solid #ede9f8;
            margin: 24px 0;
        }

        /* Notice */
        .notice {
            font-size: 12.5px;
            color: #9e95c0;
            margin-top: 8px;
        }

        /* Footer */
        .footer {
            background-color: #f5f4fc;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #ede9f8;
        }
        .footer p {
            font-size: 12px;
            color: #9e95c0;
            line-height: 1.7;
        }
        .footer .footer-app-name {
            color: #7c3aed;
            font-weight: 600;
        }

        /* Responsive */
        @media only screen and (max-width: 600px) {
            .body, .footer { padding: 24px 20px; }
            .header { padding: 24px 20px; }
            .info-card .info-row { flex-direction: column; align-items: flex-start; gap: 2px; }
        }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="container">

        {{-- Header --}}
        <div class="header">
            <span class="brand">
                <span class="brand-icon">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                    </svg>
                </span>
                <span class="brand-name">{{ config('app.name') }}</span>
            </span>
            @hasSection('badge')
                <br>
                <span class="alert-badge {{ $badgeType ?? 'info' }}">@yield('badge')</span>
            @endif
        </div>

        {{-- Body --}}
        <div class="body">
            @yield('content')

            @hasSection('action_url')
                <div class="btn-wrapper">
                    <a href="@yield('action_url')" class="btn">@yield('action_label', 'Voir les détails')</a>
                </div>
                <p class="notice">
                    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                    <a href="@yield('action_url')" style="color: #7c3aed; word-break: break-all; font-size: 12px;">@yield('action_url')</a>
                </p>
            @endif
        </div>

        {{-- Footer --}}
        <div class="footer">
            <p>
                Cet e-mail a été envoyé par <span class="footer-app-name">{{ config('app.name') }}</span>.<br>
                Si vous avez des questions, contactez votre administrateur.
            </p>
            <p style="margin-top: 8px;">© {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.</p>
        </div>

    </div>
</div>
</body>
</html>
