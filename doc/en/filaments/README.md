# Filaments

Managing filaments stock is one of the main features of *3DPTools*.

A filament represent a 3D printing FDM consumable. It is a spool of filament generally speaking: a real spool of 
filament or a sample without spool both represent a filament in the application. 

A filament has multiple features.

## Features of a filament

### Main features

- **A name**, optional, which identify or briefly describes a filament (*phosphorescent*, *fire proof*, ...).
- **A description** optional, that can be write in [Markdown](doc/en/markdown.md).
- **A list of pictures**.

### Describing features

- **The [material](doc/en/materials)**. Mandatory.
- **The diameter**, in mm (*1.75*, *2.85*, *3.0*, ...). Mandatory.
- **The [brand](doc/en/brands)**. Mandatory. 
- **The primary color**. Mandatory. It can be chosen from a list of pre-defined or already used colors, or it is possible to set
a specific color giving:
  - Its name
  - Its color code, using HTML/CSS syntax (`#RRVVBB`, `rgb(<Red>, <Green>, <Blue>)`, 
    `rgba(<Red>, <Green>, <Blue>, <Transparency>)`).
- **The secondary color**. Optional, it can be defined for example for UV or temperature reactive filaments that change their color.    
  Like the primary color, it can be chosen from a list of pre-defined or already used colors, or is it possible to set a 
  specific color giving its name and code.  
  Filaments with a secondary color will use a gradient from primary to secondary color to preview their color. 
- **A main color**. Mandatory, with automatique computing of the nearest main color by the application from the primary color.
  Main colors list is not customisable. Main color is used to regroup different kind of color behind a global one, 
  allowing easier filtering and search in the application.   
  e.g.: filaments with color *sky blue*, *dark blue* or *turquoise* will all have *blue* as main color.  

### Buying features

- **Buing date**. Mandatory.
- **The buying [shops](doc/en/shops)**. Mandatory.
- **Price**. Mandatory.

### Weight features

- **Initial net material weight**, in *kg*, Mandatory. It is the initial weight material, excluding the 
spool.  
- **Initial total weight**, material + spool, in *kg*. Mandatory. It is the overall weight of the spool, including the 
filament and the spool itself, after acquiring it (before the first use). 

These 2 weights must be as accurate as possible and are needed for the remaining filament estimation features.  
The initial total weight must be measured using a precision scale, which must be used thereafter to measure the total 
weight periodically as the filament is used: this total intermediate weight will be supplied to the application that 
will use all of these data to estimate the weight (and length) of material remaining for the filament.

**Example:**

For a filament spool containing (says by the manufacturer) 1 kg of material, the complete spool is measured at 1.235 kg.
These datas are saved in the application, which can then assume that the spool itself (or any other non-printable 
element of the set) weighs 235 g (`1,235 kg - 1 kg`).  
After using the filament to print some parts, before storing it, the scale says the complet spool + material now 
weights: 985 g.  
This value is supplied to the application, which deduces that there is only 750 g of filament remaining 
(`985 g - (1,235 kg - 1 kg)` => `985 g - 235 g`.  
The application will now state that the filament has 75% of material left.  
In addition, using the density value of the filament, the application will be able to estimate the remaining filament 
length, in meters.
  
### Technical features

- **Density** of the material in *kg/m³*. Mandatory, it is used by the application to convert between weigth and length, 
and vice versa. It is used for example in the  [💵 cost calculator](doc/en/filaments/cost_calculator.md). 
- **Hotend temperature**, in *°C*. Optional, it is composed of multiple values:
  - Minimal temperature.
  - Maximal temperature.
  - Recommended/verified temperature.
- **Heated bed temperature**, in *°C*. Optional, it is composed of multiple values:
  - Minimal temperature.
  - Maximal temperature.
  - Recommended/verified temperature.
- **Printing speed**, in *mm/s*. Optional, it is composed of 2 valeurs : the minimal and the maximal speed.
- **Extrusion flow**, in *%*. Optional, default to *100%*. 

### Importing features value from te material

Some features' values can be imported from the [material](doc/fr/materials) of the filament:

- Minimal and maximal hotend temperature
- Minimal and maximal heated bed temperature
- Minimal and maximal printing speed
- Density

# Filaments list

The list of already existing filaments in the application can be viewed in the [Filaments](/filament) section:

![Filaments list](doc/en/filaments/filaments.png "Example of a filaments list in the application")

They are shown as a list, with for each of them:
- Colors
- The material and the diameter
- Initial materiel weight and density
- Buying price, and the extrapolated price per kg
- Printing temperature recommendations
- The brand (using its logo)
- The material left, using a progress bar with the remaining weight and length 
- A set of actions that are possible on the filament

The list has a two rows header.  
The first row indicates the number of filaments corresponding to the current filtering, with a button to add a new 
filament at the fare right of the row.  
The second row allows filtering on filament, and to change the sort.  

## Available actions on a filament

In the fare right part of a filament in the list, a set a links allows the following actions on the filament:  

- Show a page with the full detailled features of the filament (it is also the default action when clicking anywhere 
  else on the filament row).
- Edit the filament
- Delete it
- Set the material left
- A sub-menu contains more actions:
  - Create a new filament by copying the current one
  - Add a image to the filament
  - Open the [💵 cost calculator](doc/en/filaments/cost_calculator.md) with the current filament pre-selected
  - Toggle the filament as finished / not finished

## Sorting

Different kind of sorts are available using the selector at the right most par of the list header.  
Selecting a new value in the selector's list is enough to re-order the list.

## Filtering

By default all not finished filament are shown in the filament list.

To filter the filament shown, several selectors are available on the second row of the list headers, allowing to filter 
on:
- Color. It is possible to select an exact primary color, or a master color.
- Material. By default the filtering is done on the exact material. Toggling the button right after the selector enables
  the material filtering also on variant of the selected material.
- Shop.
- Brand.
- Finished or not finished filaments.

# Add a filament

On the top-right corner of the filament list, in the first header row, is a button _Add filament_ that can be used to 
open the [new filament form](/filament/add).

![Add a filament](doc/en/filaments/add_filament.png "Example of adding a filament in the application")

All features of a filament can be inputed in the form, except for pictures.

When selecting a primary color (pre-defined, already used or a custom on), the master color is automatically selected by a 
nearest color algorithm.  
Vous can force this computing using the dedicated button: ![](doc/fr/filaments/master-color-button.png)  
It is also possible to manually select the master color, in case of an error during the nearest color computing (which 
may happens on color near gray of neutral). 

Some features are prefixed by the following button: ![](doc/fr/filaments/import-from-material-button.png)  
These are features whose value can be retrieved from the material. Simply use this button to pre-fill the field with the 
material's value.

## Copy of an existing filament

Using the _copy_ action from an existing filament, the new filament form will be displayed pre-filled with all the values 
of the existing filament, except buying features (date, shop, price). For these characteristics, the original values will 
however be provided for information. 

# Pictures of a filament

It is possible to illustrate a filament by associating images with it. These images can be, for example, photos of the 
filament spool, its box or its label, or pictures of objects resulting from printing with this filament.

## Add

Picture are uploaded using a dedicated form, accessible using the _add picture_ action.  Links for the action can be 
found in the _other actions_ sub-menu of a filament.

![Other action on a filament](doc/en/filaments/other_actions.png "Filament 'other actions' sub-menu")

Simply select a local picture and validate the form to upload and save the image into the application. 

![Add a picture on a filament](doc/en/filaments/add_filament_picture.png "Add a picture on a filament")

Repeat for each picture to add.

## Display and download

All the pictures of a filament are displayed in the filament's details page.

![Display of filament's pictures, with contextual icons](doc/en/filaments/filament_images_view.png "Display of filament's pictures, with contextual icons")

To zoom on a picture, simply click on it.

Hovering the picture with the mouse cursor shows action icons over the picture, on the bottom right corner.

One of these icons can be used to download the picture.

## Deletion

The second icons on contextual action icons on a filament picture can be used to delete it.  
A confirmation dialog box will appear:

![Filament picture deletion confirmation](doc/en/filaments/filament_image_deletion_confirmation.png "Filament picture deletion confirmation") 


# Display filament's details

From the filament list, by clicking anywhere on a filament row or on its _display_ action link, the filament's details 
page will appear.

This page contains all the features and information of the filament.

In the left part, an info box contains describing and technical features of the filament.

In the right parts, some buttons triggers all possible actions on the filament.

In the central part can be found:
- data about initial material weigh, usage progression and material left;
- the description if the filament, rendered in [Markdown](en/markdown.md);
- buying information: shop, date, price;
- the creation and the last modification dates;
- the description of the material;
- pictures of the filament.

![Filament details page](doc/en/filaments/filament_details_page.png "Filament details page")

# Edit a filament

Using the _edit_ action on a filament, a form like the filament add one is displayed, filled with all the data of the 
filament. 

To modify a filament, just change values in this form and save it.

Last modification date of the filament is updated when validating the form.

# Delete a filament

A filament can be deleted using the _delete_ action. When using this action, a pop-in will show up to confirm the 
deletion of the filament : 

![Filament deletion confirmation](doc/en/filaments/filament_deletion_confirmation.png "Filament deletion confirmation") 

All data of the filament are deleted, including pictures and material left information. Once deleted, there is no way to 
recover these data.

# Left material

The _left material_ can be used to manage the filament consumption. 

A page of the application allows to input different filament consumption, giving data to the application to calculate 
the amount of material remaining for the filament.

It is recommended to use this feature after each use of a filament, before putting it away, in order to have an 
up-to-date an accurate follow-up of the amount of material remaining. 

![Material left page](doc/en/filaments/material_left.png "Material left page")

## Left total weight

This is the method that will probably be used most often. It consists in measuring the total weight of the spool (the 
spool itself + the filament remaining) the same way as for measuring the total initial weight at the creation of the 
filament.

By inputting this measurement in the application, it will be able to estimate quite precisely the quantity of remaining 
material.

The accuracy of the estimation depends mainly on the measurement of the weight (and especially the respect of the 
calibration from one measurement to another), but also much of the actual amount of initial material compared to that 
announced. Some manufacturers do not provide exactly on the spool sold the weight of material announced (plus or minus), 
which distorts the overall estimate.

It may happen when you approach the end of the spool, that by entering the remaining weight the application tells you 
that there is no more material (filament finished), while this is not the case, and this despite the precision of the 
measurement. These cases are due to the fact that originally the coil contained less filament than announced by the 
manufacturer. 

## Left length

This is to indicate absolutely the exact length, in meters, of filament remaining. This method is more easily achieved 
by arriving at the end of a spool, when there are only a few meters left, and it is recommended at this time if possible, 
as it's more accurate than the estimation based on the weight.

## Add/substract length

It is also possible to remove a certain length of filament (or add some, to correct). This corresponds to indicating what 
length of filament was consumed to print a thing. This information is often provided by slicers, sometimes measured by 
some printers.

Note: in such cases, consider taking into account the filament length consumed during the loading of the filament, for 
example to clean the hotend of the previous material. 

# Finished filament

Among the possible actions of a filament, _finished_ allows to mark the filament as completed. It will then be 
represented differently in the list of filaments. Finished filaments are not displayed by default in the filament list.

On a finished filament, the _finished_ action changes to _not finished_ to correct a finished state indicated by error.

![Example of finished filaments in the filament list](doc/en/filaments/finished_filaments_in_list.png "Example of finished filaments in the filament list")

# Cost calculator

The [💵 cost calculator](doc/en/filaments/cost_calculator.md) is a tool that help to calculate the cost of printing a 
thing, based on a given filament and the amount of materiel needed for the print. 
