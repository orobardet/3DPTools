# Brands

The brands collection list all 3D printing filament manufacturers used in the filament collection.  
A filament must be associated to one of those brands.

A brand is represented by its name, its website URL, and its logo.

# Brands list

![Brands list](doc/en/brands/brands.png "Example of a brands list in the application")

Brands in the application are displayed in a list, with for each of them its name, URL, logo, creation date in the 
application, and a list of actions that can be done on the brand. 

# Add a brand

On the top right of the brand list, a button can be used to display the [new brand form](/brand/add).

Adding a brand is a 2 step process (2 forms).

The first form allow you to input the name and URL of the brand.

![Add a brand](doc/en/brands/add_brand.png "Example of adding a brand in the application")

Saving this first form add the new brand in the application's database, and display the second form which allows you to 
select a local image file. This file will be sent to the application, which will use it as brand's logo. 

![Adding a logo to a brand](doc/en/brands/add_brand_logo.png "Example of adding a logo to a brand in the application")

_Note: Adding a logo to a brand is not mandatory._ 
 
# Edit a brand

In the brand list, 2 links are available to edit a brand:

- _edit_ : Use it to change the name and url of the brand. 
- _change picture_ : Use it to change or remove the brand's logo. In this form, you can select a local image file that 
will, be used as brand's logo, or use the _Remove logo_ button to delete the existing logo.

# Delete a brand

In the brand list, a action _delete_ allows you to ask for the deletion of the brand.

The link for this action may be grayed it the deletion of the brand in not possible. Deleting a brand is not possible if 
at least one filament uses it. You will first have to edit filaments usign the brand to free it, and then the brand's deletion 
will be allowed.

Clicking on the _delete_ link display a confirmation poping:

![Brand's deletion confirmation](doc/en/brands/delete_brand_confirmation.png "Confirmation popin when deleting a brand")
