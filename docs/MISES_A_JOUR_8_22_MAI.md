# 📋 MISES À JOUR - 12 au 22 MAI 2026
**Période:** 10 jours de travail  
**Commits:** 23  
**Fichiers modifiés:** 100+  
**État projet:** 80% → 90%

---

## 🎯 RÉSUMÉ

Depuis le 12 mai, on est passés de **80% à 90%** du projet. Deux gros chantiers :

1. **Mise en ligne du site** (19-20 mai) — on a déployé le site sur Render (le serveur) et Vercel (le frontend). Mais un projet Laravel, ce n'est pas fait pour ce genre d'hébergement "allégé". Du coup, on a dû régler pas mal de problèmes techniques : les emails qui ne partaient pas, les erreurs qui s'affichaient mal, les images qui disparaissaient après chaque mise à jour, etc.

2. **Ajout de contenu et corrections** (22 mai) — on a ajouté 39 formations pour les entreprises et corrigé un bug qui empêchait les admins de se connecter dans certains cas.

---

## 🐛 SESSION DU 22 MAI

### 1. Correction bug connexion admin (2FA)

**Le problème :** Quand un admin se connecte, un code de vérification lui est envoyé par email (c'est la double authentification). Normalement, cet email est mis en attente pour ne pas ralentir la connexion. Mais il y a un mode "envoi immédiat" qui force l'envoi tout de suite. Si l'envoi échouait (ex : le service d'emails est lent), le site plantait en erreur 500 et l'admin restait bloqué sans pouvoir se connecter.

**Ce qu'on a fait :** On a entouré l'envoi d'email d'un filet de sécurité. Si l'envoi échoue, le site ne plante pas, il réessaie une fois puis continue sans bloquer l'utilisateur. Avant, la moindre panne du service d'emails empêchait toute connexion.

---

### 2. Ajout de 39 formations "Entreprise"

**Le besoin :** La plateforme propose des formations pour les particuliers, les étudiants et les entreprises. La catégorie "entreprise" était vide, il fallait la remplir.

**Ce qu'on a fait :**
- 39 formations créées (Gestion de projet, Marketing digital, Comptabilité, Management, etc.)
- Réparties sur toute l'année 2026 (3 à 4 formations par mois)
- Prix allant de 150 000 F à 1 500 000 F CFA
- Toutes attachées au Togo (le pays de la plateforme)
- Certains titres de formation étaient identiques → on a ajouté le mois pour les distinguer

**Résultat :** 59 formations au total dans la base de données (39 nouvelles + 20 existantes d'autres catégories).

---

## 🔧 CHANTIER MISE EN LIGNE (19-20 MAI)

### Pourquoi tout ce travail ?

Le site devait être accessible en ligne, pas seulement en local sur un ordinateur. On a choisi Render pour le serveur (Laravel/PHP) et Vercel pour la partie visible (React). Mais Laravel est un outil conçu pour un hébergement "classique" (un serveur dédié). L'adapter à Render et Vercel a demandé beaucoup d'ajustements. Voici les principaux problèmes rencontrés et comment on les a résolus.

---

### 1. Les logs qui plantaient le site

**Le problème :** Sur Render, certaines commandes de maintenance créent des fichiers avec un utilisateur "root" (le super-administrateur). Mais le serveur web qui affiche le site tourne avec un autre utilisateur plus limité. Résultat : le serveur web n'arrivait pas à écrire dans les fichiers créés par root, et tout le site plantait en erreur 500.

**Ce qu'on a fait :** Au lieu d'écrire les journaux d'activité dans un fichier, on les envoie directement vers la console de Render (comme un journal de bord visible en ligne). Plus besoin de fichier, plus de problème de permissions.

---

### 2. Les mises à jour qui cassaient tout

**Le problème :** À chaque déploiement (chaque fois qu'on publie une nouvelle version), Render exécute les scripts de mise à jour de la base de données. Si un script essayait d'ajouter une colonne qui existait déjà (parce que le déploiement précédent l'avait déjà créée), tout plantait.

**Ce qu'on a fait :** On a rendu ces scripts "intelligents" : avant d'ajouter quoi que ce soit, ils vérifient d'abord si ça existe déjà. Si oui, ils passent à l'étape suivante sans rien casser.

---

### 3. Les emails qui ne partaient pas

**Le problème :** Le site utilise Brevo (un service d'envoi d'emails) pour envoyer les codes de connexion, les confirmations de commande, etc. En local sur l'ordinateur du développeur, ça marchait. Mais sur Render, le système ne trouvait pas le service d'emails → "service inconnu".

**Ce qu'on a fait :** On a enregistré correctement le service Brevo dans la configuration du site pour qu'il soit reconnu sur Render. On a aussi simplifié en gardant un seul service d'emails (Brevo) au lieu d'en avoir plusieurs.

---

### 4. Les erreurs invisibles

**Le problème :** Sur Render, quand une erreur se produisait, on ne voyait rien. Le site affichait juste "Erreur 500" sans dire pourquoi. Impossible de comprendre ce qui n'allait pas.

**Ce qu'on a fait :** On a ajouté un système qui attrape toutes les erreurs et les affiche en format lisible (JSON), avec le message d'erreur et le fichier concerné. Comme ça, même en production, on peut diagnostiquer les problèmes rapidement.

---

### 5. Le problème de communication entre le site et le serveur

**Le problème :** Le site est découpé en deux parties : l'affichage (sur Vercel) et le serveur (sur Render). Ces deux parties sont sur des domaines différents (ex : monsite.vercel.app et monsite-render.com). Les navigateurs internet bloquent par sécurité la communication entre deux domaines différents. Résultat : certaines fonctionnalités ne marchaient pas.

**Ce qu'on a fait :** On a configuré correctement les règles de sécurité (CORS) pour autoriser la communication entre les deux parties du site. C'est comme donner une permission officielle pour qu'elles puissent se parler.

---

### 6. Le problème des images qui disparaissaient

**Le problème :** Sur Render, les fichiers uploadés (images) sont effacés à chaque nouveau déploiement. Si un administrateur uploadait des images de produits, elles disparaissaient à la prochaine mise à jour du site.

**Ce qu'on a fait :** On a changé la façon de stocker les images. Au lieu de les garder dans des fichiers, on les convertit en texte (base64) et on les stocke directement dans la base de données. Comme ça, les images survivent à tous les déploiements. C'est un changement important qui a touché 7 parties du site (catégories, partenaires, témoignages, etc.).

---

### 7. Configuration de Vercel (partie visible du site)

**Le problème :** Le frontend React devait être hébergé sur Vercel. Il fallait lui dire où trouver les fichiers du site, comment gérer la navigation entre les pages, et quelle adresse utiliser pour appeler le serveur.

**Ce qu'on a fait :**
- On a configuré Vercel pour qu'il trouve correctement les fichiers du site
- On a créé un script de construction adapté
- On a paramétré l'adresse du serveur (Render) pour que le site sache où envoyer les requêtes, que ce soit en local ou en ligne

---

## 🚀 NOUVELLES FONCTIONNALITÉS

### Stockage des images en base de données

**Pourquoi :** Sur Render, pas de stockage de fichiers permanent. Chaque mise à jour efface les images uploadées.

**Solution :** On stocke les images directement dans la base de données (comme si on collait une photo dans un document Excel, mais en version texte). Les images ne disparaissent plus.

### Nouvelles pages d'administration
- **Projets** : page pour gérer les projets de la plateforme
- **Formulaires** : configuration des emails de contact
- **Page d'accueil Geovision** : personnalisation des sections

---

## 🗄️ BASE DE DONNÉES

### État actuel
```
Formations :   59 (39 nouvelles "entreprise" + 20 existantes)
Produits :     ~223
Utilisateurs : administrateurs et comptes de test
```

---

## 📅 PROCHAINES ÉTAPES

### À faire rapidement
- [ ] **Ajouter des images aux formations** — les 39 formations n'ont pas encore d'images
- [ ] **Tester le site en ligne** — vérifier que tout fonctionne (connexion, commande, paiement)
- [ ] **Finir les pages d'administration** — il reste environ 5 pages à compléter

### À faire plus tard
- [ ] **Navigation par catégories** — permettre de filtrer les produits par catégorie
- [ ] **Paiement en ligne** — connecter un service de paiement (Stripe, etc.)
- [ ] **Page de paiement dédiée** — remplacer le système actuel par une vraie page

---

**Fin du rapport**  
**Date:** 22 MAI 2026  
**État du projet:** 🟢 OPÉRATIONNEL (90%)
