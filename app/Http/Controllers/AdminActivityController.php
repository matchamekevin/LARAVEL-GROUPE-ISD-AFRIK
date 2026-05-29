<?php

namespace App\Http\Controllers;

use App\Models\AdminLog;
use App\Models\AuditLog;
use App\Models\Commande;
use App\Models\HomeMarketingCard;
use App\Models\Paiement;
use App\Models\Produit;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminActivityController extends Controller
{
    private function normalizeAdminRoleValue(?string $role): string
    {
        $value = strtolower(trim((string) $role));

        if (in_array($value, ['admin_pays', 'admin_national'], true)) {
            return 'admin_pays';
        }

        if ($value === 'admin_adjoint') {
            return 'admin_adjoint';
        }

        if (in_array($value, ['superadmin', 'super-admin', 'admin'], true)) {
            return 'superadmin';
        }

        return 'client';
    }

    private function isSuperAdminUser(?object $user): bool
    {
        if (! $user) {
            return false;
        }

        return (bool) ($user->is_admin ?? false)
            && $this->normalizeAdminRoleValue($user->admin_role ?? null) === 'superadmin';
    }

    private function isPaidStatus(?string $value): bool
    {
        $status = Str::ascii(strtolower(trim((string) $value)));

        return in_array($status, ['reussi', 'approved', 'payee'], true);
    }

    private function paidStatusSql(): string
    {
        return "LOWER(REPLACE(REPLACE(COALESCE(statut_paiement, ''), 'é', 'e'), 'è', 'e'))";
    }

    private function formatUserLabel(?object $user, string $fallback = 'Utilisateur'): string
    {
        if (! $user) {
            return $fallback;
        }

        if (method_exists($user, 'getFilamentName')) {
            $label = trim((string) $user->getFilamentName());
            if ($label !== '') {
                return $label;
            }
        }

        $fullName = trim((string) ($user->prenom ?? '').' '.(string) ($user->nom ?? ''));
        if ($fullName !== '') {
            return $fullName;
        }

        return (string) ($user->email ?? $fallback);
    }

    private function buildRecentActivities(int $limit = 8, bool $includeCommerceEvents = false): array
    {
        $activities = [];

        if ($includeCommerceEvents) {
            $orders = Commande::with(['utilisateur:id_utilisateur,prenom,nom,email'])
                ->orderByDesc('date_commande')
                ->limit($limit)
                ->get();

            foreach ($orders as $order) {
                $user = $order->utilisateur;

                $activities[] = [
                    'id' => 'order-'.($order->id_commande ?? uniqid()),
                    'type' => 'commande',
                    'title' => 'Commande #'.($order->numero_commande ?? $order->id_commande ?? '-'),
                    'subtitle' => $this->formatUserLabel($user, 'Client').' • '.str_replace('_', ' ', (string) ($order->statut ?? 'statut inconnu')),
                    'amount' => (float) ($order->montant_total ?? 0),
                    'date' => (string) ($order->date_commande ?? $order->created_at ?? null),
                    'icon' => 'fa-box',
                    'color' => '#0ea5e9',
                ];
            }

            $payments = Paiement::with([
                'utilisateur:id_utilisateur,prenom,nom,email',
                'formation:id_formation,titre',
            ])
                ->orderByDesc('date_paiement')
                ->limit($limit)
                ->get();

            foreach ($payments as $payment) {
                $user = $payment->utilisateur;
                $title = $payment->formation?->titre ?: 'Paiement #'.($payment->id_paiement ?? '-');

                $activities[] = [
                    'id' => 'payment-'.($payment->id_paiement ?? uniqid()),
                    'type' => 'paiement',
                    'title' => $title,
                    'subtitle' => $this->formatUserLabel($user, 'Utilisateur').' • '.($payment->statut_paiement ?? 'inconnu'),
                    'amount' => (float) ($payment->montant ?? 0),
                    'date' => (string) ($payment->date_paiement ?? $payment->created_at ?? null),
                    'icon' => 'fa-credit-card',
                    'color' => $this->isPaidStatus($payment->statut_paiement) ? '#16a34a' : '#f59e0b',
                ];
            }
        }

        $auditLogs = AuditLog::with('utilisateur:id_utilisateur,prenom,nom,email')
            ->orderByDesc('date_action')
            ->limit($limit)
            ->get();

        foreach ($auditLogs as $audit) {
            $user = $audit->utilisateur;
            $subtitle = $this->formatUserLabel($user, 'Système').($audit->table_cible ? ' • '.$audit->table_cible : '');

            $activities[] = [
                'id' => 'audit-'.($audit->id_log ?? uniqid()),
                'type' => 'audit',
                'title' => (string) ($audit->action ?? 'Action système'),
                'subtitle' => $subtitle,
                'amount' => null,
                'date' => (string) ($audit->date_action ?? $audit->created_at ?? null),
                'icon' => 'fa-clipboard-list',
                'color' => '#64748b',
            ];
        }

        $adminLogs = AdminLog::with('admin:id_utilisateur,prenom,nom,email')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        foreach ($adminLogs as $log) {
            $admin = $log->admin;

            $activities[] = [
                'id' => 'admin-'.($log->id ?? uniqid()),
                'type' => 'admin',
                'title' => (string) ($log->action ?? 'Action admin'),
                'subtitle' => $this->formatUserLabel($admin, 'Admin'),
                'amount' => null,
                'date' => (string) ($log->created_at ?? null),
                'icon' => 'fa-user-shield',
                'color' => '#2563eb',
            ];
        }

        return collect($activities)
            ->filter(fn (array $item) => ! empty($item['date']))
            ->sortByDesc(function (array $item) {
                return strtotime((string) $item['date']) ?: 0;
            })
            ->values()
            ->slice(0, $limit)
            ->all();
    }

    private function visibleUsersCount(?object $actor): int
    {
        $query = Utilisateur::query()->whereNull('deleted_at');

        if (! $this->isSuperAdminUser($actor)) {
            $query->where(function ($builder) {
                $builder
                    ->whereNull('admin_role')
                    ->orWhereRaw("LOWER(admin_role) != 'superadmin'");
            });
        }

        return $query->count();
    }

    /**
     * GET /api/admin/activities
     * Retourne les activités récentes (audit + actions admin) fusionnées et triées.
     */
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 8);
        $limit = max(1, min(50, $limit));

        return response()->json($this->buildRecentActivities($limit, false));
    }

    /**
     * GET /api/admin/dashboard
     * Résumé rapide pour le tableau de bord admin.
     */
    public function dashboard(Request $request)
    {
        $actor = $request->user();

        $recentActivity = $this->buildRecentActivities(8, true);
        $paidExpression = $this->paidStatusSql();

        $topCustomers = Utilisateur::query()
            ->select('utilisateurs.id_utilisateur', 'utilisateurs.prenom', 'utilisateurs.nom', 'utilisateurs.email')
            ->join('commandes', 'utilisateurs.id_utilisateur', '=', 'commandes.id_utilisateur')
            ->selectRaw('COUNT(commandes.id_commande) as total_orders')
            ->selectRaw('SUM(commandes.montant_total) as total_spent')
            ->groupBy('utilisateurs.id_utilisateur', 'utilisateurs.prenom', 'utilisateurs.nom', 'utilisateurs.email')
            ->orderByDesc('total_spent')
            ->limit(5)
            ->get();

        $stats = DB::select("SELECT
            (SELECT COUNT(*) FROM commandes) AS orders,
            (SELECT COUNT(*) FROM paiements) AS payments,
            (SELECT COUNT(*) FROM commandes WHERE LOWER(statut) LIKE '%attente%') AS pending_orders,
            (SELECT COUNT(*) FROM formations) AS formations,
            (SELECT COUNT(*) FROM contact_messages) AS messages,
            (SELECT COUNT(*) FROM revendeur_demandes) AS revendeur_demandes,
            (SELECT COUNT(*) FROM devis_prestations) AS devis_prestations,
            (SELECT COUNT(*) FROM home_testimonials) AS testimonials,
            (SELECT COUNT(*) FROM home_collaborators) AS collaborators,
            (SELECT COUNT(*) FROM home_partners) AS partners,
            (SELECT COUNT(*) FROM paiements WHERE {$paidExpression} IN ('reussi', 'approved', 'payee')) AS paid_payments,
            (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE {$paidExpression} IN ('reussi', 'approved', 'payee')) AS revenue
        ")[0] ?? (object) [];

        $productsCount = Produit::query()
            ->whereHas('categorie', function ($query) {
                $query->where('segment', 'general');
            })
            ->count();

        $homeMarketingCards = HomeMarketingCard::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN section IN ('offer', 'featured_product') THEN 1 ELSE 0 END) as marketing_cards")
            ->selectRaw("SUM(CASE WHEN section IN ('home_promotion', 'promotion_page') THEN 1 ELSE 0 END) as home_promotions")
            ->first();

        return response()->json([
            'users' => $this->visibleUsersCount($actor),
            'orders' => (int) ($stats->orders ?? 0),
            'payments' => (int) ($stats->payments ?? 0),
            'paidPayments' => (int) ($stats->paid_payments ?? 0),
            'revenue' => (float) ($stats->revenue ?? 0),
            'pendingOrders' => (int) ($stats->pending_orders ?? 0),
            'products' => $productsCount,
            'formations' => (int) ($stats->formations ?? 0),
            'messages' => (int) ($stats->messages ?? 0),
            'revendeurDemandes' => (int) ($stats->revendeur_demandes ?? 0),
            'devisPrestations' => (int) ($stats->devis_prestations ?? 0),
            'marketingCardsCount' => (int) ($homeMarketingCards->marketing_cards ?? 0),
            'homePromotionsCount' => (int) ($homeMarketingCards->home_promotions ?? 0),
            'testimonials' => (int) ($stats->testimonials ?? 0),
            'collaborators' => (int) ($stats->collaborators ?? 0),
            'partners' => (int) ($stats->partners ?? 0),
            'recentActivity' => $recentActivity,
            'topCustomers' => $topCustomers,
        ]);
    }
}
