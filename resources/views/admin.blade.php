<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="icon" type="image/webp" href="{{ asset('logo.webp') }}">
    <link rel="shortcut icon" href="{{ asset('logo.webp') }}">
    <link rel="apple-touch-icon" href="{{ asset('logo.webp') }}">
    @viteReactRefresh
    @vite('resources/js/admin/main.jsx')
    <title>Admin</title>
  </head>
  <body>
    <div id="admin-root"></div>
  </body>
</html>
