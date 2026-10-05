<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'
import { JeIcon, type JeIconName } from '../JeIcon'
import type { JeMessageType } from './types'

defineOptions({ name: 'JeMessage' })

const props = withDefaults(
  defineProps<{
    /** 是否显示，配 v-model 使用 */
    modelValue?: boolean
    type?: JeMessageType
    message?: string
    /** 自动关闭延迟（毫秒），0 表示不自动关闭 */
    duration?: number
    showClose?: boolean
    /** 距视口顶部的偏移（px） */
    offset?: number
    /** 内部使用：命令式容器里由父级统一布局，关闭自身 Teleport 与自定位（旧写法，请优先用 teleportTo） */
    teleport?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    type: 'info',
    message: '',
    duration: 3000,
    showClose: false,
    offset: 20,
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

/** 语义图标名与 type 一一对应（success / info / warning / error 均已在图标集中） */
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

/** 组件式独立使用时自带顶部偏移；命令式容器内偏移由容器负责 */
const layerStyle = computed(() =>
  props.teleport ? { top: `calc(${props.offset}px + env(safe-area-inset-top))` } : undefined,
)
</script>

<template>
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      class="je-message__layer"
      :class="{ 'is-visible': modelValue, 'is-standalone': teleport }"
      :style="layerStyle"
    >
      <div
        class="je-message"
        :class="`je-message--${type}`"
        role="alert"
        aria-live="assertive"
      >
        <span class="je-message__icon" aria-hidden="true">
          <JeIcon :name="iconName" :size="18" />
        </span>
        <span class="je-message__text"><slot>{{ message }}</slot></span>
        <button
          v-if="showClose"
          type="button"
          class="je-message__close"
          aria-label="关闭"
          @click="close"
        >
          <JeIcon name="close" :size="14" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.je-message__layer {
  box-sizing: border-box;
  width: 100%;
  max-width: calc(100vw - 32px);
  pointer-events: none;
  will-change: transform, opacity;
  opacity: 0;
  transform: translateY(-16px) scale(0.94);
  transition: opacity 0.26s ease, transform 0.34s var(--je-ease-out-back);
}

.je-message__layer.is-visible {
  pointer-events: auto;
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 组件式独立使用时自定位到顶部居中；命令式容器内由容器统一布局 */
.je-message__layer.is-standalone {
  position: fixed;
  left: 50%;
  z-index: 3000;
  width: 380px;
  transform: translateX(-50%) translateY(-16px) scale(0.94);
}

.je-message__layer.is-standalone.is-visible {
  transform: translateX(-50%) translateY(0) scale(1);
}

/* 命令式堆叠的进出场由容器里的 TransitionGroup 驱动（类名加在本层根元素上） */
.je-message__layer.je-msg-enter-from,
.je-message__layer.je-msg-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.94);
}

.je-message__layer.je-msg-enter-active,
.je-message__layer.je-msg-leave-active {
  transition: opacity 0.26s ease, transform 0.34s var(--je-ease-out-back);
}

.je-msg-move {
  transition: transform 0.34s var(--je-ease-out-back);
}

.je-message {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
}

/* 语义色左色条：颜色取类型变体注入的局部变量，不新增全局 token */
.je-message::before {
  content: '';
  position: absolute;
  top: 1px;
  bottom: 1px;
  left: 1px;
  width: 3px;
  background: var(--je-message-accent, var(--je-info));
  border-radius: var(--je-radius) 0 0 var(--je-radius);
}

.je-message--success {
  --je-message-accent: var(--je-success);
}

.je-message--info {
  --je-message-accent: var(--je-info);
}

.je-message--warning {
  --je-message-accent: var(--je-warning);
}

.je-message--error {
  --je-message-accent: var(--je-danger);
}

.je-message__icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--je-message-accent, var(--je-info));
}

.je-message__text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.je-message__close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: -4px;
  color: var(--je-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.je-message__close:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-message__close:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 窄屏：通栏显示，关闭热区撑到 44px */
@media (max-width: 768px) {
  .je-message__close {
    width: 44px;
    height: 44px;
    margin: -10px -10px -10px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-message__layer,
  .je-message__layer.je-msg-enter-active,
  .je-message__layer.je-msg-leave-active,
  .je-msg-move {
    transition: none;
  }
}
</style>
