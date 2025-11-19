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

export function createInitialState() : GameState {
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