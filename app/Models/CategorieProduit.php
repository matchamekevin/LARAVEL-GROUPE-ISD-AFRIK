<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategorieProduit extends Model
{
    use HasFactory;

    protected $table = 'categories_produits';
    protected $primaryKey = 'id_categorie';
    public $timestamps = true;

    protected $hidden = ['image_data', 'image_mime'];

    protected $fillable = [
        'nom',
        'description',
        'segment',
        'image_url',
        'image',
        'image_data',
        'image_mime',
        'slug',
        'icone',
        'parent_id',
        'ordre',
        'display_mode',
        'actif',
    ];

    // Relation inverse : une catégorie a plusieurs produits
    public function produits()
    {
        return $this->hasMany(Produit::class, 'id_categorie', 'id_categorie');
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id', 'id_categorie');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id', 'id_categorie')
            ->orderBy('ordre')
            ->orderBy('nom');
    }

    public function childrenRecursive()
    {
        return $this->children()->with('childrenRecursive');
    }

    public function isLeaf(): bool
    {
        return ! $this->children()->exists();
    }

    /**
     * Retourne le fil d'Ariane sous forme de tableau d'ancêtres (racine -> courant).
     * Utile côté frontend pour générer le breadcrumb.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getBreadcrumbAttribute(): array
    {
        $crumbs = [];
        $node = $this;

        while ($node) {
            array_unshift($crumbs, [
                'id_categorie' => $node->id_categorie,
                'nom' => $node->nom,
                'slug' => $node->slug,
            ]);

            $node = $node->parent;
        }

        return $crumbs;
    }

    /**
     * Get all categories in a flat list with indentation for select boxes.
     */
    public static function getTreeOptions(): array
    {
        $roots = self::whereNull('parent_id')
            ->orderBy('ordre')
            ->orderBy('nom')
            ->get();

        $options = [];
        foreach ($roots as $root) {
            $options[$root->id_categorie] = $root->nom;
            self::appendChildrenToOptions($root, $options, 1);
        }

        return $options;
    }

    private static function appendChildrenToOptions($parent, &$options, $level): void
    {
        foreach ($parent->children as $child) {
            $options[$child->id_categorie] = str_repeat('— ', $level) . $child->nom;
            self::appendChildrenToOptions($child, $options, $level + 1);
        }
    }
}
