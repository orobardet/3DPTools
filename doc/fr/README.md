# Documentation 3DPTools

*3DPTools* est une application web permettant pour le moment de gérer votre stock de filaments pour impression 3D.

A l'avenir, il est prévu d'intégrer une gestion des imprimantes (avec leur consommation électrique), une analyse et une 
visualisation de fichiers GCode, et peut-être une gestion des résines pour impression stéréolithographique.

L'objectif de 3DPTools est d'être une boite à outils logiciel pour l'impression 3D. Les fonctionnalités se rajouterons 
donc en fonction des besoins ou des contributions.

# Installation et configuration

L'application *3DPTools* utilise [NodeJS](https://nodejs.org), [MongoDB](https://www.mongodb.com/) et [Redis](https://redis.io/). 
Elle peut être installé à la main à partir des sources, ou bien via des conteneurs [Docker](https://www.docker.com/).

Vous trouverez les prérequis et les instructions d'installation [dans la page dédiée à l'installation](doc/fr/install.md). 

Cette application peut être configurée en spécifiant des paramètres au démarrage. La plupart des paramètres ont des 
valeurs par défaut. Ceux qui n'en ont pas correspondent à des fonctionnalités désactivées par défaut (par exemple 
l'envoi d'email), ou qui nécessitent des valeur spécifique à l'environnement (par exemple Redis ou MongoDB) et sont donc 
des paramètres obligatoires.

Vous trouverez les instructions pour configurer l'application, ainsi que tous les paramètres disponibles [dans la page 
dédiée à la configuration](doc/fr/configuration.md).


# Filaments d'impression 3D

La technologie d'impression 3D FDM (*Fused Deposition Modeling*, dépôt de matière fondue) utilise des bobines de filaments.
Ces filaments sont en diverses matériaux, principalement du plastique.

*3DPTools* permet de gérer votre stock de filament, en y associant un ensemble de meta-données :
- La matière qui compose le filament.
- Le diamètre du filament.
- Sa couleur.
- Des caractéristiques d'aspect et fonctionnelles (pailleté, phosphorescent, conducteur, ...).
- La marque du fabriquant du filament.
- Le magasin, la date et le prix d'achat.
- Les intervalles de température d'extrusion et de lit chauffant.
- La densité.
- Le poids net le matière et le poids total de la bobine à l'achat (utilisé par l'application pour calculer la quantité de filament restante).
- Des images.
- ...

Une entrée dans le stock de filaments correspond généralement à une bobine de filament.

Avant d'ajouter une bobine de filament au stock, il est nécessaire de définir plus précisément certaines des méta-données
qui pourront être associée à la bobine de filament.

## Les matières

*3DPTools* gère une collection de [matières](doc/fr/materials), à saisir par l'utilisateur.

Une matière peut être générique (par ex. PLA), ou une variante spécifique à une marque (par ex. PLA PolyMax).

Chaque filament est associé à une matière, et le stock de filaments peut être filtré sur une matière particulière.

[🏾 Comment gérer les matières dans 3DPTools](doc/fr/materials).


## Les marques

*3DPTools* gère une collection de [marques](/doc/fr/brands), à saisir par l'utilisateur.

Une marque correspond au fabriquant du filament.

Chaque filament est associé à une marque, et le stock de filaments peut être filtré sur une marque particulière.

[™️ Comment gérer les marques dans 3DPTools](doc/fr/brands).


## Les magasins

*3DPTools* gère une collection de [magasins](/doc/fr/shops), à saisir par l'utilisateur.

Un magasin correspond correspond à l'endroit où a été acheté un filament.  

Chaque filament est associé à un magasin, et le stock de filaments peut être filtré sur une marque particulière.

[🛒 Comment gérer les magasins dans 3DPTools](doc/fr/shops).


## Les filaments

La collection de filaments est le coeur de la gestion des stocks de filament dans *3DPTools*.

[🗄️ Comment gérer les filaments dans 3DPTools](doc/fr/filaments)


## Statistiques sur les filaments

L'application *3DPTools* propose une page de diverses statistique sur le stock de filaments : réparition par matières/marques/magasins/couleurs, 
historique d'achat, ...

[📊 En savoir plus sur les statistiques de filaments dans 3DPTools](doc/fr/filaments/statistics.md).


# Autres fonctionnalités de l'application

## Accès par compte nominatif

> *3DPtools* est multi-utilisateurs mais **PAS** multi-organisation. Une instance de l'application = une seule collection d'imprimantes, filaments, ... (une seule organisation)

La création d'un compte utilisateur se fait par un administrateur (pas de mécanisme d'inscription).  
Chaque compte peut avoir le statut d'administrateur, qui lui confère les droits d'administration de l'application.
 
En dehors de cette distinction d'utilisateur normal ou administrateur, tous les utilisteurs ont les mêmes droits, et 
peuvent ajouter, modifier, supprimer tous les données gérée par l'application (à l'exception des parties administratives), 
qu'ils en soient les créateurs ou non.   
Il n'y a pas de notion de propriétaire d'une donnée ou d'un objet dans les stocks.

Un mécanismes permet de récupérer son mot de passe en cas d'oubli.  

## Application localisée

L'application est internationalisée. Elle est actuellement localisée en plusieurs langues, dont 2 langues principales :
- l'anglais (en), langue par défaut
- le français (fr), langue du créateur de l'application

D'autre langues peuvent être rajoutée facilement en traduisant quelques fichiers, pour localiser l'interface de l'application, 
mais aussi la présente documentation. Si vous souhaiter contribuer à l'ajout ou la maintenance d'une langue, merci de 
consulter le paragraphe [Contribution - Rédaction de documentations et traductions](#r-daction-de-documentations-et-traductions). 

## Administration de l'application

Les utilisateurs ayant le status d'administrateur auront accès dans l'interface de l'application à une gestion administrative 
de cette dernière : utilisateur, certaines configuration, état du système...

Consulter la [documentation sur l'administration de 3DPTools](doc/fr/administration) pour plus d'information.

# Contribution

## Rédaction de documentations et traductions

Vous pouvez participer en complétant les documentations, ou en traduisant l'application ou les documentations. 

Les documentations sont des fichiers Markdown, rangés dans le répertoire [doc/](doc/) du code source.   
Chaque sous-répertoire correspond à une langue (via le code ISO 639-1), et contient une structure de répertoire et de 
fichiers markdown, qui doit être respectées.

Les noms des repertoires et fichiers ne doivent pas être traduis. Cela permet à l'application, lorsqu'une page n'existe 
pas pour la langue en cours, de pouvoir à la place afficher la page dans la langue pas défaut (l'anglais, code `en`).

Les liens dans ces pages de documentations ont un traitement spécial. Les liens vers d'autres pages de la documentation 
doivent pouvoir fonctionner lorsque la documentation est consultée en interne, ou directement dans le dépôt de code. 

Pour cela vous devez utiliser des liens absolus par rapport à la racine du dépôt de code, en incluant le répertoire 
intermédiaire de la langue. En mode de consultation interne à l'application, cette dernière se chargera de gérer 
correctement les liens.

Pour la traduction de l'application *3DPTools* en elle-même, il faut éditer le fichier `.json` correspondant au code ISO 639-1 
de la langue dans le répertoire [src/locales](src/locales) du code source.
  
Pour déclarer une nouvelle langue, il faut l'ajouter dans le fichier de configuration interne [src/config/internal.json](src/config/internal.json) 
du code source, dans le tableau `locales`. Puis il faut ajouter un nouveau fichier `.json` dans le répertoire [src/locales](src/locales).

Les fichiers de langue `.json` sont des objets, les clés étant un identifiant de texte, généralement le texte à afficher 
en anglais (`en`), et les valeurs la version traduite de ce texte. Les textes peuvent contenir du HTML, du *BBCode*, ou 
des directive printf (`%s`, `%.2f`, ...), qui **faut respecter**.  

Il donc possible d'initier un fichier de langue en copiant [src/locales/en.json](src/locales/en.json).

Une autre méthode consiste à déclarer la langue dans le fichier de configuration [src/config/internal.json](src/config/internal.json), 
puis à démarrer l'application *3DPTools* en mode développement, puis choisir la langue dans le menu de sélection de la langue.
L'application créera alors automatiquement le fichier `.json`, et le remplira des textes non traduit (avec leur valeur en anglais) 
au fur et à mesure que vous navigerez dans l'interface de l'application.

**A noter pour les nouvelles langues :** chaque langue a nom, traduit lui aussi, dont la clé de texte correspond à `lang_<CODE_ISO-639-1>`.
L'application a donc besoin d'une traduction pour cette clé, **au moins dans le fichier [src/locales/en.json](src/locales/en.json) 
et le fichier `.json` de la nouvelle langue elle-même**. Vous pouvez ajouter nom de cette nouvelle langue dans les autres 
fichers de langues pour lesquels vous connaissez la traduction.  