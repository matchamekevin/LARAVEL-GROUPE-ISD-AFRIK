# 📋 Phase 2 - Next Steps (Prochaines étapes)

## 🎯 Objectif Phase 2
Ajouter les boutons panier/favoris à toutes les cartes de produits et améliorer les filtres.

---

## 📝 Tâche 1: Buttons sur Geovision Product Cards
**Effort:** 45 minutes

### Fichiers à modifier:
1. `/resources/js/pages/Geovision.jsx` - ligne ~320 (résultats search)
2. `/resources/js/pages/GeovisionCategorie.jsx` - ligne ~280 (cartes catégories)

### Code à ajouter:
```jsx
// En haut du fichier, ajouter l'import:
import { useProductActions } from "../hooks/useProductActions";

// Dans le rendu du composant produit:
const { isFavorite, addToCart, toggleFavorite } = useProductActions(product);

// Dans pp-footer-row, ajouter après boutons existants:
<button 
  className="btn-cart-minimal" 
  onClick={() => addToCart(1)}
  title="Ajouter au panier"
>
  <i className="fas fa-shopping-cart"></i>
</button>
<button 
  className={`btn-favorite-minimal ${isFavorite ? 'active' : ''}`}
  onClick={() => toggleFavorite()}
  title="Ajouter aux favoris"
>
  <i className={`fas fa-heart${isFavorite ? '' : '-o'}`}></i>
</button>
```

### CSS à ajouter (si besoin):
```css
.btn-cart-minimal, .btn-favorite-minimal {
  background: none;
  border: 1px solid #ddd;
  color: #667eea;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 14px;
}

.btn-favorite-minimal.active {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}
```

---

## 🔍 Tâche 2: Add Geovision Filter to Produit Page
**Effort:** 30 minutes

### Fichier à modifier:
`/resources/js/pages/Produit.jsx`

### Approche:
1. Ajouter filtre categorie "Geovision" dans filtres existants
2. Bouton redirection vers `/geovision` quand sélectionné

### Code Pattern:
```jsx
const handleGeovisionFilter = () => {
  navigate('/geovision');
};

// Dans section filtres:
<button 
  onClick={handleGeovisionFilter}
  className="filter-btn geovision-btn"
>
  <i className="fas fa-globe"></i> Geovision
</button>
```

---

## 🗂️ Tâche 3: Category Hierarchy Component
**Effort:** 1 heure

### Fichier à créer:
`/resources/js/components/CategorySelect.jsx`

### Logique:
- Récupérer categories de DB
- Afficher parent + enfants indentés
- Filtrer produits par categorie + enfants

### Database Support:
```sql
-- Structure déjà présente:
SELECT * FROM categories_produits WHERE parent_id IS NULL;  -- parents
SELECT * FROM categories_produits WHERE parent_id = ?;      -- enfants
```

### Props Attendues:
```jsx
<CategorySelect 
  onSelect={(categoryId) => filterBy(categoryId)}
  multiple={false}
/>
```

---

## 👥 Tâche 4: Sub-Services on DetailDomaine
**Effort:** 1 heure

### Fichier à modifier:
`/resources/js/pages/DetailDomaine.jsx`

### À vérifier d'abord:
```bash
# Vérifier structure services/formations:
psql -U root -d isd_group_afrik -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'formations' OR table_name = 'services'
ORDER BY table_name;"
```

### Approche:
1. Récupérer services liés au domaine
2. Afficher checkboxes pour chaque service
3. Permettre sélection multiple
4. Valider lors du paiement

---

## 🚀 Tester Phase 1 Before Moving to Phase 2

### Checklist de vérification:

```bash
# 1. Terminal 1: Démarrer dev server
npm run dev

# 2. Terminal 2: Vérifier hot-reload
PGPASSWORD=root psql -U root -d isd_group_afrik -c "
UPDATE produits SET titre = 'UPDATED ' || NOW()::text 
WHERE id_produit = 83 RETURNING id_produit, titre;"

# 3. Ouvrir 2 onglets navigateur:
# - http://localhost:8000/geovision
# - http://localhost:8000/geovision/produit/slug-83

# 4. Vérifier après 2-3 secondes:
# ✅ Titre mis à jour automatiquement sur page detail
# ✅ Titre mis à jour automatiquement sur page liste (si affichée)
# ✅ Cache endpoint appelle toutes les 2.5s (F12 → Network)

# 5. Tester cart/favorites:
# - Cliquer "Ajouter au panier" → feedback "Ajouté !"
# - Vérifier localStorage (F12 → Application → localStorage)
# - Clé: "isd_cart_user:[id]" ou "isd_cart_guest:[id]"
# - Clé: "isd_favorites_user:[id]" ou "isd_favorites_guest:[id]"
```

### Success Criteria:
- ✅ Hot-reload fonctionne sur page detail + liste
- ✅ Panier/Favoris persistés dans localStorage
- ✅ Boutons affichent les bons états (favori=cœur rempli)
- ✅ Pas d'erreurs console (F12 → Console)

---

## 📊 Database Validation Commands

```bash
# Vérifier intégrité données:
psql -U root -d isd_group_afrik << 'SQL'
SELECT 'Produits Geovision' as test, COUNT(*) as count 
FROM produits WHERE type_produit = 'Geovision'
UNION ALL
SELECT 'Catégories', COUNT(*) FROM categories_produits
UNION ALL
SELECT 'Formations', COUNT(*) FROM formations
UNION ALL
SELECT 'Utilisateurs', COUNT(*) FROM utilisateurs;
SQL

# Vérifier dernière mise à jour:
psql -U root -d isd_group_afrik -c "
SELECT 'Produits' as table_name, MAX(updated_at) as last_update FROM produits
UNION ALL
SELECT 'Categories', MAX(updated_at) FROM categories_produits
UNION ALL
SELECT 'Formations', MAX(updated_at) FROM formations;"
```

---

## 🔐 Security Checklist

Before pushing to production:

- [ ] Disable auto-refresh in production (change `enabled = true` to `enabled = !isDev`)
- [ ] Verify CORS settings for payment gateway
- [ ] Test with real payment provider (Stripe/PayPal staging)
- [ ] Audit localStorage keys (no sensitive data)
- [ ] Rate limit `/api/content-version` endpoint
- [ ] Add auth checks for payment endpoint

---

## 📞 Contact & Support

If issues arise:
1. Check browser console (F12 → Console)
2. Check server logs: `tail -f storage/logs/laravel.log`
3. Check cache: `./scripts/cache-refresh.sh`
4. Verify DB connection: `psql -U root -d isd_group_afrik -c "SELECT 1;"`

---

**Last Updated:** 11 Mai 2026
**Phase 1 Status:** ✅ COMPLETE
**Next Phase Ready:** 🟢 YES - Can start Phase 2 tasks
