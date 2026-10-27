# Données de démonstration du tableau de bord (version en ligne)

`donnees-demo.sql` remplit la base en ligne (`bd_mirador` sur TiDB Cloud) pour une démonstration :

- environ 700 réservations sur 90 chambres, de 3 semaines en arrière à 2 semaines en avant (≈ 70 % d'occupation) ;
- les arrivées des 3 prochains jours « En attente » (check-ins à confirmer) ;
- une facture par séjour commencé, et les recettes du restaurant, du bar et des services sur les 30 derniers jours ;
- 4 chambres en nettoyage et 3 en maintenance.

Toutes les dates sont relatives au jour du chargement. **Relancer le script le matin de la démo** remet le tableau
de bord à jour : il supprime d'abord les données qu'il avait créées (marquées `DEMO-MIRADOR`, `DMO-…`, `DEMO-…`) puis
les recrée autour de la nouvelle date. Les autres données ne sont pas touchées, sauf l'état de nettoyage et de
maintenance des chambres, qui est réinitialisé.

```powershell
mysql --defaults-extra-file=<fichier de connexion TiDB> --default-character-set=utf8mb4 bd_mirador < donnees-demo.sql
```

Le chargement prend quelques minutes (environ 2 400 instructions vers la base à Tokyo).

`generer-donnees-demo.py` produit `donnees-demo.sql` à partir de la liste des chambres libres de toute réservation réelle
(voir l'en-tête du script).
