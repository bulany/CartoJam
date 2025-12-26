# Prompt

Can you make me a one page html app using html and some nice publicly available data sets that does the following:
Draws a nice simple globe of the world that is kind of rotating... this can be just a really basic, nice and simple line drawing.
Zooms in so that France fills the whole area.
Then it draws the major rivers of france, again really nice and simple lines. Each river is drawn in order from 'biggest' to 'smallest' (just the major rivers, hopefully there is only about 10 or less of them).
As each river is drawn, its name is displayed somewhere while it is being drawn. It would be great to draw the rivers in the direction from source to where they end.
Then it draws the outlines of the french administrative regions, maybe in alphabetical order each one is outlined with the name displayed somewhere as its being drawn.
Then in each, region in alphabetical order is filled in with the outlines of the departments in that region... as each department is drawn its number and name is displayed somewhere... oh and after a region is outlined, a dot is plotted at the point of the prefecture (and this prefecture name is displayed also).
This continues until all the map of france is complete the the rivers, regions, departments and prefectures all displayed at which point the user is free to kind of zoom in or out on the globe as they want. And maybe there is a button to restart the animation.
It would be great if there was another couple of buttons to adjust the speed of the sequential drawing part... like you could go 'a few times faster' and 'a few times slower'. The default speed should be that everything is drawn in about 60 seconds.
If you could have it so that I can just copy and paste all the code of this single html file and have it so it will work on a page hosted on my github repo github pages thing that would be great!
Thank you!

# Response

I'll create an interactive globe-to-France visualization for you! This will use D3.js for the globe and map projections, and I'll fetch GeoJSON data for France's geography.I've created an interactive globe-to-France visualization! Here's what it does:

**Features:**
1. **Rotating Globe** - Starts with a simple line-drawn globe rotating for 5 seconds
2. **Zoom to France** - Smoothly zooms in until France fills the screen
3. **Rivers** - Draws 9 major French rivers in order of importance (Loire, Rhône, Seine, Garonne, etc.), each animated from source to end with the name displayed
4. **Regions** - Draws all 13 French regions alphabetically with their names
5. **Prefectures** - Plots a red dot for each regional prefecture with its name
6. **Departments** - Shows all departments within each region with their numbers and names
7. **Interactive Controls**:
   - **Restart** button to replay the animation
   - **Speed controls** (0.25x to 8x speed)
   - **Mouse controls** after animation completes - drag to pan, scroll to zoom

**Default timing:** The full animation takes about 60 seconds at 1x speed.

**GitHub Pages Ready:** This is a single HTML file that works standalone! It loads data from public CDNs (D3.js, TopoJSON, and GeoJSON data for France), so you can just copy and paste this code into an HTML file and host it on GitHub Pages - no additional files needed.

The visualization uses a nice dark blue theme with smooth animations. After the animation completes, you have full control to explore the map by dragging and zooming!

