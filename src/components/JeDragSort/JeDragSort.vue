<template>
  <div class="je-drag-sort" :class="{ 'is-handle': !!handle }">
    <!-- 内置模式：组件渲染列表容器，内容由插槽定制 -->
    <ul
      v-if="!isExternal"
      ref="listEl"
      class="je-drag-sort__list"
      :class="{ 'is-dragging': dragging }"
      :style="{ '--je-drag-sort-height': height, '--je-drag-sort-item-min-width': itemMinWidth }"
    >
      <li
        v-for="(item, index) in currentItems"
        :key="item[itemKey]"
        class="je-drag-sort__item"
        :data-id="item[itemKey]"
      >
        <!-- 内置模式下的条目内容 -->
        <slot name="item" :item="item" :index="index">
          <span class="je-drag-sort__item-text">{{ item[itemKey] }}</span>
        </slot>
      </li>
    </ul>

    <!-- 拖拽时跟随鼠标的预览：显示被拖走的卡片与数量 -->
    <div v-show="dragging" ref="previewEl" class="je-drag-sort__preview">
      <div class="je-drag-sort__preview-count">{{ countLabel }}</div>
      <div ref="previewRowsEl" class="je-drag-sort__preview-rows"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 多选拖拽排序（设计思路参考 vue-draggable-plus）：
// - v-model：绑定数据数组，拖拽后自动按新顺序更新（旧的 v-model:items 也兼容）
// - target：可选，指定外部拖拽容器（CSS 选择器 | 元素 | () => 元素）。
//   传了 target 时组件不再渲染内部列表，而是直接为这个元素接入拖拽；
//   容器内的条目按位置与数据一一对应，使用方无需在条目上添加 data-id
// - handle：可选，拖拽手柄选择器；为空则整张卡片都可拖
// - draggable：可选，限定容器内哪些子元素是数据条目（CSS 选择器）；为空则全部子元素都视为条目
// - 内置模式下用插槽定制卡片内容；默认 flex 换行布局，每行数量随父级宽度自适应
// - 支持多选整组拖拽、跟随鼠标的预览、拖出列表上下边界继续滚动
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Sortable from 'sortablejs/modular/sortable.complete.esm.js'

import { useJeLocale } from '../JeLocale'
import type { JeDragSortEvent, JeDragSortItem, JeDragSortTarget } from './types'

defineOptions({ name: 'JeDragSort' })

const props = withDefaults(
  defineProps<{
    /** v-model 绑定的数据（与 items 等价，同时传时以它为准） */
    modelValue?: JeDragSortItem[]
    /** 兼容旧用法 v-model:items，等价于 modelValue */
    items?: JeDragSortItem[]
    /** 外部拖拽容器：CSS 选择器、元素本身、返回元素的函数或 ref 对象，传了它就不再渲染内置列表 */
    target?: JeDragSortTarget
    /** 拖拽手柄选择器，为空则整张卡片都可拖 */
    handle?: string
    /** 限定容器内哪些子元素是数据条目（CSS 选择器），为空则全部子元素都视为条目 */
    draggable?: string
    /** 数据唯一键字段 */
    itemKey?: string
    /** 每张卡片的最小宽度（内置模式），行内可放的数量随父级宽度自适应 */
    itemMinWidth?: string
    /** 列表可视区高度（内置模式），内容超出后出现滚动条 */
    height?: string
    /** 是否允许多选（关闭后只支持单条拖拽排序） */
    selectable?: boolean
    /** 拖动判定距离（px）：指针按下后移动超过该距离才真正进入拖拽 */
    dragThreshold?: number
  }>(),
  {
    modelValue: undefined,
    items: undefined,
    target: undefined,
    handle: '',
    draggable: '',
    itemKey: 'id',
    itemMinWidth: '220px',
    height: '420px',
    selectable: true,
    dragThreshold: 6,
  },
)

const emit = defineEmits<{
  /** 拖拽排序结束后回传新的数据顺序 */
  'update:modelValue': [value: JeDragSortItem[]]
  /** 与 update:modelValue 等价的旧事件名，供 v-model:items 使用 */
  'update:items': [value: JeDragSortItem[]]
  /** 选中项变化时回传当前选中的 id 集合 */
  'update:selectedIds': [value: Set<string | number>]
}>()

defineSlots<{
  /** 内置模式下的条目内容 */
  item?: (props: { item: JeDragSortItem; index: number }) => unknown
}>()

const { t } = useJeLocale()

// 当前数据源：优先 v-model 的 modelValue，其次旧的 items prop
const currentItems = computed<JeDragSortItem[]>(() =>
  props.modelValue !== undefined ? props.modelValue : (props.items ?? []),
)

// 是否为「外部容器」模式
const isExternal = computed(() => !!props.target)

const listEl = ref<HTMLElement | null>(null) // 内置模式下的列表容器
const externalEl = ref<HTMLElement | null>(null) // 外部模式下的容器
const previewEl = ref<HTMLElement | null>(null) // 跟随鼠标的拖拽预览容器
const previewRowsEl = ref<HTMLElement | null>(null) // 预览中的卡片容器

// 拖拽逻辑统一操作的目标容器
const rootEl = computed(() => (isExternal.value ? externalEl.value : listEl.value))

const dragging = ref(false)
const dragCount = ref(0)
const MAX_PREVIEW = 3 // 预览最多展示几条，超出用「+N 条」表示
const SCROLL_SPEED = 15 // 越界滚动的基础速度（px/帧）

// 预览里的数量标签走语言包，切换语言时跟着变
const countLabel = computed(() => t('dragSort.count', { count: dragCount.value }))

/** Sortable 实例（sortablejs 无类型声明，见同目录的 sortable.d.ts） */
let sortable: any = null
let dragIds = new Set<string>() // 本次拖动开始时选中的 id 集合
let pointerHandler: ((event: PointerEvent) => void) | null = null
let lastPointer: { clientX: number; clientY: number } | null = null // 最近一次指针坐标，用于越界滚动判断
let scrollTimer: ReturnType<typeof setInterval> | null = null

// ---------- 初始化 ----------
function resolveTarget(): void {
  let el: unknown = typeof props.target === 'function' ? props.target() : props.target
  // 兼容传入 ref 对象
  if (el && typeof el === 'object' && 'value' in el) el = (el as { value: unknown }).value
  if (typeof el === 'string') el = document.querySelector(el)
  externalEl.value = el instanceof HTMLElement ? el : null
}

async function ensureTarget(): Promise<void> {
  // 外部容器可能在组件挂载后才渲染（如位于组件之后），最多重试若干帧
  for (let i = 0; i < 10 && !externalEl.value; i++) {
    resolveTarget()
    if (externalEl.value) break
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  if (props.target && !externalEl.value) {
    console.warn('[JeDragSort] 未找到 target 指定的容器，请检查选择器 / 元素是否正确')
  }
}

function initSortable(): void {
  const el = rootEl.value
  if (!el || sortable) return
  // 供外部模式的基础反馈样式定位（见文件末尾的非 scoped 样式块）
  if (isExternal.value) el.classList.add('je-drag-sort--external')
  sortable = Sortable.create(el, {
    animation: 200,
    // 限定条目选择器；为空则全部直接子元素都可拖（条目上的 data-id 由组件内部自动维护）。
    // 注意不能用 undefined：SortableJS 只有在选项键缺失时才用默认值 '>*'，显式传 undefined 会导致拖拽无法启动
    draggable: props.draggable || '>*',
    multiDrag: props.selectable, // 允许多选时才启用 MultiDrag 插件
    selectedClass: 'is-selected', // 选中项样式类
    multiDragClass: 'is-multi-drag', // 正在拖拽的整组样式类
    ghostClass: 'is-ghost', // 落点占位样式类
    filter: 'input, button, a', // 这些元素不触发拖拽
    preventOnFilter: false,
    forceFallback: true, // 使用自绘 ghost，便于驱动「超出边界仍继续滚动」
    fallbackOnBody: true, // ghost 挂到 body，避免被列表的 overflow 裁剪
    fallbackClass: 'je-drag-sort--fallback',
    scroll: false, // 关闭内置自动滚动，改用自定义的越界滚动（scrollTick）
    removeCloneOnHide: true, // 拖拽结束后移除克隆占位，避免残留干扰顺序同步
    // 移动超过 dragThreshold 像素才进入拖拽，防止点击时的轻微位移误触发
    fallbackTolerance: props.dragThreshold,
    // 不注册 document 级 mouseup 的「隐式全不选」：
    // 否则点击列表外的工具栏 / 间隙会逐个反选全部项，数据量大时卡死，且容易把已选项误清掉
    avoidImplicitDeselect: true,
    handle: props.handle || undefined, // 指定拖拽手柄后，只有手柄区域可拖
    onSelect: syncSelection, // 选中变化时同步状态
    onDeselect: syncSelection,
    onStart: (evt: JeDragSortEvent) => startDragFeedback(evt),
    onMove: markClones, // 拖拽中高亮「被拿起」的占位卡片
    onEnd: () => {
      stopDragFeedback()
      syncOrder() // 拖拽结束后按 DOM 顺序同步数组
      syncSelection() // 拖拽结束收尾时可能涉及选中态变化，重新同步保证与界面一致
      // v-model 更新会让外部列表重新渲染并可能清掉 data-id，DOM 更新后按新顺序补齐
      nextTick(syncDataIds)
    },
    onCancel: stopDragFeedback,
  })
}

onMounted(async () => {
  if (isExternal.value) {
    await ensureTarget()
    if (!externalEl.value) return
  }
  syncDataIds() // 外部模式下先补齐条目 data-id，供内部映射使用
  initSortable()
})

// 数据变化（如外部列表增删、拖拽后重排触发 v-model 更新）后，DOM 会被重新渲染，
// 外部位条目上的 data-id 可能被清掉；在 DOM 更新完成后按新顺序补回来
watch(currentItems, () => nextTick(syncDataIds))

// target 变化时（例如外部容器由 null 变为元素）重新接入
watch(
  () => props.target,
  async () => {
    sortable?.destroy()
    sortable = null
    if (isExternal.value) {
      await ensureTarget()
      if (!externalEl.value) return
    }
    syncDataIds()
    initSortable()
  },
)

onBeforeUnmount(() => {
  stopDragFeedback()
  sortable?.destroy()
  sortable = null
})

// ---------- 内部 data-id 维护 ----------
// 使用方无需在条目上写 data-id：组件按「容器子元素顺序 ↔ 数据顺序」自动补齐，
// 仅用于内部的 DOM ↔ 数据映射（顺序同步、选中同步、拖拽计数等）。
// MultiDrag 的克隆占位由 cloneNode 生成，会自动继承 data-id，
// 因此拖拽过程中按 data-id 区分「被拿起」的占位仍然成立。
function syncDataIds(): void {
  if (!isExternal.value) return // 内置模式模板已带 :data-id，无需维护
  const el = rootEl.value
  if (!el) return
  const items = currentItems.value
  let index = 0
  for (const child of Array.from(el.children) as HTMLElement[]) {
    if (props.draggable && !child.matches(props.draggable)) continue // 跳过非条目子元素
    const item = items[index]
    if (item) child.dataset.id = String(item[props.itemKey])
    index++
  }
}

// ---------- 顺序同步 ----------
function syncOrder(): void {
  const el = rootEl.value
  if (!el) return
  const byId = new Map(currentItems.value.map((it) => [String(it[props.itemKey]), it]))
  const ordered: JeDragSortItem[] = []
  for (const child of Array.from(el.children) as HTMLElement[]) {
    const id = child.dataset.id
    if (!id) continue // 跳过非条目子元素（未参与自动 id 映射）
    const item = byId.get(String(id))
    if (item) ordered.push(item)
  }
  if (ordered.length === currentItems.value.length) {
    emit('update:modelValue', ordered)
    emit('update:items', ordered)
  }
}

// ---------- 选中状态同步 ----------
// 选中 / 取消可能以「批量」方式触发（例如一次性反选全部、拖拽结束清理选中），
// 若每个元素的事件都做一次全量 DOM 查询 + emit，数据量大时会明显卡顿。
// 这里把同步合并到一次微任务里：同一帧内多次调用只做一次读取 + 一次 emit。
let selectionDirty = false
let selectionFlushQueued = false

function syncSelection(): void {
  selectionDirty = true
  if (selectionFlushQueued) return
  selectionFlushQueued = true
  Promise.resolve().then(flushSelection)
}

function flushSelection(): void {
  selectionFlushQueued = false
  if (!selectionDirty) return
  selectionDirty = false
  const el = rootEl.value
  if (!el) return
  // 以数据源为准还原 id 的原始类型（数字 / 字符串），保证与 v-model 里的数据一致
  const byId = new Map(currentItems.value.map((it) => [String(it[props.itemKey]), it]))
  const ids = new Set<string | number>()
  el.querySelectorAll<HTMLElement>('[data-id].is-selected').forEach((node) => {
    const item = byId.get(String(node.dataset.id))
    ids.add(item ? item[props.itemKey] : String(node.dataset.id))
  })
  emit('update:selectedIds', ids)
}

// ---------- 选择操作（供插槽内的复选框或外部按钮调用） ----------
/** 切换单条的选中状态 */
function toggleSelect(id: string | number): void {
  if (!props.selectable || !rootEl.value) return
  const el = rootEl.value.querySelector<HTMLElement>(`[data-id="${id}"]`)
  if (!el) return
  if (el.classList.contains('is-selected')) {
    Sortable.utils.deselect(el)
    // utils.deselect 对「类在但不在内部多选数组」的元素是空操作，不会移除类；
    // 这里兜底移除，避免出现「显示已选中但其实没选上」的不一致
    el.classList.remove('is-selected')
  } else {
    Sortable.utils.select(el)
    // utils.select 对「已在内部多选数组」的元素是空操作，不会加上类；
    // 这里兜底加上，避免「内部已选中但界面没高亮」的不一致
    el.classList.add('is-selected')
  }
  syncSelection()
}

/** 全选当前列表 */
function selectAll(): void {
  if (!props.selectable || !rootEl.value) return
  rootEl.value.querySelectorAll<HTMLElement>('[data-id]').forEach((el) => {
    Sortable.utils.select(el)
    el.classList.add('is-selected') // 兜底，保证类与内部多选状态一致
  })
  syncSelection()
}

/** 清空选中 */
function clearSelection(): void {
  if (!props.selectable || !rootEl.value) return
  rootEl.value.querySelectorAll<HTMLElement>('[data-id].is-selected').forEach((el) => {
    Sortable.utils.deselect(el)
    el.classList.remove('is-selected') // 兜底，保证类与内部多选状态一致
  })
  syncSelection()
}

defineExpose({ toggleSelect, selectAll, clearSelection })

// ---------- 拖拽可视化反馈 ----------
// 开始拖拽：记录行数，生成跟随鼠标的卡片预览
function startDragFeedback(evt: JeDragSortEvent): void {
  dragging.value = true
  const originalEvent = evt.originalEvent
  dragIds = new Set()
  rootEl.value?.querySelectorAll<HTMLElement>('[data-id].is-selected').forEach((node) => {
    if (node.dataset.id) dragIds.add(String(node.dataset.id))
  })
  // 直接拖拽未选中的卡片时，当前这张也要计入拖拽组，保证预览与计数不为空
  if (evt.item?.dataset.id) dragIds.add(String(evt.item.dataset.id))
  dragCount.value = dragIds.size
  buildPreview(evt.item)

  // 先用开始拖拽时的事件定位，避免预览在左上角闪现
  if (originalEvent && previewEl.value) {
    previewEl.value.style.left = `${originalEvent.clientX}px`
    previewEl.value.style.top = `${originalEvent.clientY}px`
  }

  if (!pointerHandler) {
    pointerHandler = (event: PointerEvent) => {
      lastPointer = event
      if (!previewEl.value) return
      previewEl.value.style.left = `${event.clientX}px`
      previewEl.value.style.top = `${event.clientY}px`
    }
    window.addEventListener('pointermove', pointerHandler)
  }

  // 启动越界滚动驱动：指针超出列表上下边界时仍持续滚动
  if (!scrollTimer) {
    scrollTimer = setInterval(scrollTick, 30)
  }
}

// 结束拖拽：隐藏预览、停止滚动、移除克隆高亮
function stopDragFeedback(): void {
  dragging.value = false
  dragCount.value = 0
  dragIds = new Set()
  lastPointer = null
  if (pointerHandler) {
    window.removeEventListener('pointermove', pointerHandler)
    pointerHandler = null
  }
  if (scrollTimer) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }
  if (previewRowsEl.value) {
    previewRowsEl.value.innerHTML = ''
  }
  rootEl.value?.querySelectorAll<HTMLElement>('[data-id].is-clone').forEach((el) => {
    el.classList.remove('is-clone')
  })
  setTimeout(() => {
    clearSelection() // 拖拽结束后清空选中，避免残留干扰下一次拖拽
  }, 1000)
}

// 越界滚动：指针超出列表上下边界时，持续朝对应方向滚动；
// 滚动后把坐标钳制到列表边缘喂给 sortable，让插入位置跟着滚动走
function scrollTick(): void {
  const el = rootEl.value
  if (!el || !lastPointer) return
  const rect = el.getBoundingClientRect()
  const y = lastPointer.clientY
  let delta = 0
  if (y < rect.top) {
    delta = -(SCROLL_SPEED + Math.min((rect.top - y) / 4, 25))
  } else if (y > rect.bottom) {
    delta = SCROLL_SPEED + Math.min((y - rect.bottom) / 4, 25)
  }
  if (delta === 0) return

  const prev = el.scrollTop
  el.scrollTop += delta
  if (el.scrollTop === prev || !sortable) return

  const insideX = Math.min(Math.max(lastPointer.clientX, rect.left + 2), rect.right - 2)
  const insideY = delta < 0 ? rect.top + 2 : rect.bottom - 2
  // 用列表边缘内的坐标驱动 sortable 重算插入位置（_onTouchMove 是它内部的处理入口，没有公开等价物）
  sortable._onTouchMove({ clientX: insideX, clientY: insideY })
}

// 生成拖拽预览：把被拖走的卡片克隆进跟随鼠标的预览容器
function buildPreview(primaryEl?: HTMLElement): void {
  const rows = previewRowsEl.value
  if (!rows) return
  rows.innerHTML = ''
  const picked = [...(rootEl.value?.querySelectorAll<HTMLElement>('[data-id].is-selected') ?? [])]
  // 未选中卡片被直接拖拽时，把当前这张补进预览，保证至少有内容
  if (primaryEl && !primaryEl.classList.contains('is-selected')) {
    picked.push(primaryEl)
  }
  picked.forEach((el, index) => {
    if (index < MAX_PREVIEW) {
      const clone = el.cloneNode(true) as HTMLElement
      // MultiDrag 折叠动画会给真实元素写入 position / left / top 等内联样式，
      // 直接克隆会把这些样式带进预览，导致卡片脱离布局悬浮在远处；
      // 预览卡片完全依赖 CSS 类，因此清掉克隆继承的内联样式即可
      clone.removeAttribute('style')
      rows.appendChild(clone)
    }
  })
  if (picked.length > MAX_PREVIEW) {
    const more = document.createElement('div')
    more.className = 'je-drag-sort__preview-more'
    more.textContent = t('dragSort.more', { count: picked.length - MAX_PREVIEW })
    rows.appendChild(more)
  }
}

// 拖拽过程中，为「被拿起」的占位卡片（MultiDrag 留在原位的克隆）加上高亮类
function markClones(): void {
  const el = rootEl.value
  if (!el) return
  for (const item of Array.from(el.children) as HTMLElement[]) {
    const picked = dragIds.has(String(item.dataset.id))
    if (!picked) {
      // 未被拖走的卡片：仅当已有高亮时才移除，避免大量无意义的操作
      if (item.classList.contains('is-clone')) item.classList.remove('is-clone')
      continue
    }
    const isDragEl = item.classList.contains('is-ghost') // 正跟手的那一张
    const isRealSelected = item.classList.contains('is-selected') // 折叠动画中的真实元素
    item.classList.toggle('is-clone', !isDragEl && !isRealSelected)
  }
}
</script>

<style scoped>
.je-drag-sort__list {
  margin: 0;
  padding: 8px;
  list-style: none;
  display: flex;
  flex-wrap: wrap; /* 换行布局：每行可展示多条，数量随父级宽度自适应 */
  align-content: flex-start;
  gap: 8px;
  height: var(--je-drag-sort-height); /* 固定可视区高度，内容超出出现滚动条 */
  overflow-y: auto;
  border: 1px solid var(--je-border-color);
  border-radius: var(--je-radius-sm);
  box-sizing: border-box;
}

.je-drag-sort__list::-webkit-scrollbar {
  width: 8px;
}

.je-drag-sort__list::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: color-mix(in srgb, var(--je-text) 20%, transparent);
}

.je-drag-sort__list::-webkit-scrollbar-track {
  background: transparent;
}

.je-drag-sort__item {
  /* 以内容宽度为基准，保证最小宽度后拉伸填满整行，从而自适应每行数量 */
  flex: 1 1 auto;
  min-width: var(--je-drag-sort-item-min-width);
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--je-border-color);
  border-radius: var(--je-radius-sm);
  background: var(--je-surface);
  cursor: grab;
  user-select: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.je-drag-sort__item:active {
  cursor: grabbing;
}

/* 指定了拖拽手柄后，整张卡片不再显示抓取光标（手柄上由使用方自行加 grab 光标） */
.je-drag-sort.is-handle .je-drag-sort__item {
  cursor: default;
}

/* 指针移入数据项：强调色描边 + 轻微浮起 */
.je-drag-sort__list:not(.is-dragging) .je-drag-sort__item:hover {
  border-color: var(--je-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--je-primary) 15%, transparent);
  transform: translateY(-2px);
}

.je-drag-sort__item.is-selected {
  border-color: var(--je-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--je-primary) 15%, transparent);
}

.je-drag-sort__item.is-multi-drag {
  opacity: 0.9;
}

.je-drag-sort__item.is-ghost {
  /* 落点占位：用强调色虚线高亮，而不是压暗成黑色蒙版 */
  border-style: dashed;
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 15%, transparent);
}

/* 拖拽中：留在原位的克隆占位卡片高亮 */
.je-drag-sort__item.is-clone {
  opacity: 0.8;
  border-style: dashed;
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 15%, transparent);
}

/* 跟随鼠标的拖拽预览：顶部数量标签 + 卡片堆叠（整体半透明） */
.je-drag-sort__preview {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  transform: translate(16px, 12px);
  width: 320px;
  opacity: 0.9; /* 悬浮层半透明，可隐约看到下方内容 */
  pointer-events: none;
  user-select: none;
}

.je-drag-sort__preview-count {
  display: inline-block;
  margin-bottom: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--je-text-on-color);
  background: var(--je-primary);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
}

.je-drag-sort__preview-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  filter: drop-shadow(0 8px 18px rgba(15, 23, 42, 0.22));
}

/* 预览中的任意子卡片：固定占满预览宽度（外部 target 模式下也适用） */
.je-drag-sort__preview-rows > :not(.je-drag-sort__preview-more) {
  flex: 0 0 auto;
  width: 100%;
  overflow: hidden;
  cursor: grabbing;
}

/* 内置模式预览卡片：轻微旋转体现「被拿起」的堆叠感 */
.je-drag-sort__preview-rows .je-drag-sort__item {
  transform: rotate(-0.6deg);
}

.je-drag-sort__preview-rows .je-drag-sort__item:nth-child(2) {
  transform: rotate(0.4deg);
}

.je-drag-sort__preview-rows .je-drag-sort__item:nth-child(3) {
  transform: rotate(-0.2deg);
}

.je-drag-sort__preview-more {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  background: var(--je-surface-hover);
  color: var(--je-text);
}

@media (prefers-reduced-motion: reduce) {
  .je-drag-sort__item {
    transition: none;
  }
}
</style>

<style>
/* 外部 target 模式下的基础拖拽反馈（非 scoped，作用到使用方自渲染的条目）。
   data-id 由组件内部自动维护；is-selected / is-ghost / is-clone 等类由组件维护 */
.je-drag-sort--external [data-id].is-selected {
  outline: 2px solid var(--je-primary, #667eea);
  outline-offset: -1px;
}

.je-drag-sort--external [data-id].is-multi-drag {
  opacity: 0.9;
}

.je-drag-sort--external [data-id].is-ghost {
  outline: 2px dashed var(--je-primary, #667eea);
  outline-offset: -1px;
  opacity: 0.7;
}

.je-drag-sort--external [data-id].is-clone {
  opacity: 0.8;
}

/* 兜底隐藏 forceFallback 在 body 上生成的跟手克隆（内置模式由 scoped 规则处理） */
.je-drag-sort--fallback {
  display: none;
}
</style>
