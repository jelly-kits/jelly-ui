<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useIsMobile } from '../../core/useMediaQuery'
import { useFocusTrap } from '../../core/useFocusTrap'
import { useScrollLock } from '../../core/useScrollLock'
import { nextZIndex } from '../../core/useZIndex'
import { JeButton } from '../JeButton'
import { JeIcon } from '../JeIcon'
import { useTeleportTarget } from '../JeConfigProvider/types'
import type { JeDialogDone, JeDialogProps } from './types'

defineOptions({ name: 'JeDialog' })

const props = withDefaults(defineProps<JeDialogProps>(), {
  modelValue: false,
  title: '',
  width: 520,
  showClose: true,
  closeIcon: 'close',
  closeOnClickModal: true,
  closeOnPressEscape: true,
  closeOnEscape: undefined,
  beforeClose: undefined,
  // 三个页脚属性都留空：不传 confirmButtonText 就完全不渲染内置页脚，#footer 插槽的老用法不受影响
  confirmButtonText: undefined,
  cancelButtonText: undefined,
  showCancelButton: false,
  footerLayout: 'auto',
  destroyOnClose: false,
  draggable: false,
  fullscreen: false,
  alignCenter: true,
  center: false,
  top: '',
  bottomSheet: false,
  // appendTo 不给默认值：给了 'body' 就区分不出「没传」，全局挂载点会被整个压死
  appendToBody: false,
  // teleportTo 必须显式给 undefined（原因见 useTeleportTarget 的说明），不能省略
  teleportTo: undefined,
  lockScroll: true,
  trapFocus: true,
  zIndex: undefined,
})

/**
 * 浮层挂载点。teleportTo 优先，其后是旧的 appendTo / appendToBody；
 * 都没给时跟随 ConfigProvider / configureJelly，最终落到 body。
 */
const teleportTarget = useTeleportTarget(() =>
  props.teleportTo ?? (props.appendToBody ? 'body' : props.appendTo),
)

// 事件写成内联字面量：scripts/gen-api.mjs 只认内联的 defineEmits，
// 换成 defineEmits<JeDialogEmits>() 事件表就会退化成兜底词表
const emit = defineEmits<{
  /** v-model 的 modelValue 更新时触发 */
  'update:modelValue': [value: boolean]
  /** 开始打开，此时面板还没跑完入场动画 */
  open: []
  /** 打开动画结束后触发，首次要摸 DOM 时用它 */
  opened: []
  /** 面板确实开始收起时触发；被 before-close 拦下则不会触发 */
  close: []
  /** 收起动画结束、面板不可见后触发 */
  closed: []
  /** 内置页脚的确认按钮走完流程后触发（被 before-close 拦下时不触发） */
  confirm: []
  /** 内置页脚的取消按钮走完流程后触发（被 before-close 拦下时不触发） */
  cancel: []
}>()

/** 打开动画时长，与样式里的 .42s 对齐；打开后要等它跑完才算 opened */
const OPEN_ANIMATION_MS = 420

const wrapRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const headerRef = ref<HTMLElement | null>(null)

// 只在外部传了 zIndex 时才固定层级，否则按打开顺序自动往上抬
const zIndex = ref(props.zIndex ?? nextZIndex())

const scrollLocked = computed(() => props.modelValue && props.lockScroll)
useScrollLock(scrollLocked)
useFocusTrap(panelRef, computed(() => props.modelValue && props.trapFocus))

/** 入场动画是否已经结束。拖拽只会发生在展开完成后，用它把展开用的回弹过渡切掉 */
const settled = ref(false)

/** 两种写法取或：closeOnPressEscape 是 EP 的名字，closeOnEscape 是本库历史名字 */
const escapeEnabled = computed(() => props.closeOnEscape ?? props.closeOnPressEscape)

/** 有 top 就改成顶部对齐排版；fullscreen 下两者都不参与 */
const topAligned = computed(() => !props.fullscreen && !props.alignCenter && props.top !== '')

/** 惰性渲染的开关：destroyOnClose 时首次打开之前不渲染默认插槽 */
const everOpened = ref(props.modelValue)
const bodyVisible = computed(() => !props.destroyOnClose || everOpened.value)

/**
 * 关闭的真正落点：只改 v-model，动画相关的事件交给 watch 统一发，
 * 这样外部直接改 modelValue 或调 handleClose 走的都是同一条路径。
 */
const doClose = () => {
  if (!props.modelValue) return
  emit('update:modelValue', false)
  emit('close')
}

/**
 * 用户主动触发的关闭（关闭按钮 / 遮罩 / Esc）。
 * 有 beforeClose 时把决定权交出去，不调用 done 就被拦住；此时不发 close，
 * 与「close 表示确实开始收起」的语义保持一致。
 *
 * done 的约定：done() / done(false) 放行关闭，done(true) 表示这次不关
 * （与 types.ts 里「调用它才真正关闭；传 true 表示取消」以及 dist 里的既有实现一致）。
 */
const handleClose = () => {
  if (!props.modelValue) return
  if (props.beforeClose) {
    const done: JeDialogDone = (cancel) => {
      if (cancel) return
      doClose()
    }
    props.beforeClose(done)
    return
  }
  doClose()
}

const onScrimClick = () => {
  if (props.closeOnClickModal) handleClose()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !escapeEnabled.value) return
  event.stopPropagation()
  handleClose()
}

/* ---------------------------------------------------------------- 拖拽 */

const dragX = ref(0)
const dragY = ref(0)
const dragging = ref(false)
/** 落下后抑制一次 click，避免「拖到一半松手」被当成点击关闭按钮 */
const draggedOnce = ref(false)
let startX = 0
let startY = 0
let dragPointerId = -1

const onDragStart = (event: PointerEvent) => {
  if (!props.draggable || event.button !== 0) return
  const target = event.target as HTMLElement | null
  // 标题栏右侧就是关闭按钮，从它上面按下去应该走点击而不是拖拽
  if (target?.closest('button, a, input, select, textarea')) return
  dragging.value = true
  // 每次按下先清掉上一次的抑制标记，否则第一次拖拽后会把下一次点击也吃掉
  draggedOnce.value = false
  startX = event.clientX - dragX.value
  startY = event.clientY - dragY.value
  dragPointerId = event.pointerId
  headerRef.value?.setPointerCapture(event.pointerId)
}

const onDragMove = (event: PointerEvent) => {
  if (!props.draggable || !dragging.value || event.pointerId !== dragPointerId) return
  dragX.value = event.clientX - startX
  dragY.value = event.clientY - startY
}

const onDragEnd = (event: PointerEvent) => {
  if (!props.draggable || event.pointerId !== dragPointerId) return
  dragging.value = false
  // 只有真的移动过才抑制随后的 click：点一下标题栏不该被当成拖拽
  if (dragX.value !== 0 || dragY.value !== 0) draggedOnce.value = true
  const header = headerRef.value
  if (header?.hasPointerCapture(event.pointerId)) header.releasePointerCapture(event.pointerId)
  dragPointerId = -1
}

const onClickCapture = (event: MouseEvent) => {
  if (!draggedOnce.value) return
  draggedOnce.value = false
  event.preventDefault()
  event.stopPropagation()
}

/** 复位只改位移，不动开关状态：关闭后再打开时 watch 会调用它 */
const resetPosition = () => {
  dragX.value = 0
  dragY.value = 0
  dragging.value = false
}

/* ---------------------------------------------------------------- 内置页脚 */

/**
 * 内置页脚只在传了 confirmButtonText 时渲染：这样「页脚交给 #footer 插槽」的老页面
 * 拿到的 DOM 与以前完全一致。渲染优先级仍然是 #footer 插槽 > 内置页脚。
 */
const hasBuiltinFooter = computed(() => props.confirmButtonText !== undefined)

/** 窄屏判定，供 auto 布局使用；媒体查询订阅随组件生命周期自动释放 */
const isMobile = useIsMobile()

/** 取消按钮：showCancelButton 或 cancelButtonText 满足其一即显示；没给文案时用默认「取消」 */
const showCancel = computed(() => props.showCancelButton || props.cancelButtonText !== undefined)

const cancelText = computed(() => props.cancelButtonText ?? '取消')

/** auto 交给窄屏判定（≤768px 竖排），inline / stacked 则原样透出 */
const layout = computed(() =>
  props.footerLayout === 'auto' ? (isMobile.value ? 'stacked' : 'inline') : props.footerLayout,
)

/**
 * 确认按钮的加载态。只有走 beforeClose 时才点亮：
 * done 一旦被调用（放行或取消）就立刻熄灭，页面保持打开时不会留下转圈的按钮。
 */
const confirmLoading = ref(false)

/**
 * 面板是否还挂在页面上。beforeClose 迟迟不调用 done、期间面板又被别的路径关掉时，
 * done 的后续调用不该再去动一个已经卸载的实例。
 */
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

/**
 * 确认这条收尾路径。内置确认按钮和命令式 API 都走它：
 * 顺序固定为「先发 confirm 事件，再过 beforeClose」——因为组件在 beforeClose 拦下时不会发 close，
 * 所以「事件记下了动作、面板却仍开着」这种组合是预期的，与既有 close 事件的语义一致。
 * done 的约定与 handleClose 相同：done() / done(false) 放行，done(true) 表示不关。
 */
const handleConfirm = () => {
  if (!props.modelValue) return
  emit('confirm')
  if (!props.beforeClose) {
    doClose()
    return
  }
  confirmLoading.value = true
  const done: JeDialogDone = (cancel) => {
    confirmLoading.value = false
    if (cancel || !mounted.value) return
    doClose()
  }
  props.beforeClose(done)
}

/**
 * 取消这条收尾路径（内置取消按钮 / 命令式 API 的取消侧）：
 * 同样过 beforeClose，放行后发 cancel 事件，于是命令式调用能区分「取消」与「被遮罩关掉」。
 */
const handleCancel = () => {
  if (!props.modelValue) return
  if (props.beforeClose) {
    const done: JeDialogDone = (cancel) => {
      if (cancel || !mounted.value) return
      doClose()
      emit('cancel')
    }
    props.beforeClose(done)
    return
  }
  doClose()
  emit('cancel')
}

/* ---------------------------------------------------------------- 样式 */

const panelStyle = computed(() => ({
  zIndex: zIndex.value,
  '--je-dialog-width': typeof props.width === 'number' ? `${props.width}px` : props.width,
  '--je-dialog-top': props.top,
  // 位移做成 CSS 变量而不是直接写 transform，否则会冲掉里面对齐用的 translate
  '--je-dialog-drag-x': `${dragX.value}px`,
  '--je-dialog-drag-y': `${dragY.value}px`,
  // 未落定时保持展开动画的过渡；落定后用短过渡跟随指针，拖拽时干脆不要过渡
  '--je-dialog-drag-transition': settled.value
    ? dragging.value
      ? 'transform 0s'
      : 'transform 0.2s ease-out'
    : 'transform 0.42s var(--je-ease-out-back)',
}))

/* ---------------------------------------------------------------- 生命周期 */

let openTimer = 0
let closeTimer = 0

const clearTimers = () => {
  window.clearTimeout(openTimer)
  window.clearTimeout(closeTimer)
}

watch(
  () => props.modelValue,
  (open) => {
    clearTimers()
    if (open) {
      everOpened.value = true
      if (props.zIndex === undefined) zIndex.value = nextZIndex()
      resetPosition()
      settled.value = false
      emit('open')
      document.addEventListener('keydown', onKeydown)
      // 面板常驻 DOM 且有过渡，所以用定时器而不是 nextTick 来对齐动画结束
      openTimer = window.setTimeout(() => {
        settled.value = true
        emit('opened')
      }, OPEN_ANIMATION_MS)
    } else {
      settled.value = false
      document.removeEventListener('keydown', onKeydown)
      closeTimer = window.setTimeout(() => {
        emit('closed')
        // 关闭后才清位移，否则收起动画会突然跳回中间
        resetPosition()
      }, OPEN_ANIMATION_MS)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  mounted.value = false
  clearTimers()
  document.removeEventListener('keydown', onKeydown)
})

defineExpose({
  /** 走一遍完整的关闭流程（含 before-close），供外部按钮复用 */
  handleClose,
  /** 把拖拽产生的位移清零，回到初始位置 */
  resetPosition,
  /** 走「确认」这条收尾路径：先发 confirm 事件，再过 before-close */
  handleConfirm,
  /** 走「取消」这条收尾路径：过 before-close 后发 cancel 事件，命令式 API 靠它区分取消 */
  handleCancel,
})
</script>

<template>
  <!-- appendToBody 是 EP 里的布尔开关，本库再给一个 appendTo 用来指定具体节点 -->
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div ref="wrapRef" class="je-dialog" :class="{ 'is-open': modelValue }">
      <div class="je-dialog__scrim" aria-hidden="true" @click="onScrimClick" />

      <div
        ref="panelRef"
        class="je-dialog__panel"
        :class="{
          'je-dialog--fullscreen': fullscreen,
          'je-dialog--top': topAligned,
          'je-dialog--center': center,
          'je-dialog--sheet': bottomSheet,
        }"
        :style="panelStyle"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-hidden="!modelValue"
        @click.capture="onClickCapture"
      >
        <header
          v-if="title || showClose || $slots.header"
          ref="headerRef"
          class="je-dialog__header"
          :class="{ 'je-dialog__header--draggable': draggable, 'is-dragging': dragging }"
          @pointerdown="onDragStart"
          @pointermove="onDragMove"
          @pointerup="onDragEnd"
          @pointercancel="onDragEnd"
        >
          <!-- 页头内容，替换后标题文案不再显示（关闭按钮保留） -->
          <slot name="header">
            <h2 class="je-dialog__title">{{ title }}</h2>
          </slot>
          <button
            v-if="showClose"
            type="button"
            class="je-dialog__close"
            aria-label="关闭"
            title="关闭"
            @click="handleClose"
          >
            <!-- 字符串走内置图标集，传组件时原样渲染，省得为换图标去改源码 -->
            <JeIcon v-if="typeof closeIcon === 'string'" :name="closeIcon" :size="18" />
            <component :is="closeIcon" v-else />
          </button>
        </header>

        <!-- 默认内容；destroyOnClose 打开时首次展开前不渲染，避免长列表白白挂在后台 -->
        <div v-if="bodyVisible" class="je-dialog__body">
          <slot />
        </div>

        <!-- 页脚区域：优先渲染 footer 插槽（老用法），没写插槽时才用内置页脚 -->
        <footer v-if="$slots.footer" class="je-dialog__footer">
          <slot name="footer" />
        </footer>
        <footer
          v-else-if="hasBuiltinFooter"
          class="je-dialog__footer je-dialog__footer--builtin"
          :class="`je-dialog__footer--${layout}`"
        >
          <!-- 内置页脚的取消按钮，stacked 下排在确认按钮下方 -->
          <je-button v-if="showCancel" variant="ghost" class="je-dialog__action" @click="handleCancel">
            {{ cancelText }}
          </je-button>
          <!-- 内置页脚的确认按钮；before-close 未放行时保持 loading 且不可点 -->
          <je-button
            class="je-dialog__action"
            :loading="confirmLoading"
            @click="handleConfirm"
          >
            {{ confirmButtonText }}
          </je-button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.je-dialog {
  position: fixed;
  inset: 0;
  z-index: 2000;
  /* 容器常驻 DOM 且铺满视口，收起时必须放行点击，否则会盖死整页 */
  pointer-events: none;
}

.je-dialog.is-open {
  pointer-events: auto;
}

.je-dialog__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-dialog.is-open .je-dialog__scrim {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-dialog__panel {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: var(--je-dialog-width, 520px);
  max-width: calc(100vw - 32px);
  max-height: 84vh;
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: var(--je-border);
  border-radius: var(--je-radius-lg);
  box-shadow: var(--je-shadow-popup);
  outline: none;
  pointer-events: none;
  will-change: transform, opacity;
  opacity: 0;
  visibility: hidden;
  /* 入场与拖拽共用一条 transform，真正用哪条过渡由 --je-dialog-drag-transition 决定 */
  --je-dialog-drag-x: 0px;
  --je-dialog-drag-y: 0px;
  --je-dialog-drag-transition: transform 0.42s var(--je-ease-out-back);
  /* 默认就是「垂直 + 水平居中」，与组件历史行为一致；顶部对齐改由 .je-dialog--top 覆盖 */
  transform: translate(-50%, -50%)
    translate(var(--je-dialog-drag-x), var(--je-dialog-drag-y)) translateY(20px) scale(0.94);
  transition: transform 0.3s ease-in, opacity 0.22s ease-in, visibility 0s linear 0.3s;
}

.je-dialog.is-open .je-dialog__panel {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) translate(var(--je-dialog-drag-x), var(--je-dialog-drag-y))
    translateY(0) scale(1);
  transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out,
    var(--je-dialog-drag-transition);
}

/* 顶部对齐：margin-top 由 top 传入，入场只做垂直位移动画 */
.je-dialog__panel.je-dialog--top {
  top: 0;
  margin-top: var(--je-dialog-top, 15vh);
  transform: translate(-50%, 0) translate(var(--je-dialog-drag-x), var(--je-dialog-drag-y))
    translateY(-24px) scale(0.96);
}

.je-dialog.is-open .je-dialog__panel.je-dialog--top {
  transform: translate(-50%, 0) translate(var(--je-dialog-drag-x), var(--je-dialog-drag-y))
    translateY(0) scale(1);
}

/* 全屏：铺满视口，此时 width / top / draggable 都无意义 */
.je-dialog__panel.je-dialog--fullscreen {
  top: 0;
  left: 0;
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  margin: 0;
  border: none;
  border-radius: 0;
  /* 全屏下位移交给内层内容，面板本身只做淡入，避免整屏元素跟着飞 */
  transform: none;
}

.je-dialog.is-open .je-dialog__panel.je-dialog--fullscreen {
  transform: none;
}

.je-dialog--fullscreen {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

.je-dialog__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 12px;
}

/* 可拖拽提示：抓手光标 + 禁止选中，否则拖的时候会把标题文字一起选中 */
.je-dialog__header--draggable {
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.je-dialog__header--draggable.is-dragging {
  cursor: grabbing;
}

.je-dialog__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.je-dialog__close {
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

.je-dialog__close:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-dialog__close:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-dialog__body {
  flex: 1;
  overflow: auto;
  padding: 4px 22px 22px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--je-text-muted);
  -webkit-overflow-scrolling: touch;
}

.je-dialog__footer {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 22px 22px;
}

/*
 * 内置页脚：DOM 顺序固定为「取消在左、确认在右」。
 * stacked 用 column-reverse 得到「确认在上、取消在下」——Vant 的移动端形态，
 * 主操作靠近拇指；因为按钮本身 44px 高，不用再额外补触控热区。
 */
.je-dialog__footer--builtin {
  align-items: center;
}

/* 横排：按钮不等宽，整体右对齐（页脚基础样式已是 flex-end，这里只补最小宽度） */
.je-dialog__footer--inline .je-dialog__action {
  flex: 0 0 auto;
  min-width: 96px;
}

/* 竖排：铺满整行，并在上方补一条现算的分隔线（派生色不进全局 token） */
.je-dialog__footer--stacked {
  flex-direction: column-reverse;
  align-items: stretch;
  gap: 10px;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--je-border-color) 70%, transparent);
}

.je-dialog__footer--stacked .je-dialog__action {
  width: 100%;
  min-height: 44px;
}

/* center：只把页头文字与页脚按钮推到中间，面板位置不变 */
.je-dialog--center .je-dialog__header {
  flex-direction: column;
  gap: 6px;
  text-align: center;
}

.je-dialog--center .je-dialog__footer {
  justify-content: center;
}

/*
 * 窄屏：默认保持「垂直 + 水平居中的卡片」，与 Element Plus / Vant 的对话框一致
 * （基础样式里的 max-width: calc(100vw - 32px) 已经把宽度收好了）。
 * 贴底形态改成显式开关 .je-dialog--sheet，不再无条件贴底 —— 之前那样会让移动端
 * 永远拿不到垂直居中，而「贴底」本来只适合少部分场景。
 */
@media (max-width: 768px) {
  .je-dialog__panel {
    max-height: 84vh;
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* 贴底形态：移动端 action sheet */
  .je-dialog__panel.je-dialog--sheet,
  .je-dialog__panel.je-dialog--sheet.je-dialog--top {
    top: auto;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    max-height: 86vh;
    margin: 0;
    border-bottom: none;
    border-radius: var(--je-radius-lg) var(--je-radius-lg) 0 0;
    transform: translate(-50%, 0) translate(var(--je-dialog-drag-x), var(--je-dialog-drag-y))
      translateY(24px);
  }

  .je-dialog.is-open .je-dialog__panel.je-dialog--sheet,
  .je-dialog.is-open .je-dialog__panel.je-dialog--sheet.je-dialog--top {
    transform: translate(-50%, 0) translate(var(--je-dialog-drag-x), var(--je-dialog-drag-y))
      translateY(0);
  }

  .je-dialog__header {
    padding-top: 22px;
  }

  /* 触控热区兜到 44px */
  .je-dialog__close {
    width: 44px;
    height: 44px;
  }

  /* 内置页脚：窄屏下无论哪种布局都把按钮热区兜到 44px */
  .je-dialog__footer--builtin .je-dialog__action {
    min-height: 44px;
  }
}

/*
 * 减弱动效时全部瞬切。
 * 注意必须把 .is-open / --top / --fullscreen 这些「状态类」也列进来：
 * 它们的选择器特异性比单个 .je-dialog__panel 高，只写基础类的话
 * 状态规则里的 transition 会反压回来，减弱动效实际不生效。
 */
@media (prefers-reduced-motion: reduce) {
  .je-dialog__scrim,
  .je-dialog.is-open .je-dialog__scrim,
  .je-dialog__panel,
  .je-dialog.is-open .je-dialog__panel,
  .je-dialog__panel.je-dialog--top,
  .je-dialog.is-open .je-dialog__panel.je-dialog--top,
  .je-dialog__panel.je-dialog--fullscreen,
  .je-dialog.is-open .je-dialog__panel.je-dialog--fullscreen,
  .je-dialog__panel.je-dialog--sheet,
  .je-dialog.is-open .je-dialog__panel.je-dialog--sheet {
    transition: none;
  }
}
</style>
