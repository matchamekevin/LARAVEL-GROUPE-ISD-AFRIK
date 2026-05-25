<?php

namespace App\Filament\Resources\Produits\Pages;

use App\Filament\Resources\Produits\ProduitResource;
use App\Models\CategorieProduit;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\Page;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;
use Livewire\WithFileUploads;

class ManageProduitSubcategories extends Page
{
    use WithFileUploads;

    protected static string $resource = ProduitResource::class;

    protected string $view = 'filament.resources.produits.pages.manage-produit-subcategories';

    protected static ?string $title = 'Sous-catégories';

    public ?string $parentCategoryId = null;

    public bool $isCreateModalOpen = false;

    public bool $isEditModalOpen = false;

    public ?string $editingSubcategoryId = null;

    public array $form = [
        'nom' => '',
        'slug' => '',
        'description' => '',
        'image_url' => '',
        'parent_id' => null,
        'ordre' => 0,
        'actif' => true,
    ];

    public TemporaryUploadedFile|string|null $imageUpload = null;

    public function mount(): void
    {
        $firstParent = $this->parentCategories()->first();

        $this->parentCategoryId = $firstParent?->id_categorie;
        $this->form['parent_id'] = $this->parentCategoryId;
    }

    public function getTitle(): string
    {
        return 'Sous-catégories produits';
    }

    public function getHeading(): string
    {
        return 'Sous-catégories';
    }

    public function getSubheading(): ?string
    {
        return 'Gestion des sous-catégories liée directement à la base de données.';
    }

    public function getParentCategoriesProperty()
    {
        return $this->parentCategories();
    }

    public function getSubcategoriesProperty()
    {
        if (! $this->parentCategoryId) {
            return collect();
        }

        // Pour supporter plusieurs niveaux, on peut soit afficher tout l'arbre,
        // soit seulement les enfants directs de la catégorie sélectionnée (même si c'est une sous-catégorie).
        return CategorieProduit::query()
            ->withCount('produits')
            ->where('parent_id', $this->parentCategoryId)
            ->orderBy('ordre')
            ->orderBy('nom')
            ->get();
    }

    public function getAllCategoryOptionsProperty(): array
    {
        return CategorieProduit::getTreeOptions();
    }

    public function updatedParentCategoryId($value): void
    {
        $this->parentCategoryId = $value ?: null;
        $this->form['parent_id'] = $this->parentCategoryId;
    }

    public function openCreateModal(): void
    {
        $this->resetForm();
        $this->form['parent_id'] = $this->parentCategoryId;
        $this->isCreateModalOpen = true;
    }

    public function openEditModal(string $subcategoryId): void
    {
        $subcategory = CategorieProduit::query()->findOrFail($subcategoryId);

        $this->editingSubcategoryId = $subcategory->id_categorie;
        $this->form = [
            'nom' => (string) $subcategory->nom,
            'slug' => (string) ($subcategory->slug ?? ''),
            'description' => (string) ($subcategory->description ?? ''),
            'image_url' => (string) ($subcategory->image_url ?? $subcategory->image ?? ''),
            'parent_id' => $subcategory->parent_id ?: null,
            'ordre' => (int) ($subcategory->ordre ?? 0),
            'actif' => (bool) $subcategory->actif,
        ];
        $this->parentCategoryId = $this->form['parent_id'];
        $this->imageUpload = null;
        $this->isEditModalOpen = true;
    }

    public function closeModals(): void
    {
        $this->isCreateModalOpen = false;
        $this->isEditModalOpen = false;
        $this->resetForm();
    }

    public function createSubcategory(): void
    {
        $data = $this->validateForm();

        CategorieProduit::query()->create($this->preparePayload($data));

        $this->closeModals();

        Notification::make()
            ->title('Sous-catégorie créée avec succès.')
            ->success()
            ->send();
    }

    public function updateSubcategory(): void
    {
        if (! $this->editingSubcategoryId) {
            return;
        }

        $subcategory = CategorieProduit::query()->findOrFail($this->editingSubcategoryId);

        $oldImageUrl = $subcategory->image_url ?? $subcategory->image;
        $hasNewUpload = $this->imageUpload instanceof TemporaryUploadedFile;

        $data = $this->validateForm($subcategory);
        $payload = $this->preparePayload($data, $subcategory);

        // Si un nouvel upload image remplace l'ancienne, supprimer le fichier précédent du disque.
        if ($hasNewUpload && ! empty($oldImageUrl)) {
            $oldNormalized = (string) $oldImageUrl;

            // Si c'est une URL complète, ne garder que le path.
            if (str_starts_with($oldNormalized, 'http://') || str_starts_with($oldNormalized, 'https://')) {
                $oldNormalized = parse_url($oldNormalized, PHP_URL_PATH) ?: '';
            }

            // Si c'est une URL du type /storage/xxx, convertir en chemin disque.
            if (str_starts_with($oldNormalized, '/storage/')) {
                $oldPath = ltrim(substr($oldNormalized, strlen('/storage/')), '/');
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }
        }

        $subcategory->update($payload);

        $this->closeModals();

        Notification::make()
            ->title('Sous-catégorie mise à jour avec succès.')
            ->success()
            ->send();
    }

    public function deleteSubcategory(string $subcategoryId): void
    {
        $subcategory = CategorieProduit::query()
            ->with(['produits', 'childrenRecursive'])
            ->withCount('produits')
            ->findOrFail($subcategoryId);

        $totalProducts = $subcategory->produits_count + $subcategory->childrenRecursive->sum('produits_count');

        // Cascade delete children first (recursive handled by relation)
        $subcategory->children()->delete();

        // Force delete all products (admin action, permanent)
        $subcategory->produits()->forceDelete();

        // Then delete category
        $subcategory->forceDelete();

        if ($this->editingSubcategoryId === $subcategoryId) {
            $this->closeModals();
        }

        Notification::make()
            ->title('Catégorie supprimée avec succès')
            ->body("{$totalProducts} produit(s) ont été supprimés en cascade.")
            ->success()
            ->send();
    }

    protected function parentCategories()
    {
        // On permet maintenant de sélectionner n'importe quelle catégorie comme "parente"
        // pour gérer ses propres sous-catégories.
        return CategorieProduit::query()
            ->orderBy('ordre')
            ->orderBy('nom')
            ->get();
    }

    protected function validateForm(?CategorieProduit $subcategory = null): array
    {
        return $this->validate([
            'form.nom' => ['required', 'string', 'max:255'],
            'form.slug' => [
                'nullable',
                'string',
                'max:160',
                Rule::unique('categories_produits', 'slug')
                    ->ignore($subcategory?->id_categorie, 'id_categorie'),
            ],
            'form.description' => ['nullable', 'string'],
            'form.image_url' => ['nullable', 'string', 'max:255'],
            'form.parent_id' => ['nullable', 'string', 'exists:categories_produits,id_categorie'],
            'form.ordre' => ['nullable', 'integer', 'min:0'],
            'form.actif' => ['boolean'],
            'imageUpload' => ['nullable', 'image', 'max:5120'],
        ])['form'];
    }

    protected function preparePayload(array $data, ?CategorieProduit $subcategory = null): array
    {
        if ($this->imageUpload instanceof TemporaryUploadedFile) {
            $storedPath = $this->imageUpload->store('geovision-categories', 'public');
            $data['image_url'] = Storage::disk('public')->url($storedPath);
        }

        if (blank($data['slug']) && filled($data['nom'])) {
            $data['slug'] = Str::slug($data['nom']);
        }

        $parent = CategorieProduit::query()->find($data['parent_id']);

        if ($parent && blank($data['segment'])) {
            $data['segment'] = $parent->segment ?? 'general';
        } elseif ($subcategory && blank($data['segment'])) {
            $data['segment'] = $subcategory->segment ?? 'general';
        } else {
            $data['segment'] = 'general';
        }

        if (! empty($data['image_url'])) {
            $data['image'] = $data['image_url'];
        }

        $data['actif'] = (bool) ($data['actif'] ?? true);
        $data['ordre'] = (int) ($data['ordre'] ?? 0);

        return $data;
    }

    protected function resetForm(): void
    {
        $this->resetValidation();
        $this->editingSubcategoryId = null;
        $this->imageUpload = null;
        $this->form = [
            'nom' => '',
            'slug' => '',
            'description' => '',
            'image_url' => '',
            'parent_id' => $this->parentCategoryId,
            'ordre' => 0,
            'actif' => true,
        ];
        $this->isCreateModalOpen = false;
        $this->isEditModalOpen = false;
    }
}
