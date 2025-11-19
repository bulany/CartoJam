<script lang=ts>
  import {onMount} from 'svelte'
  import * as d3 from 'd3'
  import type { Department } from './gameState'

  export let onDepartmentsLoaded: (depts: Array<Department>) => void = () => {}
  export let onDepartmentClick: (dept: Department) => void = () => {}

  let width = 800
  let height = 800
  let departments: any | null = null
  let loading = true

  type PathDatum = {
    d: string
    code: string
    nom: string
  }

  let pathData: Array<PathDatum> = []

  onMount(async() => {
    const response = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson')
    departments = await response.json()

  
    const projection = d3.geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(4000)
      .translate([width/2, height/2])
    const path = d3.geoPath().projection(projection)
    pathData = departments.features.map((feature: any) => ({
      d: path(feature),
      code: feature.properties.code,
      nom: feature.properties.mon
    }))
    const departmentList: Array<Department> = departments.features.map((feature:any) => ({
      code: feature.properties.code,
      nom: feature.properties.nom
    }))
    onDepartmentsLoaded(departmentList)
    loading = false
    console.log('Loaded', departments)

  })
</script>
<div class="map-container">
  <svg {width} {height} class="france-map">
    <rect {width} {height} fill="#f0f0f0"/>
    {#if loading}
      <text x={width/2} y={height/2} text-anchor="middle">Chargement...</text>
    {:else}
      {#each pathData as dept}
        <path 
          d={dept.d} 
          class="department"
          on:click={() => onDepartmentClick(dept)}
        />
      {/each}

    {/if}
  </svg>
</div>

<style>
  .map-container {
    width: 100%;
    max-width: 800px;
    margin: 0, auto;
  }
  .france-map {
    border: 2px solid #0055a4;
    display: block;
    margin: 0 auto;
  }
  .department {
    fill: white;
    stroke: #0055a4;
    stroke-width: 1;  
  }
  .department:hover {
    fill: #ffd700;
    cursor: pointer;
  }
</style>