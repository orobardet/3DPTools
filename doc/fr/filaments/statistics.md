# 📊 Les statistiques des filaments

La gestion des filaments de *3DPTools* inclut une section [statistiques](/filament/stats) qui présente plusieurs 
graphiques permettant d'analyser la collection de filaments.

Les graphiques de statistique sont regroupées par catégories, présentées ci-dessous. Un menu de navigation sur la 
droit de la page permet d'accéder rapidement à une catégorie particulière.

La plupart de ces graphiques sont légèrement interactif : en général, passer la souris au dessus d'un élément du 
graphique permet d'afficher les détails de l'élément, et certains graphique permettent d'afficher ou non certains éléments 
via un clic dans leur légende. 

# Totaux

Présente quelques sommes cumulés :
- Nombre de filaments
- Coût total (basé sur le prix d'achat de chaque filament)
- Poids total (poids net des filament, hors bobine et emballage)
- Longueur totale des filaments déroulés et mis bout à bout

![Totaux](doc/fr/filaments/stats_totals.png "Exemple de statistiques sur les totaux")


# Utilisation

Utilisation des filaments selon 3 représentation :
- Par poids (poids net des filaments) 
- Par longueur
- Par valeur (coût basé sur le prix d'achat de chaque filament)

Chaque représentation est une jauge représentant le total séparée en 2 zones : un zone foncée qui correspond à la 
quantité restante, et une zone claire qui correspond à la quantité utilisée.

Ces répartitions sont calculées en utilisant la quantité de matière restant pour chaque filament, par rapport à la 
quantité initiale de matière. 

![Utilisation des filaments](doc/fr/filaments/stats_usage.png "Exemple d'utilisation des filaments")


# Prix au kilo

Histogramme représentant le prix moyen au kilo et le nombre de kilo total (poids net initial) par type de matière 
principale.

Pour chaque matière, la barre foncée représente le prix au kilo moyen, et la barre clair la quantité totale au kilo.

La présence des 2 barre pour chaque matière permet de rendre compte de la quantité possédée de chaque matière par rapport
aux autre, et d'avoir une idée de la répartition de valeur globale : un stock de filament aura tendance à avoir beaucoup 
de matière peut cher (PLA ou ABS), et ces graphes permettent de le confirmer, ou au contraire d'identifier un type de 
matière plus cher que les autres et trop utilisé.

![Prix au kilo](doc/fr/filaments/stats_cost_per_kg.png "Exemple de prix au kilo par matière")


# Historique d'achat

Courbes temporelles représentants les différentes dates d'achat de filament. Il 4 courbes :
- Nombre de filament acheté
- Prix cumulé des filaments
- Le prix moyen par filament (courbe masquée par défaut, cliquez sur sa légende pour l'afficher)
- Le prix moyen au kilo (courbe masquée par défaut, cliquez sur sa légende pour l'afficher)

Au passage de la souris sur chaque point des groupes affiche le détail, qui contient les différentes valeurs représentées,
la liste des filaments concerné, leur marque et les magasins d'achat.

En dessous de ce graphique, 2 statistiques :

- Le temps moyen entre chaque achat
- Le temps écoulé depuis le dernier achat

![Historique d'achat](doc/fr/filaments/stats_purchase_history.png "Exemple d'historique d'achat")


# Les plus utilisés

Histogrammes représentant l'usage des filaments (quantité totale, utilisé et restant) répartie par catégorie, et triés 
du plus au moins utilisés.

Un graphique pour chaque catégorie de répartition :
- Par couleurs
- Par matières principales
- Par marques

Chaque barre représente le poids initial cumulé pour une catégorie. La zone supérieure transparent d'une barre représente 
la quantité de matière déjà utilisée, et la zone inférieure pleine la quantité de matière restante. 

![Répartition par usage](doc/fr/filaments/stats_most_used.png "Exemple de répartition par usage")


# Répartition par nombre

Graphiques de type camembert représentants la répartition du nombre de filaments par catégories :
- Par marques
- Par magasins
- Par matières
- Par couleurs

![Nombre de filaments](doc/fr/filaments/stats_counts.png "Exemple de répartition du nombre de filaments")


# Répartition par valeur (coût)

Graphiques de type camembert représentants la répartition des coûts des filaments par catégories :
- Par marques
- Par magasins
- Par matières
- Par couleurs

![Coût des filaments](doc/fr/filaments/stats_counts.png "Exemple de répartition du coût des filaments")