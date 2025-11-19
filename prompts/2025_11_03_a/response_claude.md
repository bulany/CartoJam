# Tutorial 2: Building the Department Guessing Game
## From Static Map to Interactive Quiz

**What you'll build**: A timed game where you race to find departments by their numbers!

**Time**: 1-2 hours of focused typing

---

### Step 1: Fix TypeScript Setup

First, let's add TypeScript support. In your terminal:

```bash
npm install -D typescript @tsconfig/svelte
```

Create `tsconfig.json` in your project root:

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"],
  "exclude": ["node_modules"]
}
```

Now rename your files:
- `src/App.svelte` stays as is (Svelte handles the script lang)
- `src/lib/FranceMap.svelte` stays as is

Update `src/lib/FranceMap.svelte` to use TypeScript:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import * as d3 from 'd3'
  
  let width = 800
  let height = 800
  let departments: any = null
  let loading = true
  
  type PathDatum = {
    d: string
    code: string
    nom: string
  }
  
  let pathData: Array<PathDatum> = []
  
  onMount(async () => {
    const response = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson')
    departments = await response.json()
    
    const projection = d3.geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(2800)
      .translate([width / 2, height / 2])
    
    const path = d3.geoPath().projection(projection)
    
    pathData = departments.features.map((feature: any) => ({
      d: path(feature) as string,
      code: feature.properties.code,
      nom: feature.properties.nom
    }))
    
    loading = false
  })
</script>

<div class="map-container">
  <svg viewBox="0 0 {width} {height}" class="france-map">
    <rect {width} {height} fill="#e8f4f8" />
    {#if loading}
      <text x={width / 2} y={height / 2} text-anchor="middle" font-size="24">
        Chargement...
      </text>
    {:else}
      {#each pathData as dept}
        <path 
          d={dept.d}
          class="department"
        />
      {/each}
    {/if}
  </svg>
</div>

<style>
  .map-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .france-map {
    border: 2px solid #0055a4;
    display: block;
    width: 100%;
    height: auto;
  }
  
  .department {
    fill: white;
    stroke: #0055a4;
    stroke-width: 1;
    transition: fill 0.2s ease;
  }
  
  .department:hover {
    fill: #ffd700;
    cursor: pointer;
  }
</style>
```

**What changed?**
- Added `lang="ts"` to the script tag
- Created a `PathDatum` type for better type safety
- Added type annotations where TypeScript needs help
- Fixed CSS with semicolons (sorry about that!)

---

### Step 2: Create Game State

Create a new file: `src/lib/gameState.ts`

```typescript
export type GameStatus = 'ready' | 'playing' | 'finished'

export type Department = {
  code: string
  nom: string
}

export type Guess = {
  department: Department
  correct: boolean
  timestamp: number
}

export type GameState = {
  status: GameStatus
  targetDepartment: Department | null
  guesses: Array<Guess>
  timeRemaining: number
  score: number
}

export function createInitialState(): GameState {
  return {
    status: 'ready',
    targetDepartment: null,
    guesses: [],
    timeRemaining: 120,
    score: 0
  }
}
```

**Why a separate file?**
Separating types and utilities makes your code easier to test and reuse. This is a common pattern in TypeScript projects. Notice how we're being explicit about what each piece of data looks like - this prevents bugs!

---

### Step 3: Add Game State to App

Update `src/App.svelte`:

```svelte
<script lang="ts">
  import FranceMap from './lib/FranceMap.svelte'
  import { createInitialState } from './lib/gameState'
  import type { GameState } from './lib/gameState'
  
  let gameState: GameState = createInitialState()
  let message = "Trouvez les Départements!"
</script>

<main>
  <h1>{message}</h1>
  
  <div class="game-status">
    <p>Status: {gameState.status}</p>
    <p>Score: {gameState.score}</p>
    <p>Time: {gameState.timeRemaining}s</p>
  </div>
  
  <FranceMap />
</main>

<style>
  main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #0055a4;
    font-family: system-ui, sans-serif;
    text-align: center;
  }
  
  .game-status {
    text-align: center;
    font-family: system-ui, sans-serif;
    margin-bottom: 1rem;
  }
  
  .game-status p {
    margin: 0.25rem 0;
  }
</style>
```

**Svelte reactivity!**
When `gameState` changes, Svelte automatically updates the DOM. You don't need to call `setState` or any special functions - just assign values and Svelte does the rest!

---

### Step 4: Add a Start Button

Update `src/App.svelte`:

```svelte
<script lang="ts">
  import FranceMap from './lib/FranceMap.svelte'
  import { createInitialState } from './lib/gameState'
  import type { GameState } from './lib/gameState'
  
  let gameState: GameState = createInitialState()
  let message = "Trouvez les Départements!"
  
  function startGame() {
    gameState = createInitialState()
    gameState.status = 'playing'
    console.log('Game started!')
  }
</script>

<main>
  <h1>{message}</h1>
  
  {#if gameState.status === 'ready'}
    <div class="start-screen">
      <p>Cliquez sur le bon département avant la fin du temps!</p>
      <button on:click={startGame} class="start-button">
        Commencer
      </button>
    </div>
  {:else if gameState.status === 'playing'}
    <div class="game-status">
      <p>Score: {gameState.score}</p>
      <p>Temps: {gameState.timeRemaining}s</p>
    </div>
  {:else}
    <div class="game-status">
      <p>Fini! Score: {gameState.score}</p>
    </div>
  {/if}
  
  <FranceMap />
</main>

<style>
  main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #0055a4;
    font-family: system-ui, sans-serif;
    text-align: center;
  }
  
  .start-screen {
    text-align: center;
    padding: 2rem;
  }
  
  .start-screen p {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }
  
  .start-button {
    background: #0055a4;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .start-button:hover {
    background: #003d7a;
  }
  
  .game-status {
    text-align: center;
    font-family: system-ui, sans-serif;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  
  .game-status p {
    margin: 0.25rem 0;
  }
</style>
```

**Event handling in Svelte!**
`on:click={startGame}` is how you handle events. Notice the syntax is different from React - no need for quotes around the function name. Also, `{#if}...{:else if}...{/if}` lets you conditionally show different screens!

---

### Step 5: Pick a Random Target Department

Update `src/lib/gameState.ts`:

```typescript
export type GameStatus = 'ready' | 'playing' | 'finished'

export type Department = {
  code: string
  nom: string
}

export type Guess = {
  department: Department
  correct: boolean
  timestamp: number
}

export type GameState = {
  status: GameStatus
  targetDepartment: Department | null
  guesses: Array<Guess>
  timeRemaining: number
  score: number
}

export function createInitialState(): GameState {
  return {
    status: 'ready',
    targetDepartment: null,
    guesses: [],
    timeRemaining: 120,
    score: 0
  }
}

export function pickRandomDepartment(departments: Array<Department>): Department {
  const randomIndex = Math.floor(Math.random() * departments.length)
  return departments[randomIndex]
}
```

**Pure functions!**
`pickRandomDepartment` is a pure function - given the same input, it returns predictable output (well, random, but you get the idea). Pure functions are easier to test and reason about.

---

### Step 6: Pass Departments to App

Update `src/lib/FranceMap.svelte` to expose departments:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import * as d3 from 'd3'
  import type { Department } from './gameState'
  
  export let onDepartmentsLoaded: (depts: Array<Department>) => void = () => {}
  
  let width = 800
  let height = 800
  let departments: any = null
  let loading = true
  
  type PathDatum = {
    d: string
    code: string
    nom: string
  }
  
  let pathData: Array<PathDatum> = []
  
  onMount(async () => {
    const response = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson')
    departments = await response.json()
    
    const projection = d3.geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(2800)
      .translate([width / 2, height / 2])
    
    const path = d3.geoPath().projection(projection)
    
    pathData = departments.features.map((feature: any) => ({
      d: path(feature) as string,
      code: feature.properties.code,
      nom: feature.properties.nom
    }))
    
    const departmentList: Array<Department> = departments.features.map((feature: any) => ({
      code: feature.properties.code,
      nom: feature.properties.nom
    }))
    
    onDepartmentsLoaded(departmentList)
    loading = false
  })
</script>

<div class="map-container">
  <svg viewBox="0 0 {width} {height}" class="france-map">
    <rect {width} {height} fill="#e8f4f8" />
    {#if loading}
      <text x={width / 2} y={height / 2} text-anchor="middle" font-size="24">
        Chargement...
      </text>
    {:else}
      {#each pathData as dept}
        <path 
          d={dept.d}
          class="department"
        />
      {/each}
    {/if}
  </svg>
</div>

<style>
  .map-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .france-map {
    border: 2px solid #0055a4;
    display: block;
    width: 100%;
    height: auto;
  }
  
  .department {
    fill: white;
    stroke: #0055a4;
    stroke-width: 1;
    transition: fill 0.2s ease;
  }
  
  .department:hover {
    fill: #ffd700;
    cursor: pointer;
  }
</style>
```

**Component props!**
`export let onDepartmentsLoaded` creates a prop - a way for parent components to pass data or callbacks to children. The `export` keyword in Svelte means "this is a prop" (different from regular JavaScript exports!).

---

### Step 7: Store Departments and Pick Target

Update `src/App.svelte`:

```svelte
<script lang="ts">
  import FranceMap from './lib/FranceMap.svelte'
  import { createInitialState, pickRandomDepartment } from './lib/gameState'
  import type { GameState, Department } from './lib/gameState'
  
  let gameState: GameState = createInitialState()
  let message = "Trouvez les Départements!"
  let allDepartments: Array<Department> = []
  
  function handleDepartmentsLoaded(depts: Array<Department>) {
    allDepartments = depts
    console.log(`Loaded ${allDepartments.length} departments`)
  }
  
  function startGame() {
    gameState = createInitialState()
    gameState.status = 'playing'
    gameState.targetDepartment = pickRandomDepartment(allDepartments)
    console.log('Game started! Target:', gameState.targetDepartment)
  }
</script>

<main>
  <h1>{message}</h1>
  
  {#if gameState.status === 'ready'}
    <div class="start-screen">
      <p>Cliquez sur le bon département avant la fin du temps!</p>
      <button 
        on:click={startGame} 
        class="start-button"
        disabled={allDepartments.length === 0}
      >
        {allDepartments.length === 0 ? 'Chargement...' : 'Commencer'}
      </button>
    </div>
  {:else if gameState.status === 'playing'}
    <div class="game-status">
      <p>Score: {gameState.score}</p>
      <p>Temps: {gameState.timeRemaining}s</p>
    </div>
  {:else}
    <div class="game-status">
      <p>Fini! Score: {gameState.score}</p>
    </div>
  {/if}
  
  <FranceMap onDepartmentsLoaded={handleDepartmentsLoaded} />
</main>

<style>
  main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #0055a4;
    font-family: system-ui, sans-serif;
    text-align: center;
  }
  
  .start-screen {
    text-align: center;
    padding: 2rem;
  }
  
  .start-screen p {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }
  
  .start-button {
    background: #0055a4;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .start-button:hover:not(:disabled) {
    background: #003d7a;
  }
  
  .start-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .game-status {
    text-align: center;
    font-family: system-ui, sans-serif;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  
  .game-status p {
    margin: 0.25rem 0;
  }
</style>
```

**Disabled state!**
Notice how we disable the button until departments load. This prevents starting a game with no data. The button text also changes reactively - no manual DOM manipulation needed!

---

### Step 8: Display the Target Department

Update `src/App.svelte`:

```svelte
<script lang="ts">
  import FranceMap from './lib/FranceMap.svelte'
  import { createInitialState, pickRandomDepartment } from './lib/gameState'
  import type { GameState, Department } from './lib/gameState'
  
  let gameState: GameState = createInitialState()
  let message = "Trouvez les Départements!"
  let allDepartments: Array<Department> = []
  
  function handleDepartmentsLoaded(depts: Array<Department>) {
    allDepartments = depts
  }
  
  function startGame() {
    gameState = createInitialState()
    gameState.status = 'playing'
    gameState.targetDepartment = pickRandomDepartment(allDepartments)
  }
</script>

<main>
  <h1>{message}</h1>
  
  {#if gameState.status === 'ready'}
    <div class="start-screen">
      <p>Cliquez sur le bon département avant la fin du temps!</p>
      <button 
        on:click={startGame} 
        class="start-button"
        disabled={allDepartments.length === 0}
      >
        {allDepartments.length === 0 ? 'Chargement...' : 'Commencer'}
      </button>
    </div>
  {:else if gameState.status === 'playing'}
    <div class="game-container">
      <div class="game-info">
        <div class="target-display">
          <div class="target-number">{gameState.targetDepartment?.code}</div>
          <div class="target-name">{gameState.targetDepartment?.nom}</div>
        </div>
        <div class="game-stats">
          <div>Score: {gameState.score}</div>
          <div>Temps: {gameState.timeRemaining}s</div>
        </div>
      </div>
      <FranceMap onDepartmentsLoaded={handleDepartmentsLoaded} />
    </div>
  {:else}
    <div class="game-status">
      <p>Fini! Score: {gameState.score}</p>
    </div>
    <FranceMap onDepartmentsLoaded={handleDepartmentsLoaded} />
  {/if}
  
  {#if gameState.status === 'ready'}
    <div style="height: 20px;"></div>
    <FranceMap onDepartmentsLoaded={handleDepartmentsLoaded} />
  {/if}
</main>

<style>
  main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #0055a4;
    font-family: system-ui, sans-serif;
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .start-screen {
    text-align: center;
    padding: 2rem;
  }
  
  .start-screen p {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }
  
  .start-button {
    background: #0055a4;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .start-button:hover:not(:disabled) {
    background: #003d7a;
  }
  
  .start-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .game-container {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
  }
  
  .game-info {
    flex-shrink: 0;
    width: 200px;
  }
  
  .target-display {
    background: white;
    border: 3px solid #0055a4;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .target-number {
    font-size: 4rem;
    font-weight: bold;
    color: #0055a4;
    line-height: 1;
  }
  
  .target-name {
    font-size: 1rem;
    color: #666;
    margin-top: 0.5rem;
  }
  
  .game-stats {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 1rem;
    font-size: 1.1rem;
  }
  
  .game-stats div {
    margin: 0.5rem 0;
  }
  
  .game-status {
    text-align: center;
    font-family: system-ui, sans-serif;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    padding: 2rem;
  }
</style>
```

**Layout with flexbox!**
We're using CSS flexbox to put the target display beside the map. The `?.` is TypeScript's optional chaining - it safely accesses properties that might be null.

---

### Step 9: Handle Department Clicks

Update `src/lib/FranceMap.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import * as d3 from 'd3'
  import type { Department } from './gameState'
  
  export let onDepartmentsLoaded: (depts: Array<Department>) => void = () => {}
  export let onDepartmentClick: (dept: Department) => void = () => {}
  
  let width = 800
  let height = 800
  let departments: any = null
  let loading = true
  
  type PathDatum = {
    d: string
    code: string
    nom: string
  }
  
  let pathData: Array<PathDatum> = []
  
  onMount(async () => {
    const response = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson')
    departments = await response.json()
    
    const projection = d3.geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(2800)
      .translate([width / 2, height / 2])
    
    const path = d3.geoPath().projection(projection)
    
    pathData = departments.features.map((feature: any) => ({
      d: path(feature) as string,
      code: feature.properties.code,
      nom: feature.properties.nom
    }))
    
    const departmentList: Array<Department> = departments.features.map((feature: any) => ({
      code: feature.properties.code,
      nom: feature.properties.nom
    }))
    
    onDepartmentsLoaded(departmentList)
    loading = false
  })
  
  function handleClick(dept: PathDatum) {
    onDepartmentClick({ code: dept.code, nom: dept.nom })
  }
</script>

<div class="map-container">
  <svg viewBox="0 0 {width} {height}" class="france-map">
    <rect {width} {height} fill="#e8f4f8" />
    {#if loading}
      <text x={width / 2} y={height / 2} text-anchor="middle" font-size="24">
        Chargement...
      </text>
    {:else}
      {#each pathData as dept}
        <path 
          d={dept.d}
          class="department"
          on:click={() => handleClick(dept)}
        />
      {/each}
    {/if}
  </svg>
</div>

<style>
  .map-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .france-map {
    border: 2px solid #0055a4;
    display: block;
    width: 100%;
    height: auto;
  }
  
  .department {
    fill: white;
    stroke: #0055a4;
    stroke-width: 1;
    transition: fill 0.2s ease;
  }
  
  .department:hover {
    fill: #ffd700;
    cursor: pointer;
  }
</style>
```

**Callback props!**
We added `onDepartmentClick` - another prop. When a department is clicked, we call this function with the department info. The parent component decides what to do with it.

---

### Step 10: Process Guesses

Update `src/App.svelte`:

```svelte
<script lang="ts">
  import FranceMap from './lib/FranceMap.svelte'
  import { createInitialState, pickRandomDepartment } from './lib/gameState'
  import type { GameState, Department } from './lib/gameState'
  
  let gameState: GameState = createInitialState()
  let message = "Trouvez les Départements!"
  let allDepartments: Array<Department> = []
  
  function handleDepartmentsLoaded(depts: Array<Department>) {
    allDepartments = depts
  }
  
  function startGame() {
    gameState = createInitialState()
    gameState.status = 'playing'
    gameState.targetDepartment = pickRandomDepartment(allDepartments)
  }
  
  function handleDepartmentClick(dept: Department) {
    if (gameState.status !== 'playing' || !gameState.targetDepartment) return
    
    const correct = dept.code === gameState.targetDepartment.code
    
    gameState.guesses = [...gameState.guesses, {
      department: dept,
      correct,
      timestamp: Date.now()
    }]
    
    if (correct) {
      gameState.score += 1
      gameState.targetDepartment = pickRandomDepartment(allDepartments)
      console.log('Correct! New target:', gameState.targetDepartment)
    } else {
      console.log(`Wrong! Clicked ${dept.code} ${dept.nom}`)
    }
  }
</script>

<main>
  <h1>{message}</h1>
  
  {#if gameState.status === 'ready'}
    <div class="start-screen">
      <p>Cliquez sur le bon département avant la fin du temps!</p>
      <button 
        on:click={startGame} 
        class="start-button"
        disabled={allDepartments.length === 0}
      >
        {allDepartments.length === 0 ? 'Chargement...' : 'Commencer'}
      </button>
    </div>
  {:else if gameState.status === 'playing'}
    <div class="game-container">
      <div class="game-info">
        <div class="target-display">
          <div class="target-number">{gameState.targetDepartment?.code}</div>
          <div class="target-name">{gameState.targetDepartment?.nom}</div>
        </div>
        <div class="game-stats">
          <div>Score: {gameState.score}</div>
          <div>Temps: {gameState.timeRemaining}s</div>
          <div>Essais: {gameState.guesses.length}</div>
        </div>
      </div>
      <FranceMap 
        onDepartmentsLoaded={handleDepartmentsLoaded}
        onDepartmentClick={handleDepartmentClick}
      />
    </div>
  {:else}
    <div class="game-status">
      <p>Fini! Score: {gameState.score}</p>
    </div>
    <FranceMap onDepartmentsLoaded={handleDepartmentsLoaded} />
  {/if}
  
  {#if gameState.status === 'ready'}
    <div style="height: 20px;"></div>
    <FranceMap onDepartmentsLoaded={handleDepartmentsLoaded} />
  {/if}
</main>

<style>
  main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #0055a4;
    font-family: system-ui, sans-serif;
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .start-screen {
    text-align: center;
    padding: 2rem;
  }
  
  .start-screen p {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }
  
  .start-button {
    background: #0055a4;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .start-button:hover:not(:disabled) {
    background: #003d7a;
  }
  
  .start-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .game-container {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
  }
  
  .game-info {
    flex-shrink: 0;
    width: 200px;
  }
  
  .target-display {
    background: white;
    border: 3px solid #0055a4;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .target-number {
```svelte
    font-size: 4rem;
    font-weight: bold;
    color: #0055a4;
    line-height: 1;
  }
  
  .target-name {
    font-size: 1rem;
    color: #666;
    margin-top: 0.5rem;
  }
  
  .game-stats {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 1rem;
    font-size: 1.1rem;
  }
  
  .game-stats div {
    margin: 0.5rem 0;
  }
  
  .game-status {
    text-align: center;
    font-family: system-ui, sans-serif;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    padding: 2rem;
  }
</style>
```

**Immutable updates!**
Notice `gameState.guesses = [...gameState.guesses, newGuess]` - we create a new array rather than pushing to the old one. This is a Svelte best practice that ensures reactivity works properly. The spread operator `...` copies the old array, then we add the new item.

Check your console - you should see "Correct!" or "Wrong!" messages when clicking departments!

---

## 🎉 Congratulations on Tutorial 2!

You've built the core game mechanics! You now have:
- ✅ TypeScript with proper types
- ✅ Game state management
- ✅ Random target department selection
- ✅ Click handling and guess tracking
- ✅ Score tracking
- ✅ A clean side-by-side layout

**Test it**: Start a game and try clicking departments. Your score should increase when you find the right one!

---

## 🎮 What We've Learned

**Svelte Concepts:**
- Component props with `export let`
- Callback props for parent-child communication
- Reactivity through simple assignment
- Conditional rendering with `{#if}`
- Event handling with `on:click`

**TypeScript Concepts:**
- Type definitions with `type`
- Type annotations where needed
- Optional chaining with `?.`

**Patterns:**
- Separating state logic from components
- Pure functions for predictable behavior
- Immutable updates for reactivity

---

## 🚀 Coming in Tutorial 3

We'll add:
- ⏱️ The countdown timer (using `setInterval`)
- ✨ Visual feedback (flash correct/wrong on the map)
- 🎨 Brief label display for wrong guesses
- 🏁 Automatic game ending when time runs out
- 📊 Basic results screen

**Quick Challenge**: Before Tutorial 3, try adding a "wrong guess" counter to the stats panel. You already track all guesses - can you filter for just the wrong ones and display the count?

**Hint**: 
```typescript
const wrongGuesses = gameState.guesses.filter(g => !g.correct).length
```

Ready for Tutorial 3? Let me know and we'll add the timer and visual feedback! 🎯