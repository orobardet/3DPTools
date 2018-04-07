# Materials

The materials collection is a list of plastic (or something else) material of which the filaments are made.  
A filament must be associated to a material. 

A material can be a generic one (e.g. `PLA`), or a brand specific variant (e.g. `PLA PolyMax`). So material can be 
hierarchically organized. A *B* material can have another *A* material as a parent, which makes the *B* material a **variant** 
of the *A* material.

The filament stock can be filtered on a material. If the material used for filtering has variants, it is possible to 
filter strictly, and only filaments made of that exact material are listed, or to filter including variants. 

In *3DPTools*, [material management](/material) can be reached on the *Datas* menu, and then *Materials* sub-menu.  
This will display the list of materials (which can be empty if there is no material in the database). 

# Material spécifications

- **Name**: display name of the material (or the variant). For example: `PLA`, `ABS`, `PLA PolyMax`, `Laybrick`, ...
- **Parent material**: if a parent material is defined, the current material will be considerd as a variant of the parent material.
- **Descriptions**: a description text of the material, where [Markdown](/doc/en/markdown.md) can be used.
- **Density**: the material density in kg/m³. This is needed for the application when dealing with amount of material left, consumed, ...
- **Minimal and maximal print speed**: in mm/s, the recommended print speed interval, if any.
- **Hotend temperature**: in °C, the hotend printing temperature interval for the material.
- **Hot bed temperature**: in °C, the hot bed temperature interval for the material, if any.
- **Attached files**, like technical or commercial sheets.

For non mandatory intervals (min/max), it is possible to set the 2 values, or only one of them (or none).
 
# Materials list

![Materials list](doc/en/materials/materials.png "Example of a materials list in the application")

The already existing materials in the application a listed as a table list, in the alphabetical order of the main materials.  
Each main material is followed by the indented list of its variants, if any.

Information of each material (main or variant) are displayed.

In the right part of each material (main or variant), a set of links are present in order to do the following actions on 
the material:

- edit.
- delete.
- add a file, to attach a new file to the material.

By default, when the application was just installed or on an empty database, there is no pre-defined materials.

# Add a material

On the top right of the material list, a button can be used to display the [new material form](/material/add).

This form can be used to input all the specifications of a material. The mandatory ones are identified with a little 
red star (*) to the right of their label.  

The *Description* accept [Markdown](/doc/en/markdown.md). The area on its right will display a live preview on the inputed 
Markdown.

![Ajout d'une matière](doc/en/materials/add_material.png "Example of adding a material")

# Edit a material

In the materials list, at the right of each material, there is an *edit* link, which display a form for editing a material.

The material edition used the same form as the one for adding a material, filled with the actual specifications of the material.

# Delete a material

In the material list,  at the right of each material, there is an *delete* link, which ask the the deletion of a material.

This link can be grayed out if the deletion of a material is not possible, for one of the following reasons:
 - The material has variants. You must first delete all the variants (or edit them to select another parent material).
 - The material is used by filaments. You must first edit these filement to select another material.

A click on the *delete* link show a delete confirmaiton popin: 

![Delete confirmation for a material](doc/en/materials/delete_material_confirmation.png "Delete material confirmation popin")

# Attache file to a material

It is possible to attache files to a material by using the *add a file* link, on the right of each material in the materials list.

Clicking on this link will show a form for selection a file on your computer, and the display name of this file in the 
application. Ces 2 informations are mandatory, but the second one is pre-computed when you select a file.

One the form is validated, the file is uploaded into the application and save in its database, attached to the material.

It is possible to attach as many file as wanted to a same material.

The attached file list is on the right of a material description in the materiasl list.

![Material's attached files](doc/en/materials/material_file_list.png "Material's attached files")

It is a list of links, that allow to view or download (depending of the file's type) each attached files.
