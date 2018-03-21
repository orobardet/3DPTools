# Les matières

La collection de matière correspond à la liste des matériaux plastique (ou autre) dont pourront être composés les filaments.  
Un filament devra être associé à une de ces matière.

Une matière peut être générique (par ex. PLA), ou une variante spécifique à une marque (par ex. PLA PolyMax). Il y a donc 
une notion d'arborescence de matière. Une matière *B* peut avoir une autre matière *A* comme parente, ce qui fera de la matière 
*B* une **variante** de la matière *A*.

Le stock de filaments peut être filtré sur une matière particulière. Si la matière utilisée pour le filtre a des variantes, 
il est possible d'avoir un filtrage strict, où seuls les filaments composé exactement de cette matière sont listés, oui 
bien un filtrage incluant les variantes.

Dans *3DPTools*, on accède à la [gestion des matières](/material) via le menu *Données*, puis le sous-menu *Matières*.  
Cela affiche la liste des matières (qui peut être vide s'il n'y a pas de matière dans la base de données).

# Caractéristiques d'une matière

> En **gras** les informations obligatoires

- **Nom** : nom d'affichage de la matière (ou de la variante). Par exemple : `PLA`, `ABS`, `PLA PolyMax`, `Laybrick`, ...
- Matière parent : si une matière parente est définie, la matière courante sera considérée par l'application comme une variante de la matière parente.
- Description : un texte de description de la matière, pouvant être écrit en utilisant du [Markdown](/doc/fr/markdown.md).
- **Densité** : la densité de la matière en kg/m³. Cette information est nécessaire pour que l'application puisse gérer les volumes de matière restante, consommée, etc.
- Vitesse d'impression minimale et maximale : en mm/s, l'interval de vitesse d'impression recommandé, s'il y en a un.
- Température d'extrusion : en °C, l'interval de température d'extrusion de la matière.
- Température du plateau : en °C, l'interval de température du plateau chauffant, s'il y en a un.
- Des fichiers joints, comme par exemple des fiches de descriptions techniques ou commerciales.

Pour les informations d'interval (min/max) non obligatoires, il est tout à fait possible de mettre les 2 valeurs ou une seule des 2 (ou aucune).

# Liste des matières

![Liste des matières](doc/fr/materials/materials.png "Exemple d'une liste de matières dans l'application")

Les matières déjà présentes dans l'application sont affichées sous forme d'un tableau listing, dans l'ordre alphabétique 
des matières principales.   
Chaque matière principale est suivie de la liste indentée de ces variantes, si elle en a.

Pour chaque matière (principale ou variante) sont affichés toutes ses informations.  

Dans la partie droite de chaque matière (principale ou variante) se trouvent un ensemble de lien permettant de réaliser 
des actions sur la matières :

- modifier.
- supprimer, qui est grisé pour une matière disposant de variante (il faut d'abord suppimer toutes les variantes), ou utilisée par des filaments.
- ajouter un fichier, pour attacher un fichier à la matière.  

Par défaut, lorsque l'application vient d'être installé ou sur une base de donnée vierge, il n'y a aucune matières pré-remplie.

# Ajouter une matière

En haut à gauche de la liste des matières se trouve un bouton permettant d'accéder au 
[formulaire d'ajout d'une nouvelle matière](/material/add).

Ce formulaire permet de saisir chacune des informations caractérisant une matière. Les informations obligatoires sont 
repérée par une petite étoile (*) rouge à droite de leur libellé.

Dans le champ *Description*, il est possible d'utiliser du [Markdown](/doc/fr/markdown.md). La zone à droite du champs 
de saisie de la description affichera une pré-visualisation en temps réelle du markdown saisie 

![Ajout d'une matière](doc/fr/materials/add_material.png "Exemple d'ajout d'une matière")

# Modifier une matière

Dans la liste des matières, dans la partie droite de chaque matière se trouve un lien *modifier* qui permet d'afficher le 
formulaire de modification d'une matière.

La modification d'une matière utilise le même formulaire que celui d'ajout, pré-remplie avec les caractéristiques actuelles 
de la matière.

# Supprimer une matière

Dans la liste des matières, dans la partie droite de chaque matière se trouve un lien *supprimer* qui permet de demander 
la suppression d'une matière.

Ce lien peut être grisé quand si la suppression de la matière n'est pas possible, pour une ou plusieurs des raisons suivantes :
 - La matière possède des variantes. Il faut d'abord supprimer toutes les variantes (ou les modifier pour les associer à une autre matière parente).
 - La matière est actuellement utilisée par des filaments. Il faut d'abord modifier tout ces filaments pour les associer à une autre matière.  
 Il est possible de lister les filaments en question en allant dans la liste des [filaments](/doc/fr/filaments) et en les
 filtrant par matière.

Un clic sur le lien *supprimer* affiche une popin de confirmation de la suppression :

![Confirmation de suppression d'une matière](doc/fr/materials/delete_material_confirmation.png "Popin de confirmation de suppression d'une matière")

#  Attacher des fichiers à une matière

Il est possible d'attacher des fichiers à une matière grâce au lien *ajouter un fichier* qui se trouve dans la partie droite 
de chaque matière, dans la liste des matières.

Un clic sur ce lien affiche une page de formulaire de sélection d'un fichier sur votre ordinateur, et du nom d'affichage 
du fichier dans l'application. Ces 2 informations sont obligatoires, mais la secondes est pré-remplie par défaut lorsque 
vous choisissez un fichier.

Une fois le formulaire validé, le fichier est téléchargé vers l'application qui l'enregistre dans sa base de donnée et 
l'associe à la matière.

Il est possible d'attacher autant de fichier que l'on veut à une même matière.

La liste des fichiers attachés à une matière se trouve à droite de sa description dans la liste des matières.

![Fichiers attachés d'une matière](doc/fr/materials/material_file_list.png "Liste des fichiers attachés à une matière")

Il s'agit d'une liste de liens, qui permettent d'afficher ou de télécharger (selon le type du fichier) chacun des fichiers attachés.