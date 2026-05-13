# 🔴 À FAIRE - PHASE 2 DÉTAILLÉE
**Date:** 12 MAI 2026  
**Avancement:** 80% → 90% (Phase 2)  
**Deadline:** 31 mai 2026

---

## 🎯 ROADMAP PHASE 2 (19 jours)

### SEMAINE 1 (12-16 mai) - PAIEMENTS BLOQUANTS

#### TASK 1.1: Paiement Formations - FedaPay Integration
**Priorité:** 🔴 CRITIQUE | **Effort:** 2 jours | **Deadline:** 13 mai

**Problème actuel:**
- Formations affichées avec prix
- Utilisateurs CANNOT payer formation
- Bloque revenue formations

**À faire:**
1. Mettre à jour FormationDetail.jsx:
   ```jsx
   // Ajouter bouton "Payer cette formation"
   <button onClick={() => initiateFormationPayment(formation)}>
     Payer {formation.prix} XOF
   </button>
   ```

2. Créer FormationCheckout component:
   - Afficher résumé formation (titre, prix, dates)
   - Intégration FedaPay
   - Gérer callback paiement

3. Backend route POST `/api/formations/{id}/checkout`:
   - Créer transaction FedaPay
   - Retourner payment URL
   - Logger transaction

4. Callback webhook:
   ```php
   POST /api/webhooks/fedapay/formation-paid
   - Mettre à jour statut formation_registrations
   - Envoyer email confirmation
   - Générer facture PDF
   ```

5. Tests:
   - Test mode FedaPay
   - Flow complet utilisateur
   - Email & facture PDF

**Fichiers à créer:**
- `/resources/js/components/FormationCheckout.jsx` (200 lignes)
- `/resources/js/pages/FormationPayment.jsx` (150 lignes)
- `app/Http/Controllers/FormationPaymentController.php` (100 lignes)
- `app/Models/FormationTransaction.php` (50 lignes)

**Migration BD:** Ajouter colonne `formation_registrations.payment_status`

**État:** ✗ À FAIRE

---

#### TASK 1.2: Paiement Geovision Products - FedaPay Integration
**Priorité:** 🔴 CRITIQUE | **Effort:** 2 jours | **Deadline:** 14 mai

**Problème actuel:**
- Produits Geovision affichés avec panier
- ProductActionButtons redirige contact
- Customers CANNOT payer directement

**À faire:**
1. Modifier ProductActionButtons.jsx:
   ```jsx
   // Au lieu de contact redirect:
   if (product.type === 'geovision') {
     handleGeovisionCheckout(product, quantite);
   }
   ```

2. Créer GeovisionCheckout component:
   - Panier Geovision
   - Quantités multiples
   - Appliquer promotions
   - Intégration FedaPay

3. Backend POST `/api/geovision/checkout`:
   - Valider stock
   - Calculer total (prix * quantité)
   - Créer commande temporaire
   - Retourner payment URL

4. Webhook POST `/api/webhooks/fedapay/geovision-paid`:
   - Mettre à jour statut commande
   - Réduire stock
   - Envoyer facture & devis
   - Email confirmation client

5. Tests:
   - Panier multi-produits
   - Réduction stock
   - Factures générées

**Fichiers à créer:**
- `/resources/js/components/GeovisionCheckout.jsx` (250 lignes)
- `app/Http/Controllers/GeovisionCheckoutController.php` (120 lignes)
- `app/Models/GeovisionTransaction.php` (50 lignes)

**Migration BD:** Ajouter `geovision_transactions` table

**État:** ✗ À FAIRE

---

### SEMAINE 2 (17-22 mai) - FORMATIONS & ANALYTICS

#### TASK 2.1: Formations - Contenu Upload & Parcours
**Priorité:** 🔴 HAUTE | **Effort:** 3 jours | **Deadline:** 19 mai

**Problème actuel:**
- Formations UI créée
- Pas de contenus (vidéos, documents)
- Pas de parcours/ordre leçons
- Pas de quiz

**À faire:**
1. Créer admin panel Formations Contenus:
   - Upload vidéos (AWS S3)
   - Upload documents (PDF, slides)
   - Gérer ordre leçons (drag-drop)
   - Créer quiz par leçon

2. Modifier Formation model:
   ```php
   // Ajouter relations:
   - hasMany('FormationLessons')
   - hasMany('FormationQuizzes')
   - hasMany('UserFormationProgress')
   ```

3. Frontend FormationContent component:
   - Afficher vidéo + description
   - Lister leçons (sidebar)
   - Afficher progression utilisateur
   - Quiz après chaque leçon

4. Tests:
   - Upload vidéo 100MB+
   - Navigation leçons
   - Quiz scoring
   - Progress saving

**Fichiers à créer:**
- `app/Models/FormationLesson.php` (30 lignes)
- `app/Models/FormationQuiz.php` (30 lignes)
- `/resources/js/pages/admin/FormationContents.jsx` (300 lignes)
- `/resources/js/pages/FormationViewer.jsx` (250 lignes)

**État:** ✗ À FAIRE

---

#### TASK 2.2: Admin Analytics & Reporting
**Priorité:** 🔴 HAUTE | **Effort:** 3 jours | **Deadline:** 20 mai

**Problème actuel:**
- Dashboard admin existe mais basique
- Pas de graphiques
- Pas d'exports données
- Pas de KPIs détaillés

**À faire:**
1. Créer AnalyticsController:
   ```php
   GET /api/admin/analytics/overview  // KPIs principaux
   GET /api/admin/analytics/sales     // Ventes par semaine/mois
   GET /api/admin/analytics/users     // Utilisateurs actifs
   GET /api/admin/analytics/formations // Formations vendues
   ```

2. Frontend Dashboard components:
   - Chart.js ou Recharts (graphiques)
   - KPIs cards (revenus, commandes, users)
   - Tableaux data avec pagination
   - Filtres date range

3. Export fonctionnalités:
   ```
   POST /api/admin/analytics/export
   - Params: type (sales|users|formations), format (csv|pdf), date_range
   - Retourner fichier téléchargeable
   ```

4. Tests:
   - Vérifier calculs KPI
   - Graphiques affichage correct
   - Exports générés sans erreur

**Fichiers à créer:**
- `app/Http/Controllers/AnalyticsController.php` (200 lignes)
- `/resources/js/pages/admin/Analytics.jsx` (400 lignes)
- `/resources/js/components/ChartCard.jsx` (100 lignes)

**État:** ✗ À FAIRE

---

### SEMAINE 3 (23-28 mai) - GEOVISION & FINALIZATION

#### TASK 3.1: Geovision - Devis & Comparateur
**Priorité:** 🟡 MOYENNE | **Effort:** 2 jours | **Deadline:** 24 mai

**À faire:**
1. Créer Comparateur produits:
   - Sélectionner 2-3 produits
   - Afficher tableau comparaison specs
   - Pricing par variante

2. Devis en ligne:
   - Sélectionner produits + quantités
   - Auto-génération PDF devis
   - Email devis au client
   - Tracking validité devis (30 jours)

3. Stock temps réel:
   - Badge "En stock" / "Rupture"
   - Notifier disponibilité si rupture
   - Update stock automatique après paiement

**Fichiers à créer:**
- `/resources/js/components/ProductComparator.jsx` (200 lignes)
- `/resources/js/components/QuoteBuilder.jsx` (250 lignes)
- `app/Http/Controllers/QuoteController.php` (150 lignes)

**État:** ✗ À FAIRE

---

#### TASK 3.2: Admin Panel - 5 pages finales
**Priorité:** 🟡 MOYENNE | **Effort:** 3 jours | **Deadline:** 26 mai

**Pages manquantes:**
1. `AdminAuditTrail.jsx` - Logs complets (100 lignes)
2. `AdminPermissions.jsx` - RBAC avancée (200 lignes)
3. `AdminMonitoring.jsx` - Health checks (150 lignes)
4. `AdminPaymentSettings.jsx` - Config FedaPay (100 lignes)
5. `AdminBackups.jsx` - Sauvegardes (80 lignes)

**État:** ✗ À FAIRE

---

### SEMAINE 4 (29-31 mai) - TESTS & FINALIZATION

#### TASK 4.1: Tests UAT Complets
**Priorité:** 🔴 HAUTE | **Effort:** 3 jours | **Deadline:** 30 mai

**Scénarios à tester:**
1. Utilisateur achète formation
2. Utilisateur achète produit Geovision
3. Admin crée nouvelle formation
4. Admin voit analytics & exporte données
5. Admin gère paiements
6. Utilisateur voit historique commandes
7. Email & PDF factures générées
8. Mobile responsive (tous scénarios)

**Outils:**
- Manual testing
- Screenshot comparisons
- Test checklist complète

**État:** À FAIRE

---

#### TASK 4.2: Optimisations finales
**Priorité:** 🟡 MOYENNE | **Effort:** 2 jours | **Deadline:** 31 mai

- Core Web Vitals optimization
- Image optimization
- Cache headers configuration
- Database query optimization
- Code minification

**État:** À FAIRE

---

## 📊 TIMELINE VISUELLE

```
12 mai    13 mai    14 mai    17 mai    19 mai    20 mai    23 mai    24 mai    26 mai    29 mai    31 mai
|         |         |         |         |         |         |         |         |         |         |
[---Task 1.1---]    [---Task 1.2---]   [---Task 2.1---]  [---Task 2.2---]
                    [---Task 3.1---]  [---Task 3.2---]
                    [---Task 4.1---]  [---Task 4.2---]

70% ────────────────────────────────────────────────────────────────────────────→ 90%+ (DONE)
```

---

## 🚀 ESTIM ATION RESSOURCES

| Phase | Tâches | Jours | FTE | Dependances |
|-------|--------|-------|-----|-------------|
| P2.1 | Formation Payment | 2 | 1 | Base FedaPay |
| P2.2 | Geovision Payment | 2 | 1 | P2.1 |
| P2.3 | Formation Contenus | 3 | 1 | AWS S3 config |
| P2.4 | Analytics | 3 | 1 | API data |
| P2.5 | Geovision Advanced | 2 | 1 | P2.2 |
| P2.6 | Admin Final (5 pages) | 3 | 1 | Parallel possible |
| P2.7 | Tests UAT | 3 | 2 | Après P2.1→P2.6 |
| P2.8 | Optimizations | 2 | 1 | Final |
| | **TOTAL** | **21 jours** | **1 FTE** | Sequential |

**Note:** Peut être fait par 1 développeur en 3 semaines

---

## ✅ CRITÈRES DE SUCCÈS

### Go-live checklist (31 mai)
- [ ] Formation payment 100% opérationnel
- [ ] Geovision payment 100% opérationnel
- [ ] Formation contenus uploadés (au moins 3)
- [ ] Admin analytics fonctionnel
- [ ] 5 pages admin créées
- [ ] 0 bugs bloquants
- [ ] 100% responsive tested
- [ ] Factures PDF générées
- [ ] Emails transactionnels envoyés
- [ ] Backup & monitoring active

---

**FIN ROADMAP PHASE 2  
Signé:** GitHub Copilot  
**Date:** 12 MAI 2026
