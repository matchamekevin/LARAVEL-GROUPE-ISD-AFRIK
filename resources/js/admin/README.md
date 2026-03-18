Installation et utilisation rapide du front Admin

1) Entrée Vite
 - Le fichier `vite.config.js` a été mis à jour pour inclure `resources/js/admin/main.jsx`.

2) Montage
 - Créez une vue blade `resources/views/admin.blade.php` contenant un `<div id="admin-root"></div>` et incluez les assets Vite:

```php
<!doctype html>
<html>
  <head>
    @vite('resources/js/admin/main.jsx')
  </head>
  <body>
    <div id="admin-root"></div>
  </body>
</html>
```

3) Lancer en dev

```bash
npm run dev
```

4) Prochaine étape
 - Intégrer l'auth (Sanctum/session), appels API et pages CRUD.

4) Commandes utiles

- Démarrage dev Vite (rebuilde les assets et hot reload):

```bash
npm run dev
```

- Build assets pour production:

```bash
npm run build
```

5) Route d'administration

Crée une route dans `routes/web.php` pour servir la vue admin si besoin:

```php
Route::get('/admin', function(){
  return view('admin');
})->middleware('auth');
```

6) Remarques

- Les endpoints `/api/users`, `/api/products`, `/api/orders` doivent exister côté Laravel (GET/POST/PUT/DELETE selon actions). Utilise `sanctum` stateful pour l'auth SPA (configuration déjà présente).
- Pour améliorer l'UI, on peut remplacer les alerts JSON par une modal React.

