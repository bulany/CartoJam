<script lang="ts">
  import FranceMap from './lib/FranceMap.svelte'
  import { createInitialState, pickRandomDepartment, type Department, type GameState } from './lib/gameState'

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
    if (gameState.status !== 'playing') return
    if (!gameState.targetDepartment) return

    const correct = dept.code === gameState.targetDepartment.code

    gameState.guesses = [...gameState.guesses, {
      department: dept,
      correct,
      timestamp: Date.now()
    }]

    if (correct) {
      gameState.score += 1
      gameState.targetDepartment = pickRandomDepartment(allDepartments)
      console.log(`Correct!`)
      
    } else {
      
    }
  }
</script>


<main>
  <h1>{message}</h1>
  {#if gameState.status === 'ready'}
  <div class="start-screen">
    <p>Cliquez sur le bon départemenbt avant la fin du temps!</p>
    <button 
      on:click={startGame}
      disabled={allDepartments.length === 0}
    >
      {allDepartments.length === 0 ? 'Chargement...': 'Commencer'}
  </button>
  </div>
  {:else if gameState.status === 'playing'}

    <div class="target-display">
      <div>{gameState.targetDepartment?.code}</div>
      <div>{gameState.targetDepartment?.nom}</div>
    </div>
    <div class="game-stats">
      <p>Score: {gameState.score}</p>
      <p>Time: {gameState.timeRemaining}</p>
    </div>
  {:else}
    <div class="game-status">
      <p>Fini! Score: {gameState.score}</p>
    </div>
  {/if}

  <FranceMap 
    onDepartmentsLoaded={handleDepartmentsLoaded}
    onDepartmentClick={handleDepartmentClick}
  />
</main>

<style>
  .game-status {
    margin-bottom: 1rem;
  }

  .game-status p {
    margin: 0.25rem 0;
  }
</style>
