# 3DPTools Documentation

*3DPTools* is a web application allowing its users to manage their stock of 3D printing filament.

In the future, we plan to add printer management (with their power consumption), analysis and visualization of GCode
files, and possibly management of resins for SLA printing.

3DPTools aims to be a toolbox for 3D printing. The features will be added according to needs or contributions.

# Installation and configuration

The *3DPTools* application uses [NodeJS](https://nodejs.org), [MongoDB](https://www.mongodb.com/) et [Redis](https://redis.io/).   
It can be installed manually from source, or using [Docker](https://www.docker.com/) containers.

You will find prerequisites and installation instruction in the [page dedicated to installation](doc/en/install.md).

The application can be configured by specifying parameters at startup. Most parameters have default values. 
Those that do not have any correspond to features that are disabled by default (for example sending emails), 
or requiring specific values for the environment (for example Redis or MongoDB) and are therefore mandatory parameters.

You will find instructions to configure the application, with all available parameters, in the 
[page dedicated to configuration](doc/en/configuration.md).


# 3D printing filaments 

FDM (*Fused Deposition Modeling*) 3D printing technology uses spools of filaments. These filaments are made of various 
materials, mainly plastic.

*3DPTools* allows you to manage your stock of filament, using a set of metadata:
- The material that makes up the filament
- The diameter of the filament.
- Its color.
- Appearance and functional features (glittering, phosphorescent, conductive, ...).
- The brand of the manufacturer of the filament.
- The store, the date and the purchase price.
- Extrusion and heating bed temperature intervals.
- The density.
- The net weight the material and the total weight of the spool at purchase (used by the application to compute the 
amount of filament remaining).
- Images.
- ...

An entry into the filament stock generally corresponds to a filament spool.

Before adding a reel of filament to the stock, it is necessary to define more precisely some of the meta-data
which may be associated with the filament spool.

## Materials

*3DPTools* manages a collection of [materials](doc/en/materials), that the user must fill in.

A material may be generic (e.g. PLA), or a brand-specific variant (e.g. PLA PolyMax)

Each filament is associated with a material, and the filament stock can be filtered on a particular material.

[🏾 How to manage materials in 3DPTools](doc/en/materials).

## Brands

*3DPTools* manages a collection of [brands](doc/en/brands), that the user must fill in.

A brand is the manufacturer of the filament.

Each filament is associated with a brand, and the filament stock can be filtered on a particular brand.

[™️ How to manage brands in 3DPTools](doc/en/brands).

## Shops

*3DPTools* manages a collection of [shops](doc/en/shops), that the user must fill in.

A shop is where the filament was purchased.

Each filament is associated with a shop, and the filament stock can be filtered on a particular shop.

[🛒️ How to manage shops in 3DPTools](doc/en/shops).

## Filament

The filament collection management is a core feature of *3DPTools*.

[🗄️️ How to manage filaments in 3DPTools](doc/en/filaments).

## Statistics on filaments

The *3DPTools* application has a page of various statistics on the stock of filaments: reparation by materials / brands 
/ stores / colors, purchase history, ...

[📊 Learn more about filament statistics in 3DPTools](doc/en/filaments/statistics.md).


# Other feature of the application

## Personal account access

> *3DPtools* is multi-user but **NOT** multi-organization. An instance of the application = a single collection of printers, filaments, ... (one organization)

The creation of a user account must be done by an administrator (no self-registration mechanism). Each account can have 
the status of administrator, which gives administrative privileges over the application.

Apart from this distinction of normal user or administrator, all the users have the same rights, and can add, modify, 
delete all the data managed by the application (with the exception of the administrative parts), whether they are the 
creators or not.  
There is no concept of ownership of a given item or item in the stocks.

A feature allows a user to recover its account in cas he forgot his password.

## Localized software

The application is internationalized. It is currently localized in several languages, including 2 main languages:
- English (en), the default language
- French (fr), language of the creator of the application

Other languages can be added easily by translating some files, to localize the interface of the application, but also 
this documentation. If you wish to contribute to the addition or the maintenance of a language, please read the section
[Contribution - Writing of documentations and translations](#documentation-writing-and-translation).

## Application administration

Users with administrator privileges will have access in the interface of the application to the administrative section:
users, some configuration, system status, ...

Please read the [documentation on administering 3DPTools](doc/en/administration) for more information.

# Contributing

## Documentation writing and translation

You can contribute by completing the documentation, or by translating the application or its documentation.

The documentations are Markdown files, stored in the [doc/] (doc/) directory of the source code.  
Each subdirectory corresponds to one language (via the ISO 639-1 code), and contains a directory structure and
markdown files, which must be respected.

The names of the directories and files should not be translated. This allows the application, when a page does not exists
for the current language, to be able instead to display the page in the default language (English, code `en`).

The links in these documentation pages have special meaning. Links to other pages of the documentation must be able to 
work when the documentation is consulted internally, or directly in the code repository.

For this you must use absolute links from the root of the code repository, including the directory of the language. 
In internal consultation mode, the application will handle these links.

For the translation of the *3DPTools* application itself, edit the `.json` file corresponding to the ISO 639-1 code
of the language in the [src/locales](src/local) directory of the source code.

To declare a new language, you must add it to the internal configuration file [src/config/internal.json](src/config/internal.json), 
in the `local` array. Then add a new `.json` file in the [src/locales](src/locales) directory.

The `.json` language files are objects, the keys being a text identifier, usually the text to display in English (`en`), 
and values the translated version of this text. Texts can contain HTML, * BBCode *, or printf directives (`% s`,`% .2f`, ...), 
which **must be respected** when translating.

It is therefore possible to initiate a language file by copying from [src/locales/en.json](src/locales/en.json).

Another method is to declare the language in the configuration file [src/config/internal.json](src/config/internal.json),
start the *3DPTools* application in development mode, and then choose the language from the language selection menu.
The application will then automatically create the `.json` file, and fill it with untranslated texts (with their value in English)
as you navigate through the application interface.

**Please note for the new languages:** each language have name, also translated, whose key of text corresponds to `lang_ <CODE_ISO-639-1>`.
The application therefore needs a translation for this key, **at least in the file [src/locales/en.json](src/locales/en.json)
and the `.json` file of the new language itself**. You can add name of this new language in the others language files 
for which you know the translation.
