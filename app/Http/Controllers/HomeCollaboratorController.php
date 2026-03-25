<?php

namespace App\Http\Controllers;

use App\Models\HomeCollaborator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HomeCollaboratorController extends Controller
{
    private const DEFAULT_COLLABORATORS = [
        [
            'name' => 'DEV 1',
            'image_path' => '/images/collaborateur/col1.webp',
            'is_active' => true,
            'sort_order' => 10,
        ],
        [
            'name' => 'DEV 2',
            'image_path' => '/images/collaborateur/col2.webp',
            'object_position' => 'center 0%',
            'is_active' => true,
            'sort_order' => 20,
        ],
        [
            'name' => 'DEV 3',
            'image_path' => '/images/collaborateur/col3.webp',
            'is_active' => true,
            'sort_order' => 30,
        ],
        [
            'name' => 'DEV 4',
            'image_path' => '/images/collaborateur/col4.webp',
            'is_active' => true,
            'sort_order' => 40,
        ],
    ];

    private function seedDefaultsIfEmpty(): void
    {
        if (HomeCollaborator::query()->exists()) {
            return;
        }

        $rows = collect(self::DEFAULT_COLLABORATORS)->map(function (array $item) {
            return [
                'name' => $item['name'],
                'image_path' => $item['image_path'],
                'object_position' => $item['object_position'] ?? null,
                'is_active' => $item['is_active'] ?? true,
                'sort_order' => $item['sort_order'] ?? 0,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->all();

        HomeCollaborator::insert($rows);
    }

    private function shouldDeleteStoredImage(?string $path): bool
    {
        if (!$path) {
            return false;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return false;
        }

        return !str_starts_with($path, '/');
    }

    public function index()
    {
        $this->seedDefaultsIfEmpty();

        return response()->json(
            HomeCollaborator::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
        );
    }

    public function adminIndex()
    {
        $this->seedDefaultsIfEmpty();

        return response()->json(
            HomeCollaborator::query()
                ->orderBy('sort_order')
                ->orderByDesc('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'object_position' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $validated['image_path'] = $request->file('image')->store('home-collaborators', 'public');
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $collaborator = HomeCollaborator::create($validated);

        return response()->json($collaborator, 201);
    }

    public function update(Request $request, HomeCollaborator $collaborator)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'object_position' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            if ($this->shouldDeleteStoredImage($collaborator->image_path)) {
                Storage::disk('public')->delete($collaborator->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('home-collaborators', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $collaborator->update($validated);

        return response()->json($collaborator->fresh());
    }

    public function destroy(HomeCollaborator $collaborator)
    {
        if ($this->shouldDeleteStoredImage($collaborator->image_path)) {
            Storage::disk('public')->delete($collaborator->image_path);
        }

        $collaborator->delete();

        return response()->json(['success' => true]);
    }
}
