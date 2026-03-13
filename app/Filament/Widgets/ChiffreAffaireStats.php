<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use App\Models\Facture;
use App\Models\Utilisateur;

class ChiffreAffaireStats extends BaseWidget
{
    protected function getStats(): array
    {
        $user = auth()->user();

        // Construire la requête de base
        $facturesQuery = Facture::query();
        
        // Appliquer le filtre si l'utilisateur est admin pays
        if (method_exists($user, 'isAdminPays') && $user->isAdminPays()) {
            $facturesQuery->where('id_pays', $user->id_pays);
        }

        $totalFactures = $facturesQuery->count();
        
        // Reconstruire la requête pour le montant
        $facturesQueryMontant = Facture::query();
        if (method_exists($user, 'isAdminPays') && $user->isAdminPays()) {
            $facturesQueryMontant->where('id_pays', $user->id_pays);
        }
        $chiffreAffaire = $facturesQueryMontant->sum('montant') ?? 0;
        
        $clientsActifs = Utilisateur::where('statut', true)->count();

        return [
            Stat::make('Nombre de factures', $totalFactures)
                ->description('Factures émises')
                ->descriptionIcon('heroicon-m-document-text')
                ->color('success'),

            Stat::make('Chiffre d\'affaires', number_format($chiffreAffaire, 0, ',', ' ') . ' FCFA')
                ->description('Montant total')
                ->descriptionIcon('heroicon-m-currency-dollar')
                ->color('primary'),

            Stat::make('Clients actifs', $clientsActifs)
                ->description('Utilisateurs actifs')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('warning'),
        ];
    }
}