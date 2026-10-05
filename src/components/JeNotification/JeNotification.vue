<script setup lang="ts">
import { computed, onBeforeUnmount, watch, type CSSProperties } from 'vue'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { JeIcon, type JeIconName } from '../JeIcon'
import { useIsMobile } from '../../core/useMediaQuery'
import { useTeleportTarget } from '../JeConfigProvider/types'
import type { JeNotificationPosition, JeNotificationType } from './types'

defineOptions({ name: 'JeNotification' })

const props = withDefaults(
  defineProps<{
    /** 是否显示，配 v-model 使用 */
    modelValue?: boolean
    title?: string
    message?: string
    type?: JeNotificationType
    /** 自动关闭延迟（毫秒），0 表示不自动关闭 */
    duration?: number
    position?: JeNotificationPosition
    showClose?: boolean
    /** 内部使用：命令式容器里由父级统一布局，关闭自身 Teleport 与自定位（旧写法，请优先用 teleportTo） */
    teleport?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    title: '',
    message: '',
    type: 'info',
    duration: 4500,
    position: 'top-right',
    showClose: true,
    teleport: true,
    teleportTo: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

/**
 * 浮层挂载点。teleportTo 优先；旧的 teleport=false 仍表示就地渲染。
 * 两者都没给时跟随 ConfigProvider / configureJelly，最终落到 body。
 */
const teleportTarget = useTeleportTarget(() =>
  props.teleportTo ?? (props.teleport === false ? false : undefined),
)

const isMobile = useIsMobile()

/** 语义图标名与 type 一一对应 */
const iconName = computed<JeIconName>(() => props.type)

let timer: ReturnType<typeof setTimeout> | null = null

/** 组件卸载 / 手动关闭 / 重新显示时都要清掉旧定时器，避免重复关闭与泄漏 */
const clearTimer = () => {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

const close = () => {
  clearTimer()
  if (!props.modelValue) return
  emit('update:modelValue', false)
  emit('close')
}

watch(
  () => props.modelValue,
  (visible) => {
    clearTimer()
    if (visible && props.duration > 0) {
      timer = setTimeout(close, props.duration)
    }
  },
  { immediate: true },
)

onBeforeUnmount(clearTimer)

/** 组件式独立使用时的四角定位；窄屏统一改为顶部通栏 */
const layerStyle = computed<CSSProperties | undefined>(() => {
  if (!props.teleport) return undefined

  if (isMobile.value) {
    return {
      position: 'fixed',
      top: 'calc(16px + env(safe-area-inset-top))',
      left: '12px',
      right: '12px',
      width: 'auto',
      zIndex: 3000,
    }
  }

  const top = 'calc(20px + env(safe-area-inset-top))'
  const bottom = 'calc(20px + env(safe-area-inset-bottom))'
  const map: Record<JeNotificationPosition, CSSProperties> = {
    'top-right': { position: 'fixed', top, right: '20px', width: '360px', zIndex: 3000 },
    'top-left': { position: 'fixed', top, left: '20px', width: '360px', zIndex: 3000 },
    'bottom-right': { position: 'fixed', bottom, right: '20px', width: '360px', zIndex: 3000 },
    'bottom-left': { position: 'fixed', bottom, left: '20px', width: '360px', zIndex: 3000 },
  }
  return map[props.position]
})
</script>

<template>
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      class="je-notification__layer"
      :class="{ 'is-visible': modelValue }"
      :style="layerStyle"
    >
      <div
        class="je-notification"
        :class="`je-notification--${type}`"
        role="alert"
        aria-live="assertive"
      >
        <span class="je-notification__icon" aria-hidden="true">
          <JeIcon :name="iconName" :size="20" />
        </span>

        <div class="je-notification__body">
          <p v-if="title" class="je-notification__title">{{ title }}</p>
          <p class="je-notification__text"><slot>{{ message }}</slot></p>
        </div>

        <button
          v-if="showClose"
          type="button"
          class="je-notification__close"
          aria-label="关闭"
          @click="close"
        >
          <JeIcon name="close" :size="15" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.je-notification__layer {
  box-sizing: border-box;
  width: 100%;
  max-width: calc(100vw - 24px);
  pointer-events: none;
  will-change: transform, opacity;
  opacity: 0;
  transform: scale(0.94);
  transition: opacity 0.26s ease, transform 0.32s var(--je-ease-out-back);
}

.je-notification__layer.is-visible {
  pointer-events: auto;
  opacity: 1;
  transform: scale(1);
}

/* 命令式堆叠的进出场由容器里的 TransitionGroup 驱动（类名加在本层根元素上） */
.je-notification__layer.je-notify-enter-from,
.je-notification__layer.je-notify-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

.je-notification__layer.je-notify-enter-active,
.je-notification__layer.je-notify-leave-active {
  transition: opacity 0.26s ease, transform 0.32s var(--je-ease-out-back);
}

.je-notify-move {
  transition: transform 0.32s var(--je-ease-out-back);
}

.je-notification {
  position: relative;
  box-sizing: border-box;
  display: flex;
  gap: 12px;
  width: 100%;
  padding: 16px;
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius-lg);
  box-shadow: var(--je-shadow-popup);
}

.je-notification--success {
  --je-notification-accent: var(--je-success);
}

.je-notification--info {
  --je-notification-accent: var(--je-info);
}

.je-notification--warning {
  --je-notification-accent: var(--je-warning);
}

.je-notification--error {
  --je-notification-accent: var(--je-danger);
}

.je-notification__icon {
  display: inline-flex;
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--je-notification-accent, var(--je-info));
}

.je-notification__body {
  flex: 1;
  min-width: 0;
}

.je-notification__title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  word-break: break-word;
}

.je-notification__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--je-text-muted);
  word-break: break-word;
}

.je-notification__close {
  display: inline-flex;
  flex-shrink: 0;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: -4px -4px 0 0;
  color: var(--je-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.je-notification__close:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-notification__close:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 窄屏：卡片通栏，关闭热区撑到 44px */
@media (max-width: 768px) {
  .je-notification__close {
    width: 44px;
    height: 44px;
    margin: -12px -12px 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-notification__layer,
  .je-notification__layer.je-notify-enter-active,
  .je-notification__layer.je-notify-leave-active,
  .je-notify-move {
    transition: none;
  }
}
</style>
