<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compte réactivé</title>
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
            color: #10b981;
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
        .success-box {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .success-text {
            color: #065f46;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white !important;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .cta-button:hover {
            opacity: 0.9;
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
                <div class="icon">✅</div>
                <h1 class="title">Compte réactivé</h1>
                <p class="subtitle">Bienvenue, vous pouvez à nouveau accéder à votre compte</p>
            </div>

            <div class="content">
                <p>Bonjour {{ $prenom }} {{ $nom }},</p>
                
                <p>Nous sommes heureux de vous informer que votre compte sur la plateforme <strong>ISD AFRIK</strong> a été réactivé.</p>

                <div class="success-box">
                    <div class="success-text">
                        🎉 Vous pouvez maintenant vous connecter et accéder à tous vos services sans restriction.
                    </div>
                </div>

                <p>Vous rétablirez l'accès complet à :</p>
                <ul style="color: #6b7280; font-size: 14px;">
                    <li>Vos formations et cours</li>
                    <li>Vos commandes et produits</li>
                    <li>Vos données personnelles</li>
                    <li>Tous les services de la plateforme</li>
                </ul>

                <center>
                    <a href="{{ config('app.frontend_url', 'https://isd-afrik.com') }}/login" class="cta-button">
                        Se connecter maintenant
                    </a>
                </center>

                <p style="color: #6b7280; font-size: 14px;">
                    Si vous avez besoin d'assistance, n'hésitez pas à 
                    <a href="mailto:support@isd-afrik.com" class="contact-link">nous contacter</a>.
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
