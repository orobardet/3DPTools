# Administration of the 3DPTools application

The administration section of the application is available to users with administrator privileges.

It is accessible in the main menu of the application, and consists of several sections.

# Users

View and manage users with access to the application.

By default, this section shows the list of users, with their information:
- E-mail address
- First name
- Last name
- Account creation date
- Is the accoutn an administrator?

A link allows to modify a user account. A click on this link brings up a popin allowing to modify the above information, 
as well as change the password of the user.

To add a user, a corresponding button is available on the right in the header of the user list.
It must appear a popin similar to that of the edition of a user, but this time to create a new one.

# System information

Displays all technical information about the application environment and the system:
- OS type and architecture
- Storage status
- State of memory
- Information on the application database
- Information about MongoDB
- Version of Node JS and its modules
- Environment variables
- ...

The data on the page are refreshed automatically. A button at the top right of the page allows you to control
the level of data update in the page.

A link in the header of the page will display the end-point Prometheus metric of the application, if enabled in the
configuration.

# Show the configuration

This section allows you to view the current configuration of the application (all sources of merged parameters),
YAML or JSON formats.

Passwords and secrets are hidden, replaced by stars (*).

At the top right of the page, a button is used to test the email configuration of the application (if it is activated,
otherwise the button does not appear). It sends a test email to the currently logged on user.