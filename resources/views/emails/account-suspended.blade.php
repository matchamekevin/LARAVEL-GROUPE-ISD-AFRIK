<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compte suspendu</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        .title {
            color: #dc2626;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
        }
        .content {
            color: #374151;
            margin-bottom: 30px;
        }
        .reason-box {
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .reason-title {
            color: #991b1b;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .reason-text {
            color: #7f1d1d;
            font-size: 14px;
        }
        .footer {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 4px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .contact-link {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="icon">⚠️</div>
                <h1 class="title">Compte suspendu</h1>
                <p class="subtitle">Votre accès a été temporairement désactivé</p>
            </div>

            <div class="content">
                <p>Bonjour {{ $prenom }} {{ $nom }},</p>
                
                <p>Nous vous informons que votre compte sur la plateforme <strong>ISD AFRIK</strong> a été suspendu.</p>

                @if($reason)
                <div class="reason-box">
                    <div class="reason-title">Raison :</div>
                    <div class="reason-text">{{ $reason }}</div>
                </div>
                @endif

                <p>Cela signifie que vous n'avez plus accès à votre compte jusqu'à ce qu'il soit réactivé.</p>

                <p style="color: #6b7280; font-size: 14px;">
                    Si vous pensez qu'il y a une erreur ou si vous avez besoin de contacter le support, 
                    veuillez <a href="mailto:support@isd-afrik.com" class="contact-link">nous contacter</a>.
                </p>
            </div>

            <div class="footer">
                <p style="margin: 0;">© {{ date('Y') }} ISD AFRIK. Tous droits réservés.</p>
                <p style="margin: 10px 0 0;">Pour toute question, contactez-nous à support@isd-afrik.com</p>
            </div>
        </div>
    </div>
</body>
</html>
