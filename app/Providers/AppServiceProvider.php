<?php

namespace App\Providers;

use App\Models\Blog;
use App\Models\CategorieProduit;
use App\Models\Commande;
use App\Models\Commentaire;
use App\Models\ContactMessage;
use App\Models\DevisPrestation;
use App\Models\Formation;
use App\Models\FormationParticipant;
use App\Models\HomeCollaborator;
use App\Models\HomeGeovisionSection;
use App\Models\HomeMarketingCard;
use App\Models\HomePartner;
use App\Models\HomeTestimonial;
use App\Models\Image;
use App\Models\LignesCommande;
use App\Models\Newsletter;
use App\Models\Paiement;
use App\Models\Pays;
use App\Models\Produit;
use App\Models\Projet;
use App\Models\ReservationFormation;
use App\Models\RevendeurDemande;
use App\Models\TicketSupport;
use App\Models\Utilisateur;
use App\Observers\ModelChangeObserver;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::useScriptTagAttributes([
            'crossorigin' => 'anonymous',
        ]);

        Relation::enforceMorphMap([
            'utilisateur' => 'App\Models\Utilisateur',
            'user' => 'App\Models\Utilisateur',
            'FORMATION' => 'App\Models\Formation',
            'PRODUIT' => 'App\Models\Produit',
            'commande' => 'App\Models\Commande',
            'BLOG' => 'App\Models\Blog',
        ]);

        if (app()->environment('production')) {
            URL::forceScheme('https');
        }

        $this->registerModelObservers();
    }

    private function registerModelObservers(): void
    {
        $models = [
            Blog::class,
            CategorieProduit::class,
            Commande::class,
            Commentaire::class,
            ContactMessage::class,
            DevisPrestation::class,
            Formation::class,
            FormationParticipant::class,
            HomeCollaborator::class,
            HomeGeovisionSection::class,
            HomeMarketingCard::class,
            HomePartner::class,
            HomeTestimonial::class,
            Image::class,
            LignesCommande::class,
            Newsletter::class,
            Paiement::class,
            Pays::class,
            Produit::class,
            Projet::class,
            ReservationFormation::class,
            RevendeurDemande::class,
            TicketSupport::class,
            Utilisateur::class,
        ];

        foreach ($models as $model) {
            $model::observe(ModelChangeObserver::class);
        }
    }
}
