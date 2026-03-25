<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mise à jour de vos accès</title>
</head>
<body>
    <h2>Bonjour {{ $user->prenom }} {{ $user->nom }},</h2>

    <p>Vos acces sur la plateforme ISD AFRIK viennent d'etre mis a jour.</p>

    <p><strong>Rôle précédent :</strong> {{ $details['old_role'] }}</p>
    <p><strong>Nouveau rôle :</strong> {{ $details['new_role'] }}</p>
    <p><strong>Statut actuel :</strong> {{ ucfirst($details['status'] ?? 'actif') }}</p>

    @if (!empty($details['removed']))
        <p><strong>Éléments retirés :</strong></p>
        <ul>
            @foreach ($details['removed'] as $item)
                <li>{{ $item }}</li>
            @endforeach
        </ul>
    @endif

    @if (!empty($details['remaining']))
        <p><strong>Ce qu'il vous reste actuellement :</strong></p>
        <ul>
            @foreach ($details['remaining'] as $item)
                <li>{{ $item }}</li>
            @endforeach
        </ul>
    @endif

    <p>Si vous pensez qu'il s'agit d'une erreur, contactez un super administrateur.</p>

    <p>Merci,<br>L'equipe ISD AFRIK</p>
</body>
</html>
