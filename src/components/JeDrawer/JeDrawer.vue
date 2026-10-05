<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFocusTrap } from '../../core/useFocusTrap'
import { useScrollLock } from '../../core/useScrollLock'
import { nextZIndex } from '../../core/useZIndex'
import { JeIcon } from '../JeIcon'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeDrawer' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    /** 面板滑入方向：rtl 右 / ltr 左 / ttb 上 / btt 下 */
    direction?: 'rtl' | 'ltr' | 'ttb' | 'btt'
    /** 数字按 px 处理，字符串原样使用；窄屏 rtl/ltr 自动改为 86vw */
    size?: string | number
    /** 右上角关闭按钮 */
    showClose?: boolean
    /** 点击遮罩关闭 */
    closeOnClickModal?: boolean
    /** 按 Esc 关闭 */
    closeOnEscape?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    title: '',
    direction: 'rtl',
    size: 320,
    showClose: true,
    closeOnClickModal: true,
    closeOnEscape: true,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)
const zIndex = ref(nextZIndex())

const locked = computed(() => props.modelValue)
useScrollLock(locked)
useFocusTrap(panelRef, locked)

const panelStyle = computed(() => ({
  zIndex: zIndex.value,
  '--je-drawer-size': typeof props.size === 'number' ? `${props.size}px` : props.size,
}))

const close = () => {
  if (!props.modelValue) return
  emit('update:modelValue', false)
  emit('close')
}

const onScrimClick = () => {
  if (props.closeOnClickModal) close()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !props.closeOnEscape) return
  event.stopPropagation()
  close()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      zIndex.value = nextZIndex()
      emit('open')
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)
</script>

<template>
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div class="je-drawer" :class="[`je-drawer--${direction}`, { 'is-open': modelValue }]">
      <div class="je-drawer__scrim" aria-hidden="true" @click="onScrimClick" />

      <aside
        ref="panelRef"
        class="je-drawer__panel"
        :style="panelStyle"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-label="title || undefined"
        :aria-hidden="!modelValue"
      >
        <header v-if="title || showClose || $slots.header" class="je-drawer__header">
          <slot name="header">
            <h2 class="je-drawer__title">{{ title }}</h2>
          </slot>
          <button
            v-if="showClose"
            type="button"
            class="je-drawer__close"
            aria-label="关闭"
            @click="close"
          >
            <JeIcon name="close" :size="18" />
          </button>
        </header>

        <div class="je-drawer__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="je-drawer__footer">
          <slot name="footer" />
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.je-drawer {
  position: fixed;
  inset: 0;
  z-index: 2000;
  /* 容器常驻 DOM 且铺满视口，收起时必须放行点击，否则会盖死整页 */
  pointer-events: none;
}

.je-drawer.is-open {
  pointer-events: auto;
}

.je-drawer__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-drawer.is-open .je-drawer__scrim {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-drawer__panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
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
  padding-bottom: env(safe-area-inset-bottom);
  /* 收起后必须屏蔽点击，否则过渡期间面板是「隐形可点」的 */
  pointer-events: none;
  will-change: transform, opacity;
  opacity: 0;
  visibility: hidden;
  transition: transform 0.3s ease-in, opacity 0.22s ease-in, visibility 0s linear 0.3s;
}

/* 展开：回弹过渡 + visibility 立即生效 */
.je-drawer.is-open .je-drawer__panel {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: translate(0, 0);
  transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
}

/* 从左侧滑入 */
.je-drawer--ltr .je-drawer__panel {
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--je-drawer-size);
  border-radius: 0 var(--je-radius-lg) var(--je-radius-lg) 0;
  transform: translateX(-100%);
}

/* 从右侧滑入（默认） */
.je-drawer--rtl .je-drawer__panel {
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--je-drawer-size);
  border-radius: var(--je-radius-lg) 0 0 var(--je-radius-lg);
  transform: translateX(100%);
}

/* 从顶部滑入 */
.je-drawer--ttb .je-drawer__panel {
  top: 0;
  right: 0;
  left: 0;
  height: var(--je-drawer-size);
  border-radius: 0 0 var(--je-radius-lg) var(--je-radius-lg);
  border-top: none;
  transform: translateY(-100%);
}

/* 从底部滑入 */
.je-drawer--btt .je-drawer__panel {
  right: 0;
  bottom: 0;
  left: 0;
  height: var(--je-drawer-size);
  border-radius: var(--je-radius-lg) var(--je-radius-lg) 0 0;
  border-bottom: none;
  transform: translateY(100%);
}

.je-drawer__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 12px;
}

.je-drawer__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.je-drawer__close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--je-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  outline: none;
  transition: color 0.2s ease, background 0.2s ease;
}

.je-drawer__close:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-drawer__close:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 内容区可滚动；这里不能设 touch-action，否则触屏滑不动内容 */
.je-drawer__body {
  flex: 1;
  overflow: auto;
  padding: 4px 22px 22px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--je-text-muted);
  -webkit-overflow-scrolling: touch;
}

.je-drawer__footer {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 22px 22px;
}

/* 窄屏：左右抽屉收窄到 86vw，避免整屏盖死；触控热区不小于 44px */
@media (max-width: 768px) {
  .je-drawer--rtl .je-drawer__panel,
  .je-drawer--ltr .je-drawer__panel {
    width: 86vw;
  }

  .je-drawer__header {
    padding-top: 22px;
  }

  .je-drawer__close {
    width: 44px;
    height: 44px;
  }
}

/*
 * 减弱动效时全部瞬切。
 * 必须把 .is-open 状态类也列进来：它的选择器特异性比单个基础类高，
 * 只写基础类的话状态规则里的 transition 会反压回来，减弱动效实际不生效。
 */
@media (prefers-reduced-motion: reduce) {
  .je-drawer__scrim,
  .je-drawer__panel,
  .je-drawer.is-open .je-drawer__scrim,
  .je-drawer.is-open .je-drawer__panel {
    transition: none;
  }
}
</style>
