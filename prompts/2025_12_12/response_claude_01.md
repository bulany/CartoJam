Great questions! Let me explain and then make those improvements.

## 1. How the styling works

The styling uses **Tailwind CSS**, which is built into Claude's React artifacts! That's why you see class names like:
- `bg-white` (white background)
- `text-2xl` (large text)
- `text-blue-600` (blue color)
- `shadow-lg` (box shadow)
- `p-6` (padding)

**To run this on your own machine**, you'd need:

### Option A: Quick HTML file (easiest)
Save as `index.html` and open in browser:
```html
<!DOCTYPE html>
<html>
<head>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    // Paste the component code here
  </script>
</body>
</html>
```

### Option B: React + Vite project (better)
```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Now let me update the code with your changes!Perfect! I've made both changes:

## What changed:

### 1. **Added Corsica departments** (2A & 2B)
- They now appear between 19 (Corrèze) and 21 (Côte-d'Or)
- Custom sorting ensures they stay in the right order when using arrow keys

### 2. **Improved hover/selection behavior**
Now it works like this:
- **Initially**: Hover works normally, no selection
- **After clicking**: Department is "locked" as selected
- **While hovering**: You can still hover over other departments to see their info temporarily
- **Snap back**: When you move the mouse outside the map OR press an arrow key, it returns to the last clicked department
- **Arrow keys**: Navigate numerically and clear any temporary hover

Try it out:
1. Click on department 01
2. Hover around to see other departments
3. Move your mouse outside the map → snaps back to 01
4. Press arrow keys → navigates through departments

## About the styling

The colors and fonts you see are from **Tailwind CSS**, which provides:
- **Font**: Default is a nice sans-serif stack (system fonts)
- **Colors**: `blue-600` (#3b82f6), `gray-800`, etc.
- **Spacing**: `p-6` (padding), `mb-4` (margin-bottom)

This styling is **built-in to Claude's artifacts**, but to use it on your own machine, you'd need to set up Tailwind CSS in your project!
