<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Compte Admin ISD AFRIK</title>
</head>
<body>
    <h2>Bonjour {{ $admin->prenom }} {{ $admin->nom }},</h2>

    <p>Un compte administrateur vient d’être créé pour vous sur la plateforme ISD AFRIK.</p>

    <p><strong>Email :</strong> {{ $admin->email }}</p>
    <p><strong>Mot de passe provisoire :</strong> {{ $password }}</p>

    <p>Veuillez vous connecter via <a href="{{ url('/admin/login') }}">ce lien</a> 
    et changer votre mot de passe après la première connexion.</p>

    <p>Merci,<br>L’équipe ISD AFRIK</p>
</body>
</html>