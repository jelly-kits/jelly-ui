<script setup lang="ts">
import { computed } from 'vue'
import { useJeConfigSize } from '../JeConfigProvider/types'
import type { JeSegmentedOption } from './types'

defineOptions({ name: 'JeSegmented' })

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: JeSegmentedOption[]
    disabled?: boolean
    /** 撑满父级宽度 */
    block?: boolean
    /** 尺寸，不传时取全局配置（configureJelly / JeConfigProvider） */
    size?: 'small' | 'default' | 'large'
  }>(),
  { modelValue: null, disabled: false, block: false, size: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

/** 尺寸：组件自身优先，再退回全局配置（configureJelly / JeConfigProvider） */
const size = useJeConfigSize(() => props.size)

/** default 不产生类名（基础样式即 default） */
const sizeClass = computed(() => (size.value === 'default' ? '' : `je-segmented--${size.value}`))

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
    :class="[sizeClass, { 'is-disabled': disabled, 'is-block': block }]"
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
  /* 尺寸变量：default 为基础值，修饰类只覆盖这几个变量 */
  --je-sg-item-py: 6px;
  --je-sg-item-px: 14px;
  --je-sg-item-fs: var(--je-control-fs);
  position: relative;
  display: inline-grid;
  box-sizing: border-box;
  grid-template-columns: repeat(var(--je-segmented-count), minmax(var(--je-segmented-min, 0px), 1fr));
  padding: 4px;
  font-family: inherit;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-control-radius);
}

.je-segmented--small {
  --je-sg-item-py: 4px;
  --je-sg-item-px: 10px;
  --je-sg-item-fs: var(--je-control-fs-sm);
}

.je-segmented--large {
  --je-sg-item-py: 8px;
  --je-sg-item-px: 18px;
  --je-sg-item-fs: var(--je-control-fs-lg);
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
  border-radius: calc(var(--je-control-radius) - 2px);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--je-primary) 40%, transparent);
  transition: transform 0.36s var(--je-ease-out-back), opacity 0.2s ease;
  pointer-events: none;
}

.je-segmented__item {
  position: relative;
  z-index: 1;
  padding: var(--je-sg-item-py, 6px) var(--je-sg-item-px, 14px);
  font-family: inherit;
  font-size: var(--je-sg-item-fs, var(--je-control-fs));
  font-weight: 500;
  color: var(--je-text-muted);
  white-space: nowrap;
  background: none;
  border: none;
  border-radius: calc(var(--je-control-radius) - 2px);
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

/* 窄屏：接触屏档（32 / 44 / 50），每格给一个最小宽度，超出时可横向滑动 */
@media (max-width: 768px) {
  .je-segmented {
    --je-segmented-min: 88px;
    --je-sg-item-py: 9px;
    --je-sg-item-px: 15px;
    --je-sg-item-fs: var(--je-touch-fs);

    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .je-segmented--small {
    --je-sg-item-py: 6px;
    --je-sg-item-px: 12px;
    --je-sg-item-fs: var(--je-touch-fs-sm);
  }

  .je-segmented--large {
    --je-sg-item-py: 12px;
    --je-sg-item-px: 18px;
    --je-sg-item-fs: var(--je-touch-fs-lg);
  }

  .je-segmented::-webkit-scrollbar {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-segmented__thumb {
    transition: none;
  }
}
</style>