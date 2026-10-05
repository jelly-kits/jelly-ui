<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import type { JeAffixProps } from './types'

defineOptions({ name: 'JeAffix' })

const props = withDefaults(defineProps<JeAffixProps>(), {
  offset: 0,
  target: '',
  position: 'top',
})

const emit = defineEmits<{ change: [fixed: boolean] }>()

const rootRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

const fixed = ref(false)
/** 固定后距视口上 / 下的距离 */
const fixedOffset = ref(0)
const fixedLeft = ref(0)
const width = ref(0)
const height = ref(0)

let observer: ResizeObserver | null = null
let targetEl: HTMLElement | Window | null = null

const resolveTarget = (): HTMLElement | Window => {
  if (props.target) {
    const el = document.querySelector<HTMLElement>(props.target)
    if (el) return el
  }
  return window
}

const update = () => {
  const rootEl = rootRef.value
  const contentEl = contentRef.value
  if (!rootEl || !contentEl) return

  const target = resolveTarget()
  const rootRect = rootEl.getBoundingClientRect()
  const targetRect = target instanceof Window ? null : target.getBoundingClientRect()
  const targetTop = targetRect ? targetRect.top : 0
  const targetBottom = targetRect ? targetRect.bottom : window.innerHeight

  // 占位元素始终留在文档流里，量到的就是内容的原始尺寸
  width.value = rootRect.width
  height.value = contentEl.offsetHeight

  const shouldFix =
    props.position === 'bottom'
      ? rootRect.bottom >= targetBottom - props.offset
      : rootRect.top <= targetTop + props.offset

  fixedOffset.value =
    props.position === 'bottom'
      ? window.innerHeight - targetBottom + props.offset
      : targetTop + props.offset
  fixedLeft.value = rootRect.left

  if (shouldFix !== fixed.value) {
    fixed.value = shouldFix
    emit('change', shouldFix)
  }
}

/** 占位元素顶住原高度，元素固定后页面不会跳动 */
const rootStyle = computed<CSSProperties | undefined>(() =>
  fixed.value ? { width: `${width.value}px`, height: `${height.value}px` } : undefined,
)

const contentStyle = computed<CSSProperties | undefined>(() => {
  if (!fixed.value) return undefined
  const style: CSSProperties = {
    position: 'fixed',
    left: `${fixedLeft.value}px`,
    width: `${width.value}px`,
  }
  if (props.position === 'bottom') style.bottom = `${fixedOffset.value}px`
  else style.top = `${fixedOffset.value}px`
  if (props.zIndex !== undefined) style.zIndex = props.zIndex
  return style
})

const observe = () => {
  if (typeof ResizeObserver === 'undefined') return
  observer?.disconnect()
  observer = new ResizeObserver(update)
  if (rootRef.value) observer.observe(rootRef.value)
  if (targetEl instanceof HTMLElement) observer.observe(targetEl)
}

const bind = () => {
  targetEl = resolveTarget()
  // 捕获阶段才能听到任意滚动容器（含 target 自身）的滚动
  window.addEventListener('scroll', update, true)
  window.addEventListener('resize', update)
  observe()
  update()
}

const unbind = () => {
  window.removeEventListener('scroll', update, true)
  window.removeEventListener('resize', update)
  observer?.disconnect()
  observer = null
  targetEl = null
}

watch(() => props.target, bind)
watch(() => [props.offset, props.position], update)

onMounted(bind)
onBeforeUnmount(unbind)
</script>

<template>
  <div ref="rootRef" class="je-affix" :style="rootStyle">
    <div
      ref="contentRef"
      class="je-affix__content"
      :class="{ 'is-fixed': fixed }"
      :style="contentStyle"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.je-affix,
.je-affix__content {
  box-sizing: border-box;
}

.je-affix__content.is-fixed {
  z-index: 100;
}
</style>
