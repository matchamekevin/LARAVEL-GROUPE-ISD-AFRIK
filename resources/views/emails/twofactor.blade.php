<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Code de vérification</title>
    <style>
        body { background-color: #f4f6f8; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
        .header { background: #0ea5a4; padding: 20px; text-align: center; color: #ffffff; }
        .content { padding: 24px; }
        .code { display: inline-block; padding: 14px 22px; background: #f1f5f9; border-radius: 8px; font-weight: 700; font-size: 28px; letter-spacing: 6px; font-family: 'Courier New', monospace; color: #071129; margin: 16px 0; }
        .muted { color: #6b7280; font-size: 14px; }
        .footer { padding: 16px; text-align: center; color: #9ca3af; font-size: 13px; background: #fafafa; }
        @media (max-width: 420px) { .code { font-size: 24px; padding: 12px 18px; } }
    </style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
        <td align="center">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                    <td class="header">
                        <h1 style="margin:0;font-size:20px">{{ config('app.name', 'ISD AFRIK') }}</h1>
                    </td>
                </tr>
                <tr>
                    <td class="content">
                        <p style="margin:0 0 12px 0">Bonjour {{ $nom ?? '' }},</p>
                        <p style="margin:0 0 12px 0">Voici votre code de vérification à 6 chiffres :</p>
                        <div class="code" align="center">{{ $code }}</div>
                        <p class="muted">Ce code expire dans 10 minutes. Ne le transmettez à personne.</p>
                        <p style="margin:18px 0 0 0">Si vous n'avez pas demandé ce code, ignorez simplement cet e‑mail.</p>
                    </td>
                </tr>
                <tr>
                    <td class="footer">
                        <p style="margin:0">© {{ date('Y') }} {{ config('app.name', 'ISD AFRIK') }} — Besoin d'aide ? Répondez à cet e‑mail.</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>