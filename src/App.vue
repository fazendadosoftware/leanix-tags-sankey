<template>
  <div class="h-screen p-4">
    <sankey-chart
      v-if="chartData !== null"
      :advanced="true"
      :data="chartData"
      @click="clickHandler"/>
  </div>
</template>

<script setup lang="ts">
import useReport from './composables/useReport'
import SankeyChart from './components/SankeyChart.vue'

// https://github.com/d2bjs/d2b/blob/master/src/scripts/chart/sunburst.js#L89
// check events here...
const { initializeReport, chartData, clickHandler } = useReport()
initializeReport()
</script>
