<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import { useSpring } from '../../core/useSpring'
import { jePresets } from '../../core/presets'

defineOptions({ name: 'JePullRefresh' })

const props = withDefaults(
  defineProps<{
    /** 是否处于加载中，刷新完成后由调用方置回 false */
    modelValue?: boolean
    /** 禁用下拉手势 */
    disabled?: boolean
    /** 触发刷新需要的下拉距离 */
    headHeight?: number
    /** 刷新成功后提示的停留时长（毫秒） */
    successDuration?: number
    /** 下拉中提示 */
    pullingText?: string
    /** 达到阈值、可松手时的提示 */
    loosingText?: string
    /** 加载中提示 */
    loadingText?: string
    /** 刷新成功提示 */
    successText?: string
  }>(),
  {
    modelValue: false,
    disabled: false,
    headHeight: 50,
    successDuration: 500,
    pullingText: '下拉即可刷新',
    loosingText: '释放立即刷新',
    loadingText: '加载中...',
    successText: '刷新成功',
  },
)

const emit = defineEmits<{
  'update:modelValue': [loading: boolean]
  /** 下拉距离达到阈值并松手 */
  refresh: []
}>()

type PullStatus = 'normal' | 'pulling' | 'loosing' | 'loading' | 'success'

const rootRef = ref<HTMLElement | null>(null)
const status = ref<PullStatus>('normal')

const spring = useSpring(0, jePresets.release)
const distance = spring.value

/** 手指 / 鼠标下的位移，超过阈值后阻力递增 */
const damp = (delta: number) => {
  const base = delta * 0.5
  const max = props.headHeight * 1.5
  return base <= max ? base : max + (base - max) * 0.3
}

/** 只有最近的可滚动祖先（缺省为文档）已经到顶，才允许下拉 */
const isAtTop = (el: HTMLElement | null) => {
  let node = el?.parentElement ?? null
  while (node) {
    const overflowY = getComputedStyle(node).overflowY
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node.scrollTop <= 0
    }
    node = node.parentElement
  }
  return (document.scrollingElement?.scrollTop ?? 0) <= 0
}

let startY = 0
let active = false
let successTimer = 0
let settleTimer = 0

const begin = (y: number) => {
  if (props.disabled || props.modelValue || active || !isAtTop(rootRef.value)) return
  startY = y
  active = true
}

const update = (y: number) => {
  if (!active) return
  const delta = y - startY
  if (delta <= 0) {
    // 反向滑动：把这次下拉交还给原生滚动
    if (distance.value === 0) {
      active = false
      status.value = 'normal'
    }
    return
  }
  const value = damp(delta)
  spring.jump(value)
  status.value = value >= props.headHeight ? 'loosing' : 'pulling'
}

const finish = () => {
  if (!active) return
  active = false
  if (distance.value >= props.headHeight) {
    spring.set(props.headHeight, jePresets.settle)
    status.value = 'loading'
    emit('update:modelValue', true)
    emit('refresh')
  } else {
    spring.set(0, jePresets.release)
    status.value = 'normal'
  }
}

/* 触摸与鼠标各挂一套：只有触摸需要 preventDefault 拦住原生 overscroll */
const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (touch) begin(touch.clientY)
}

const onTouchMove = (event: TouchEvent) => {
  if (!active) return
  const touch = event.touches[0]
  if (!touch) return
  if (touch.clientY - startY > 0) event.preventDefault()
  update(touch.clientY)
}

const onMouseDown = (event: MouseEvent) => begin(event.clientY)
const onMouseMove = (event: MouseEvent) => update(event.clientY)

const addListeners = () => {
  const el = rootRef.value
  if (!el) return
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', finish)
  el.addEventListener('touchcancel', finish)
  el.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', finish)
}

const removeListeners = () => {
  const el = rootRef.value
  if (el) {
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', finish)
    el.removeEventListener('touchcancel', finish)
    el.removeEventListener('mousedown', onMouseDown)
  }
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', finish)
}

onMounted(addListeners)
onBeforeUnmount(() => {
  removeListeners()
  window.clearTimeout(successTimer)
  window.clearTimeout(settleTimer)
})

/* 加载中由调用方通过 v-model 控制收起时机 */
watch(
  () => props.modelValue,
  (loading, previous) => {
    window.clearTimeout(successTimer)
    window.clearTimeout(settleTimer)
    if (loading) {
      spring.set(props.headHeight, jePresets.settle)
      status.value = 'loading'
    } else if (previous) {
      status.value = 'success'
      successTimer = window.setTimeout(() => {
        spring.set(0, jePresets.release)
        settleTimer = window.setTimeout(() => {
          status.value = 'normal'
        }, 300)
      }, props.successDuration)
    }
  },
)

const trackStyle = computed(() => ({ transform: `translate3d(0, ${distance.value}px, 0)` }))
const headStyle = computed(() => ({ height: `${props.headHeight}px` }))

const headText = computed(() => {
  switch (status.value) {
    case 'pulling':
      return props.pullingText
    case 'loosing':
      return props.loosingText
    case 'loading':
      return props.loadingText
    case 'success':
      return props.successText
    default:
      return ''
  }
})
</script>

<template>
  <div ref="rootRef" class="je-pull-refresh">
    <div class="je-pull-refresh__track" :style="trackStyle">
      <div class="je-pull-refresh__head" :style="headStyle">
        <slot :name="status" :distance="distance">
          <JeIcon
            v-if="status === 'loading'"
            class="je-pull-refresh__spinner"
            name="loading"
            spin
            :size="18"
          />
          <span class="je-pull-refresh__text">{{ headText }}</span>
        </slot>
      </div>

      <div class="je-pull-refresh__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.je-pull-refresh {
  position: relative;
  overflow: hidden;
  font-family: inherit;
  /* 不设 touch-action：内部滚动交给原生，下拉方向靠 touchmove 的 preventDefault 拦截 */
}

.je-pull-refresh__head {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  font-size: 13px;
  color: var(--je-text-muted);
  /* 默认藏在内容区上方，轨道下移时滑入视野 */
  transform: translate3d(0, -100%, 0);
}

.je-pull-refresh__text {
  white-space: nowrap;
}

.je-pull-refresh__spinner {
  color: var(--je-primary);
}
</style>
