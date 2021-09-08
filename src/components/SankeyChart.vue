<template>
  <canvas ref="chart" />
</template>

<script lang="ts" setup>
import { ref, unref, onMounted } from 'vue'
import { Chart, LinearScale } from 'chart.js'
import { SankeyController, Flow } from 'chartjs-chart-sankey'

const chart = ref(null)
Chart.register(LinearScale, SankeyController, Flow)

onMounted(() => {
  // @ts-ignore
  const ctx = unref(chart)?.getContext('2d')

  const colors: Record<string, string> = {
    Oil: 'black',
    Coal: 'gray',
    'Fossil Fuels': 'slategray',
    Electricity: 'blue',
    Energy: 'orange'
  }
  const getColor = (name: string) => colors[name] || 'green'

  // eslint-disable-next-line no-new
  new Chart(ctx, {
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
          colorFrom: c => getColor(c.dataset.data[c.dataIndex].from),
          colorTo: c => getColor(c.dataset.data[c.dataIndex].to)
        }
      ]
    }
  })
})

</script>
