<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

defineOptions({ name: 'JeCircle' })

/** 渐变 id 用模块级计数器，保证同页多个实例互不覆盖 */
let circleSeed = 0

const DEFAULT_COLORS = ['var(--je-primary)', 'var(--je-primary-end)'] as const

const props = withDefaults(
  defineProps<{
    /** 当前值 */
    modelValue?: number
    /** 总量（modelValue 达到它时画满一圈） */
    rate?: number
    /** 直径，数字按 px 处理 */
    size?: number | string
    /** 进度色，支持单色、色数组或按当前值取色的函数 */
    color?: string | string[] | ((current: number) => string)
    /** 轨道底色 */
    layerColor?: string
    /** 填充模式：none 只描边 / solid 单色填充 / gradient 渐变填充 */
    fill?: 'none' | 'solid' | 'gradient'
    /** 环宽，占半径的百分比 */
    strokeWidth?: number
    /** 是否顺时针 */
    clockwise?: boolean
    /** 线帽 */
    strokeLinecap?: 'round' | 'square' | 'butt'
    /** 弧形起始位置 */
    startPosition?: 'top' | 'right' | 'bottom' | 'left'
    /** 动画速度，值越大越快 */
    speed?: number
    /** 中心文字 */
    text?: string
    /** 自定义渐变（取前两色），不传时用 color 数组前两色现算 */
    linearGradient?: string[]
  }>(),
  {
    modelValue: 0,
    rate: 100,
    size: 100,
    color: () => ['var(--je-primary)', 'var(--je-primary-end)'],
    layerColor: 'var(--je-surface)',
    fill: 'none',
    strokeWidth: 40,
    clockwise: true,
    strokeLinecap: 'round',
    startPosition: 'top',
    speed: 100,
    text: undefined,
    linearGradient: undefined,
  },
)

defineEmits<{
  'update:modelValue': [value: number]
}>()

const gradientId = `je-circle-grad-${(circleSeed += 1)}`

const toUnit = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : value

/**
 * strokeWidth 的语义是「环宽占半径的百分比」，而 SVG 的 stroke-width 用的是视图盒单位。
 * 视图盒 100×100、半径 50，所以百分比换算成单位要除以 2。
 *
 * 半径必须按同一个换算结果回缩：radius + strokeUnits / 2 正好等于 50，
 * 外沿永远贴着视图盒边缘。之前 radius 用的是换算后的值、stroke-width 却传了原始值，
 * 于是默认 40 时外沿跑到 60，整个环被 SVG 裁成了圆角方块。
 */
const strokeUnits = computed(() => props.strokeWidth / 2)
const radius = computed(() => 50 - strokeUnits.value / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

/* ---------------- 数值补间 ---------------- */

const displayed = ref(0)
let rafId = 0
let from = 0
let to = 0
let startAt = 0
let duration = 0

const stopRaf = () => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

const tick = (now: number) => {
  const progress = duration > 0 ? Math.min(1, (now - startAt) / duration) : 1
  displayed.value = from + (to - from) * progress
  if (progress < 1) {
    rafId = requestAnimationFrame(tick)
  } else {
    displayed.value = to
    rafId = 0
  }
}

/** 时长由「变化量 / 总量 / 速度」反推，单次动画不超过 1s */
const animateTo = (target: number) => {
  stopRaf()
  from = displayed.value
  to = target
  const ratio = props.rate > 0 ? Math.abs(to - from) / props.rate : 0
  const speed = props.speed > 0 ? props.speed : 1
  duration = Math.min(1000, Math.max(0, (ratio / speed) * 1000))
  if (duration <= 0) {
    displayed.value = to
    return
  }
  startAt = performance.now()
  rafId = requestAnimationFrame(tick)
}

onMounted(() => animateTo(props.modelValue))
watch(
  () => props.modelValue,
  (value) => animateTo(value),
)
onBeforeUnmount(stopRaf)

/* ---------------- 绘制参数 ---------------- */

/** dasharray 用补间后的显示值算，直接绑 props 就没有过渡 */
const dashArray = computed(() => {
  const ratio = props.rate > 0 ? displayed.value / props.rate : 0
  const dash = Math.min(1, Math.max(0, ratio)) * circumference.value
  return `${dash} ${circumference.value}`
})

const currentColor = computed(() => {
  if (typeof props.color === 'function') return props.color(displayed.value)
  if (Array.isArray(props.color)) return props.color[0] ?? DEFAULT_COLORS[0]
  return props.color || DEFAULT_COLORS[0]
})

const gradientStops = computed<[string, string]>(() => {
  const source = props.linearGradient?.length
    ? props.linearGradient
    : Array.isArray(props.color)
      ? props.color
      : [currentColor.value]
  const start = source[0] ?? DEFAULT_COLORS[0]
  const end = source[1] ?? start
  return [start, end]
})

const progressStroke = computed(() =>
  props.fill === 'gradient' ? `url(#${gradientId})` : currentColor.value,
)

const progressFill = computed(() => {
  if (props.fill === 'gradient') return `url(#${gradientId})`
  if (props.fill === 'solid') return currentColor.value
  return 'none'
})

/** 起点默认在 +x 轴（3 点方向），按 startPosition 旋转 */
const CLOCKWISE_ANGLE = { top: -90, right: 0, bottom: 90, left: 180 } as const
/** 逆时针时先镜像，起点角度要取左右互换后的值 */
const COUNTER_ANGLE = { top: -90, right: 180, bottom: 90, left: 0 } as const

const rotation = computed(() => {
  const angle = (props.clockwise ? CLOCKWISE_ANGLE : COUNTER_ANGLE)[props.startPosition]
  const rotate = `rotate(${angle} 50 50)`
  // 镜像写在最左侧：先旋转再镜像，x' = 100 - x
  return props.clockwise ? rotate : `scale(-1 1) translate(-100 0) ${rotate}`
})

const rootStyle = computed(() => ({ width: toUnit(props.size), height: toUnit(props.size) }))
/** 文字容器不能超过内孔：内孔直径 = 100 - strokeWidth（视图盒百分比），再留一点余量 */
const textStyle = computed(() => ({ width: `${Math.max(30, 100 - props.strokeWidth)}%` }))
const rounded = computed(() => Math.round(displayed.value))
</script>

<template>
  <div
    class="je-circle"
    :style="rootStyle"
    role="progressbar"
    aria-valuemin="0"
    :aria-valuemax="rate"
    :aria-valuenow="rounded"
  >
    <svg class="je-circle__svg" viewBox="0 0 100 100">
      <defs v-if="fill === 'gradient'">
        <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop :stop-color="gradientStops[0]" offset="0%" />
          <stop :stop-color="gradientStops[1]" offset="100%" />
        </linearGradient>
      </defs>

      <circle
        class="je-circle__track"
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke="layerColor"
        :stroke-width="strokeUnits"
        :stroke-linecap="strokeLinecap"
        :transform="rotation"
      />
      <circle
        class="je-circle__meter"
        cx="50"
        cy="50"
        :r="radius"
        :fill="progressFill"
        :stroke="progressStroke"
        :stroke-width="strokeUnits"
        :stroke-linecap="strokeLinecap"
        :stroke-dasharray="dashArray"
        :transform="rotation"
      />
    </svg>

    <div v-if="text || $slots.default" class="je-circle__text" :style="textStyle">
      <slot>{{ text }}</slot>
    </div>
  </div>
</template>

<style scoped>
.je-circle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  color: var(--je-text);
}

.je-circle__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.je-circle__track,
.je-circle__meter {
  transition: stroke var(--je-duration) ease;
}

.je-circle__text {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 14px;
  line-height: 1.3;
  color: var(--je-text-muted);
  text-align: center;
  transform: translate(-50%, -50%);
}

@media (max-width: 768px) {
  .je-circle__text {
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-circle__track,
  .je-circle__meter {
    transition: none;
  }
}
</style>