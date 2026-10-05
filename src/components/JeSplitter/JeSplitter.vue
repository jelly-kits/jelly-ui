<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import {
  jeSplitterKey,
  type JeSplitterContext,
  type JeSplitterLayout,
  type JeSplitterPanelProvider,
} from './types'

defineOptions({ name: 'JeSplitter' })

const props = withDefaults(
  defineProps<{
    layout?: JeSplitterLayout
    /** 各面板尺寸（百分比），配合 v-model 使用 */
    modelValue?: number[]
  }>(),
  { layout: 'horizontal' },
)

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  resize: [index: number, sizes: number[]]
  resizeStart: []
  resizeEnd: []
}>()

const rootRef = ref<HTMLElement | null>(null)
const sizes = ref<number[]>([])
const count = ref(0)
const activeIndex = ref(-1)

const layout = computed(() => props.layout)

/** 面板按挂载顺序登记；卸载时置空，保持下标稳定 */
const providers: (JeSplitterPanelProvider | null)[] = []

const readState = (index: number) => {
  const provider = providers[index]
  return provider ? provider() : null
}

/** 依据面板 size 推导初始尺寸；未指定的面板均分剩余空间 */
const resetSizes = () => {
  const total = providers.length
  if (total === 0) return

  const raws = providers.map((provider) => {
    const size = provider ? provider().size : undefined
    return typeof size === 'number' && size > 0 ? size : 0
  })
  const assigned = raws.reduce((sum, value) => sum + value, 0)
  const unset = raws.filter((value) => value <= 0).length
  const share = unset > 0 ? Math.max(0, 100 - assigned) / unset : 0

  sizes.value = raws.map((value) => (value > 0 ? value : share))
}

const registerPanel = (provider: JeSplitterPanelProvider) => {
  const index = providers.length
  providers.push(provider)
  count.value = providers.length
  if (!props.modelValue || props.modelValue.length === 0) resetSizes()
  return index
}

const unregisterPanel = (index: number) => {
  if (index >= 0 && index < providers.length) providers[index] = null
}

const commit = (next: number[], index: number) => {
  sizes.value = next
  emit('update:modelValue', next)
  emit('resize', index, next)
}

/** 只挪动某一对相邻面板，其余保持不变 */
const applyPair = (index: number, base: number[], delta: number) => {
  const first = base[index]
  const second = base[index + 1]
  if (first === undefined || second === undefined) return

  const stateA = readState(index)
  const stateB = readState(index + 1)
  const pair = first + second
  const minA = stateA?.collapsible ? 0 : (stateA?.min ?? 0)
  const minB = stateB?.collapsible ? 0 : (stateB?.min ?? 0)
  const lower = Math.max(minA, pair - (stateB?.max ?? 100))
  const upper = Math.min(stateA?.max ?? 100, pair - minB)
  if (lower > upper) return

  const target = Math.min(upper, Math.max(lower, first + delta))
  const next = [...base]
  next[index] = target
  next[index + 1] = pair - target
  commit(next, index)
}

let dragStart = 0
let dragBase: number[] = []
let dragTotal = 0

const onBarPointerDown = (index: number, event: PointerEvent) => {
  const state = readState(index)
  if (!state || !state.resizable) return

  const root = rootRef.value
  dragTotal = root
    ? props.layout === 'horizontal'
      ? root.clientWidth
      : root.clientHeight
    : 0
  dragStart = props.layout === 'horizontal' ? event.clientX : event.clientY
  dragBase = [...sizes.value]
  activeIndex.value = index

  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  event.preventDefault()
  emit('resizeStart')
}

const onBarPointerMove = (event: PointerEvent) => {
  if (activeIndex.value < 0 || dragTotal <= 0) return
  const current = props.layout === 'horizontal' ? event.clientX : event.clientY
  applyPair(activeIndex.value, dragBase, ((current - dragStart) / dragTotal) * 100)
}

const onBarPointerUp = (event: PointerEvent) => {
  if (activeIndex.value < 0) return
  const el = event.currentTarget as HTMLElement
  if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
  activeIndex.value = -1
  dragBase = []
  dragTotal = 0
  emit('resizeEnd')
}

const nudge = (index: number, delta: number) => {
  applyPair(index, sizes.value, delta)
}

const context: JeSplitterContext = {
  layout,
  sizes,
  count,
  activeIndex,
  registerPanel,
  unregisterPanel,
  onBarPointerDown,
  onBarPointerMove,
  onBarPointerUp,
  nudge,
}
provide(jeSplitterKey, context)

watch(
  () => props.modelValue,
  (value) => {
    if (value && value.length) sizes.value = [...value]
  },
  { immediate: true },
)
</script>

<template>
  <div
    ref="rootRef"
    class="je-splitter"
    :class="[`je-splitter--${layout}`, { 'is-dragging': activeIndex >= 0 }]"
  >
    <slot />
  </div>
</template>

<style scoped>
.je-splitter {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  font-family: inherit;
}

.je-splitter--horizontal {
  flex-direction: row;
}

.je-splitter--vertical {
  flex-direction: column;
}

/* 拖拽期间禁止选中文字，避免拖出蓝色选区 */
.je-splitter.is-dragging {
  user-select: none;
}
</style>
