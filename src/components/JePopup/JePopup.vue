<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useFocusTrap } from '../../core/useFocusTrap'
import { useScrollLock } from '../../core/useScrollLock'
import { nextZIndex } from '../../core/useZIndex'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeIconName } from '../JeIcon/icons'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JePopup' })

const props = withDefaults(
  defineProps<{
    /** 显示 / 隐藏 */
    modelValue?: boolean
    /** 弹出位置 */
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
    /** 圆角（按位置自动决定哪几条边） */
    round?: boolean
    /** 右上角等位置的关闭按钮 */
    closeable?: boolean
    /** 关闭按钮图标 */
    closeIcon?: JeIconName
    /** 关闭按钮位置 */
    closeIconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    /** 是否显示遮罩 */
    overlay?: boolean
    /** 点击遮罩关闭 */
    closeOnClickOverlay?: boolean
    /** 打开时锁定页面滚动 */
    lockScroll?: boolean
    /** 底部预留安全区 */
    safeAreaInsetBottom?: boolean
    /** 顶部预留安全区 */
    safeAreaInsetTop?: boolean
    /** 展开 / 收起的过渡时长，单位毫秒，同时用于 opened / closed 事件时机 */
    duration?: number
    /** 指定层级，不传则自动取全局递增层级 */
    zIndex?: number
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    position: 'center',
    round: false,
    closeable: false,
    closeIcon: 'close',
    closeIconPosition: 'top-right',
    overlay: true,
    closeOnClickOverlay: true,
    lockScroll: true,
    safeAreaInsetBottom: false,
    safeAreaInsetTop: false,
    duration: 300,
    zIndex: undefined,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 开始展开 */
  open: []
  /** 展开动画结束 */
  opened: []
  /** 开始收起 */
  close: []
  /** 收起动画结束 */
  closed: []
  /** 点击遮罩 */
  clickOverlay: []
}>()

const contentRef = ref<HTMLElement | null>(null)
const innerZIndex = ref(nextZIndex())

const locked = computed(() => props.modelValue && props.lockScroll)
useScrollLock(locked)
useFocusTrap(contentRef, computed(() => props.modelValue))

const rootStyle = computed(() => ({
  zIndex: props.zIndex ?? innerZIndex.value,
  '--je-popup-duration': `${props.duration}ms`,
  '--je-popup-safe-top': props.safeAreaInsetTop ? 'env(safe-area-inset-top, 0px)' : '0px',
  '--je-popup-safe-bottom': props.safeAreaInsetBottom ? 'env(safe-area-inset-bottom, 0px)' : '0px',
}))

let timer = 0

watch(
  () => props.modelValue,
  (open) => {
    window.clearTimeout(timer)
    if (open) {
      // 每次打开都重新取层级，保证后开的浮层压在上面
      innerZIndex.value = nextZIndex()
      emit('open')
      timer = window.setTimeout(() => emit('opened'), props.duration)
    } else {
      emit('close')
      timer = window.setTimeout(() => emit('closed'), props.duration)
    }
  },
)

onBeforeUnmount(() => window.clearTimeout(timer))

const close = () => {
  if (!props.modelValue) return
  emit('update:modelValue', false)
}

const onOverlayClick = () => {
  emit('clickOverlay')
  if (props.closeOnClickOverlay) close()
}
</script>

<template>
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      class="je-popup"
      :class="[
        `je-popup--${position}`,
        { 'is-open': modelValue, 'is-round': round, 'has-overlay': overlay },
      ]"
      :style="rootStyle"
    >
      <div v-if="overlay" class="je-popup__overlay" aria-hidden="true" @click="onOverlayClick" />

      <div
        ref="contentRef"
        class="je-popup__content"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-hidden="!modelValue"
      >
        <slot />

        <button
          v-if="closeable"
          type="button"
          class="je-popup__close"
          :class="`je-popup__close--${closeIconPosition}`"
          aria-label="关闭"
          @click="close"
        >
          <JeIcon :name="closeIcon" :size="16" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.je-popup {
  position: fixed;
  inset: 0;
  /* 容器铺满视口且常驻 DOM：默认放行点击，只有展开时由子元素各自接管 */
  pointer-events: none;
  --je-popup-duration: 300ms;
}

.je-popup__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--je-popup-duration) ease,
    visibility 0s linear var(--je-popup-duration);
}

.je-popup.is-open .je-popup__overlay {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity var(--je-popup-duration) ease;
}

.je-popup__content {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: 100%;
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: var(--je-border);
  box-shadow: var(--je-shadow-popup);
  outline: none;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity;
  transition: transform var(--je-popup-duration) ease-in,
    opacity calc(var(--je-popup-duration) * 0.7) ease-in,
    visibility 0s linear var(--je-popup-duration);
}

.je-popup.is-open .je-popup__content {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: translate(0, 0) scale(1);
  transition: transform var(--je-popup-duration) var(--je-ease-out-back),
    opacity calc(var(--je-popup-duration) * 0.8) ease-out;
}

.je-popup.is-round .je-popup__content {
  border-radius: var(--je-radius-lg);
}

/* 居中 */
.je-popup--center .je-popup__content {
  top: 50%;
  left: 50%;
  width: min(92vw, 480px);
  transform: translate(-50%, -50%) scale(0.86);
}

.je-popup--center.is-open .je-popup__content {
  transform: translate(-50%, -50%) scale(1);
}

/* 顶部滑入 */
.je-popup--top .je-popup__content {
  top: 0;
  right: 0;
  left: 0;
  padding-top: var(--je-popup-safe-top);
  transform: translateY(-100%);
}

.je-popup--top.is-open .je-popup__content {
  transform: translateY(0);
}

/* 底部滑入 */
.je-popup--bottom .je-popup__content {
  right: 0;
  bottom: 0;
  left: 0;
  padding-bottom: var(--je-popup-safe-bottom);
  transform: translateY(100%);
}

.je-popup--bottom.is-open .je-popup__content {
  transform: translateY(0);
}

/* 左侧滑入 */
.je-popup--left .je-popup__content {
  top: 0;
  bottom: 0;
  left: 0;
  width: min(86vw, 420px);
  transform: translateX(-100%);
}

.je-popup--left.is-open .je-popup__content {
  transform: translateX(0);
}

/* 右侧滑入 */
.je-popup--right .je-popup__content {
  top: 0;
  right: 0;
  bottom: 0;
  width: min(86vw, 420px);
  transform: translateX(100%);
}

.je-popup--right.is-open .je-popup__content {
  transform: translateX(0);
}

.je-popup__close {
  position: absolute;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--je-text-muted);
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 50%;
  outline: none;
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

.je-popup__close:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-popup__close:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-popup__close--top-left {
  top: 8px;
  left: 8px;
}

.je-popup__close--top-right {
  top: 8px;
  right: 8px;
}

.je-popup__close--bottom-left {
  bottom: 8px;
  left: 8px;
}

.je-popup__close--bottom-right {
  right: 8px;
  bottom: 8px;
}

@media (max-width: 768px) {
  .je-popup__close {
    width: 40px;
    height: 40px;
  }
}

/*
 * 减弱动效时全部瞬切。
 * 必须把 .is-open 状态类以及各个方向修饰符一起列进来：它们的选择器特异性
 * 比单个基础类高，只写基础类的话状态规则里的 transition 会反压回来，
 * 减弱动效实际不生效。
 */
@media (prefers-reduced-motion: reduce) {
  .je-popup__overlay,
  .je-popup__content,
  .je-popup.is-open .je-popup__overlay,
  .je-popup.is-open .je-popup__content,
  .je-popup--center .je-popup__content,
  .je-popup--center.is-open .je-popup__content,
  .je-popup--top .je-popup__content,
  .je-popup--top.is-open .je-popup__content,
  .je-popup--bottom .je-popup__content,
  .je-popup--bottom.is-open .je-popup__content,
  .je-popup--left .je-popup__content,
  .je-popup--left.is-open .je-popup__content,
  .je-popup--right .je-popup__content,
  .je-popup--right.is-open .je-popup__content {
    transition: none;
  }
}
</style>
