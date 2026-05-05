<?php

// @formatter:off
// phpcs:ignoreFile
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\Models{
/**
 * Class Blog
 * Articles de blog créés par les utilisateurs.
 *
 * @property int $id_blog
 * @property string $titre
 * @property string $contenu
 * @property string $date_pub
 * @property int $id_utilisateur
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Commentaire> $commentaires
 * @property-read int|null $commentaires_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Image> $images
 * @property-read int|null $images_count
 * @property-read \App\Models\Utilisateur $utilisateur
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Blog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Blog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Blog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Blog whereContenu($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Blog whereDatePub($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Blog whereIdBlog($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Blog whereIdUtilisateur($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Blog whereTitre($value)
 */
	class Blog extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Commande
 * Représente une commande passée par un utilisateur.
 *
 * @property int $id_commande
 * @property string $numero_commande
 * @property \DateTime $date_commande
 * @property string $statut
 * @property float $montant_total
 * @property float|null $montant_commission
 * @property \DateTime|null $date_livraison
 * @property int $id_utilisateur
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Facture|null $facture
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\LigneCommande> $lignesCommande
 * @property-read int|null $lignes_commande_count
 * @property-read \App\Models\Livraison|null $livraison
 * @property-read \App\Models\Paiement|null $paiement
 * @property-read \App\Models\Utilisateur $utilisateur
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereDateCommande($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereDateLivraison($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereIdCommande($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereIdUtilisateur($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereMontantCommission($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereMontantTotal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereNumeroCommande($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereStatut($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commande whereUpdatedAt($value)
 */
	class Commande extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Commentaire
 * Représente un commentaire associé à un produit, une formation ou un blog.
 *
 * @property int $id_commentaire
 * @property string $contenu
 * @property int|null $note
 * @property string $date
 * @property string $commentable_type
 * @property int $commentable_id
 * @property int $id_utilisateur
 * @property string|null $created_at
 * @property string|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Model|\Eloquent $commentable
 * @property-read \App\Models\Utilisateur $utilisateur
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire whereCommentableId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire whereCommentableType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire whereContenu($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire whereIdCommentaire($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire whereIdUtilisateur($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire whereNote($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Commentaire whereUpdatedAt($value)
 */
	class Commentaire extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Facture
 * Représente une facture liée à une commande, un paiement ou une formation.
 *
 * @property int $id_facture
 * @property string $numero_facture
 * @property string $date_facture
 * @property string $montant
 * @property int|null $id_commande
 * @property int|null $id_paiement
 * @property int|null $id_formation
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Commande|null $commande
 * @property-read \App\Models\Paiement|null $paiement
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture whereDateFacture($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture whereIdCommande($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture whereIdFacture($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture whereIdFormation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture whereIdPaiement($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture whereMontant($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture whereNumeroFacture($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Facture whereUpdatedAt($value)
 */
	class Facture extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Image
 * Représente une image liée à un produit, une formation ou un blog.
 *
 * @property int $id_image
 * @property string $url
 * @property string $imageable_type
 * @property int $imageable_id
 * @property string|null $created_at
 * @property string|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Model|\Eloquent $imageable
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Image newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Image newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Image query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Image whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Image whereIdImage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Image whereImageableId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Image whereImageableType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Image whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Image whereUrl($value)
 */
	class Image extends \Eloquent {}
}

namespace App\Models{
/**
 * Class LigneCommande
 * Détail d’une commande : produit, quantité et prix.
 *
 * @property int $id_ligne
 * @property int $quantite
 * @property float $prix_unitaire
 * @property float $sous_total
 * @property int $id_commande
 * @property int $id_produit
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Commande $commande
 * @property-read \App\Models\Produit $produit
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande whereIdCommande($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande whereIdLigne($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande whereIdProduit($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande wherePrixUnitaire($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande whereQuantite($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande whereSousTotal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LigneCommande whereUpdatedAt($value)
 */
	class LigneCommande extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Livraison
 * Représente la livraison d'une commande.
 *
 * @property int $id_livraison
 * @property string $adresse
 * @property string $ville
 * @property string $pays
 * @property string $statut
 * @property string|null $date_livraison_prev
 * @property int $id_commande
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Commande $commande
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison whereAdresse($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison whereDateLivraisonPrev($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison whereIdCommande($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison whereIdLivraison($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison wherePays($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison whereStatut($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Livraison whereVille($value)
 */
	class Livraison extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Notification
 * Notification envoyée à un utilisateur.
 *
 * @property int $id_notification
 * @property string $message
 * @property string $type
 * @property \DateTime $date
 * @property int $id_utilisateur
 * @property-read \App\Models\Utilisateur $utilisateur
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereIdNotification($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereIdUtilisateur($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereType($value)
 */
	class Notification extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Paiement
 * Représente un paiement lié à une commande.
 *
 * @property int $id_paiement
 * @property string $reference_transaction
 * @property string $moyen_paiement
 * @property string $statut_paiement
 * @property float $montant
 * @property \DateTime $date_paiement
 * @property int $id_commande
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Commande $commande
 * @property-read \App\Models\Facture|null $facture
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement whereDatePaiement($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement whereIdCommande($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement whereIdPaiement($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement whereMontant($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement whereMoyenPaiement($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement whereReferenceTransaction($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement whereStatutPaiement($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Paiement whereUpdatedAt($value)
 */
	class Paiement extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Pays
 * Représente un pays enregistré sur la plateforme ISD Afrik.
 * 
 * Chaque pays peut avoir plusieurs produits et formations.
 *
 * @property int $id_pays
 * @property string $nom_pays
 * @property string $code_pays
 * @property string|null $devise_locale
 * @property string|null $langue_principale
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Produit> $produits
 * @property-read int|null $produits_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays whereCodePays($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays whereDeviseLocale($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays whereIdPays($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays whereLanguePrincipale($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays whereNomPays($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pays whereUpdatedAt($value)
 */
	class Pays extends \Eloquent {}
}

namespace App\Models{
/**
 * Class Produit
 * Représente un produit disponible sur la plateforme.
 *
 * @property int $id_produit
 * @property string $titre
 * @property string|null $description
 * @property string $prix
 * @property string $statut
 * @property string $date_creation
 * @property int $id_pays
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Commentaire> $commentaires
 * @property-read int|null $commentaires_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Image> $images
 * @property-read int|null $images_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\LigneCommande> $lignesCommande
 * @property-read int|null $lignes_commande_count
 * @property-read \App\Models\Pays $pays
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit whereDateCreation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit whereIdPays($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit whereIdProduit($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit wherePrix($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit whereStatut($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit whereTitre($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Produit whereUpdatedAt($value)
 */
	class Produit extends \Eloquent {}
}

namespace App\Models{
/**
 * Class TicketSupport
 * Représente une demande d’assistance faite par un utilisateur.
 *
 * @property int $id_ticket
 * @property string $sujet
 * @property string $message
 * @property string $statut
 * @property \DateTime $date_creation
 * @property int $id_utilisateur
 * @property-read \App\Models\Utilisateur $utilisateur
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TicketSupport newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TicketSupport newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TicketSupport query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TicketSupport whereDateCreation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TicketSupport whereIdTicket($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TicketSupport whereIdUtilisateur($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TicketSupport whereMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TicketSupport whereStatut($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TicketSupport whereSujet($value)
 */
	class TicketSupport extends \Eloquent {}
}

namespace App\Models{
/**
 * @property \Illuminate\Database\Eloquent\Factories\Factory $factory
 * @property int $id_utilisateur
 * @property string $nom
 * @property string $prenom
 * @property string $email
 * @property string|null $telephone
 * @property string $mot_de_passe
 * @property string $role
 * @property string $date_creation
 * @property string $statut
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property bool|null $is_admin
 * @property string|null $two_factor_code
 * @property string|null $two_factor_expires_at
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereDateCreation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereIdUtilisateur($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereIsAdmin($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereMotDePasse($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereNom($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePrenom($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereStatut($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereTelephone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereTwoFactorCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereTwoFactorExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUpdatedAt($value)
 */
	class User extends \Eloquent {}
}

namespace App\Models{
/**
 * Modèle représentant un utilisateur du système.
 *
 * @property int $id_utilisateur
 * @property string $nom
 * @property string $prenom
 * @property string $email
 * @property string|null $telephone
 * @property string $mot_de_passe
 * @property string $role
 * @property string $date_creation
 * @property string $statut
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property bool|null $is_admin
 * @property string|null $two_factor_code
 * @property \Illuminate\Support\Carbon|null $two_factor_expires_at
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereDateCreation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereIdUtilisateur($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereIsAdmin($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereMotDePasse($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereNom($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur wherePrenom($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereStatut($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereTelephone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereTwoFactorCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereTwoFactorExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Utilisateur whereUpdatedAt($value)
 */
	class Utilisateur extends \Eloquent {}
}

