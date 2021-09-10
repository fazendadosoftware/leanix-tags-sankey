<template>
  <div :class="['vue-d2b-container', `vue-d2b-chart-sunkey`]" ref="root"/>
</template>

<script lang="ts" setup>
import { ref, unref, Ref, toRefs, PropType, watch, onMounted, onUnmounted, nextTick } from 'vue'
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

const generator = chartSankey()

let unwatch = () => {}

const unwatcher = () => { if (typeof unwatch === 'function') unwatch() }
const watcher = () => { unwatcher(); unwatch = watch([data, config], () => update(), { deep: true }) }

const update = (options?: { skipTransition: boolean }) => {
  const _root = select(unref(root))
  if (_root === null) return

  // @ts-ignore
  const eventDataMapper = (event: any, d: unknown): void => emit(event.type, { ...d, event })

  nextTick(() => {
    selectAll('.d2b-sankey-link')
      .on('mouseover', eventDataMapper)
      .on('mouseleave', eventDataMapper)
      .on('click', eventDataMapper)
    selectAll('.d2b-sankey-node')
      .on('mouseover', eventDataMapper)
      .on('mouseleave', eventDataMapper)
      .on('click', eventDataMapper)
  })

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
    @apply cursor-pointer text-sm tracking-tight;
  }
</style>
