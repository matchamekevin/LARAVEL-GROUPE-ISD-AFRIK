<?php

namespace App\Http\Controllers;

use App\Models\HomeCollaborator;
use App\Services\Base64ImageService;
use Illuminate\Http\Request;

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
                'id' => (string) \Illuminate\Support\Str::uuid(),
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

        $encoded = Base64ImageService::encode($request->file('image'));
        $validated['image_data'] = $encoded['data'];
        $validated['image_mime'] = $encoded['mime'];
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
            $encoded = Base64ImageService::encode($request->file('image'));
            $validated['image_data'] = $encoded['data'];
            $validated['image_mime'] = $encoded['mime'];
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $collaborator->update($validated);

        return response()->json($collaborator->fresh());
    }

    public function image(HomeCollaborator $collaborator)
    {
        if ($collaborator->image_data) {
            return Base64ImageService::response($collaborator->image_data, $collaborator->image_mime);
        }
        abort(404);
    }

    public function destroy(HomeCollaborator $collaborator)
    {
        $collaborator->delete();

        return response()->json(['success' => true]);
    }
}
