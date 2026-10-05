<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import JeScrollbar from '../JeScrollbar/JeScrollbar.vue'
import { jeSplitterKey } from './types'

defineOptions({ name: 'JeSplitterPanel' })

const props = withDefaults(
  defineProps<{
    /** 初始尺寸，按百分比处理（30 表示 30%） */
    size?: number | string
    /** 最小尺寸（百分比） */
    min?: number
    /** 最大尺寸（百分比） */
    max?: number
    /** 允许被拖到 0，从而折叠 */
    collapsible?: boolean
    /** 是否允许拖动它右侧 / 下方的分割条 */
    resizable?: boolean
  }>(),
  { min: 0, max: 100, collapsible: false, resizable: true },
)

const context = inject(jeSplitterKey, null)
const index = ref(-1)

onMounted(() => {
  if (!context) return
  index.value = context.registerPanel(() => ({
    size: props.size,
    min: props.min,
    max: props.max,
    collapsible: props.collapsible,
    resizable: props.resizable,
  }))
})

onBeforeUnmount(() => {
  if (context && index.value >= 0) context.unregisterPanel(index.value)
})

const isHorizontal = computed(() => !!context && context.layout.value === 'horizontal')
const isActive = computed(() => !!context && context.activeIndex.value === index.value)
const showBar = computed(
  () => !!context && index.value >= 0 && index.value < context.count.value - 1,
)

const sizePercent = computed(() => (context ? (context.sizes.value[index.value] ?? 0) : 100))

const panelStyle = computed(() => ({ flex: `1 1 ${sizePercent.value}%` }))

const onPointerDown = (event: PointerEvent) => {
  if (!context || !props.resizable) return
  context.onBarPointerDown(index.value, event)
}

const onPointerMove = (event: PointerEvent) => context?.onBarPointerMove(event)
const onPointerUp = (event: PointerEvent) => context?.onBarPointerUp(event)

const onKeydown = (event: KeyboardEvent) => {
  if (!context || !props.resizable) return
  const step = event.shiftKey ? 10 : 2
  const forward = isHorizontal.value ? 'ArrowRight' : 'ArrowDown'
  const backward = isHorizontal.value ? 'ArrowLeft' : 'ArrowUp'

  if (event.key === forward) {
    event.preventDefault()
    context.nudge(index.value, step)
  } else if (event.key === backward) {
    event.preventDefault()
    context.nudge(index.value, -step)
  }
}
</script>

<template>
  <div class="je-splitter__panel" :style="panelStyle">
    <JeScrollbar>
      <slot />
    </JeScrollbar>
  </div>

  <div
    v-if="showBar"
    class="je-splitter__bar"
    :class="[
      isHorizontal ? 'je-splitter__bar--horizontal' : 'je-splitter__bar--vertical',
      { 'is-active': isActive, 'is-disabled': !resizable },
    ]"
    role="separator"
    :aria-orientation="isHorizontal ? 'vertical' : 'horizontal'"
    :aria-valuenow="Math.round(sizePercent)"
    aria-valuemin="0"
    aria-valuemax="100"
    :tabindex="resizable ? 0 : -1"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKeydown"
  />
</template>

<style scoped>
.je-splitter__panel {
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  font-family: inherit;
}

.je-splitter__bar {
  position: relative;
  flex: 0 0 auto;
  background: transparent;
  outline: none;
  /* 只有分割条本身禁用触屏手势，面板内容照常滚动 */
  touch-action: none;
}

.je-splitter__bar--horizontal {
  width: 4px;
  cursor: col-resize;
}

.je-splitter__bar--vertical {
  height: 4px;
  cursor: row-resize;
}

/* 视觉细线由伪元素绘制，元素本身只负责命中区 */
.je-splitter__bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 4px;
  height: 100%;
  background: var(--je-border-color);
  border-radius: 999px;
  transform: translateX(-50%);
  transition: background var(--je-duration) ease;
}

.je-splitter__bar--vertical::after {
  top: 50%;
  left: 0;
  width: 100%;
  height: 4px;
  transform: translateY(-50%);
}

.je-splitter__bar:hover::after,
.je-splitter__bar.is-active::after {
  background: var(--je-primary);
}

.je-splitter__bar:focus-visible::after {
  background: var(--je-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--je-primary) 35%, transparent);
}

.je-splitter__bar.is-disabled {
  cursor: default;
}

/* 窄屏：命中区加宽到 16px，视觉线仍是 4px */
@media (max-width: 768px) {
  .je-splitter__bar--horizontal {
    width: 16px;
  }

  .je-splitter__bar--vertical {
    height: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-splitter__bar::after {
    transition: none;
  }
}
</style>
