<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useIsMobile } from '../../core/useMediaQuery'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import type { JeSelectOption } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: JeSelectOption[]
    placeholder?: string
    disabled?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: null,
    placeholder: '请选择',
    disabled: false,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const uid = useId()
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const isOpen = ref(false)
/** 键盘高亮项的下标，-1 表示无 */
const activeIndex = ref(-1)

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

const selectedIndex = computed(() =>
  props.options.findIndex((item) => item.value === props.modelValue),
)
const selectedOption = computed<JeSelectOption | undefined>(() => props.options[selectedIndex.value])
const selectedLabel = computed(() => selectedOption.value?.label ?? '')

const open = () => {
  sheet.reset()
  isOpen.value = true
  activeIndex.value = props.options.findIndex((item) => item.value === props.modelValue)
}

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
}

const toggle = () => {
  if (props.disabled) return
  isOpen.value ? close() : open()
}

const select = (option: JeSelectOption) => {
  if (option.value !== props.modelValue) emit('update:modelValue', option.value)
  close()
  triggerRef.value?.focus()
}

const moveActive = (step: number) => {
  const count = props.options.length
  if (count === 0) return
  // activeIndex 为 -1 时：向下从第一项开始，向上从最后一项开始
  const base = activeIndex.value < 0 ? (step > 0 ? -1 : 0) : activeIndex.value
  activeIndex.value = (base + step + count) % count
}

const commitActive = () => {
  const option = props.options[activeIndex.value]
  if (option) select(option)
}

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return

  switch (event.key) {
    case 'Escape':
      if (!isOpen.value) return
      event.preventDefault()
      close()
      break

    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) {
        open()
        return
      }
      moveActive(event.key === 'ArrowDown' ? 1 : -1)
      break

    // 空格键的 event.key 是单个空格字符
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!isOpen.value) {
        open()
        return
      }
      commitActive()
      break
  }
}

const onDocumentPointerDown = (event: PointerEvent) => {
  if (!isOpen.value) return
  const target = event.target as Node
  if (rootRef.value?.contains(target)) return
  // 浮层可能被传送到 body，得单独判断
  if (menuRef.value?.contains(target)) return
  close()
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <div
    ref="rootRef"
    class="je-select"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
    @keydown="onKeydown"
  >
    <div
      ref="triggerRef"
      class="je-select__trigger"
      :class="{ 'has-value': !!selectedLabel }"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="`${uid}-listbox`"
      :aria-activedescendant="isOpen && activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined"
      :tabindex="disabled ? -1 : 0"
      @click="toggle"
    >
      <span v-if="$slots.prefix" class="je-select__prefix">
        <slot name="prefix" />
      </span>

      <span class="je-select__label">
        <slot name="label" :index="selectedIndex" :label="selectedLabel" :value="modelValue">
          {{ selectedLabel || placeholder }}
        </slot>
      </span>

      <span class="je-select__arrow" aria-hidden="true" />
    </div>

    <Teleport
      :to="teleportTarget === false ? 'body' : teleportTarget"
      :disabled="!isMobile || teleportTarget === false"
    >
      <div
        v-if="isMobile"
        class="je-select__scrim"
        :class="{ 'is-open': isOpen }"
        aria-hidden="true"
        @click="close"
      />

      <div
        :id="`${uid}-listbox`"
        ref="menuRef"
        class="je-select__menu"
        :class="{ 'is-open': isOpen }"
        :style="panelStyle"
        role="listbox"
        :aria-hidden="!isOpen"
      >
        <div
          v-if="isMobile"
          class="je-select__handle"
          aria-hidden="true"
          @pointerdown="sheet.onPointerDown"
          @pointermove="sheet.onPointerMove"
          @pointerup="sheet.onPointerUp"
          @pointercancel="sheet.onPointerUp"
        />

        <div
          v-for="(option, index) in options"
          :id="`${uid}-opt-${index}`"
          :key="option.value"
          class="je-select__item"
          :class="{
            'is-selected': option.value === modelValue,
            'is-active': index === activeIndex,
          }"
          role="option"
          :aria-selected="option.value === modelValue"
          @click="select(option)"
        >
          <slot name="option" :item="option" :index="index">{{ option.label }}</slot>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-select {
  position: relative;
  font-family: inherit;
  user-select: none;
}

.je-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
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

.je-select__trigger.has-value {
  color: var(--je-text);
}

/* 聚焦与展开共用同一套高亮，键盘用户也能看清当前焦点 */
.je-select__trigger:focus-visible,
.je-select.is-open .je-select__trigger {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-select__label {
  /* 撑满剩余宽度，把箭头推到最右（有 prefix 插槽时也不会被 space-between 挤到中间） */
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* prefix 插槽：图标 / 色块等，放在选中内容前面 */
.je-select__prefix {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}

.je-select__arrow {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  margin-top: -4px;
  border-right: 2px solid var(--je-text-faint);
  border-bottom: 2px solid var(--je-text-faint);
  transform: rotate(45deg);
  transition: transform 0.4s var(--je-ease-overshoot), margin-top 0.4s var(--je-ease-overshoot),
    border-color var(--je-duration) ease;
}

.je-select.is-open .je-select__arrow {
  margin-top: 4px;
  border-color: var(--je-text);
  transform: rotate(-135deg);
}

.je-select__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  z-index: 50;
  padding: 6px;
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

.je-select__menu.is-open {
  pointer-events: auto;
  visibility: visible;
  opacity: 1;
  transform: scale(1, 1) translateY(0);
  /* 展开即回弹，visibility 立即生效 */
  transition: transform 0.38s var(--je-ease-out-back), opacity 0.24s ease-out;
}

.je-select__item {
  /* 选项内容由 option 插槽决定，这里用 flex 让图标 / 色块和文字对齐 */
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease,
    transform var(--je-duration) var(--je-ease-overshoot);
}

.je-select__item:hover,
.je-select__item.is-active {
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 20%, transparent);
  transform: translateX(4px);
}

.je-select__item.is-selected {
  color: var(--je-text);
  font-weight: 600;
  background: color-mix(in srgb, var(--je-primary) 35%, transparent);
}

.je-select.is-disabled .je-select__trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-select__scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-select__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-select__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  touch-action: none;
}

.je-select__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

/* 窄屏：面板改成贴底的弹出层，并预留给安全区 */
@media (max-width: 768px) {
  .je-select__menu {
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 101;
    max-height: 72vh;
    overflow-y: auto;
    padding: 4px 12px calc(14px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0;
    border-bottom: none;
    transform-origin: bottom center;
    /* 这里不能设 touch-action: none，否则选项列表在触屏上没法滚动；
       拖拽手势的 touch-action 由 .je-select__handle 单独承担 */
    transform: translateY(100%);
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-select__menu.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }

  .je-select__item {
    display: flex;
    align-items: center;
    min-height: 48px;
    padding: 12px 16px;
    font-size: 15px;
  }

  /* 触屏没有 hover，位移高亮改由选中 / 键盘高亮承担 */
  .je-select__item:hover {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  /* 展开 / 收起都直接切到位，不做过渡 */
  .je-select__menu,
  .je-select__menu.is-open,
  .je-select__scrim {
    transition: none;
  }
}
</style>