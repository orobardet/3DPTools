# Les filaments

La gestion d'une collection de filament est une des fonctionnalités principales de *3DPTools*.

Un filament représente un exemplaire d'un consommable de type filament d'imprimante 3D. Généralement, 
il s'agit d'une bobine de filament, mais au sens large du terme : un échantillon ou une longueur sans bobine correspond 
à un exemplaire de filament dans l'application.

Un filament dispose de multiple caractéristiques.

## Caractéristiques d'un filament

### Caractéristiques générales

- **Un nom**, optionnel, qui permet d'identifier ou de décrire rapidement un filament si nécessaire 
  (*Phosphorescent vert*, *ignifugé*, ...).
- **Une description** optionnelle, acceptant le format [Markdown](doc/fr/markdown.md).
- **Une liste d'images** illustrant le filament.

### Caractéristiques descriptives

- **La [matière](doc/fr/materials)**. Obligatoire
- **Le diamètre**, en mm (*1.75*, *2.85*, *3.0*, ...). Obligatoire.
- **La [marque](doc/fr/brands)**. Obligatoire. 
- **La couleur principale**. Obligatoire. Elle peut être choisi parmi une liste de couleurs pré-définies ou déjà utilisées, ou bien
  il est possible de définir une couleur particulière en indiquant :  
  - Son nom
  - Son code couleur, exprimé en code HTML (`#RRVVBB`, `rgb(<Rouge>, <Vert>, <Bleu>)`, 
    `rgba(<Rouge>, <Vert>, <Bleu>, <Transparence>)`).
- **La couleur secondaire**. Optionnelle, elle peut être défini par exemple pour les filaments qui changent de couleurs 
  selon un élément externe (UV, temperature, obscurité, ...). Tout comme le couleur principale, elle peut être choisi 
  parmi une liste de couleurs pré-définies ou déjà utilisées, ou bien il est possible de définir une couleur particulière 
  en indiquant son nom et son code couleur.  
  Les filaments ayant une couleur secondaire utiliseront un dégradé de la couleur principale vers la secondaire pour 
  illustrer la couleur du filament.
- **Une couleur maîtresse**. Obligatoire avec calcul de correspondance automatique par l'application sur la couleur principale.  
  Non libre, il s'agit de la catégorie de couleur primaire, utilisée dans le reste de l'application pour faire des 
  filtrages par couleurs.  
  Par exemple, des filaments *bleu ciel*, *bleu foncé* et *turquoise* auront pour couleur maîtresse le *bleu*.
- **Les caractéristiques d'aspect et fonctionnelles**. Optionnelles :
  - Pailleté
  - Marbré/granite
  - Phosphorescent (la couleur secondaire indique la couleur que prend le filament dans le noir)
  - Change avec les UV (la couleur secondaire indique la couleur que prend le filament sous UV)
  - Change avec la température (la couleur secondaire indique la couleur que prend le filament au changement de température)
  - Conducteur 

### Caractéristiques d'achat

- **La date d'achat**. Obligatoire.
- **Le [magasin](doc/fr/shops)** d'achat. Obligatoire.
- **Le prix d'achat**. Obligatoire.

### Caractéristiques de poids

- **Le poids de matière inital net**, en *kg*, Obligatoire. Il s'agit de la quantité de matière disponible initialement 
sur la bobine, hors bobine.
- **Le poids total initial**, matière + bobine, en *kg*. Obligatoire. Il s'agit du poids de l'ensemble de la bobine et 
de matière qu'elle contient, au moment de l'achat (sans avoir jamais utilisé le filament).

Ces 2 poids doivent être le plus précis possible et sont nécessaires pour les fonctionnalités d'estimation de filament 
restant.  
Le poids total initial doit être mesuré à l'aide d'une balance, qui doit être utilisée par la suite pour mesurer le poids total 
périodiquement au fur et à mesure de l'utilisation du filament : ce poids total intermédiaire sera fourni à l'application 
qui se servira de toutes ces données pour estimer le poids (et la longueur) de matière restante pour le filament.

**Exemple :**

Pour une bobine de filament vendue comme contenant 1 kg de matière, on mesure la bobine complète à 1,235 kg.  
Ces données sont enregistrées dans l'application, qui peut alors supposer que la bobine en elle-même (ou tout autre 
élément non imprimable de l'ensemble) pèse 235 g (`1,235 kg - 1 kg`).  
Après utilisation du filament pour imprimer quelques pièces, avant de la ranger on mesure la bobine complète : 985 g.  
Cette valeur est fourni à l'application, qui en déduit qu'il ne reste plus que 750 g de filament disponible 
(`985 g - (1,235 kg - 1 kg)` => `985 g - 235 g`).  
L'application indiquera donc que le filament ne contient plus que 75% de matière.  
De plus, en utilisant la valeur de densité du filament, l'application sera capable d'estimer la longueur de filament 
restante, en mètre.

### Caractéristiques techniques

- **La densité** de la matière du filament en *kg/m³*. Obligatoire, elle est utilisée dans l'application pour les calculs 
  de poids et de volumétrie, par exemple pour les fonctionnalités de gestion de la quantité de filament restant, ou  
  dans le [💵 calculateur de coût](doc/fr/filaments/cost_calculator.md). 
- **La température d'extrusion**, en *°C*. Optionnelle, il s'agit de plusieurs valeurs :
  - La température minimale.
  - La température maximale.
  - La température expérimentée/recommandée.
- **La température du plateau chauffant**, en *°C*. Optionnelle, il s'agit de plusieurs valeurs :
  - La température minimale.
  - La température maximale.
  - La température expérimentée/recommandée.
- **La vitesse d'impression**, en *mm/s*. Optionnelle, il s'agit de 2 valeurs : la vitesse minimale et maximale.
- **Le pourcentage de flux d'extrusion**. Optionnel, il sera défini à 100% par défaut. Permet d'indiquer, pour des 
  filaments particuliers, une augmentation ou une réduction du flux d'extrusion par rapport aux filaments du même type 
  habituellement.

### Héritage de la matière

Certaines des caractéristiques peuvent être héritées de la [matière](doc/fr/materials) renseignée pour le filament :

- Température d'extrusion minimale et maximale
- Température du plateau chauffant minimale et maximale
- Vitesse d'impression minimale et maximale
- Densité

# Liste des filaments

La liste des filaments déjà présents dans l'application est accessible dès l'arrivée dans la section [Filaments](/filament) :

![Liste des filaments](doc/fr/filaments/filaments.png "Exemple d'une liste de filaments dans l'application")

Ils sont affichés sous forme d'une liste, avec pour chacun d'eux :
- Les couleurs
- La matière et la section (diamètre)
- Le poids de matière initial et la densité de la matière
- Le prix d'achat et le prix au kilo calculé
- Les recommendations de températures d'impression (correspond aux températures expérimentés/recommandées)
- La marque (via son logo)
- La quantité de filament restant, sous forme d'une barre de progression par rapport au poids initial, avec la poids et   
  longueur restant.
- Un ensemble d'actions réalisables sur le filament

La liste de filament est précédée d'un en-tête sur 2 lignes.  

La première ligne indique le nombre de filament correspondant au filtrage actuel, et contient à son extrême droite un 
bouton pour ajouter un filament. 

La seconde ligne permet de filter les filaments affichés selon divers critères, et de changer la méthode de tri.

## Actions réalisables sur un filament dans la liste

Dans la partie la plus à droite d'un filament dans la liste, un ensemble de liens permettent de réaliser les actions 
suivantes sur le filament :

- Afficher les informations détaillées sur le filament (c'est également l'action par défaut en cliquant la ligne du filament)
- Le modifier
- Le supprimer
- Modifier la quantité de matière restante
- Un sous-menu d'actions complémentaires :
  - Créer un nouveau filament en copiant les données du filament courant
  - Ajouter une image
  - Afficher le [💵 calculateur de coût](doc/fr/filaments/cost_calculator.md) avec ce filament pré-sélectionné
  - Marquer le filament comme terminé / non terminé

## Tri

Il est possible de choisir la méthode de tri des filaments dans la liste.  
Il faut utiliser pour cela le sélecteur se trouvant à l'extrême droite de la seconde ligne d'en-tête.

## Filtrage

Par défaut, en arrivant sur la liste, tout les filaments non terminés sont affichés.

Pour filtrer les filaments, plusieurs sélecteurs sont disponibles dans le seconde ligne d'en-tête, pour filtre par :
- Couleur. Il est possible de sélectionner une couleur primaire exacte, ou une couleur maîtresse.
- Matière. Par défaut le filtrage se fait sur la matière exacte. En activant le bouton qui suis le sélecteur de filtrage 
  de matières, l'application inclura dans le filtre toutes les variantes de la matière sélectionnée. 
- Magasin
- Marque
- Terminés/non terminés

# Ajouter un filament

En haut à droite de la liste des filaments, sur la première ligne d'en-tête, se trouve un bouton _ajouter un filament_ 
qui permet d'accéder au [formulaire d'ajout d'un nouveau filament](/filament/add).

![Ajout d'un filament](doc/fr/filaments/add_filament.png "Exemple d'ajout d'un filament dans l'application")

Toutes les caractéristiques d'un filament peuvent être saisies dans ce formulaire, à l'exception des images.

Lors de la sélection d'une couleur primaire (prédéfinie ou personnalisée), la couleur maîtresse est automatiquement sélectionnée 
par calcul de la couleur la plus proche.  
Vous pouvez forcer ce re-calcul en utilisant le bouton dédié : ![](doc/fr/filaments/master-color-button.png)
Il est cependant possible de sélectionner manuellement la couleur maîtresse, en cas d'erreur du mécanisme automatique, 
ce qui arrive sur certaines couleurs proches du gris.

Certaines caractéristiques sont préfixées par le bouton suivant : ![](doc/fr/filaments/import-from-material-button.png)
Il s'agit des caractéristiques dont il est possible de récupérer la valeur à partir de la matière du filament. Il suffit 
d'utiliser ce bouton pour pré-remplir le champ à partir de la valeur actuelle de la matière.

## Copie d'un filament existant

En utilisant l'action _copier_ à partir d'un filament existant, le formulaire d'ajout de filament s'affichera pré-rempli 
avec toutes les caractéristiques du filament existant, à l'exception des caractéristiques d'achat (date, magasin, prix).  
Pour ces caractéristiques d'achat, les valeurs du filament d'origine seront cependant fournie à titre indicatif.

Cette fonctionnalité permet d'ajouter rapidement d'autres exemplaire d'un même filament, par exemple acheté par la suite.

# Images d'un filament

Il est possible d'illustrer un filament en lui associant des images. Ces images peuvent être par exemple des photos de 
la bobine de filament, sa boite ou son étiquette, ou bien des photos d'objets résultat de l'impression avec ce filament.

## Ajout

Les images sont téléchargées vers l'application, via un formulaire dédié à chaque filament, accessible par l'action 
_ajouter une image_. Le lien de cette action est disponible (entre autre) dans la liste des filament, dans le menu 
_autres actions_. 

![Autres actions sur les filaments](doc/fr/filaments/other_actions.png "Sous-menu 'autres actions' d'un filament")

Il suffit alors de sélectionner une image locale puis de valider le formulaire pour qu'elle soit enregistrée dans 
l'application. 

![Ajout d'une image à une filament](doc/fr/filaments/add_filament_picture.png "Ajout d'une image à une filament")

L'opération est à répéter pour chaque image à ajouter.


## Affichage et téléchargement

L'ensemble des images sont affichées dans la page de détail d'un filament (cf. ci-dessous).

![Affichage des images d'un filament, avec icônes d'actions contextuelles](doc/fr/filaments/filament_images_view.png "Affichage des images d'un filament, avec icônes d'actions contextuelles")

Pour zoomer sur une image, il suffit de cliquer dessus.

En passant le curseur sur une image, des icônes d'action apparaissent par dessus l'image dans son coin inférieur droit.

Une des icônes permet de lancer le téléchargement de l'image.

## Suppression

La seconde icône qui apparait dans le coin inférieur droit d'une image permet de supprimer l'image.  
Une boite de dialogue de confirmation apparaîtra avant que le filament ne soit supprimé :

![Confirmation de suppression d'une image d'un filament](doc/fr/filaments/filament_image_deletion_confirmation.png "Confirmation de suppression d'une image d'un filament") 

# Affichage des détails d'un filament

A partir de la liste des filaments, en cliquant sur la ligne d'un filament ou sur son lien d'action _afficher_, l'application
affichage la page des détails du filament.

Cette page regroupe toutes les caractéristiques et information du filament.

Dans la partie de gauche se trouve une boite d'information reprenant les caractéristiques descriptives et technique du
filament.

Dans la partie de droite, des boutons permettent d'effectuer l'ensemble des actions possibles sur le filament.

Dans la partie centrale sont affichés :
- les données sur la quantité de matière initiale et restante, avec une barre de progression illustrant l'usage actuel 
  du filament ;
- la description du filament, mise en format si le format [Markdown](fr/markdown.md) a été utilisé pour rédiger la 
  description ;
- les informations d'achat : magasin, date et prix d'achat ;
- les dates de création et de dernière modification du filament ;
- un rappel de la description de la matière ;
- la galerie des images du filament.

![Page d'affichage des détails d'un filament](doc/fr/filaments/filament_details_page.png "Page d'affichage des détails d'un filament")

# Modifier un filament

En utilisant l'action _modifier_ d'un filament, un formulaire identique à celui de l'ajout d'un filament est affiché, 
pré-rempli avec toutes les données actuelles du filament.

Il suffit de modifier ce formulaire puis de le valider pour modifier le filament.

La date de dernière modification du filament est mise à jour au moment de la validation du formulaire.

# Supprimer un filament

En utilisant l'action _supprimer_ d'un filament, une popin sera afficher pour demander la confirmation de suppression du
filament : 

![Confirmation de suppression d'un filament](doc/fr/filaments/filament_deletion_confirmation.png "Confirmation de suppression d'un filament") 

Toutes les données du filaments sont supprimées, y compris les images associées et la quantité de matière déjà utilisée.

# Matière restante

L'action _matière restante_ permet de gérer l'utilisation du filament.

Une page permet de saisir de différente manière la consommation faite du filament, permettant à l'application de calculer 
la quantité de matière restante.

Il est recommandé d'utiliser cette fonctionnalité après chaque usage d'un filament, avant de le ranger, afin d'avoir un
suivi à jour et le plus précis possible de la quantité de matière imprimable restante.

![Page de gestion de la matière restante](doc/fr/filaments/material_left.png "Page de gestion de la matière restante")

## Poids total restant

C'est la méthode qui sera probablement utilisée le plus souvent. Elle consiste a mesurer le poids total de la bobine 
(bobine en elle-même + filament restant) de la même manière que pour mesurer le poids total initial à la création du 
filament.

En reportant cette mesure dans l'application, elle sera à capable d'estimer assez précisément la quantité de matière 
restantes.

La précision de l'estimation dépend principalement de celle de la mesure du poids (et surtout du respect de la 
calibration d'une mesure à l'autre), mais aussi beaucoup de la quantité réelle de matière initiale par rapport à celle 
annoncée. Certains fabriquant ne fournisse pas exactement sur les bobines vendu le poids de matière annoncée (en plus ou 
en moins), ce qui fausse l'estimation globale.

Il pourra arriver lorsque vous vous approcherez de la fin de la bobine, qu'en saisissant le poids restant l'application 
vous indique qu'il ne reste plus de matière (filament terminé), alors que ce n'est pas le cas, et ce malgré la précision 
de la mesure. Ces cas là sont dû au fait qu'à l'origine la bobine contenait moins de filament qu'annoncé par le fabricant. 
 
## Longueur restante

Il s'agit ici d'indiquer de manière absolue la longueur exacte, en mètre, de filament restant. Cette méthode est plus 
facilement réalisable en arrivant à la fin d'une bobine, lorsqu'il ne reste plus que quelques mètres, et elle est 
recommandée à ce moment là si possible, car plus précise que l'estimation sur le poids.

## Ajouter/retirer de la longueur

Il est également possible de retirer une certaine longueur de filament (ou d'en ajouter, pour corriger). Cela correspond 
à indiquer quelle longueur de filament a été consommée pour imprimer une pièce. C'est une information qui est souvent 
fournie par les trancheurs, parfois mesuré par certaines imprimantes.

Note : dans de tels cas, pensez à prendre en compte dans la longueur de filament consommée celle éventuellement consommée 
lors du chargement du filament, par exemple pour nettoyer la tête d'impression de la précédente matière. 

# Filament terminé

Parmi les actions possible d'un filament, _terminé_ permet de marqué le filament comme terminé. Il sera alors représenté 
différemment dans la liste des filaments. Les filaments terminés ne sont pas affichés par défaut dans la liste de filament.

Sur un filament terminé, l'action _terminé_ se transforme en _non terminé_ pour permettre de corriger un état terminé 
indiqué par erreur.

![Exemple de filaments terminés dans la liste des filaments](doc/fr/filaments/finished_filaments_in_list.png "Exemple de filaments terminés dans la liste des filaments")

# Calculateur de coût

Le [💵 calculateur de coût](doc/fr/filaments/cost_calculator.md) est un outil permettant d'évaluer précisément le coût 
d'impression d'une pièce à partir d'un filament donné et de la quantité de matière nécessaire pour son impression.
