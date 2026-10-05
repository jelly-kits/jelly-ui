<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import { JeIcon } from '../JeIcon'
import { JeInput } from '../JeInput'
import type { JeAutoCompleteOption } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeAutoComplete' })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    /** 根据输入关键字返回候选；支持同步或异步 */
    fetchSuggestions: (
      query: string,
    ) => JeAutoCompleteOption[] | Promise<JeAutoCompleteOption[]>
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    /** 聚焦时立即拉取一次候选 */
    triggerOnFocus?: boolean
    /** 输入防抖毫秒数 */
    debounce?: number
    loadingText?: string
    emptyText?: string
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: '',
    placeholder: '',
    disabled: false,
    clearable: true,
    triggerOnFocus: true,
    debounce: 300,
    loadingText: '加载中…',
    emptyText: '无匹配结果',
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [option: JeAutoCompleteOption]
  change: [value: string]
}>()

const uid = useId()
const listId = `${uid}-listbox`

const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const inputValue = ref(props.modelValue)
const options = ref<JeAutoCompleteOption[]>([])
const loading = ref(false)
const isOpen = ref(false)
/** 键盘高亮项下标，-1 表示无 */
const activeIndex = ref(-1)
const zIndex = ref(nextZIndex())
const panelWidth = ref(0)

let fetchTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null
/** 请求序号：异步返回时用它丢弃过期结果 */
let requestSeq = 0

watch(
  () => props.modelValue,
  (value) => {
    if (value !== inputValue.value) inputValue.value = value
  },
)

const isMobile = useIsMobile()
const locked = computed(() => isMobile.value && isOpen.value)
useScrollLock(locked)

const sheet = useSheetDrag(() => close())

const { x, y } = useFloating({
  reference: rootRef,
  floating: panelRef,
  open: isOpen,
  placement: () => 'bottom-start',
  offset: 8,
})

const panelStyle = computed(() => {
  if (!isMobile.value) {
    return {
      left: `${x.value}px`,
      top: `${y.value}px`,
      width: panelWidth.value > 0 ? `${panelWidth.value}px` : undefined,
      zIndex: zIndex.value,
    }
  }
  // 收起态的位移交给 CSS，inline transform 会盖掉它
  if (!isOpen.value) return { zIndex: zIndex.value }
  return {
    zIndex: zIndex.value,
    transform: `translateY(${sheet.offset.value}px)`,
    transition: sheet.dragging.value ? 'none' : undefined,
  }
})

const open = () => {
  if (props.disabled) return
  sheet.reset()
  panelWidth.value = rootRef.value?.offsetWidth ?? 0
  zIndex.value = nextZIndex()
  isOpen.value = true
}

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
  activeIndex.value = -1
}

const clearFetchTimer = () => {
  if (fetchTimer !== null) {
    clearTimeout(fetchTimer)
    fetchTimer = null
  }
}

const runFetch = async (query: string) => {
  const seq = ++requestSeq
  loading.value = true
  open()
  try {
    const result = await Promise.resolve(props.fetchSuggestions(query))
    if (seq !== requestSeq) return
    options.value = result ?? []
  } catch {
    if (seq === requestSeq) options.value = []
  } finally {
    if (seq === requestSeq) {
      loading.value = false
      activeIndex.value = -1
    }
  }
}

const scheduleFetch = (query: string) => {
  clearFetchTimer()
  fetchTimer = setTimeout(() => {
    fetchTimer = null
    void runFetch(query)
  }, props.debounce)
}

const selectOption = (option: JeAutoCompleteOption) => {
  if (option.disabled) return
  inputValue.value = option.value
  emit('update:modelValue', option.value)
  emit('change', option.value)
  emit('select', option)
  close()
}

const onInput = (value: string) => {
  inputValue.value = value
  emit('update:modelValue', value)
  emit('change', value)
  scheduleFetch(value)
}

const onFocus = () => {
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  if (!props.triggerOnFocus) return
  clearFetchTimer()
  void runFetch(inputValue.value)
}

const onBlur = () => {
  // 延后收起，给面板内选项的点击留出时间
  if (closeTimer !== null) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    closeTimer = null
    close()
  }, 120)
}

/** 方向键在可选项之间移动，自动跳过禁用项 */
const moveActive = (step: number) => {
  const list = options.value
  if (list.length === 0) return
  let next = activeIndex.value
  for (let i = 0; i < list.length; i += 1) {
    next += step
    if (next < 0) next = list.length - 1
    if (next >= list.length) next = 0
    const option = list[next]
    if (option && !option.disabled) {
      activeIndex.value = next
      return
    }
  }
}

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) open()
      else moveActive(1)
      break

    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) open()
      else moveActive(-1)
      break

    case 'Enter': {
      const option = options.value[activeIndex.value]
      if (!isOpen.value || !option) return
      event.preventDefault()
      selectOption(option)
      break
    }

    case 'Escape':
      if (!isOpen.value) return
      event.preventDefault()
      close()
      break
  }
}

const clear = () => {
  inputValue.value = ''
  options.value = []
  emit('update:modelValue', '')
  emit('change', '')
  close()
}

useClickOutside([rootRef, panelRef], () => {
  if (isOpen.value) close()
})

onBeforeUnmount(() => {
  clearFetchTimer()
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
})
</script>

<template>
  <div
    ref="rootRef"
    class="je-autocomplete"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
    @keydown.escape="close"
  >
    <div class="je-autocomplete__field">
      <JeInput
        class="je-autocomplete__input"
        :model-value="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="isOpen"
        :aria-controls="listId"
        :aria-activedescendant="isOpen && activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined"
        @update:model-value="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />

      <button
        v-if="clearable && inputValue && !disabled"
        type="button"
        class="je-autocomplete__clear"
        aria-label="清空输入"
        @click="clear"
      >
        <JeIcon name="close" :size="14" />
      </button>
    </div>

    <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
      <div
        v-if="isMobile"
        class="je-autocomplete__scrim"
        :class="{ 'is-open': isOpen }"
        aria-hidden="true"
        @click="close"
      />

      <div
        :id="listId"
        ref="panelRef"
        class="je-autocomplete__panel"
        :class="{ 'is-open': isOpen }"
        :style="panelStyle"
        role="listbox"
        aria-label="候选项"
        :aria-hidden="!isOpen"
      >
        <div
          v-if="isMobile"
          class="je-autocomplete__handle"
          aria-hidden="true"
          @pointerdown="sheet.onPointerDown"
          @pointermove="sheet.onPointerMove"
          @pointerup="sheet.onPointerUp"
          @pointercancel="sheet.onPointerUp"
        />

        <div v-if="loading" class="je-autocomplete__status" role="status">
          <JeIcon name="loading" :size="14" spin />
          <span>{{ loadingText }}</span>
        </div>

        <template v-else-if="options.length > 0">
          <div
            v-for="(option, index) in options"
            :id="`${uid}-opt-${index}`"
            :key="option.value"
            class="je-autocomplete__option"
            :class="{ 'is-active': index === activeIndex, 'is-option-disabled': option.disabled }"
            role="option"
            :aria-selected="index === activeIndex"
            :aria-disabled="option.disabled || undefined"
            @click="selectOption(option)"
          >
            {{ option.label ?? option.value }}
          </div>
        </template>

        <div v-else class="je-autocomplete__status">{{ emptyText }}</div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-autocomplete {
  font-family: inherit;
}

.je-autocomplete__field {
  position: relative;
}

/* 有清空按钮时给输入框右侧留出空间（padding 由外框转交到内部控件上） */
.je-autocomplete :deep(.je-input) {
  padding-right: 40px;
}

.je-autocomplete__clear {
  position: absolute;
  top: 50%;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--je-text-faint);
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transform: translateY(-50%);
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

.je-autocomplete__clear:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-autocomplete__clear:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 面板常驻 DOM，收起态用 visibility，过渡才不会被 display 打断 */
.je-autocomplete__panel {
  position: fixed;
  z-index: 2000;
  box-sizing: border-box;
  min-width: 200px;
  max-width: calc(100vw - 24px);
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
  font-family: inherit;
  font-size: 14px;
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
  transform-origin: top left;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.96) translateY(-6px);
  transition: transform 0.24s ease-in, opacity 0.18s ease-in, visibility 0s linear 0.24s;
}

.je-autocomplete__panel.is-open {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: scale(1) translateY(0);
  transition: transform 0.32s var(--je-ease-out-back), opacity 0.2s ease-out;
}

.je-autocomplete__option {
  padding: 10px 12px;
  color: var(--je-text-muted);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: background var(--je-duration) ease, color var(--je-duration) ease;
}

.je-autocomplete__option:hover,
.je-autocomplete__option.is-active {
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 24%, transparent);
}

.je-autocomplete__option.is-option-disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.je-autocomplete__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 12px;
  font-size: 13px;
  color: var(--je-text-faint);
}

.je-autocomplete__status :deep(.je-icon) {
  color: var(--je-primary);
}

.je-autocomplete__scrim {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-autocomplete__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-autocomplete__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  touch-action: none;
}

.je-autocomplete__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

/* 窄屏：底部弹出层；面板不设 touch-action，内部列表才能滚动 */
@media (max-width: 768px) {
  .je-autocomplete__panel {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2001;
    width: 100%;
    max-width: 100%;
    max-height: 70vh;
    padding: 4px 12px calc(14px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0;
    border-bottom: none;
    transform-origin: bottom center;
    transform: translateY(100%);
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-autocomplete__panel.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }

  .je-autocomplete__option {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 12px 16px;
    font-size: 15px;
  }

  .je-autocomplete__clear {
    width: 44px;
    height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-autocomplete__clear,
  .je-autocomplete__panel,
  .je-autocomplete__panel.is-open,
  .je-autocomplete__scrim {
    transition: none;
  }
}
</style>
