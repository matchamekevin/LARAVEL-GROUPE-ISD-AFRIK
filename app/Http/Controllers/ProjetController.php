<?php

namespace App\Http\Controllers;

use App\Models\Projet;
use Illuminate\Http\Request;

class ProjetController extends Controller
{
    private const DEFAULT_PROJECTS = [
        [
            'title' => "Plateforme ERP & CRM",
            'category' => "Solutions digitales",
            'description' => "Mise en place d'une plateforme ERP/CRM pour centraliser les ventes, la relation client et le pilotage financier.",
            'long_desc' => "Déploiement d'une suite ERP/CRM connectée aux équipes terrain avec tableaux de bord décisionnels, workflow d'approbation et synchronisation multi-sites.",
            'url' => null,
            'slug' => 'plateforme-erp-crm',
            'image_path' => '/images/solutions/im1.webp',
            'is_active' => true,
            'sort_order' => 10,
        ],
        [
            'title' => "Vidéosurveillance intelligente",
            'category' => "Sécurité",
            'description' => "Installation d'un système de vidéosurveillance IP avec supervision centralisée.",
            'long_desc' => "Conception et déploiement d'un dispositif de vidéo-protection avec analytics, alertes en temps réel et maintenance proactive.",
            'url' => null,
            'slug' => 'videosurveillance-intelligente',
            'image_path' => '/images/solutions/im3.webp',
            'is_active' => true,
            'sort_order' => 20,
        ],
        [
            'title' => "Pilotage drone industriel",
            'category' => "Drones",
            'description' => "Fourniture de drones et formation opérationnelle pour l'inspection et la surveillance.",
            'long_desc' => "Mise en place d'un programme complet incluant équipements, formation des pilotes et procédures de maintenance.",
            'url' => null,
            'slug' => 'pilotage-drone-industriel',
            'image_path' => '/images/solutions/im4.webp',
            'is_active' => true,
            'sort_order' => 30,
        ],
        [
            'title' => "Archivage numérique & GED",
            'category' => "Archivage",
            'description' => "Digitalisation et gestion documentaire pour optimiser l'accès aux informations.",
            'long_desc' => "Déploiement d'une plateforme GED avec indexation intelligente, workflows d'approbation et politique de conservation.",
            'url' => null,
            'slug' => 'archivage-numerique-ged',
            'image_path' => '/images/produits/int.webp',
            'is_active' => true,
            'sort_order' => 40,
        ],
        [
            'title' => "Infrastructure réseau d'entreprise",
            'category' => "Infrastructure",
            'description' => "Refonte complète du réseau LAN/WAN avec segmentation et sécurité renforcée.",
            'long_desc' => "Architecture réseau redondée, mise en place de VLAN, QoS et supervision 24/7 pour assurer la continuité d'activité.",
            'url' => null,
            'slug' => 'infrastructure-reseau-entreprise',
            'image_path' => '/images/produits/proj.webp',
            'is_active' => true,
            'sort_order' => 50,
        ],
        [
            'title' => "Transformation digitale RH & Paie",
            'category' => "Transformation",
            'description' => "Automatisation des processus RH et paie pour un pilotage fiable et sécurisé.",
            'long_desc' => "Implémentation d'outils RH intégrés avec portail collaborateurs, workflow de validation et reporting mensuel.",
            'url' => null,
            'slug' => 'transformation-digitale-rh-paie',
            'image_path' => '/images/solutions/im2.webp',
            'is_active' => true,
            'sort_order' => 60,
        ],
    ];

    private function seedDefaultsIfEmpty(): void
    {
        if (Projet::query()->exists()) {
            return;
        }

        foreach (self::DEFAULT_PROJECTS as $project) {
            Projet::query()->create($project);
        }
    }

    public function image(Projet $projet)
    {
        if ($projet->image_data) {
            $data = $projet->image_data;

            if (str_starts_with($data, 'data:')) {
                $parts = explode(',', $data, 2);
                $content = isset($parts[1]) ? base64_decode($parts[1]) : base64_decode($parts[0]);
                preg_match('/^data:(image\/\w+);/', $data, $mime);
                $mimeType = $mime[1] ?? 'image/jpeg';
            } else {
                $content = base64_decode($data);
                $mimeType = 'image/jpeg';
            }

            return response($content, 200, ['Content-Type' => $mimeType]);
        }

        if ($projet->image_path) {
            $path = $projet->image_path;
            if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
                return redirect()->away($path);
            }

            $localPath = public_path(ltrim($path, '/'));
            if (is_file($localPath)) {
                return response()->file($localPath);
            }
        }

        return response()->noContent(204);
    }

    public function index()
    {
        $this->seedDefaultsIfEmpty();

        return response()->json(
            Projet::query()
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
            Projet::query()
                ->orderBy('sort_order')
                ->orderByDesc('id')
                ->get()
        );
    }

    public function show($slug)
    {
        $projet = Projet::where('slug', $slug)->firstOrFail();
        return response()->json($projet);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'long_desc' => ['nullable', 'string'],
            'url' => ['nullable', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:projets,slug'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $mime = $file->getMimeType();
            $b64 = base64_encode($file->get());
            $validated['image_data'] = 'data:' . $mime . ';base64,' . $b64;
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $projet = Projet::create($validated);

        return response()->json($projet, 201);
    }

    public function update(Request $request, Projet $projet)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'long_desc' => ['nullable', 'string'],
            'url' => ['nullable', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:projets,slug,' . $projet->id],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $mime = $file->getMimeType();
            $b64 = base64_encode($file->get());
            $validated['image_data'] = 'data:' . $mime . ';base64,' . $b64;
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $projet->update($validated);

        return response()->json($projet->fresh());
    }

    public function destroy(Projet $projet)
    {
        $projet->delete();

        return response()->json(['success' => true]);
    }
}
