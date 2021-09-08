<template>
  <div class="relative h-full">
    <canvas ref="canvas" />
  </div>
</template>

<script lang="ts" setup>
import { ref, unref, onMounted } from 'vue'
import { Chart, ChartEvent, ActiveElement, LinearScale } from 'chart.js'
import { SankeyController, Flow } from 'chartjs-chart-sankey'

const canvas = ref(null)
Chart.register(LinearScale, SankeyController, Flow)

onMounted(() => {
  // @ts-ignore
  const ctx = unref(canvas.value)?.getContext('2d')

  const colors: Record<string, string> = {
    Oil: 'black',
    Coal: 'gray',
    'Fossil Fuels': 'slategray',
    Electricity: 'blue',
    Energy: 'orange'
  }

  const priority: Record<string, number> = {
    Oil: 1,
    'Narural Gas': 2,
    Coal: 3,
    'Fossil Fuels': 1,
    Electricity: 2,
    Energy: 1
  }

  const labels: Record<string, string> = {
    Oil: 'black gold (label changed) oil'
  }

  const getColor = (name: string) => colors[name] || 'green'

  const chart = new Chart(ctx, {
    type: 'sankey',
    data: {
      datasets: [
        {
          data: [
            { from: 'Oil', to: 'Fossil Fuels', flow: 15 },
            { from: 'Natural Gas', to: 'Fossil Fuels', flow: 20 },
            { from: 'Coal', to: 'Fossil Fuels', flow: 25 },
            { from: 'Coal', to: 'Electricity', flow: 25 },
            { from: 'Fossil Fuels', to: 'Energy', flow: 60 },
            { from: 'Electricity', to: 'Energy', flow: 25 }
          ],
          priority,
          labels,
          colorFrom: (c) => getColor(c.dataset.data[c.dataIndex].from),
          colorTo: (c) => getColor(c.dataset.data[c.dataIndex].to),
          colorMode: 'gradient',
          borderWidth: 2,
          borderColor: 'black'
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event: ChartEvent, elements: ActiveElement[]) => {
        const { element: { from = null, to = null, flow = null } = {} } = elements[0] ?? {}
        // console.log('HOVER', event)
        console.log('ELEMENTS', from, to, flow)
      }
    }
  })
})

</script>
