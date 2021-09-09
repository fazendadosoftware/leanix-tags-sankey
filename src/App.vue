<template>
  <div class="h-screen">
    <sankey-chart
      v-if="chartData !== null"
      :advanced="true"
      :data="chartData"
      @click="clickHandler"/>
    <div v-else class="h-full flex items-center justify-center text-2xl font-bold text-gray-800">No tagged factsheets for this tag group...</div>
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
