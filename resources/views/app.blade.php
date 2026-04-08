<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/webp" href="{{ asset('logo.webp') }}">
    <link rel="shortcut icon" href="{{ asset('logo.webp') }}">
    <link rel="apple-touch-icon" href="{{ asset('logo.webp') }}">
    <title>ISD AFRIK</title>
    @vite('resources/css/app.css')
</head>
<body class="font-[Corbel] bg-gray-50 text-gray-900">
    <div id="react-root"></div>
    @viteReactRefresh
    @vite('resources/js/app.jsx')
</body>
</html>