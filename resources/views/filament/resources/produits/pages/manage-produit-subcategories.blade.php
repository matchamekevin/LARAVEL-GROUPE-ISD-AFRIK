<x-filament-panels::page>
    @php
        $parentCategories = $this->parentCategories;
        $subcategories = $this->subcategories;
        $buttonStyle = 'inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2';
        $primaryButtonStyle = $buttonStyle . ' border-amber-500 bg-white text-amber-600 hover:bg-amber-50';
        $secondaryButtonStyle = $buttonStyle . ' border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
        $dangerButtonStyle = $buttonStyle . ' border-rose-500 bg-white text-rose-600 hover:bg-rose-50';
    @endphp

    <div class="space-y-6">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div class="space-y-1">
                    <h2 class="text-lg font-semibold text-slate-900">Familles de produits</h2>
                    <p class="text-sm text-slate-500">
                        Sélectionnez une catégorie parente pour gérer ses sous-catégories en base de données.
                    </p>
                </div>

                <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label class="min-w-72">
                        <span class="mb-2 block text-sm font-medium text-slate-700">Catégorie parente</span>
                        <select
                            wire:model.live="parentCategoryId"
                            class="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                        >
                            <option value="">Sélectionner une catégorie...</option>
                            @foreach ($this->allCategoryOptions as $id => $nom)
                                <option value="{{ $id }}">{{ $nom }}</option>
                            @endforeach
                        </select>
                    </label>

                    <button type="button" wire:click="openCreateModal" class="{{ $primaryButtonStyle }}">
                        + Créer une sous-catégorie
                    </button>
                </div>
            </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            @forelse ($subcategories as $subcategory)
                <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div class="relative h-52 bg-slate-100">
                        @php
                            $imageSource = $subcategory->image_url ?: $subcategory->image ?: asset('images/produits/proj.webp');
                        @endphp

                        <img
                            src="{{ $imageSource }}"
                            alt="{{ $subcategory->nom }}"
                            class="h-full w-full object-cover"
                        />

                        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/10 to-transparent"></div>

                        <div class="absolute left-4 top-4">
                            <span class="inline-flex items-center rounded-full border border-white/50 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                                {{ $subcategory->actif ? 'Active' : 'Inactive' }}
                            </span>
                        </div>

                        <div class="absolute bottom-4 left-4 right-4">
                            <h3 class="text-lg font-semibold text-white">{{ $subcategory->nom }}</h3>
                            <p class="mt-1 text-sm text-slate-100">
                                {{ $subcategory->slug ?: 'Slug généré automatiquement' }}
                            </p>
                        </div>
                    </div>

                    <div class="space-y-4 p-5">
                        <p class="min-h-12 text-sm leading-6 text-slate-600">
                            {{ $subcategory->description ?: 'Aucune description renseignée pour cette sous-catégorie.' }}
                        </p>

                        <div class="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            <div>
                                <span class="block text-xs uppercase tracking-wide text-slate-400">Ordre</span>
                                <span class="mt-1 block font-semibold text-slate-900">{{ $subcategory->ordre }}</span>
                            </div>

                            <div>
                                <span class="block text-xs uppercase tracking-wide text-slate-400">Produits liés</span>
                                <span class="mt-1 block font-semibold text-slate-900">{{ $subcategory->produits_count }}</span>
                            </div>
                        </div>

                        <div class="flex flex-wrap gap-3 pt-1">
                            <button type="button" wire:click="openEditModal({{ $subcategory->id_categorie }})" class="{{ $primaryButtonStyle }}">
                                Éditer
                            </button>

                            <button
                                type="button"
                                wire:click="deleteSubcategory({{ $subcategory->id_categorie }})"
                                wire:confirm="Supprimer cette sous-catégorie ?"
                                class="{{ $dangerButtonStyle }}"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </article>
            @empty
                <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                    Aucune sous-catégorie trouvée pour cette famille.
                </div>
            @endforelse
        </div>
    </div>

    @if ($isCreateModalOpen || $isEditModalOpen)
        <div class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"></div>

        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900">
                            {{ $isEditModalOpen ? 'Éditer la sous-catégorie' : 'Créer une sous-catégorie' }}
                        </h3>
                        <p class="text-sm text-slate-500">
                            Toutes les modifications sont enregistrées directement en base de données.
                        </p>
                    </div>

                    <button type="button" wire:click="closeModals" class="{{ $secondaryButtonStyle }}">
                        Fermer
                    </button>
                </div>

                <form wire:submit.prevent="{{ $isEditModalOpen ? 'updateSubcategory' : 'createSubcategory' }}" class="space-y-6 px-6 py-6">
                    <div class="grid gap-6 md:grid-cols-2">
                        <label class="space-y-2">
                            <span class="block text-sm font-medium text-slate-700">Nom</span>
                            <input
                                type="text"
                                wire:model.defer="form.nom"
                                class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                placeholder="Ex: TPE"
                            />
                            @error('form.nom') <span class="text-sm text-rose-600">{{ $message }}</span> @enderror
                        </label>

                        <label class="space-y-2">
                            <span class="block text-sm font-medium text-slate-700">Slug</span>
                            <input
                                type="text"
                                wire:model.defer="form.slug"
                                class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                placeholder="Laisser vide pour génération auto"
                            />
                            @error('form.slug') <span class="text-sm text-rose-600">{{ $message }}</span> @enderror
                        </label>

                        <label class="space-y-2">
                            <span class="block text-sm font-medium text-slate-700">Catégorie parente</span>
                            <select
                                wire:model.defer="form.parent_id"
                                class="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            >
                                <option value="">Aucune (Catégorie Racine)</option>
                                @foreach ($this->allCategoryOptions as $id => $nom)
                                    @if (!$isEditModalOpen || $id != $editingSubcategoryId)
                                        <option value="{{ $id }}">{{ $nom }}</option>
                                    @endif
                                @endforeach
                            </select>
                            @error('form.parent_id') <span class="text-sm text-rose-600">{{ $message }}</span> @enderror
                        </label>

                        <label class="space-y-2">
                            <span class="block text-sm font-medium text-slate-700">Ordre</span>
                            <input
                                type="number"
                                min="0"
                                wire:model.defer="form.ordre"
                                class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            />
                            @error('form.ordre') <span class="text-sm text-rose-600">{{ $message }}</span> @enderror
                        </label>
                    </div>

                    <label class="space-y-2">
                        <span class="block text-sm font-medium text-slate-700">Description</span>
                        <textarea
                            rows="4"
                            wire:model.defer="form.description"
                            class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            placeholder="Décrivez brièvement la sous-catégorie"
                        ></textarea>
                        @error('form.description') <span class="text-sm text-rose-600">{{ $message }}</span> @enderror
                    </label>

                    <div class="grid gap-6 md:grid-cols-2">
                        <label class="space-y-2">
                            <span class="block text-sm font-medium text-slate-700">Image upload</span>
                            <input
                                type="file"
                                wire:model="imageUpload"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                class="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-2 file:font-medium file:text-amber-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            />
                            @error('imageUpload') <span class="text-sm text-rose-600">{{ $message }}</span> @enderror
                        </label>

                        <label class="space-y-2">
                            <span class="block text-sm font-medium text-slate-700">URL image</span>
                            <input
                                type="text"
                                wire:model.defer="form.image_url"
                                class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                placeholder="/images/produits/proj.webp"
                            />
                            @error('form.image_url') <span class="text-sm text-rose-600">{{ $message }}</span> @enderror
                        </label>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <span class="mb-3 block text-sm font-medium text-slate-700">Aperçu image</span>

                        @if ($imageUpload)
                            <img src="{{ $imageUpload->temporaryUrl() }}" alt="Prévisualisation" class="h-40 w-full rounded-2xl object-cover">
                        @elseif (filled($form['image_url']))
                            <img src="{{ $form['image_url'] }}" alt="Image actuelle" class="h-40 w-full rounded-2xl object-cover">
                        @else
                            <div class="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                                Aucune image renseignée
                            </div>
                        @endif
                    </div>

                    <label class="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                            type="checkbox"
                            wire:model.defer="form.actif"
                            class="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span class="text-sm font-medium text-slate-700">Sous-catégorie active</span>
                    </label>

                    <div class="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
                        <button type="button" wire:click="closeModals" class="{{ $secondaryButtonStyle }}">
                            Annuler
                        </button>

                        <button type="submit" class="{{ $primaryButtonStyle }}">
                            {{ $isEditModalOpen ? 'Enregistrer les modifications' : 'Créer la sous-catégorie' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</x-filament-panels::page>
