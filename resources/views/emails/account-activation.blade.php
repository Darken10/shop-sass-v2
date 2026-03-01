<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>Activez votre compte &mdash; {{ config('app.name') }}</title>
    <style>
        body{margin:0;padding:0;background-color:#eeecfd;}
        table{border-spacing:0;}
        @media only screen and (max-width:600px){
            .w600{width:100%!important;}
            .pad{padding:28px 20px!important;}
            .hpad{padding:32px 20px!important;}
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#eeecfd;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eeecfd;">
<tr><td align="center" style="padding:40px 16px;">

    <table role="presentation" class="w600" width="600" cellspacing="0" cellpadding="0" border="0"
           style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(74,40,196,0.12);">

        <!-- Stripe top -->
        <tr><td style="height:5px;font-size:0;line-height:0;background:linear-gradient(90deg,#4a28c4,#7c52f0,#a78bfa);"></td></tr>

        <!-- Header -->
        <tr><td class="hpad" align="center"
                style="padding:42px 48px 38px;background:linear-gradient(155deg,#2e1a85 0%,#4a28c4 50%,#7048e8 100%);">

            <!-- Brand -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 22px;">
            <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 13px;line-height:0;vertical-align:middle;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
                        <line x1="3" y1="6" x2="21" y2="6" stroke="#fff" stroke-width="2"/>
                        <path d="M16 10a4 4 0 01-8 0" stroke="#fff" stroke-width="2"/>
                    </svg>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.4px;">{{ config('app.name') }}</span>
                </td>
            </tr>
            </table>

            <!-- Badge -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 18px;">
            <tr><td style="background:rgba(255,255,255,0.18);border-radius:20px;padding:5px 18px;">
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ddd6fe;">Activation de compte</span>
            </td></tr>
            </table>

            <!-- Title -->
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;letter-spacing:-0.5px;">Activez votre compte</p>
            <p style="margin:10px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.70);line-height:1.5;">Un compte a &eacute;t&eacute; cr&eacute;&eacute; pour vous</p>

        </td></tr>

        <!-- Body -->
        <tr><td class="pad" style="padding:40px 48px;">

            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:18px;font-weight:700;color:#1e1528;">Bonjour {{ $user->name }},</p>

            <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;color:#4a4067;line-height:1.7;">
                Un compte a &eacute;t&eacute; cr&eacute;&eacute; pour vous sur <strong style="color:#1e1528;">{{ config('app.name') }}</strong>.
                Cliquez sur le bouton ci-dessous pour d&eacute;finir votre mot de passe et activer votre acc&egrave;s.
            </p>

            <!-- Info card -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                   style="background:#f5f3ff;border-radius:12px;border-left:3px solid #7c52f0;margin:0 0 28px;">
                <tr><td style="padding:14px 20px;border-bottom:1px solid #ede8fb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
                        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#8b7fae;font-weight:500;">Adresse e-mail</td>
                        <td align="right" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#1e1528;font-weight:700;">{{ $user->email }}</td>
                    </tr></table>
                </td></tr>
                <tr><td style="padding:14px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
                        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#8b7fae;font-weight:500;">Lien valide jusqu'au</td>
                        <td align="right" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#1e1528;font-weight:700;">{{ now()->addHours(24)->format('d/m/Y \à H:i') }}</td>
                    </tr></table>
                </td></tr>
            </table>

            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;color:#4a4067;line-height:1.7;">
                Ce lien expire dans <strong style="color:#1e1528;">24 heures</strong>. Pass&eacute; ce d&eacute;lai, contactez votre administrateur.
            </p>

            <!-- CTA -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px auto 0;">
            <tr><td align="center" style="border-radius:11px;background:linear-gradient(135deg,#4a28c4,#7c52f0);box-shadow:0 6px 20px rgba(74,40,196,0.35);">
                <a href="{{ $activationUrl }}"
                   style="display:inline-block;padding:16px 44px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none;border-radius:11px;">
                    Activer mon compte
                </a>
            </td></tr>
            </table>

            <p style="margin:18px 0 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;color:#a89fc8;line-height:1.7;">
                Bouton inaccessible&nbsp;? Copiez ce lien&nbsp;:<br>
                <a href="{{ $activationUrl }}" style="color:#7c52f0;word-break:break-all;">{{ $activationUrl }}</a>
            </p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="background:#f8f6ff;border-top:1px solid #ede8fb;padding:26px 48px;">
            <p style="margin:0 0 5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12.5px;color:#8b7fae;line-height:1.8;">
                Envoy&eacute; par <strong style="color:#5b35d5;">{{ config('app.name') }}</strong> &mdash; Pour toute question, contactez votre administrateur.
            </p>
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;color:#bbb3d8;">
                &copy; {{ date('Y') }} {{ config('app.name') }}. Tous droits r&eacute;serv&eacute;s.
            </p>
        </td></tr>

    </table>

</td></tr>
</table>
</body>
</html>
