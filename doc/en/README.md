# 3DPTools Documentation

This is the *3DPTools* documentation index.

Select a topic:

1. [Materials](/doc/en/materials)
2. [Brands](/doc/en/brands)
3. [Shops](/doc/en/shops)
4. [Filaments](/doc/en/filaments)
 
 
# Documentation writers and translators

Links in these documentation files have a special handling.
  
To add links to another pages of the documentation, **you must _not_ prefix their path with ``**. 
These link pathes must be absolute from the root documentation folder, and ignore locale sub-folder name.

e.g. to show a link to the materials documentation page:
```markdown
[Materials](materials)
```

Also, the path **must not be translated** and **must be the same as the original english reference links**.    

This is necessary for the application to handle internal documentation links, and automatically manage localized page display.

All other links (e.g. not with this prefix), will works as usual in Markdown. So, you can add a link to a page of the application. 

e.g. to show a link to the materials management section of the application:

```markdown
[Materials](/material)
```

The documentation browser may detect external links (starting with a URI scheme), internal documentation links 
(not starting with `/`), and internal application links (all others) and use a different rendering for each classes.