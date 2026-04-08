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

    public ?int $parentCategoryId = null;

    public bool $isCreateModalOpen = false;

    public bool $isEditModalOpen = false;

    public ?int $editingSubcategoryId = null;

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

        return CategorieProduit::query()
            ->withCount('produits')
            ->where('parent_id', $this->parentCategoryId)
            ->orderBy('ordre')
            ->orderBy('nom')
            ->get();
    }

    public function updatedParentCategoryId($value): void
    {
        $this->parentCategoryId = $value ? (int) $value : null;
        $this->form['parent_id'] = $this->parentCategoryId;
    }

    public function openCreateModal(): void
    {
        $this->resetForm();
        $this->form['parent_id'] = $this->parentCategoryId;
        $this->isCreateModalOpen = true;
    }

    public function openEditModal(int $subcategoryId): void
    {
        $subcategory = CategorieProduit::query()->findOrFail($subcategoryId);

        $this->editingSubcategoryId = (int) $subcategory->id_categorie;
        $this->form = [
            'nom' => (string) $subcategory->nom,
            'slug' => (string) ($subcategory->slug ?? ''),
            'description' => (string) ($subcategory->description ?? ''),
            'image_url' => (string) ($subcategory->image_url ?? $subcategory->image ?? ''),
            'parent_id' => $subcategory->parent_id ? (int) $subcategory->parent_id : null,
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
        $data = $this->validateForm($subcategory);

        $subcategory->update($this->preparePayload($data, $subcategory));

        $this->closeModals();

        Notification::make()
            ->title('Sous-catégorie mise à jour avec succès.')
            ->success()
            ->send();
    }

    public function deleteSubcategory(int $subcategoryId): void
    {
        $subcategory = CategorieProduit::query()
            ->withCount('produits')
            ->findOrFail($subcategoryId);

        if ($subcategory->produits_count > 0) {
            Notification::make()
                ->title('Suppression impossible')
                ->body('Cette sous-catégorie contient encore des produits.')
                ->danger()
                ->send();

            return;
        }

        $subcategory->delete();

        if ($this->editingSubcategoryId === $subcategoryId) {
            $this->closeModals();
        }

        Notification::make()
            ->title('Sous-catégorie supprimée.')
            ->success()
            ->send();
    }

    protected function parentCategories()
    {
        return CategorieProduit::query()
            ->whereNull('parent_id')
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
            'form.parent_id' => ['required', 'integer', 'exists:categories_produits,id_categorie'],
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
