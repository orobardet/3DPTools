# Shops

The shops collection is a list of places where 3D printing filament where bought.  
A filament must be associated to a shop. 

A shop is represented by its name, its website URL, and its logo.

# Shops list

![Shops list](doc/en/shops/shops.png "Example of a shops list in the application")

Shops in the application are displayed in a list, with for each of them its name, URL, logo, creation date in the 
application, and a list of actions that can be done on the shop. 

# Add a shop

On the top right of the shop list, a button can be used to display the [new shop form](/shop/add).

Adding a shop is a 2 step process (2 forms).

The first form allow you to input the name and URL of the shop.

![Add a shop](doc/en/shops/add_shop.png "Example of adding a shop in the application")

Saving this first form add the new shop in the application's database, and display the second form which allows you to 
select a local image file. This file will be sent to the application, which will use it as shop's logo. 

![Adding a logo to a shop](doc/en/shops/add_shop_logo.png "Example of adding a logo to a shop in the application")

_Note: Adding a logo to a shop is not mandatory._ 

# Edit a shop

In the shop list, 2 links are available to edit a shop:

- _edit_ : Use it to change the name and url of the shop. 
- _change picture_ : Use it to change or remove the shop's logo. In this form, you can select a local image file that 
will, be used as shop's logo, or use the _Remove logo_ button to delete the existing logo.

# Delete a shop

In the shop list, a action _delete_ allows you to ask for the deletion of the shop.

The link for this action may be grayed it the deletion of the shop in not possible. Deleting a shop is not possible if 
at least one filament uses it. You will first have to edit filaments using the shop to free it, and then the shop's deletion 
will be allowed.

Clicking on the _delete_ link display a confirmation poping:

![Shop's deletion confirmation](doc/en/shops/delete_shop_confirmation.png "Confirmation popin when deleting a shop")

