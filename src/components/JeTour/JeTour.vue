<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { nextZIndex } from '../../core/useZIndex'
import { JeButton } from '../JeButton'
import type { JeTourStep } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeTour' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    steps: JeTourStep[]
    current?: number
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    current: 0,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:current': [value: number]
  change: [current: number]
  finish: []
}>()

const uid = useId()
const targetRef = ref<HTMLElement | null>(null)
const bubbleRef = ref<HTMLElement | null>(null)
const isOpen = ref(props.modelValue)
const index = ref(props.current)
const zIndex = ref(nextZIndex())

const isMobile = useIsMobile()

/** 高亮框跟随的目标矩形（视口坐标） */
const rect = ref({ top: 0, left: 0, width: 0, height: 0 })

const total = computed(() => props.steps.length)
const step = computed(() => props.steps[index.value])
/** 目标元素找不到时的居中兜底 */
const centered = computed(() => !targetRef.value)

const { x, y, update } = useFloating({
  reference: targetRef,
  floating: bubbleRef,
  open: isOpen,
  placement: () => step.value?.placement ?? 'bottom',
  offset: 14,
})

const updateRect = () => {
  const el = targetRef.value
  if (!el) {
    rect.value = { top: 0, left: 0, width: 0, height: 0 }
    return
  }
  const box = el.getBoundingClientRect()
  rect.value = { top: box.top, left: box.left, width: box.width, height: box.height }
}

/** 按选择器找目标元素，然后同步高亮框与气泡位置 */
const syncTarget = async () => {
  const selector = step.value?.target
  targetRef.value = selector ? document.querySelector<HTMLElement>(selector) : null
  await nextTick()
  updateRect()
  update()
}

const wrapStyle = computed(() => ({ zIndex: zIndex.value }))

// 没有目标时让 .is-centered 的全屏遮罩生效，所以不挂内联矩形
const highlightStyle = computed(() =>
  centered.value
    ? undefined
    : {
        top: `${rect.value.top}px`,
        left: `${rect.value.left}px`,
        width: `${rect.value.width}px`,
        height: `${rect.value.height}px`,
      },
)

// 窄屏气泡贴底，不挂内联坐标；居中兜底同理
const bubbleStyle = computed(() => {
  if (isMobile.value || centered.value) return undefined
  return { left: `${x.value}px`, top: `${y.value}px` }
})

const setCurrent = (next: number) => {
  const clamped = Math.max(0, Math.min(next, total.value - 1))
  if (clamped === index.value) return
  index.value = clamped
  emit('update:current', clamped)
  emit('change', clamped)
}

const prev = () => setCurrent(index.value - 1)

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
  emit('update:modelValue', false)
}

const next = () => {
  if (index.value >= total.value - 1) {
    close()
    emit('finish')
    return
  }
  setCurrent(index.value + 1)
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isOpen.value) return
  event.stopPropagation()
  close()
}

watch(
  [isOpen, index],
  ([open]) => {
    if (!open) return
    void syncTarget()
  },
  { immediate: true },
)

watch(isOpen, async (value) => {
  if (value) {
    zIndex.value = nextZIndex()
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    bubbleRef.value?.focus()
  } else {
    document.removeEventListener('keydown', onKeydown)
    targetRef.value = null
  }
})

watch(
  () => props.modelValue,
  (value) => {
    if (value !== isOpen.value) isOpen.value = value
  },
)

watch(
  () => props.current,
  (value) => {
    if (value !== index.value) index.value = value
  },
)

onMounted(() => {
  window.addEventListener('resize', updateRect)
  // 捕获阶段才能跟住任意滚动容器
  window.addEventListener('scroll', updateRect, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateRect)
  window.removeEventListener('scroll', updateRect, true)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      class="je-tour"
      :class="{ 'is-open': isOpen }"
      :style="wrapStyle"
      :aria-hidden="!isOpen"
    >
      <div
        class="je-tour__hole"
        :class="{ 'is-centered': centered }"
        :style="highlightStyle"
        aria-hidden="true"
      />

      <div
        ref="bubbleRef"
        class="je-tour__bubble"
        :class="{ 'is-centered': centered }"
        :style="bubbleStyle"
        role="dialog"
        :aria-labelledby="step?.title ? `${uid}-title` : undefined"
        tabindex="-1"
      >
        <div class="je-tour__card">
          <p v-if="step?.title" :id="`${uid}-title`" class="je-tour__title">
            {{ step.title }}
          </p>
          <p v-if="step?.description" class="je-tour__desc">{{ step.description }}</p>

          <div class="je-tour__footer">
            <span class="je-tour__progress">{{ index + 1 }} / {{ total }}</span>
            <div class="je-tour__actions">
              <JeButton variant="ghost" :disabled="index === 0" @click="prev">上一步</JeButton>
              <JeButton @click="next">{{ index >= total - 1 ? '完成' : '下一步' }}</JeButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.je-tour {
  position: fixed;
  inset: 0;
  /* 遮罩与气泡都不吃事件，页面仍可滚动查看目标 */
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.24s ease, visibility 0s linear 0.24s;
}

.je-tour.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.24s ease;
}

/* 挖洞：高亮框本身透明，用超大 box-shadow 铺满四周形成遮罩 */
.je-tour__hole {
  position: fixed;
  border-radius: var(--je-radius-sm);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
}

/* 目标缺失时退化成整屏遮罩 */
.je-tour__hole.is-centered {
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 0;
  box-shadow: none;
}

.je-tour__bubble {
  position: fixed;
  pointer-events: auto;
  outline: none;
}

.je-tour__bubble.is-centered {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.je-tour__card {
  box-sizing: border-box;
  width: 300px;
  max-width: calc(100vw - 24px);
  padding: 16px 18px;
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: var(--je-border);
  border-radius: var(--je-radius-lg);
  box-shadow: var(--je-shadow-popup);
  transform: scale(0.94);
  transition: transform 0.32s var(--je-ease-out-back);
}

.je-tour.is-open .je-tour__card {
  transform: scale(1);
}

.je-tour__title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
}

.je-tour__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-muted);
}

.je-tour__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.je-tour__progress {
  font-size: 12px;
  color: var(--je-text-faint);
  white-space: nowrap;
}

.je-tour__actions {
  display: flex;
  gap: 8px;
}

/* 气泡里空间有限，按钮收窄一档 */
.je-tour__actions :deep(.je-button) {
  padding: 9px 16px;
  font-size: 13px;
  border-radius: var(--je-radius-sm);
}

/* 窄屏：气泡横向铺满、垂直居中（之前是贴底，移动端就拿不到纵向居中了），按钮热区不小于 44px */
@media (max-width: 768px) {
  .je-tour__bubble,
  .je-tour__bubble.is-centered {
    top: 50%;
    right: 12px;
    bottom: auto;
    left: 12px;
    transform: translateY(-50%);
  }

  .je-tour__card {
    width: 100%;
    max-width: none;
    padding: 16px 18px;
  }

  .je-tour__actions :deep(.je-button) {
    flex: 1;
    min-height: 44px;
    padding: 12px 18px;
    font-size: 15px;
  }
}

/*
 * 减弱动效时全部瞬切。
 * 必须把 .is-open 状态类也列进来：它的选择器特异性比单个基础类高，
 * 只写基础类的话状态规则里的 transition 会反压回来，减弱动效实际不生效。
 */
@media (prefers-reduced-motion: reduce) {
  .je-tour,
  .je-tour__card,
  .je-tour.is-open {
    transition: none;
  }
}
</style>
