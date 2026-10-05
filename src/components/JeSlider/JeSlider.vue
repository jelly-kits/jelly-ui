<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ name: 'JeSlider' })

const props = withDefaults(
  defineProps<{
    /** 单值传 number，范围模式传 [起点, 终点] */
    modelValue?: number | number[]
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    showTooltip?: boolean
  }>(),
  { modelValue: 0, min: 0, max: 100, step: 1, disabled: false, showTooltip: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: number | number[]] }>()

const rootRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const dragging = ref(false)
const activeIndex = ref(0)

const isRange = computed(() => Array.isArray(props.modelValue))

const values = computed<number[]>(() =>
  Array.isArray(props.modelValue) ? [...props.modelValue] : [props.modelValue],
)

const decimals = computed(() => {
  const text = String(props.step)
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
})

const round = (value: number) => {
  const factor = 10 ** decimals.value
  return Math.round(value * factor) / factor
}

const clamp = (value: number) => Math.min(props.max, Math.max(props.min, value))

const percent = (value: number) => {
  const span = props.max - props.min
  return span === 0 ? 0 : ((value - props.min) / span) * 100
}

const fillStyle = computed(() => {
  if (isRange.value) {
    const [start, end] = values.value
    return { left: `${percent(start)}%`, width: `${percent(end) - percent(start)}%` }
  }
  return { left: '0%', width: `${percent(values.value[0])}%` }
})

const tooltipValue = computed(() => values.value[activeIndex.value] ?? props.min)

const ratioFromEvent = (event: PointerEvent) => {
  const el = trackRef.value
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  if (rect.width === 0) return 0
  return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
}

const valueFromRatio = (ratio: number) => {
  const raw = props.min + ratio * (props.max - props.min)
  const stepped = Math.round((raw - props.min) / props.step) * props.step + props.min
  return round(clamp(stepped))
}

/** 写入某个把手：范围模式下不允许两个值交叉，避免拖拽时把手互相穿越 */
const setValueAt = (index: number, value: number) => {
  if (!isRange.value) {
    if (value !== props.modelValue) emit('update:modelValue', value)
    return
  }
  const next: number[] = [values.value[0], values.value[1]]
  if (index === 0) next[0] = Math.min(value, values.value[1])
  else next[1] = Math.max(value, values.value[0])
  if (next[0] !== values.value[0] || next[1] !== values.value[1]) emit('update:modelValue', next)
}

const nearestIndex = (value: number) => {
  if (!isRange.value) return 0
  const [start, end] = values.value
  return Math.abs(value - start) <= Math.abs(value - end) ? 0 : 1
}

const startDrag = (event: PointerEvent, index: number) => {
  if (props.disabled) return
  activeIndex.value = index
  dragging.value = true
  rootRef.value?.setPointerCapture(event.pointerId)
  setValueAt(index, valueFromRatio(ratioFromEvent(event)))
}

const onTrackPointerDown = (event: PointerEvent) => {
  if (props.disabled) return
  const value = valueFromRatio(ratioFromEvent(event))
  const index = nearestIndex(value)
  activeIndex.value = index
  dragging.value = true
  rootRef.value?.setPointerCapture(event.pointerId)
  setValueAt(index, value)
}

const onPointerMove = (event: PointerEvent) => {
  if (!dragging.value) return
  setValueAt(activeIndex.value, valueFromRatio(ratioFromEvent(event)))
}

const endDrag = (event: PointerEvent) => {
  if (!dragging.value) return
  dragging.value = false
  if (rootRef.value?.hasPointerCapture(event.pointerId)) {
    rootRef.value.releasePointerCapture(event.pointerId)
  }
}

const onKeydown = (event: KeyboardEvent, index: number) => {
  if (props.disabled) return
  activeIndex.value = index
  const current = values.value[index]

  const commit = (value: number) => {
    event.preventDefault()
    setValueAt(index, round(clamp(value)))
  }

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      commit(current + props.step)
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      commit(current - props.step)
      break
    case 'Home':
      commit(props.min)
      break
    case 'End':
      commit(props.max)
      break
  }
}

const format = (value: number) => String(round(value))
</script>

<template>
  <div
    ref="rootRef"
    class="je-slider"
    :class="{ 'is-disabled': disabled, 'is-range': isRange }"
    @pointermove="onPointerMove"
    @pointerup="endDrag"
    @pointercancel="endDrag"
  >
    <div ref="trackRef" class="je-slider__track" @pointerdown="onTrackPointerDown">
      <div class="je-slider__fill" :style="fillStyle" />

      <button
        v-for="(value, index) in values"
        :key="index"
        type="button"
        class="je-slider__thumb"
        role="slider"
        :style="{ left: `${percent(value)}%` }"
        :disabled="disabled"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="value"
        :aria-label="isRange ? (index === 0 ? '最小值' : '最大值') : '数值'"
        @pointerdown.stop="startDrag($event, index)"
        @keydown="onKeydown($event, index)"
      />

      <span
        v-if="showTooltip && dragging"
        class="je-slider__tooltip"
        :style="{ left: `${percent(tooltipValue)}%` }"
        aria-hidden="true"
      >
        {{ format(tooltipValue) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.je-slider {
  box-sizing: border-box;
  width: 100%;
  padding: 12px 0;
  font-family: inherit;
  touch-action: none;
  user-select: none;
}

.je-slider__track {
  position: relative;
  width: 100%;
  height: 6px;
  background: var(--je-surface);
  border-radius: 999px;
  cursor: pointer;
  touch-action: none;
}

.je-slider__fill {
  position: absolute;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--je-primary), var(--je-primary-end));
  border-radius: 999px;
}

.je-slider__thumb {
  position: absolute;
  top: 50%;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  padding: 0;
  background: #fff;
  border: 2px solid var(--je-primary);
  border-radius: 50%;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--je-primary) 45%, transparent);
  cursor: grab;
  outline: none;
  transform: translate(-50%, -50%);
  transition: transform 0.2s var(--je-ease-out-back), box-shadow 0.2s ease;
}

/* 透明热区：视觉上仍是 20px 的圆点，实际可点区域扩到 44px */
.je-slider__thumb::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
}

.je-slider__thumb:hover,
.je-slider__thumb:focus-visible {
  transform: translate(-50%, -50%) scale(1.15);
}

.je-slider__thumb:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 3px;
}

.je-slider__thumb:active {
  cursor: grabbing;
}

.je-slider__tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  padding: 4px 8px;
  font-size: 12px;
  color: var(--je-text);
  background: var(--je-popup);
  border: var(--je-border);
  border-radius: 8px;
  transform: translateX(-50%);
  pointer-events: none;
  white-space: nowrap;
}

.je-slider.is-disabled {
  opacity: 0.5;
}

.je-slider.is-disabled .je-slider__track {
  cursor: not-allowed;
}

.je-slider.is-disabled .je-slider__thumb {
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .je-slider__track {
    height: 8px;
  }

  .je-slider__thumb {
    width: 24px;
    height: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-slider__thumb {
    transition: none;
  }
}
</style>