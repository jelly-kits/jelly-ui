<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeIconName } from '../JeIcon/icons'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeFloatingBubble' })

const props = withDefaults(
  defineProps<{
    /** 当前坐标（相对视口左上角，单位 px） */
    offset?: { x: number; y: number }
    /** 允许拖拽的方向 */
    axis?: 'x' | 'y' | 'xy'
    /** 松手后吸附到哪条边 */
    magnetic?: 'x' | 'y'
    /** 气泡内的图标 */
    icon?: JeIconName
    /** 与屏幕边缘保持的距离 */
    gap?: number
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    offset: undefined,
    axis: 'y',
    magnetic: undefined,
    icon: undefined,
    gap: 24,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:offset': [value: { x: number; y: number }]
  /** 坐标变化（拖拽中与吸附后都会触发） */
  offsetChange: [value: { x: number; y: number }]
  /** 位移小于阈值时视为点击 */
  click: [event: MouseEvent | KeyboardEvent]
}>()

const rootRef = ref<HTMLElement | null>(null)
const pos = ref({ x: props.offset?.x ?? 0, y: props.offset?.y ?? 0 })
const dragging = ref(false)

/** 拖动结束时用来吞掉随之而来的那次 click */
let suppressClick = false
let moved = false
let startX = 0
let startY = 0
let originX = 0
let originY = 0

const size = () => rootRef.value?.offsetWidth ?? 0

const clampX = (x: number) => {
  const max = window.innerWidth - size() - props.gap
  return Math.min(Math.max(x, props.gap), Math.max(props.gap, max))
}

const clampY = (y: number) => {
  const max = window.innerHeight - size() - props.gap
  return Math.min(Math.max(y, props.gap), Math.max(props.gap, max))
}

const rootStyle = computed(() => ({
  transform: `translate3d(${pos.value.x}px, ${pos.value.y}px, 0)`,
}))

const update = (next: { x: number; y: number }) => {
  pos.value = next
  emit('update:offset', next)
  emit('offsetChange', next)
}

watch(
  () => props.offset,
  (value) => {
    if (value) pos.value = { x: value.x, y: value.y }
  },
)

const onPointerDown = (event: PointerEvent) => {
  dragging.value = true
  moved = false
  suppressClick = false
  startX = event.clientX
  startY = event.clientY
  originX = pos.value.x
  originY = pos.value.y
  rootRef.value?.setPointerCapture(event.pointerId)
}

const onPointerMove = (event: PointerEvent) => {
  if (!dragging.value) return
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true

  update({
    x: props.axis === 'y' ? originX : clampX(originX + dx),
    y: props.axis === 'x' ? originY : clampY(originY + dy),
  })
}

const snap = () => {
  const next = { ...pos.value }
  if (props.magnetic === 'x') {
    const left = pos.value.x + size() / 2 < window.innerWidth / 2
    next.x = left ? props.gap : window.innerWidth - size() - props.gap
  } else {
    const top = pos.value.y + size() / 2 < window.innerHeight / 2
    next.y = top ? props.gap : window.innerHeight - size() - props.gap
  }
  update(next)
}

const onPointerUp = (event: PointerEvent) => {
  if (!dragging.value) return
  dragging.value = false
  if (rootRef.value?.hasPointerCapture(event.pointerId)) {
    rootRef.value.releasePointerCapture(event.pointerId)
  }
  suppressClick = moved
  if (!moved) return
  if (props.magnetic) snap()
}

const onClick = (event: MouseEvent) => {
  if (suppressClick) {
    suppressClick = false
    return
  }
  emit('click', event)
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  emit('click', event)
}

const onResize = () => {
  update({ x: clampX(pos.value.x), y: clampY(pos.value.y) })
}

onMounted(() => {
  // 首次挂载只做边界收敛，不回抛事件
  pos.value = { x: clampX(pos.value.x), y: clampY(pos.value.y) }
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      ref="rootRef"
      class="je-floating-bubble"
      :class="{ 'is-dragging': dragging }"
      :style="rootStyle"
      role="button"
      tabindex="0"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click="onClick"
      @keydown="onKeydown"
    >
      <slot>
        <JeIcon v-if="icon" :name="icon" :size="24" />
      </slot>
    </div>
  </Teleport>
</template>

<style scoped>
.je-floating-bubble {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 52px;
  height: 52px;
  font-family: inherit;
  font-size: 20px;
  color: #fff;
  cursor: grab;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-radius: 50%;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 45%, transparent);
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  /* 拖拽由 JS 接管，这里禁止浏览器把触摸当成滚动 / 缩放 */
  touch-action: none;
  /* 吸附回弹用 CSS 过渡，拖动过程中关掉 */
  transition: transform 0.34s var(--je-ease-out-back);
}

.je-floating-bubble.is-dragging {
  cursor: grabbing;
  transition: none;
}

.je-floating-bubble:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--je-primary) 45%, transparent),
    0 8px 24px color-mix(in srgb, var(--je-primary) 45%, transparent);
}

@media (max-width: 768px) {
  .je-floating-bubble {
    width: 56px;
    height: 56px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-floating-bubble {
    transition: none;
  }
}
</style>
