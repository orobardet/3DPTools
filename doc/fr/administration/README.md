# Administration de l'application 3DPTools

La section d'administration de l'application est disponible pour les utilisateurs avec les droits administrateur.

Elle est accessible dans le menu principal de l'application, et est composée de plusieurs section.

# Utilisateurs

Permet de consulter et gérer les utilisateurs ayant accès à l'application.

Par défaut, cette section affiche la liste des utilisateurs, avec leurs informations :
- Adresse email
- Prénom
- Nom
- Date de création du compte
- Compte administrateur ou non

Un lien permet de modifier un compte utilisateur. Un click sur ce lien fait apparaître une popin permettant de modifier 
les informations ci-dessus, ainsi que changer le mot de passe de l'utilisateur. 

Pour ajouter un utilisateur, un bouton correspondant est disponible à droite dans l'en-tête de la liste des utilisateurs.
Il faut apparaître une popin similaire à cette de l'édition d'un utilisateur, mais permettant cette fois d'en créer un nouveau.

# Informations système

Affiche toutes les informations techniques sur l'environnement de l'application et le système :
- Type d'OS et architecture
- Etat du stockage
- Etat de la mémoire
- Informations sur la base de donnée de l'application
- Information sur MongoDB
- Version de Node JS et de ses modules
- Variables d'environnements
- ...

Les information sur la page sont rafraîchies automatiquement. Un bouton en haut à droite de la page permet de contrôler 
le niveau de mise à jour des données dans la page.

Un lien dans l'en-tête de la page permet d'afficher le metric end-point Prometheus de l'application, si activé dans la 
configuration.

# Affichage de la configuration

Cette section permet de visualiser la configuration actuelle de l'application (toutes sources de paramètres fusionnées), 
aux formats YAML ou JSON.

Les mots de passe et secrets sont masqués, remplacés par des étoiles (*).

En haut à droite de la page, un bouton permet de tester la configuration email de l'application (si elle est activée, 
sinon le bouton n'apparaît pas). Il envoie un email de test à l'utilisateur actuellement connecté.
