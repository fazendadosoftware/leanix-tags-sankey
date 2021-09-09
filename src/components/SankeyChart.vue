<template>
  <div :class="['vue-d2b-container', `vue-d2b-${name}`]" ref="root"/>
</template>

<script lang="ts" setup>
import { ref, unref, Ref, toRefs, PropType, watch, onMounted, onUnmounted } from 'vue'
import { id as generateId, chartSankey } from 'd2b'
import { ChartSankeyData } from 'd2b/src/types'
import { select, selectAll } from 'd3-selection'
import 'd3-transition'

const props = defineProps({
  data: { type: Object as PropType<ChartSankeyData>, required: true },
  config: Function as PropType<(chart: any) => void>,
  duration: { type: Number, default: 250 },
  id: { type: String, default: generateId() },
  advanced: { type: Boolean }
})

const { data, config, duration, id, advanced } = toRefs(props)

const root: Ref<HTMLCanvasElement | null> = ref(null)
const emit = defineEmits(['beforeRender', 'rendered', 'mouseover', 'mouseleave', 'click'])

const name = 'chart-sunkey'
const generator = chartSankey()

let unwatch = () => {}

const unwatcher = () => { if (typeof unwatch === 'function') unwatch() }
const watcher = () => { unwatcher(); unwatch = watch([data, config], () => update(), { deep: true }) }

const update = (options?: { skipTransition: boolean }) => {
  const _root = select(unref(root))
  if (_root === null) return

  // add event retransmitters to links and nodes
  selectAll('.d2b-sankey-link')
    .on('mouseover', (event, link) => emit('mouseover', { event, link }))
    .on('mouseleave', (event, link) => emit('mouseleave', { event, link }))
    .on('click', (event, link) => emit('click', { event, link }))

  selectAll('.d2b-sankey-node')
    .on('mouseover', (event, node) => emit('mouseover', { event, node }))
    .on('mouseleave', (event, node) => emit('mouseleave', { event, node }))
    .on('click', (event, node) => emit('click', { event, node }))

  const _configCallback = unref(config)
  const _data = unref(data)
  const _duration = unref(duration)
  const _generator = unref(advanced) ? generator.advanced : generator

  unwatcher()
  emit('beforeRender', _root, generator)

  if (typeof _configCallback === 'function') _configCallback(_generator)
  _root.datum(_data)
  if (options?.skipTransition) _root.call(_generator)
  else _root.transition().duration(_duration).call(_generator)

  emit('rendered', _root, _generator)
  watcher()
}

const updateNow = () => update({ skipTransition: true })
const updateDefer = () => setTimeout(updateNow, 0)

onMounted(() => {
  updateDefer()
  select(window).on(`resize.${id}`, updateDefer)
})

onUnmounted(() => {
  selectAll('.d2b-tooltip').remove()
  select(window).on(`resize.${id}`, null)
})
</script>

<style>
  .vue-d2b-container {
    height: 100%;
    width: 100%;
  }
  .d2b-sankey-link, .d2b-sankey-node {
    @apply cursor-pointer;
  }
</style>
