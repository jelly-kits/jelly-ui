<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useJeLocale } from '../JeLocale'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeIconName } from '../JeIcon/icons'
import { useFocusTrap } from '../../core/useFocusTrap'
import { useScrollLock } from '../../core/useScrollLock'
import { nextZIndex } from '../../core/useZIndex'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeImagePreview' })

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    modelValue?: boolean
    /** 图片地址列表 */
    images?: string[]
    /** 初始显示第几张 */
    startPosition?: number
    /** 顶部索引指示 */
    showIndex?: boolean
    /** 底部小圆点指示 */
    showIndicators?: boolean
    /** 首尾循环切换 */
    infinite?: boolean
    /** infinite 的别名，二者取或 */
    loop?: boolean
    /** 切图动画时长 */
    swipeDuration?: number
    /** 最大缩放倍数 */
    maxZoom?: number
    /** 最小缩放倍数 */
    minZoom?: number
    /** 显示关闭按钮 */
    closeable?: boolean
    /** 关闭按钮图标 */
    closeIcon?: JeIconName
    /** 点击图片外的空白区域关闭 */
    closeOnClickOverlay?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    images: () => [],
    startPosition: 0,
    showIndex: true,
    showIndicators: false,
    infinite: false,
    loop: false,
    swipeDuration: 300,
    maxZoom: 3,
    minZoom: 1,
    closeable: true,
    closeIcon: 'close',
    closeOnClickOverlay: true,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 当前图片下标变化 */
  change: [index: number]
  /** 关闭 */
  close: []
  /** 缩放倍数变化 */
  scale: [scale: number]
}>()

const { t } = useJeLocale()

const rootRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const zIndex = ref(nextZIndex())

const index = ref(0)
const offset = ref(0)
const dragging = ref(false)
/** 循环切换跨多张时直接跳，避免长距离滑动 */
const instant = ref(false)

const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)

/** 加载失败的图片，用来显示占位 */
const failed = ref<boolean[]>([])

const active = computed(() => props.modelValue)
useScrollLock(active)
useFocusTrap(rootRef, active)

const looping = computed(() => props.infinite || props.loop)
const count = computed(() => props.images.length)
const safeIndex = computed(() => clamp(index.value, 0, Math.max(0, count.value - 1)))

const indexText = computed(() =>
  t('imagePreview.index', {
    current: safeIndex.value + 1,
    total: count.value,
  }),
)

const rootStyle = computed(() => ({
  zIndex: zIndex.value,
  '--je-image-preview-safe-top': 'env(safe-area-inset-top, 0px)',
  '--je-image-preview-safe-bottom': 'env(safe-area-inset-bottom, 0px)',
}))

const EASE = 'cubic-bezier(0.25, 0.8, 0.35, 1)'

const trackStyle = computed(() => ({
  transform: `translate3d(calc(${-index.value * 100}% + ${offset.value}px), 0, 0)`,
  transition:
    dragging.value || instant.value ? 'none' : `transform ${props.swipeDuration}ms ${EASE}`,
}))

const imgStyle = computed(() => ({
  transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0) scale(${scale.value})`,
  transition: dragging.value ? 'none' : `transform ${props.swipeDuration}ms ${EASE}`,
}))

/* ---------------- 缩放 / 平移 ---------------- */

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const trackSize = () => ({
  width: trackRef.value?.clientWidth || window.innerWidth,
  height: trackRef.value?.clientHeight || window.innerHeight,
})

const panLimit = () => {
  const { width, height } = trackSize()
  return {
    x: Math.max(0, (width * (scale.value - 1)) / 2),
    y: Math.max(0, (height * (scale.value - 1)) / 2),
  }
}

const setScale = (next: number) => {
  const value = clamp(next, props.minZoom, props.maxZoom)
  scale.value = value
  if (value <= props.minZoom) {
    // 缩到最小处即为原图，平移量失去意义
    translateX.value = 0
    translateY.value = 0
  } else {
    const limit = panLimit()
    translateX.value = clamp(translateX.value, -limit.x, limit.x)
    translateY.value = clamp(translateY.value, -limit.y, limit.y)
  }
  emit('scale', value)
}

const resetTransform = () => {
  scale.value = props.minZoom
  translateX.value = 0
  translateY.value = 0
}

/** 翻页统一入口：循环取模、非循环夹紧 */
const goTo = (target: number) => {
  const total = count.value
  if (total === 0) return
  const next = looping.value ? ((target % total) + total) % total : clamp(target, 0, total - 1)
  if (next === index.value) {
    offset.value = 0
    return
  }
  instant.value = Math.abs(next - index.value) > 1
  index.value = next
  offset.value = 0
  resetTransform()
  emit('change', next)
  if (instant.value) {
    requestAnimationFrame(() => {
      instant.value = false
    })
  }
}

/* ---------------- 手势 ---------------- */

type Mode = 'none' | 'swipe' | 'pan' | 'pinch'

const pointers = new Map<number, { x: number; y: number }>()
let mode: Mode = 'none'
let startX = 0
let startY = 0
let startTx = 0
let startTy = 0
let startScale = 1
let startDistance = 1
let lastTapAt = 0
let moved = false

const currentScale = () => scale.value

const onPointerDown = (event: PointerEvent) => {
  if (!props.modelValue) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)

  if (pointers.size === 1) {
    moved = false
    mode = currentScale() > props.minZoom ? 'pan' : 'swipe'
    dragging.value = true
    startX = event.clientX
    startY = event.clientY
    startTx = translateX.value
    startTy = translateY.value
    offset.value = 0
    return
  }

  if (pointers.size === 2) {
    const [first, second] = [...pointers.values()]
    if (!first || !second) return
    mode = 'pinch'
    dragging.value = true
    startDistance = Math.hypot(first.x - second.x, first.y - second.y) || 1
    startScale = currentScale()
    startTx = translateX.value
    startTy = translateY.value
    offset.value = 0
  }
}

const onPointerMove = (event: PointerEvent) => {
  if (!pointers.has(event.pointerId)) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (mode === 'pinch') {
    const [first, second] = [...pointers.values()]
    if (!first || !second) return
    const distance = Math.hypot(first.x - second.x, first.y - second.y) || 1
    setScale((startScale * distance) / startDistance)
    return
  }

  if (mode === 'pan') {
    const limit = panLimit()
    translateX.value = clamp(startTx + (event.clientX - startX), -limit.x, limit.x)
    translateY.value = clamp(startTy + (event.clientY - startY), -limit.y, limit.y)
    if (Math.abs(event.clientX - startX) > 8 || Math.abs(event.clientY - startY) > 8) moved = true
    return
  }

  if (mode === 'swipe') {
    let delta = event.clientX - startX
    // 首尾不循环时加阻尼，越界拖动更「重」
    if (!looping.value && ((index.value === 0 && delta > 0) || (index.value === count.value - 1 && delta < 0))) {
      delta *= 0.35
    }
    offset.value = delta
    if (Math.abs(delta) > 8 || Math.abs(event.clientY - startY) > 8) moved = true
  }
}

const isTapOnImage = (x: number, y: number) => {
  const el = document.elementFromPoint(x, y)
  return !!el?.closest('.je-image-preview__img')
}

const onImageError = (target: number) => {
  failed.value[target] = true
}

const onPointerUp = (event: PointerEvent) => {
  if (!pointers.has(event.pointerId)) return
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
  pointers.delete(event.pointerId)

  if (pointers.size > 0) {
    // 双指松开一根：改成以剩余手指继续平移 / 滑动
    const [rest] = [...pointers.values()]
    if (rest) {
      mode = currentScale() > props.minZoom ? 'pan' : 'swipe'
      startX = rest.x
      startY = rest.y
      startTx = translateX.value
      startTy = translateY.value
      offset.value = 0
    }
    return
  }

  const previousMode = mode
  mode = 'none'
  dragging.value = false

  if (previousMode === 'swipe') {
    const threshold = Math.max(60, trackSize().width / 4)
    if (offset.value > threshold) goTo(index.value - 1)
    else if (offset.value < -threshold) goTo(index.value + 1)
    else offset.value = 0
  }

  if (scale.value <= props.minZoom) resetTransform()

  // 轻点：图片上判定双击缩放，图片外关闭
  if (!moved && previousMode !== 'pinch') {
    if (isTapOnImage(event.clientX, event.clientY)) {
      const now = performance.now()
      if (now - lastTapAt < 300) {
        lastTapAt = 0
        if (currentScale() > props.minZoom) resetTransform()
        else setScale(props.maxZoom)
      } else {
        lastTapAt = now
      }
    } else if (props.closeOnClickOverlay) {
      close()
    }
  }
  moved = false
}

const onWheel = (event: WheelEvent) => {
  if (!props.modelValue) return
  setScale(currentScale() * (event.deltaY < 0 ? 1.12 : 1 / 1.12))
}

/* ---------------- 开关与键盘 ---------------- */

const close = () => {
  if (!props.modelValue) return
  emit('update:modelValue', false)
  emit('close')
}

const onOverlayClick = () => {
  if (props.closeOnClickOverlay) close()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.stopPropagation()
    close()
    return
  }
  if (event.key === 'ArrowLeft') goTo(index.value - 1)
  else if (event.key === 'ArrowRight') goTo(index.value + 1)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      // 每次显示都重新取层级，保证压住先前打开的浮层
      zIndex.value = nextZIndex()
      index.value = count.value > 0 ? clamp(props.startPosition, 0, count.value - 1) : 0
      offset.value = 0
      dragging.value = false
      resetTransform()
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      ref="rootRef"
      class="je-image-preview"
      :class="{ 'is-open': modelValue }"
      :style="rootStyle"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      :aria-hidden="!modelValue"
    >
      <div class="je-image-preview__overlay" aria-hidden="true" @click="onOverlayClick" />

      <div
        ref="trackRef"
        class="je-image-preview__track"
        :style="trackStyle"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel.prevent="onWheel"
      >
        <div v-for="(image, i) in images" :key="i" class="je-image-preview__item">
          <img
            v-if="!failed[i]"
            class="je-image-preview__img"
            :src="image"
            :alt="`第 ${i + 1} 张图片`"
            :style="i === index ? imgStyle : undefined"
            draggable="false"
            @error="onImageError(i)"
          >
          <span v-else class="je-image-preview__error">
            <JeIcon name="image" :size="40" />
          </span>
        </div>
      </div>

      <div v-if="showIndex && count > 0" class="je-image-preview__index">{{ indexText }}</div>

      <button
        v-if="closeable"
        type="button"
        class="je-image-preview__close"
        :aria-label="t('imagePreview.close')"
        @click="close"
      >
        <JeIcon :name="closeIcon" :size="20" />
      </button>

      <div v-if="showIndicators && count > 1" class="je-image-preview__indicators">
        <span
          v-for="dot in count"
          :key="dot"
          class="je-image-preview__indicator"
          :class="{ 'is-active': dot - 1 === index }"
          @click="goTo(dot - 1)"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.je-image-preview {
  position: fixed;
  inset: 0;
  font-family: inherit;
  /* 整块压在深色遮罩上，文字与图标一律浅色 */
  color: var(--je-text-on-color);
  /* 常驻 DOM 且铺满视口，收起时必须放行点击 */
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--je-duration) ease, visibility 0s linear var(--je-duration);
}

.je-image-preview.is-open {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transition: opacity var(--je-duration) ease;
}

.je-image-preview__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.je-image-preview__track {
  position: absolute;
  inset: 0;
  display: flex;
  /* 只对横向手势做拦截，纵向滚动交还浏览器（浮层下页面本身已锁滚动） */
  touch-action: pan-y;
  cursor: grab;
  will-change: transform;
}

.je-image-preview__item {
  position: relative;
  display: flex;
  flex: 0 0 100%;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: calc(var(--je-image-preview-safe-top) + 56px) 12px
    calc(var(--je-image-preview-safe-bottom) + 56px);
}

.je-image-preview__img {
  max-width: 100%;
  max-height: 100%;
  touch-action: none;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
}

.je-image-preview__error {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  color: var(--je-text-faint);
  background: var(--je-surface);
  border-radius: var(--je-radius);
}

.je-image-preview__index {
  position: absolute;
  top: calc(var(--je-image-preview-safe-top) + 16px);
  left: 50%;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  /* 压在深色遮罩上，固定浅色 */
  color: var(--je-text-on-color);
  pointer-events: none;
  transform: translateX(-50%);
}

.je-image-preview__close {
  position: absolute;
  top: calc(var(--je-image-preview-safe-top) + 8px);
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  /* 压在深色遮罩上，固定浅色 */
  color: var(--je-text-on-color);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  outline: none;
  transition: background var(--je-duration) ease;
}

.je-image-preview__close:hover {
  background: var(--je-surface-hover);
}

.je-image-preview__close:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-image-preview__indicators {
  position: absolute;
  bottom: calc(var(--je-image-preview-safe-bottom) + 20px);
  left: 50%;
  display: flex;
  gap: 8px;
  transform: translateX(-50%);
}

.je-image-preview__indicator {
  width: 8px;
  height: 8px;
  cursor: pointer;
  /* 指示点也在深色遮罩上，固定由浅色派生 */
  background: color-mix(in srgb, var(--je-text-on-color) 35%, transparent);
  border-radius: 50%;
  transition: background var(--je-duration) ease, transform var(--je-duration) ease;
}

.je-image-preview__indicator.is-active {
  background: var(--je-primary);
  transform: scale(1.25);
}

@media (max-width: 768px) {
  .je-image-preview__index {
    font-size: 13px;
  }
}

/*
 * 减弱动效时全部瞬切。
 * 必须把 .is-open 状态类也列进来：它的选择器特异性比单个基础类高，
 * 只写基础类的话状态规则里的 transition 会反压回来，减弱动效实际不生效。
 */
@media (prefers-reduced-motion: reduce) {
  .je-image-preview,
  .je-image-preview.is-open,
  .je-image-preview__indicator {
    transition: none;
  }
}
</style>