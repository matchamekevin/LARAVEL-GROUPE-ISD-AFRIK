Ansible playbook pour backup + import produits

Fichiers:
- `ansible/product_import.yml` : playbook principal (backup puis import optionnel).
- `ansible/inventory.example` : exemple d'inventaire.

Utilisation rapide :

1) Installer Ansible sur la machine de contrôle.

```bash
pip install ansible
```

2) Adapter `ansible/inventory.example` en `ansible/inventory.ini` puis préciser l'hôte `prod`.

3) Lancer uniquement la partie backup :

```bash
ansible-playbook -i ansible/inventory.ini ansible/product_import.yml --limit prod -e local_backup_dir=./backups
```

4) Pour exécuter la partie import (ATTENTION : destructive), éditez les variables dans le playbook ou passez `-e do_import=true -e import_dir=./imports` :

```bash
ansible-playbook -i ansible/inventory.ini ansible/product_import.yml --limit prod -e do_import=true -e import_dir=./imports
```

Notes de sécurité:
- Le playbook utilise la variable `DATABASE_URL` présente sur l'hôte distant ; assurez-vous que l'environnement est correctement configuré.
- Testez d'abord sur un environnement de staging.
