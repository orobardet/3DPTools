# Les magasins

L'inventaire des magasins correspond aux endroits où les filaments d'impression 3D ont été achetés.  
Un filament devra être associé à un de ces magasins.

Un magasin est simplement représenté par son nom, l'URL de son site web, et son logo.

# Liste des magasins

![Liste des magasins](doc/fr/shops/shops.png "Exemple d'une liste de magasins dans l'application")

Les magasins déjà présents dans l'application sont affichés sous forme d'une liste, avec pour chaque magasin son nom et 
son URL, son logo, la date d'ajout du magasin dans l'application et une liste d'actions réalisables pour le magasin.

# Ajouter un magasin

En haut à droite de la liste des magasins se trouve un bouton permettant d'accéder au 
[formulaire d'ajout d'un nouveau magasin](/shop/add).

L'ajout d'un magasin se fait en 2 étapes (2 formulaires).

Le premier formulaire permet de saisir le nom et l'URL du magasin.

![Ajout d'un magasin](doc/fr/shops/add_shop.png "Exemple d'ajout d'un magasin dans l'application")

La validation de ce premier formulaire enregistre le nouveau magasin dans l'application, et affiche le second un second 
formulaire qui permet de sélectionner un fichier image local qui sera envoyé dans l'application pour être utilisé comme 
logo du magasin.

![Ajout d'un logo à un magasin](doc/fr/shops/add_shop_logo.png "Exemple d'ajout d'un logo à un magasin dans l'application")

_Note : L'ajout d'un logo est optionnel._ 

# Modifier un magasin

Dans la liste des magasins, 2 liens d'action sont disponibles pour modifier un magasin.

- _modifier_ : Permet d'afficher le formulaire de modification du nom du magasin et de son URL.
- _changer l'image_ : Permet de changer le logo du magasin, ou de retirer le logo existant. Dans le formulaire présenté, 
on peut sélectionner un fichier image local qui sera envoyé dans l'application pour être utilisé comme nouveau logo, ou 
bien utiliser le bouton _Retirer le logo_ pour supprimer le logo existant.

# Supprimer un magasin

Dans la liste des magasins, une action _supprimer_ permet de demander la suppression d'un magasin.

Le lien de cette action peut être grisé si la suppression du magasin n'est pas possible, car utilisé par au moins un 
filament. Il faudra d'abord modifier les filaments utilisant le magasins pour libérer ce dernier et pouvoir le supprimer.

Un clic sur le lien _supprimer_ affiche une popin de confirmation de la suppression :

![Confirmation de suppression d'un magasin](doc/fr/shops/delete_shop_confirmation.png "Popin de confirmation de suppression d'un magasin")
