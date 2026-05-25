<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RevendeurDemande extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'revendeur_demandes';

    protected $fillable = [
        'nom_entreprise',
        'statut_juridique',
        'rccm',
        'identifiant_fiscal',
        'annee_creation',
        'adresse_siege',
        'pays',
        'ville',
        'telephone',
        'email_professionnel',
        'site_web',
        'representant_nom',
        'representant_fonction',
        'representant_telephone',
        'representant_email',
        'zone_couverture',
        'experience_annees',
        'marques_distribuees',
        'motivation',
        'equipe_commerciale',
        'equipe_technique',
        'showroom',
        'service_installation_maintenance',
        'activites',
        'documents',
        'statut',
    ];

    protected $casts = [
        'equipe_commerciale' => 'boolean',
        'equipe_technique' => 'boolean',
        'showroom' => 'boolean',
        'service_installation_maintenance' => 'boolean',
        'activites' => 'array',
        'documents' => 'array',
    ];
}
