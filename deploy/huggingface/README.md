# Héberger gratuitement, sans carte bancaire : Hugging Face Spaces

Un **Space gratuit « CPU basic »** donne (d'après la documentation de Hugging Face, à vérifier au moment de
l'inscription) 2 vCPU et 16 Go de RAM dans un conteneur : assez pour faire tourner MySQL, les 11 microservices, la
gateway et le site. Il faut seulement un compte avec une adresse e-mail, **sans carte bancaire**.

Tout est dans **un seul conteneur** (`Dockerfile`, `start.sh`, `nginx.conf` de ce dossier). Le Space clone le dépôt
GitHub, compile tout et démarre.

## Étapes (environ 10 minutes de ton côté)

1. Crée un compte sur https://huggingface.co/join (e-mail + mot de passe, confirmer l'e-mail).
2. https://huggingface.co/new-space :
   - **Space name** : `mirador-hotel` (par exemple) ;
   - **Space SDK** : **Docker**, modèle **Blank** ;
   - **Hardware** : **CPU basic · 2 vCPU · 16 GB · FREE** ;
   - **Public** (nécessaire pour que le lien soit ouvert à tous ; l'application a sa propre connexion).
3. Dans le Space → onglet **Files** → **Add file → Create a new file**, nom `Dockerfile`, et colle le contenu de
   https://raw.githubusercontent.com/nouba4tech/Projet_de_fin_d-etudes/main/deploy/huggingface/Dockerfile
   puis **Commit new file to main**.
4. **Obligatoire** : Space → **Settings → Variables and secrets → New secret** :
   - nom : `ADMIN_PASSWORD`, valeur : le mot de passe que tu veux pour le compte administrateur `noubasra`.
   Sans ce secret, l'API reste fermée (sécurité) et personne ne peut se connecter.
5. L'onglet **App** affiche la construction (**10 à 20 minutes** la première fois : compilation Java + npm).
   Ensuite le conteneur démarre : **environ 8 minutes** avant que l'API réponde.
6. Le lien de l'application est `https://<ton-pseudo>-mirador-hotel.hf.space` (bouton « Embed this Space » → « Direct URL »).
   Connexion : utilisateur `noubasra`, mot de passe = la valeur de `ADMIN_PASSWORD`.

## À savoir (limites de l'offre gratuite)

- **Mise en veille** : un Space gratuit s'endort après une période d'inactivité (48 h d'après la documentation). Au
  réveil, il redémarre complètement (environ 8 minutes).
- **Données non persistantes** : le disque est effacé à chaque redémarrage. Les données de démonstration sont
  rechargées à chaque démarrage ; **ce qui est saisi pendant la présentation est perdu au prochain redémarrage**.
- Les 9 comptes de démonstration (`akono`, …) sont **désactivés** (mot de passe aléatoire) : seul `noubasra` se connecte.
- Les notifications restent simulées (pas d'envoi réel).
- **Mettre à jour** : après un `git push`, Space → Settings → **Factory rebuild**.

## En cas de problème

Space → onglet **Logs** (visibles par toi). Les lignes `[start ...]` racontent chaque étape (nginx, MySQL, chaque
service, chargement des données). Colle-les moi : je corrige.

> **Non testé** : ce conteneur n'a jamais été construit ni lancé (Docker n'est pas installé sur la machine de
> développement). Les scripts ont été relus et la syntaxe de `start.sh` vérifiée, mais la première construction peut
> demander un ou deux ajustements.
