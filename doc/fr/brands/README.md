# Les marques

L'inventaire des marques correspond aux fabriquants de filaments d'impression 3D.  
Un filament devra être associé à une de ces marques.

Une marque est simplement représentée par son nom, l'URL de son site Web, et son logo. 

# Liste des marques

![Liste des marques](doc/fr/brands/brands.png "Exemple d'une liste de marques dans l'application")

Les marques déjà présentes dans l'application sont affichées sous forme d'une liste, avec pour chaque marque son nom et
son URL, son logo, la date d'ajout de la marque dans l'application, et une liste d'actions réalisables pour la marque.

# Ajouter une marque

En haut à droite de la liste des marques se trouve un bouton permettant d'accéder au 
[formulaire d'ajout d'une nouvelle marque](/brand/add).

L'ajout d'une marque se fait en 2 étapes (2 formulaires).

Le premier formulaire permet de saisir le nom et l'URL de la marque.

![Ajout d'une marque](doc/fr/brands/add_brand.png "Exemple d'ajout d'une marque dans l'application")

La validation de ce premier formulaire enregistre la nouvelle marque dans l'application, et affiche le second un second 
formulaire qui permet de sélectionner un fichier image local qui sera envoyé dans l'application pour être utilisé comme 
logo de la marque.

![Ajout d'un logo à une marque](doc/fr/brands/add_brand_logo.png "Exemple d'ajout d'un logo à une marque dans l'application")

_Note : L'ajout d'un logo est optionnel._ 
 
# Modifier une marque

Dans la liste des marques, 2 liens d'action sont disponibles pour modifier une marque :

- _modifier_ : Permet d'afficher le formulaire de modification du nom de la marque et de son URL. 
- _changer l'image_ : Permet de changer le logo de la marque, ou de retirer celui existant. Dans le formulaire présenté, 
on peut sélectionner un fichier image local qui sera envoyé dans l'application pour être utilisé comme nouveau logo, ou 
bien utiliser le bouton _Retirer le logo_ pour supprimer le logo existant.

# Supprimer une marque

Dans la liste des marques, une action _supprimer_ permet de demander la suppression d'une marque.

Le lien de cette action peut être grisé si la suppression de la marque n'est pas possible, car utilisée par au moins un 
filament. Il faudra d'abord modifier les filaments utilisant la marque pour libérer cette dernière et pouvoir la supprimer.

Un clic sur le lien _supprimer_ affiche une popin de confirmation de la suppression :

![Confirmation de suppression d'une marque](doc/fr/brands/delete_brand_confirmation.png "Popin de confirmation de suppression d'une marque")
