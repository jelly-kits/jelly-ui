<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useIsMobile } from '../../core/useMediaQuery'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeTimePicker' })

const props = withDefaults(
  defineProps<{
    /** 形如 "HH:mm"，未选全时为 null */
    modelValue?: string | null
    /** 小时步长，默认 1（0-23） */
    hourStep?: number
    /** 分钟步长，默认 5（0-55） */
    minuteStep?: number
    placeholder?: string
    disabled?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: null,
    hourStep: 1,
    minuteStep: 5,
    placeholder: '请选择时间',
    disabled: false,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const uid = useId()
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const hourColRef = ref<HTMLElement | null>(null)
const minuteColRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

/** 窄屏切底部弹出层：挂到 body、锁滚动、可下拉关闭 */
const isMobile = useIsMobile()
const locked = computed(() => isMobile.value && isOpen.value)
useScrollLock(locked)

const sheet = useSheetDrag(() => close())

const panelStyle = computed(() => {
  if (!isMobile.value || !isOpen.value) return undefined
  return {
    transform: `translateY(${sheet.offset.value}px)`,
    transition: sheet.dragging.value ? 'none' : undefined,
  }
})

const pad = (n: number) => String(n).padStart(2, '0')
const buildRange = (end: number, step: number) => {
  const list: number[] = []
  for (let i = 0; i < end; i += step) list.push(i)
  return list
}

const hours = computed(() => buildRange(24, props.hourStep))
const minutes = computed(() => buildRange(60, props.minuteStep))

const parsed = /^(\d{1,2}):(\d{1,2})$/.exec(props.modelValue ?? '')
const hour = ref<number | null>(parsed ? Number(parsed[1]) : null)
const minute = ref<number | null>(parsed ? Number(parsed[2]) : null)

const hasValue = computed(() => hour.value !== null || minute.value !== null)

const triggerLabel = computed(() => {
  if (!hasValue.value) return ''
  const h = hour.value === null ? '--' : pad(hour.value)
  const m = minute.value === null ? '--' : pad(minute.value)
  return `${h}:${m}`
})

/**
 * 重播一次性 pop 动画。
 * 同一个单元格连点也要能重播，所以先把类摘掉、读一次布局属性强制重排，再加回去。
 * 整个流程是同步的，不依赖 rAF / setTimeout。
 */
const replayPop = (el: HTMLElement | null) => {
  if (!el) return
  el.classList.remove('is-popping')
  void el.offsetWidth
  el.classList.add('is-popping')
}

const commit = () => {
  if (hour.value !== null && minute.value !== null) {
    emit('update:modelValue', `${pad(hour.value)}:${pad(minute.value)}`)
  }
}

const selectHour = (value: number, event: Event) => {
  hour.value = value
  replayPop(event.currentTarget as HTMLElement)
  commit()
}

const selectMinute = (value: number, event: Event) => {
  minute.value = value
  replayPop(event.currentTarget as HTMLElement)
  commit()
  // 分钟选完即代表输入结束，直接收起，不需要再点一次关闭
  close()
}

const open = () => {
  sheet.reset()
  isOpen.value = true
  // 两列常驻 DOM（收起只是 visibility: hidden），所以打开时能直接量到高度
  void nextTick(syncScroll)
}

/** 把一列滚到选中项居中，否则打开时只能看到 00:xx，得自己往下翻 */
const centerColumn = (col: HTMLElement | null) => {
  if (!col) return
  const cell = col.querySelector<HTMLElement>('[aria-selected="true"]')
  if (!cell) return
  const colRect = col.getBoundingClientRect()
  const cellRect = cell.getBoundingClientRect()
  col.scrollTop += cellRect.top - colRect.top - col.clientHeight / 2 + cellRect.height / 2
}

const syncScroll = () => {
  centerColumn(hourColRef.value)
  centerColumn(minuteColRef.value)
}

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
}

const toggle = () => {
  if (props.disabled) return
  isOpen.value ? close() : open()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    close()
  }
}

const onDocumentPointerDown = (event: PointerEvent) => {
  if (!isOpen.value) return
  const target = event.target as Node
  if (rootRef.value?.contains(target)) return
  // 浮层可能被传送到 body，得单独判断
  if (panelRef.value?.contains(target)) return
  close()
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <div ref="rootRef" class="je-time" :class="{ 'is-open': isOpen, 'is-disabled': disabled }">
    <button
      type="button"
      class="je-time__trigger"
      :class="{ 'has-value': hasValue }"
      :disabled="disabled"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="`${uid}-panel`"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="je-time__label">{{ triggerLabel || placeholder }}</span>
      <span class="je-time__icon" aria-hidden="true" />
    </button>

    <Teleport
      :to="teleportTarget === false ? 'body' : teleportTarget"
      :disabled="!isMobile || teleportTarget === false"
    >
      <div
        v-if="isMobile"
        class="je-time__scrim"
        :class="{ 'is-open': isOpen }"
        aria-hidden="true"
        @click="close"
      />

      <div
        :id="`${uid}-panel`"
        ref="panelRef"
        class="je-time__panel"
        :class="{ 'is-open': isOpen }"
        :style="panelStyle"
        role="dialog"
        aria-label="选择时间"
      >
        <div
          v-if="isMobile"
          class="je-time__handle"
          aria-hidden="true"
          @pointerdown="sheet.onPointerDown"
          @pointermove="sheet.onPointerMove"
          @pointerup="sheet.onPointerUp"
          @pointercancel="sheet.onPointerUp"
        />

        <p class="je-time__title">选择小时和分钟</p>
        <div class="je-time__wheel">
          <div ref="hourColRef" class="je-time__column" role="listbox" aria-label="小时">
            <button
              v-for="value in hours"
              :key="`h-${value}`"
              type="button"
              class="je-time__cell"
              role="option"
              :aria-selected="value === hour"
              @click="selectHour(value, $event)"
            >
              {{ pad(value) }}
            </button>
          </div>

          <span class="je-time__sep" aria-hidden="true">:</span>

          <div ref="minuteColRef" class="je-time__column" role="listbox" aria-label="分钟">
            <button
              v-for="value in minutes"
              :key="`m-${value}`"
              type="button"
              class="je-time__cell"
              role="option"
              :aria-selected="value === minute"
              @click="selectMinute(value, $event)"
            >
              {{ pad(value) }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-time {
  position: relative;
  font-family: inherit;
}

.je-time__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  padding: 14px 16px;
  font-family: inherit;
  font-size: 15px;
  color: var(--je-text-faint);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  cursor: pointer;
  outline: none;
  transition: border-color var(--je-duration) ease, background var(--je-duration) ease,
    box-shadow var(--je-duration) ease;
}

.je-time__trigger.has-value {
  color: var(--je-text);
}

.je-time__trigger:focus-visible,
.je-time.is-open .je-time__trigger {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-time__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 用纯 CSS 画一个钟表图标，避免引资源 */
.je-time__icon {
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 16px;
  height: 16px;
  border: 2px solid var(--je-text-faint);
  border-radius: 50%;
}

.je-time__icon::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 50%;
  width: 1.5px;
  height: 5px;
  background: var(--je-text-faint);
  transform: translateX(-50%);
}

.je-time__icon::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 50%;
  width: 4px;
  height: 1.5px;
  background: var(--je-text-faint);
}

.je-time__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  z-index: 50;
  padding: 16px;
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
  transform-origin: top center;
  /* 收起后必须屏蔽点击，否则动画期间面板是「隐形可点」的 */
  pointer-events: none;
  will-change: transform, opacity;
  /* 默认态就是收起态。展开方向用 .is-open 里的回弹过渡，收起方向用这里的 ease-in 过渡 */
  opacity: 0;
  visibility: hidden;
  transform: scale(0.94) translateY(-6px);
  /* visibility 要等收起动画跑完再切，否则面板会当场消失、看不到收起过程 */
  transition: transform 0.28s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.28s;
}

.je-time__panel.is-open {
  pointer-events: auto;
  visibility: visible;
  opacity: 1;
  transform: scale(1, 1) translateY(0);
  /* 展开即回弹，visibility 立即生效 */
  transition: transform 0.38s var(--je-ease-out-back), opacity 0.24s ease-out;
}

.je-time__scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-time__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-time__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  touch-action: none;
}

.je-time__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

.je-time__title {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--je-text-faint);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.je-time__wheel {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.je-time__column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  max-height: 180px;
  padding: 4px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--je-border-color) transparent;
}

.je-time__column::-webkit-scrollbar {
  width: 4px;
}

.je-time__column::-webkit-scrollbar-thumb {
  background: var(--je-border-color);
  border-radius: 2px;
}

.je-time__cell {
  min-width: 48px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 15px;
  color: var(--je-text-faint);
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  will-change: transform;
  transition: background 0.2s ease, color 0.2s ease;
}

.je-time__cell:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

/* 选中态直接用 aria-selected 属性选择器：单元格的 class 由命令式 replayPop 接管，
   不能再挂 :class 绑定，否则 Vue 更新时会整体覆写 className，把 is-popping 冲掉 */
.je-time__cell[aria-selected='true'] {
  font-weight: 700;
  /* 选中格压在品牌渐变上，文字固定浅色 */
  color: var(--je-text-on-color);
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
}

.je-time__cell:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-time__sep {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--je-text-faint);
}

.je-time.is-disabled .je-time__trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 点中时 1 → 1.15 → 1 */
.je-time__cell.is-popping {
  animation: je-time-pop 0.6s;
}

@keyframes je-time-pop {
  0% {
    transform: scale(1);
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  40% {
    transform: scale(1.15);
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  100% {
    transform: scale(1);
  }
}

/* 窄屏：面板改成贴底的弹出层，并预留给安全区 */
@media (max-width: 768px) {
  .je-time__panel {
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 101;
    max-height: 72vh;
    overflow-y: auto;
    padding: 4px 16px calc(16px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0;
    border-bottom: none;
    transform-origin: bottom center;
    /* 这里不能设 touch-action: none，否则小时 / 分钟列表在触屏上没法滚动；
       拖拽手势的 touch-action 由 .je-time__handle 单独承担 */
    transform: translateY(100%);
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-time__panel.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }

  .je-time__wheel {
    gap: 20px;
  }

  .je-time__column {
    flex: 1 1 0;
    max-height: 42vh;
  }

  /* 触屏热区不小于 44px */
  .je-time__cell {
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  /* 展开 / 收起都直接切到位，不做过渡 */
  .je-time__panel,
  .je-time__panel.is-open,
  .je-time__scrim {
    transition: none;
  }

  .je-time__cell.is-popping {
    animation: none;
  }
}
</style>