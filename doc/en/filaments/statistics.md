# 📊 Filaments statistics

The filament management in *3DPTools* include a [statistics](/filament/stats) section, that show several charts useful
to analyse filament collection.

Statistics charts are grouped by categories, explained below. A navigation menu on the right of the page allow to 
quickly jump to a category.

Most of the charts are a bit interactives: hovering an element with the mouse cursor will display détails about the 
element, and some charts have line ça can be displayed or not by clicking on their legend.

# Totals

Shows somme totals :
- Filaments count
- Total cost (base on the price of each filament)
- Total weight (net initial weigth of each filament, excluding spool and packaging)
- Total length of filaments

![Totals](doc/en/filaments/stats_totals.png "Example of totals statistics")


# Usage

Usage of filaments with 3 representations: 
- By weight (net weight of filaments)
- By length
- By cost (base on the price of each filament)

Each representation is a gauge of the total split in 2 parts: the dark part is the left quantity, and the light part 
the used quantity.

These charts are computed based on the material left of each filament.

![Filaments usage](doc/en/filaments/stats_usage.png "Example of filaments usage")


# Cost per kg

Historgram representing the average cost per kilogram and the number of kg, per main material.

For each material, dark bar is the average cost per kg, and light bar is the quantity in kg

![Cost per kg](doc/en/filaments/stats_cost_per_kg.png "Example of cost per kg")


# Purchase history

Time chart representing each purchase date. There is 4 splines, representing for each date:
- The number of filaments bought
- The cumulated price of filaments
- The average price per filament
- The average price per kg

Hovering a point with the mouse cursor display details, like filament list, brands and shops.

Below the chart, 2 statistics: 
- Average time between each purchase date
- Time elapsed since the last purchase

![Purchase history](doc/en/filaments/stats_purchase_history.png "Example of purchase history")


# Most used

Histogram representing the filament usage (with total, used and left amount) by categories, and sorted from the most used 
to the less one.

A chart of each of these repartition categories:
- By colour
- By main material
- By brand

Each bar represent the cumulated net initial weight for a category. The upper transparent part of the bar is the weight 
of material used, and the lower plain part is the weight of material left. 

![Repartition by usage](doc/en/filaments/stats_most_used.png "Example of repartition by usage")


# Repartition by counts

Pie charts representing the repartition of the count of filaments per categories:
- Per brands
- Per shops
- Per main materials
- Per colors

![Number of filaments](doc/en/filaments/stats_counts.png "Example of repartition of filaments count")


# Repartition by costs

Pie charts representing the repartition of the cost of filaments per categories:
- Per brands
- Per shops
- Per main materials
- Per colors

![Cost of filaments](doc/en/filaments/stats_counts.png "Example of repartition of filaments cost")