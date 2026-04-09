# Rapport d'avancement 3 semaines

## Plateforme GROUPE ISD AFRIK

**Date du rapport :** 8 avril 2026  
**Période couverte :** 18 mars 2026 au 8 avril 2026  
**Public visé :** Direction, équipe métier, partenaires non techniques

---

## 1. Résumé exécutif (lecture rapide)

Sur les 3 dernières semaines, le travail a surtout porté sur la **stabilisation de la plateforme**, l'**amélioration des pages vitrines clés** (GeoVision, Accueil, Ingénierie/Prestations), la **préparation de la production**, et la **finalisation du parcours e-commerce** (produits, panier, favoris, paiement).

En termes simples:
- La base du site est fonctionnelle et exploitable.
- Les pages vitrines stratégiques (Accueil, GeoVision, Ingénierie/Prestations) ont été retravaillées pour mieux présenter l'offre.
- Le parcours utilisateur est plus fiable (images, navigation, paiement produits, messages d'erreur plus clairs).
- Les fondations de mise en production sont présentes (documentation, checklist, architecture Docker production).
- Les principaux blocages observés concernent encore la **messagerie email en production** et certains **réglages d'environnement** (configuration, clés, connectivité).

Le niveau global est bon pour une phase de montée en charge, mais il reste des points essentiels avant un fonctionnement pleinement fluide à l'échelle (emails transactionnels, tests renforcés, complétude de certains modules du cahier des charges).

---

## 2. Rappel du cahier des charges (objectif métier)

Le cahier des charges demande une plateforme centrale qui permet:
- de présenter l'entreprise, ses services, ses projets, ses actualités et ses formations,
- de vendre/payer des produits, services et formations en ligne de façon sécurisée,
- d'offrir un espace client (historique, factures, profil),
- d'offrir un back-office de gestion (contenus, paiements, utilisateurs, rôles),
- de respecter un niveau attendu de sécurité, de fiabilité et de professionnalisme.

En plus, le document insiste sur:
- la qualité de navigation (site clair, mobile, ergonomique),
- les rôles admin/super admin bien séparés,
- la sécurité des accès et des paiements,
- la capacité de suivi (logs, statistiques, historique).

---

## 3. Ce qui a été fait pendant les 3 dernières semaines

## 3.1. Semaine 1 (18 mars -> 24 mars): Stabilisation fonctionnelle et qualité d'affichage

### Travaux réalisés
- Travaux sur la page **Accueil** pour clarifier les messages, les appels à l'action et la lisibilité visuelle.
- Travaux sur le bloc/page **GeoVision** (présentation, structuration des gammes, cohérence de navigation vers le catalogue).
- Travaux sur la page **Ingénierie/Prestations** pour mieux présenter les services et améliorer la compréhension de l'offre.
- Amélioration de la lisibilité des pages produits et des blocs marketing.
- Ajustements de navigation et des redirections de boutons pour réduire les erreurs de parcours.
- Consolidation des pages d'information publique (présentation institutionnelle et légale déjà engagée).
- Corrections front-end pour supprimer des incohérences visuelles sur desktop/mobile.

### Impact métier
- Les visiteurs comprennent mieux les prestations du Groupe (notamment sur Ingénierie et GeoVision).
- La page d'accueil joue mieux son rôle d'orientation vers les offres prioritaires.
- Les visiteurs comprennent mieux l'offre.
- Les parcours principaux demandent moins d'effort.
- L'image de sérieux du site est renforcée.

---

## 3.2. Semaine 2 (25 mars -> 31 mars): Mise à plat technique et préparation production

### Travaux réalisés
- Mise en place/structuration des procédures de déploiement et vérification post-déploiement.
- Clarification de la cible d'hébergement production (Docker production, Render, configuration serveur).
- Documentation des priorités sécurité (gestion des secrets, accès, rôles, logs, rollback).

### Impact métier
- Le projet devient transmissible et moins dépendant d'une seule personne.
- Le risque de rupture de service diminue.
- Les décisions production se font sur une base claire et documentée.

---

## 3.3. Semaine 3 (1 avril -> 8 avril): Finalisation du parcours boutique et paiement produits

### Travaux réalisés
- **Paiement réel des produits** branché sur l'intégration FedaPay existante.
- Création du flux complet commande + lignes de commande + paiement pour les achats produits.
- Chargement correct des images produits depuis la base de données sur les pages **Panier** et **Favoris**.
- Amélioration de l'expérience sur les cartes produits:
  - indication visuelle "déjà au panier",
  - indication visuelle "déjà en favoris".
- Amélioration de la navigation produit:
  - fil d'Ariane rendu plus propre et plus accessible,
  - simplification de la page détail produit.
- Amélioration des retours utilisateurs:
  - messages d'erreur de paiement affichés en **toast** (notification claire),
  - meilleur ressenti lors des erreurs comme "Téléphone invalide".

### Impact métier
- Le tunnel d'achat produit est beaucoup plus crédible et proche d'une vraie exploitation.
- L'utilisateur reçoit des retours clairs et rapides.
- Le taux de confusion baisse (images, navigation, état panier/favoris).

---

## 4. Bilan par rapport au cahier des charges

| Bloc du cahier des charges | État actuel | Commentaire non-technique |
|---|---|---|
| Présentation entreprise/pages publiques (dont Accueil, GeoVision, Ingénierie/Prestations) | Partiellement réalisé et amélioré | Des améliorations concrètes ont été réalisées sur ces pages, mais il reste des enrichissements de contenu et de dynamisation. |
| Catalogue produits | Réalisé et amélioré | Affichage, images et navigation ont progressé. |
| Formations | Réalisé en base | Parcours présent, nécessite encore un durcissement qualité et tests globaux. |
| Paiement en ligne | Fonctionnel, en consolidation | Paiement formations présent, paiement produits branché; reste à fiabiliser le contexte production. |
| Facture/traçabilité | Partiellement réalisé | Génération et suivi présents, mais la chaîne email doit être fiabilisée pour un cycle complet. |
| Espace client | Partiellement réalisé | Fonctionnalités clés présentes, mais complétude et ergonomie à poursuivre. |
| Back-office/admin | Réalisé en base | Le socle existe; des modules avancés (stats, pilotage) restent à compléter. |
| Sécurité et gouvernance des accès | En cours | Bonne base, mais sécurisation secrets + discipline release/test à renforcer. |

---

## 5. Difficultés rencontrées (dont mail + production)

## 5.1. Difficultés sur la messagerie email

### Problèmes observés
- La configuration applicative indique un mode par défaut qui peut écrire les emails dans les logs si la prod n'est pas correctement configurée.
- Des erreurs SMTP ont été observées, notamment une impossibilité de joindre le serveur d'envoi (erreur DNS vers smtp.gmail.com).
- Plusieurs envois d'emails sont volontairement protégés par des "try/catch" pour ne pas bloquer l'utilisateur, ce qui évite la panne frontale mais peut masquer un défaut d'envoi réel.

### Conséquence métier
- Un utilisateur peut réussir une action (connexion 2FA, changement d'état compte, etc.) sans recevoir l'email attendu.
- Risque de perte de confiance si la notification attendue n'arrive pas.

### Actions déjà engagées
- Journalisation des erreurs d'envoi.
- Documentation des variables d'environnement mail à valider avant mise en production.
- Préparation d'une checklist de déploiement avec vérifications post-release.

### Ce qui reste à faire
- Verrouiller une configuration SMTP production stable et testée.
- Tester des scénarios bout-en-bout (envoi réel + réception + délais).
- Mettre en place un suivi d'échec d'email plus visible côté exploitation.

---

## 5.2. Difficultés de production (infra/configuration)

### Problèmes observés
- Erreurs de configuration déjà rencontrées: clé applicative absente, base non trouvée, dépendances d'environnement manquantes.
- Historique d'erreurs d'authentification FedaPay (lié à configuration/clé API).
- Variabilité des comportements selon environnement local/preprod/prod.

### Conséquence métier
- Une fonctionnalité qui marche localement peut échouer en production.
- Risque d'interruption de service ou de blocage au moment des paiements.

### Actions déjà engagées
- Standardisation de la documentation de déploiement.
- Ajout d'une approche Docker orientée production.
- Clarification des points critiques à vérifier à chaque release.

### Ce qui reste à faire
- Finaliser une procédure de release stricte et obligatoire.
- Valider systématiquement les variables critiques avant mise en ligne.
- Renforcer les tests de non-régression sur les parcours vitaux.

---

## 6. Ce qui est considéré comme fait à date

- Parcours catalogue et consultation produit globalement fonctionnels.
- Pages Accueil, GeoVision et Ingénierie/Prestations retravaillées pour mieux valoriser l'offre.
- Parcours panier/favoris amélioré visuellement et fonctionnellement.
- Paiement produits connecté au système de paiement existant.
- Paiement formations déjà exploité dans l'architecture.
- Documentation de production et passation disponibles.
- Base admin et gestion des rôles existantes.

---

## 7. Ce qui reste à faire (priorités opérationnelles)

## 7.1. Pages de la plateforme restant à terminer ou à compléter

### Pages publiques (visiteur)
- Solutions: finaliser les contenus détaillés et les redirections métiers.
- Projets: compléter les fiches projets (contexte, résultats, visuels, filtres sectoriels).
- Actualités: structurer la publication régulière (articles, communiqués, médias).
- Contact: finaliser le parcours complet (formulaire, routage, suivi des demandes).
- FAQ / Support / Assistance: mettre en place une page d'aide centralisée.
- Pages légales (RGPD, confidentialité, CGV, mentions): enrichir et harmoniser les versions définitives.

### Espace client
- Tableau de bord client: consolider une vue synthétique (commandes, paiements, inscriptions).
- Historique client: finaliser l'historique détaillé commandes/demandes/paiements.
- Factures téléchargeables: fiabiliser le parcours complet avec notifications associées.
- Profil utilisateur: finaliser tous les cas de mise à jour et validation.
- Support client: intégrer un parcours simple de demande d'assistance.

### Administration (back-office)
- Dashboard admin: finaliser les indicateurs globaux (visites, ventes, inscriptions).
- Gestion avancée des utilisateurs: ajouter recherche, filtres, contrôle des accès et traçabilité.
- Gestion des rôles et permissions: compléter la logique hiérarchique (admin/super admin) selon RBAC.
- Gestion des contenus: compléter les workflows de publication (produits, formations, projets, actualités).
- Gestion paiements/facturation: terminer les fonctions de suivi avancé, relances et exports.
- Monitoring et logs: finaliser les écrans de supervision pour l'exploitation quotidienne.

### Modules transverses à finaliser
- Reporting/statistiques: consolider un suivi pilotage utilisable par la direction.
- Accessibilité: terminer l'audit et les corrections d'ergonomie (desktop/mobile).
- Recette et déploiement: formaliser une procédure de validation finale avant mise en production.
- Qualité continue: renforcer les tests automatiques sur les parcours critiques.

## Priorité 1 (immédiate)
- Fiabiliser définitivement les emails transactionnels en production.
- Finaliser la robustesse du paiement (tests bout-en-bout, cas d'erreur, suivi).
- Renforcer la vérification après déploiement (checklist + preuve de test).

## Priorité 2 (court terme)
- Compléter les pages encore partielles demandées par le cahier des charges.
- Renforcer l'espace client (historique, suivi, confort d'usage).
- Stabiliser la gouvernance des accès admin/super admin et les audits.

## Priorité 3 (moyen terme)
- Ajouter un vrai pilotage statistique (visites, ventes, inscriptions).
- Renforcer la qualité globale (tests automatisés sur scénarios critiques).
- Consolider les aspects conformité/sécurité à cadence régulière.

---

## 8. Lecture non-technique: ce que cela change pour l'entreprise

Concrètement, en 3 semaines:
- Le site est devenu plus "vendable" et plus cohérent pour un client final.
- Le passage vers une exploitation réelle est plus proche grâce au paiement produits.
- Les équipes ont maintenant une meilleure base pour déployer sans improvisation.

Mais pour un niveau "production mature", il faut encore:
- sécuriser totalement la chaîne email,
- verrouiller la discipline de déploiement,
- terminer certains blocs du cahier des charges (fonctionnels et pilotage).

---

## 9. Plan recommandé pour les 2 prochaines semaines

## Semaine A
- Finaliser SMTP production + tests réels d'emails transactionnels.
- Exécuter un test complet paiement (succès, échec, reprise).
- Valider une checklist release signée avant chaque mise en ligne.

## Semaine B
- Finaliser les écrans/sections encore partiels du cahier des charges.
- Renforcer les contrôles de qualité sur les parcours client principaux.
- Produire un mini tableau de bord de suivi (incident, paiement, email, performance).

---

## 10. Conclusion

Le projet a connu une progression nette sur la période, en particulier sur les parcours à forte valeur (boutique et paiement). Les travaux réalisés rapprochent la plateforme de l'objectif du cahier des charges.

Le prochain palier de réussite est clair: **fiabilisation production (email + paiement + process de release)** puis **complétude fonctionnelle des modules restants**. Une fois ces points verrouillés, la plateforme pourra être exploitée avec un niveau de confiance beaucoup plus élevé.

