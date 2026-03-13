# Guide d'activation UUID

## Étapes d'implémentation

### 1. Migration UUID (✅ FAIT)
Fichier: `database/migrations/2026_03_09_add_uuid_to_tables.php`
Commande: `php artisan migrate`

Cela ajoutera une colonne `uuid` unique et non-nullable aux tables :
- produits
- utilisateurs
- formations
- commandes
- paiements
- categorie_produits

### 2. Middleware MaskNumericIds (✅ CRÉÉ)
Fichier: `app/Http/Middleware/MaskNumericIds.php`

Pour activer le middleware:

**En Laravel 11+ (bootstrap/app.php):**
```php
use App\Http\Middleware\MaskNumericIds;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(MaskNumericIds::class);
    })
    ->withExceptionHandling()
    ...
```

**Ou en Laravel 10 et antérieur (app/Http/Kernel.php):**
```php
protected $middleware = [
    // ...
    \App\Http\Middleware\MaskNumericIds::class,
];
```

### 3. Configurer modèles Laravel
Chaque modèle doit utiliser uuid comme clé publique:

```php
use Illuminate\Database\Eloquent\Model;

class Produit extends Model
{
    use HasUuids;
    
    protected $keyType = 'string';
    public $incrementing = false;
    
    // ou attribuer uuid à la création
    protected static function booted()
    {
        static::creating(function ($model) {
            if (!$model->uuid) {
                $model->uuid = \Illuminate\Support\Str::uuid();
            }
        });
    }
}
```

### 4. Routes : Utiliser uuid au lieu d'id
Changer dans les routes API:
```php
// Avant
Route::get('/produits/{id}', ...);

// Après
Route::get('/produits/{produit:uuid}', ...);
```

### 5. Frontend : Utiliser UUIDs dans les URLs
- Toutes les URLs publiques doivent utiliser `uuid` au lieu de `id_produit`
- Les IDs numériques ne doivent jamais être visibles au client

### Résultats
✅ IDs numériques masqués dans les réponses API
✅ UUIDs exposés comme identifiants publics
✅ Protection débilitation énumération (enumeration attack)
✅ Compatible avec la base de données existante

## Notes
- La migration est progressive (n'efface pas l'id existant)
- Les IDs numériques restent en DB pour performance/indices
- UUIDs sont générés automatiquement pour les enregistrements existants
