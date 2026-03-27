# Exposer le projet Laravel avec ngrok

php artisan serve --host=127.0.0.1 --port=8000

php artisan queu:work

npm run dev 




(sudo modprobe wl) pour mon wifi 



Ce document décrit comment démarrer votre application Laravel localement et l'exposer via ngrok.

## Prérequis
- Avoir PHP et Composer installés
- Avoir ngrok installé (ou utiliser `npx localtunnel` / `cloudflared`)
- Avoir un authtoken ngrok valide si vous utilisez un compte ngrok

## Commandes rapides

- Démarrer le serveur Laravel (port 8000 recommandé) :
```bash
php artisan serve --host=127.0.0.1 --port=8000
```

- Lancer ngrok vers ce serveur :
```bash
ngrok http 8000
```

La sortie de ngrok doit afficher une ligne `Forwarding https://... -> http://localhost:8000` — c'est l'URL publique.

## Utiliser un fichier de config local (sans toucher `~/.config`)

Créez `./ngrok.yml` dans la racine du projet :

```yaml
version: 2
authtoken: YOUR_TOKEN
tunnels:
  web:
    proto: http
    addr: 8000
```

Puis démarrez :
```bash
ngrok start --config ./ngrok.yml web
```

## Installer l'authtoken globalement

Si vous préférez installer l'authtoken dans `~/.config/ngrok` :
```bash
ngrok authtoken YOUR_TOKEN
# ou, si permission denied, créez le dossier et adaptez la propriété :
sudo mkdir -p $HOME/.config/ngrok
sudo chown -R "$(id -u):$(id -g)" $HOME/.config/ngrok
ngrok authtoken YOUR_TOKEN
```

## Mise à jour du fichier `.env`

- Mettre `APP_URL` si vous souhaitez l'utiliser dans l'app :
```
APP_URL=https://your-ngrok-domain.ngrok-free.dev
```
- Pour Laravel Sanctum (stateful), ajoutez le domaine ngrok à `SANCTUM_STATEFUL_DOMAINS` :
```
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost:8000,127.0.0.1:8000,your-ngrok-domain.ngrok-free.dev
```
Après modification, rechargez la config Laravel :
```bash
php artisan config:clear
```

## Tester

- Vérifier le serveur local :
```bash
curl -I http://127.0.0.1:8000
```
- Vérifier l'URL publique (remplacez par l'URL fournie par ngrok) :
```bash
curl -I https://your-ngrok-domain.ngrok-free.dev
```

## Dépannage rapide
- `ERR_NGROK_4018` : authtoken manquant ou non installé
- `ERR_NGROK_107` : authtoken invalide ou révoqué — régénérez depuis le dashboard
- `permission denied` sur `/home/you/.config/ngrok` : corriger la propriété ou utiliser un `./ngrok.yml` local
- Le tunnel existe déjà : arrêtez d'abord l'instance en conflit (`pkill ngrok`) ou démarrez avec `--pooling-enabled`

## Alternatives sans compte ngrok
- Localtunnel (npm) :
```bash
npx localtunnel --port 8000
```
- Cloudflare Tunnel (`cloudflared`) :
```bash
cloudflared tunnel --url http://localhost:8000
```

## Commande unique pour démarrer serveur + ngrok et afficher l'URL
Exécutez dans la racine du projet :
```bash
nohup php artisan serve --host=127.0.0.1 --port=8000 > /tmp/artisan.log 2>&1 & sleep 1 && nohup ngrok http 8000 > /tmp/ngrok.log 2>&1 & sleep 2 && curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "import sys,json; j=json.load(sys.stdin); print(j['tunnels'][0]['public_url'])"
```

---

Si tu veux, j'ajoute ce fichier dans le repo et je peux lier l'URL actuelle automatiquement dans `.env`.
