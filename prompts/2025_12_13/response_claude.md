Great questions! Let me explain the projection and then create a visualization.

## What's Happening Here?

**Yes, these are GPS coordinates!** Specifically:
- **Longitude** (East-West): -5.5° to 9.5°
- **Latitude** (North-South): 41.3° to 51.2°

**The "projection" is called an Equirectangular (Plate Carrée) projection** - the simplest possible mapping where:
```
x = longitude
y = latitude
```

It's like if you peeled the curved surface of Earth and flattened it without any math correction.

## The Distortion Problem

Because Earth is a sphere (well, oblate spheroid), **latitude lines get closer together as you move north**. At the equator, 1° of longitude = ~111km. At 45°N (middle of France), 1° of longitude = ~78km.

**So in our map:**
- East-West distances are **stretched** compared to North-South
- The further north you go, the worse it gets
- At France's latitude (~42-51°N), horizontal distances appear ~25-35% longer than they should!

Let me create a Three.js visualization that shows the Earth globe vs the flat projection:Perfect! Now you can see the distortion in action. Click between "Globe" and "Flat Projection" to watch the cities morph!

## What You're Seeing:

**🌍 Globe Mode (Reality):**
- Cities plotted on actual sphere at their GPS coordinates
- Notice: Longitude lines converge as you go north
- Distances are true to reality

**🗺️ Flat Projection Mode (Our Map):**
- Same coordinates stretched onto a flat rectangle
- East-West distances are exaggerated
- This is exactly what our department map does!

## The Math Behind It:

For France (roughly 42°N to 51°N latitude):
- At **42°N** (Corsica): 1° longitude ≈ 82 km
- At **51°N** (Lille): 1° longitude ≈ 70 km
- But in our flat map: 1° longitude = constant pixels!

So **horizontal distances appear ~25-35% too wide** compared to vertical distances.

## Why This Still Works:

1. **France is relatively small** - the distortion is consistent across the region
2. **We're just using it for reference** - not for navigation or measuring distances
3. **The prefecture coordinates naturally reveal France's shape** - which is actually pretty cool!

For a more accurate projection, you'd use **Lambert Conformal Conic** (which France officially uses) or **Mercator**, but for our simple reference map, the equirectangular projection is perfectly fine! 🗺️