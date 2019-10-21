# Next

Starting with this version, 3DPTools **runs on NodeJS 12** and is compatible with MongoDB 4.0 (but not required). 

- [New] Secondary color for filaments (#119)
- [New] Filament features, starting with: glittery, phosphorescent, uv or temperature changing, conductive (#136)
- [New] Sort filaments by percentage *or* length of material left (previously per percentage only) (#143)
- [Doc] French translation for configuration documentation page (#139)
- [Imp] Log error message if connection to Redis is not possible or broken (#138)
- [Imp] Startup performance improvement and resilience
- [Tec] Docker image now wait for mongo and redis to be ready (#130)
- [Tec] Compatibility with MongoDB 4.0 (#135)
- [Tec] Upgrade to NodeJS 12 (#137)
- [Tec] Internal logger (#140)
- [Tec] Compression of http response (#141)

# v1.4.1

- [Fix] Fix docker image run (bash missing + windows EOL in docker_start.sh script)

# v1.4.0

This version introduce features requiring new application capability: sending emails. 
By default, **email sending and all dependent feature are disabled**.
Check README for documentation about email configuration.

This version bumps to MongoDB **3.6**

- [New] Embedded documentation (#79)
- [New] Configuration files are now in YAML (#99)
- [New] Forgotten password feature now available, if a mail send configuration is given (no one by default) (#89)
- [New] Password can be changed in the profile page (#97)
- [New] "Stay connected"/"Remember me" feature in user authentification (#102)
- [New] Language selector on non logged in pages (#111)
- [New] Filament's name is now optional (#110)
- [New] Changing password disconnect all other sessions and clean stay connected (need login on next visit) (#126)
- [Imp] Separate internal and overridable settings, and documents them (#98)
- [Imp] Configuration display in admin: better handling of secret value obfuscation (#93)
- [Imp] No "Add filament" buttons if there is no materials, brands and shops (#90)
- [Imp] Allow changelog page to be accessible for non-logged users (#94)
- [Imp] Homepage's count per material chart no use root material for grouping (#96)
- [Imp] Filament statistics now use master colors and parent materials for aggregation (#83)
- [Imp] Filament sorting by color (default) now sort first by master color code (#105)
- [Imp] Better default name extraction in the material file form (#108)
- [Imp] Add a icon to help identify sort combo box in filament list (#127)
- [Imp] In production environment, language files are not longer updated with missing strings (#117)
- [Imp] It is now allowed to set 0m length left in a filament (#115)
- [Imp] Setting a filament left material to 0 now automatically set the filament as finished (#116)  
- [Fix] Filament statistics page errors when no filaments (#91)
- [Fix] No link to filament statistics when no filaments (#95)
- [Fix] Material variants on homepage filtering (#100)
- [Fix] Master color on homepage filtering (#101)
- [Fix] Upgrade marked NPM library to fix a vulnerability (#109)
- [Fix] Fix dependency packages' vulnerabilities (#124)
- [Fix] Fix filament display when it has no brand (#125)
- [Fix] It was possible to delete a material used by filament. It's no more allowed. (#118)
- [Fix] It was possible to delete a brand used by filament. It's no more allowed. (#120)
- [Fix] It was possible to delete a shop used by filament. It's no more allowed. (#121)
- [Fix] Filament stats chart for cost per shop was displaying invalid data (#128)
- [Fix] Filament stats chart for count per color was not showing pies' percentage (#129)
- [Tec] Upgrade to NodeJS 10 (#107, #122)
- [Tec] Upgrade to MongoDB 3.6 (#123)
- [Tec] Add `versionSuffix` config setting (#92)
- [Tec] Improve Docker image and stack (#80 #81 #82 #85 #86 #88)
- [Tec] Use Yarn instead of NPM for node dependencies management (#112)
- [Tec] Upgrade to latest Sentry library (#132, #133)

## Upgrade notes :

- You need to upgrade your MongoDB version to 3.6. 3DPTools database is compatible without changes:
  - Backup you data (just in case)
  - Upgrade 3DPTools 
  - Stop 3DPTools
  - Upgrade MongoDB to 3.6
  - Restart 3DPTools
  - Although not needed by 3DPTool (for now), it is recommended to enable Mongo's [3.6 feature compatibility](https://docs.mongodb.com/manual/reference/command/setFeatureCompatibilityVersion/)**. 
```javascript
// In a MongoShell as admin:
db.adminCommand( { setFeatureCompatibilityVersion: "3.6" } )
```

- Filament name is now optional. You can clean name for all filament where it match the `material name + color name`
 (e.g. `PLA Black`) with:
```shell
bin/cli database patch 110-filament-names-clean
```
Can be run any time on a running instance, after version upgrade.


# v1.3.0

This version **REQUIRES** MongoDB **3.4**, with **[3.4 feature compatibility enabled](https://docs.mongodb.com/manual/reference/command/setFeatureCompatibilityVersion/)**!

- [New] Allow creation of material variants (#68)
- [New] Add master color for filament, to allow searching filament in all color nuances (#60)
- [New] Show changelog when clicking on version number (#54)
- [New] Add project source link (to Gitlab) on changelog page (#58)
- [New] Add a system information page in admin section (#70)
- [New] Add a show config page in admin section (#76)
- [New] Prometheus metrics endpoint (`/metrics`), enabled by default (#78)
- [New] Filament stats: menu with scrollspy for quick access to each graphs (#53)
- [New] Filament stats, buy history, 2 splines added : (#53)
  - Cost per filament count
  - Cost per Kg
- [New] Filament stats, buy history: add average buy interval and elapsed time from last purchase (#73)
- [New] Creating new filament by copy (#66)
- [New] Filament left: allow input of a length to substract or add (#63)
- [New] Filter filaments in cost calculator list (#61)
- [Imp] Don't show finished filaments in cost calculator list (#62)
- [Imp] Filament stats, buy history: add points on splines (#67)
- [Imp] Rename 'Settings' menu (brand, shop, material) to 'Data' (#77)
- [Fix] UI language selection (#75)
- [Tec] Upgrade to latest NPM & Bower dependencies versions (#64)
- [Tec] Upgrade to NodeJS 8.2 (#64)
- [Tec] Use `version` from package.json (#71)
- [Tec] Add -h|--help to `cli` script (#72)
- [Tec] Code refactoring to use ES6/7/8 enhancement (#65)

# v1.2.1

- [Fix] Filaments stats: were never displayed even if DB contains filaments (#52)

# v1.2

- [New] Attach file to material (#42)
- [New] Show spool price and price per Kg in filament list (#46)
- [New] Add sorting feature on filament list (#47)
- [New] Add speed printing range for material and filament (#45)
- [Imp] Add quick access on homepage to colors and materials filament filtering (#44)
- [Fix] Fix Node 7 deprecation/incompatibilities (#50)
- [Fix] Fix incomplete support of empty database, when starting the app for the first time (#49, #51)
- [Tec] Upgrade do NodeJS 7 (#43) 
- [Tec] Upgrade to latest NPM & Bower dependencies versions
- [Tec] Docker image base on Node Alpine + add Docker & docker-compose usage documentation (#48)

# v1.1

- [Fix] Index: Exclude finished filament from counts per materials (#40)
- [Fix] Index: filtering out 100% filament from unused list (#39)

# v1.0

- [New] Filament section in home page (#6)
- [New] Finished filament feature (#26)
- [New] Filtering (by color, material, brand and shop) in filament list (#4)
- [New] Stats: average price per Kg, for each material (#31)
- [Imp] Autofocus on main field in forms (#34)
- [Imp] Change icon for cost calculator (#35)
- [Fix] Stats: wrong weight computation for usage stats (#36)
- [Tec] Migrating to JQuery 3 + global dependencies upgrade (#24)
- [Tec] Production mode (#37)
- [Tec] Github mirroring and Docker Hub auto build (#38)

# v0.9.5

- [New] Cost calulator of filament usage (#5)

# v0.9.4

- [New] Material left form: live display of the left % (#32)
- [New] Schéma migration system (#30)
- [New] Filament: creation, modification and last usage dates (#27, #28, #29)
- [Fix] Deleting a filament was redirecting to the deleted filament page (#33)

# v0.9.3

- [New] Statistics for filaments (#15)
- [New] Return to trigger page once a form is validated (#7)
- [Imp] Material left form: show filament details (#23)
- [Imp] Material left form: option to input left weight in g or Kg (#17)
- [Imp] Material left form: live preview of the weigh/length remaining while typing (#22)
- [Imp] Use some Repetier Server web icon (#13)
- [Tec] Build: using new Gitlab-CI variables (#25)
- [Tec] Migrating Mongoose usage to mpromise (#20)

# v0.9.2

- [Imp] Material left form: it is now possible to define left material by length (#16)
- [Fix] All forms were not working anymore with the latest version of express-form (#19)

# v0.9.1

- [Imp] Left weight and length in filament list (#14)
- [Imp] colors' name in filaments list (#10)
- [Tec] Migrating to NodeJS v6 (#11)
- [Tec] SASS compilation in the Dockerfile (#18)

# v0.9

- First tracked release
