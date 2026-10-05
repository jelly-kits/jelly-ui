<script setup lang="ts">
import { computed } from 'vue'
import type { JeSegmentedOption } from './types'

defineOptions({ name: 'JeSegmented' })

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: JeSegmentedOption[]
    disabled?: boolean
    /** 撑满父级宽度 */
    block?: boolean
  }>(),
  { modelValue: null, disabled: false, block: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const activeIndex = computed(() =>
  props.options.findIndex((option) => option.value === props.modelValue),
)

const thumbStyle = computed(() => ({
  width: `calc((100% - 8px) / ${props.options.length || 1})`,
  opacity: activeIndex.value < 0 ? '0' : '1',
  transform: `translateX(${Math.max(0, activeIndex.value) * 100}%)`,
}))

const select = (option: JeSegmentedOption) => {
  if (props.disabled || option.disabled) return
  if (option.value !== props.modelValue) emit('update:modelValue', option.value)
}

/** 方向键在当前可选项之间移动 */
const move = (step: number) => {
  const count = props.options.length
  if (count === 0) return
  const base = activeIndex.value < 0 ? -1 : activeIndex.value
  let next = base
  for (let i = 0; i < count; i += 1) {
    next = (next + step + count) % count
    const option = props.options[next]
    if (option && !option.disabled) {
      select(option)
      return
    }
  }
}

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  }
}
</script>

<template>
  <div
    class="je-segmented"
    :class="{ 'is-disabled': disabled, 'is-block': block }"
    :style="{ '--je-segmented-count': options.length }"
    role="radiogroup"
    @keydown="onKeydown"
  >
    <span class="je-segmented__thumb" :style="thumbStyle" aria-hidden="true" />

    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="je-segmented__item"
      :class="{ 'is-active': option.value === modelValue }"
      role="radio"
      :aria-checked="option.value === modelValue"
      :disabled="disabled || option.disabled"
      @click="select(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.je-segmented {
  position: relative;
  display: inline-grid;
  box-sizing: border-box;
  grid-template-columns: repeat(var(--je-segmented-count), minmax(var(--je-segmented-min, 0px), 1fr));
  padding: 4px;
  font-family: inherit;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.je-segmented.is-block {
  display: grid;
  width: 100%;
}

/* 选中态滑块：位移用带过冲的缓动，切换时有轻微果冻感 */
.je-segmented__thumb {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-radius: calc(var(--je-radius) - 4px);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--je-primary) 40%, transparent);
  transition: transform 0.36s var(--je-ease-out-back), opacity 0.2s ease;
  pointer-events: none;
}

.je-segmented__item {
  position: relative;
  z-index: 1;
  padding: 10px 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--je-text-muted);
  white-space: nowrap;
  background: none;
  border: none;
  border-radius: calc(var(--je-radius) - 4px);
  cursor: pointer;
  outline: none;
  transition: color 0.25s ease;
}

.je-segmented__item.is-active {
  /* 选中项压在同位移的渐变滑块上，固定浅色 */
  color: var(--je-text-on-color);
}

.je-segmented__item:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-segmented__item:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-segmented.is-disabled {
  opacity: 0.6;
}

/* 窄屏：给每格一个最小宽度，超出时可横向滑动，热区不小于 44px */
@media (max-width: 768px) {
  .je-segmented {
    --je-segmented-min: 88px;

    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .je-segmented::-webkit-scrollbar {
    display: none;
  }

  .je-segmented__item {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-segmented__thumb {
    transition: none;
  }
}
</style>