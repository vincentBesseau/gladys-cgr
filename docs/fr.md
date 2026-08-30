# CGR

Films actuellement à l'affiche dans votre cinéma CGR, affichés dans le widget
"Prochaines sorties" de Gladys.

## Important : intégration non officielle

Cette intégration lit les données d'horaires que **cgrcinemas.fr sert
publiquement à n'importe quel visiteur** de son site — le même contenu que
vous verriez en ouvrant la page de votre cinéma dans un navigateur, rien de
plus. Elle n'est ni développée, ni approuvée, ni affiliée à CGR. CGR peut
changer son site à tout moment et casser cette intégration sans préavis.

Aucune API payante, aucun identifiant extrait d'une application, aucun
contournement de protection anti-robot n'est utilisé : uniquement les points
d'accès publics que le site utilise déjà pour lui-même.

## Configuration

1. Ouvrez l'onglet **Configuration** de l'intégration.
2. Lancez l'action **Trouver mon cinéma** : laissez le champ vide pour lister
   les 5 cinémas CGR les plus proches de votre maison Gladys (si sa position
   est renseignée), ou tapez une ville pour chercher parmi tous les cinémas.
   Le résultat s'affiche sous le bouton, au format
   `Nom du cinéma — Ville (12.3 km) (ID: P0905)` (la distance n'apparaît que
   pour une recherche par proximité).
3. Copiez l'identifiant du cinéma souhaité dans le champ **Identifiant du
   cinéma**, puis enregistrez.

Si aucune maison Gladys n'a de position renseignée, laisser le champ vide
liste tous les cinémas CGR (comportement de repli).

Les films à l'affiche aujourd'hui dans ce cinéma apparaissent alors dans le
widget "Prochaines sorties" du tableau de bord. En cliquant sur une affiche,
la fiche du film affiche sa bande-annonce (quand cgrcinemas.fr en propose
une) et un tableau des horaires de séances du jour dans ce cinéma (heure et
version, VF/VO/VOST).

## Limites connues (v1)

- Un seul cinéma à la fois par installation de l'intégration.
- Uniquement les films et horaires du jour même (pas de vue sur demain ou les
  jours suivants).
- La liste des cinémas est une liste statique maintenue à la main (voir le
  README du dépôt) : un nouveau cinéma CGR peut ne pas encore y apparaître.

## Dépannage

L'intégration journalise tout ce qu'elle fait : consultez les logs de
l'intégration depuis l'interface Gladys (ou `docker logs` sur l'hôte) avec
`LOG_LEVEL=debug` pour le détail complet.
