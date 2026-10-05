<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { nextZIndex } from '../../core/useZIndex'
import { JeEmpty } from '../JeEmpty'
import { JeIcon } from '../JeIcon'
import type { JeIconName } from '../JeIcon/icons'
import { JeScrollbar } from '../JeScrollbar'
import { JeTooltip } from '../JeTooltip'
import { useTeleportTarget } from '../JeConfigProvider/types'
import type {
  JeTableCellRef,
  JeTableCellSpan,
  JeTableCellStyle,
  JeTableColumn,
  JeTableProps,
  JeTableRow,
  JeTableSortOrder,
} from './types'

defineOptions({ name: 'JeTable' })

const props = withDefaults(defineProps<JeTableProps>(), {
  border: false,
  stripe: false,
  size: 'default',
  layout: 'auto',
  cardLabelPosition: 'left',
  height: undefined,
  maxHeight: undefined,
  emptyText: '暂无数据',
  rowKey: 'id',
  showHeader: true,
  highlightCurrentRow: false,
  currentRowKey: undefined,
  rowClassName: '',
  rowStyle: undefined,
  cellClassName: '',
  cellStyle: undefined,
  spanMethod: undefined,
  defaultExpandAll: false,
  expandRowKeys: undefined,
  showSummary: false,
  summaryMethod: undefined,
  sumText: '合计',
  treeProps: () => ({ children: 'children', hasChildren: 'hasChildren' }),
  lazy: false,
  load: undefined,
  cellSelection: false,
  virtual: false,
  itemHeight: 48,
  overscan: 4,
  rowDraggable: false,
  groupBy: undefined,
  groupSummary: false,
  groupSummaryMethod: undefined,
  groupSummaryText: '小计',
  groupExpandable: false,
  defaultGroupExpanded: true,
  teleportTo: undefined,
})

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

/** 窄屏判定：卡片形态与筛选浮层的贴底样式共用同一次订阅 */
const isMobile = useIsMobile()

/** 卡片形态：layout 显式指定为准，auto 时由屏幕宽度决定（窄屏走卡片、宽屏走表格） */
const cardMode = computed(
  () => props.layout === 'card' || (props.layout === 'auto' && isMobile.value),
)

const emit = defineEmits<{
  /** 行被点击时触发，回传行数据与行下标 */
  'row-click': [row: JeTableRow, index: number]
  /** 勾选变化时触发，回传当前全部选中行；调用暴露的 toggleRowSelection 等 API 不会触发 */
  'selection-change': [rows: JeTableRow[]]
  /** 排序状态变化时触发，order 为 null 表示取消排序；sortable: 'custom' 时只发事件不本地排序 */
  'sort-change': [payload: { prop: string; order: JeTableSortOrder }]
  /** 列筛选确认或清除时触发（浮层点「重置 / 确认」、调用 clearFilter）；filters 为空数组表示该列已清除筛选 */
  'filter-change': [payload: { prop: string; values: Array<string | number | boolean> }]
  /** 拖拽列宽结束时触发，回传该列最新宽度（px） */
  'column-resize': [payload: { prop: string; width: number }]
  /** 当前高亮行变化时触发，仅在 highlightCurrentRow 生效；切换时会同时回传旧值 */
  'current-change': [currentRow: JeTableRow | null, oldCurrentRow: JeTableRow | null]
  /** 展开行展开 / 收起时触发，expanded 为最新状态 */
  'expand-change': [row: JeTableRow, expanded: boolean]
  /** 树形子行展开 / 收起时触发（与展开行的 expand-change 是两回事） */
  'tree-expand-change': [row: JeTableRow, expanded: boolean]
  /** 单元格框选范围落定时触发（拖拽松手或单击），cells 按先行后列的顺序给出 */
  'cell-selection-change': [payload: { cells: JeTableCellRef[] }]
  /** 行拖拽排序结束时触发（row-draggable 生效时）；rows 是按新顺序排好的完整行数组，data 由调用方写回 */
  'row-drag-end': [payload: { from: number; to: number; rows: JeTableRow[]; row: JeTableRow }]
  /** 分组展开 / 收起时触发（group-expandable 生效时），key 是分组的取值 */
  'group-expand-change': [payload: { key: string | number; expanded: boolean }]
}>()

const slots = useSlots()

/** 组件根节点：行拖拽时按它查表体里当前渲染出来的数据行 */
const rootRef = ref<HTMLElement | null>(null)

/**
 * 溢出提示的 tooltip 触发元素 id。
 * JeTooltip 的触发元素会渲染成它自己的 span，不再是单元格本身，
 * 这里按「行列坐标」生成稳定 id（而不是自增计数），SSR / 客户端水合结果才能一致。
 */
const tooltipId = (rowIndex: number, columnIndex: number) =>
  `je-table-tip-${rowIndex}-${columnIndex}`

/** 日期样式字符串：YYYY-MM-DD，可带时间 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/

/** 内置排序：数字 → 日期字符串 → 字符串；未知值排在最前 */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b

  const left = String(a)
  const right = String(b)
  if (DATE_PATTERN.test(left) && DATE_PATTERN.test(right)) {
    return Date.parse(left.replace(' ', 'T')) - Date.parse(right.replace(' ', 'T'))
  }

  const leftNum = Number(left)
  const rightNum = Number(right)
  if (left !== '' && right !== '' && !Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
    return leftNum - rightNum
  }
  return left.localeCompare(right, 'zh-Hans-CN')
}

const sortState = ref<{ prop: string; order: JeTableSortOrder; custom: boolean }>({
  prop: '',
  order: null,
  custom: false,
})
const selectedKeys = ref<Array<string | number>>([])
const currentKey = ref<string | number | null>(null)
const expandedKeys = ref<Array<string | number>>([])

/**
 * 框选拖过多个单元格后，抑制紧随其后的那一次 row-click。
 * 用 ref 而不是普通变量：onRowClick 在模板里被调用，与框选逻辑分处两个代码块，
 * 共用一个显式的响应式引用比拼「谁先声明」更清楚。
 */
const suppressRowClick = ref(false)

/**
 * 筛选状态：列 key → 已确认生效的筛选项值。
 * 只存列 key 与值，不存整列配置，列配置变化（比如外部重建 columns 数组）时状态不会丢。
 */
const filterState = ref<Record<string, Array<string | number | boolean>>>({})

/**
 * 拖拽后的列宽覆盖：列 key → 像素宽度。
 * 拖拽只改这一份覆盖值，不改调用方传进来的 columns（props 只读），
 * 于是「受控地重建 columns」与「用户手动拖宽」两种来源不会互相打架。
 */
const resizedWidths = ref<Record<string, number>>({})

const draggingColKey = ref<string | null>(null)
const dragOffsetX = ref(0)

/**
 * 列 key：优先用 prop（同一张表里它天然唯一），没有 prop 的特殊列退化为 type。
 * 与「筛选 / 列宽覆盖 / 当前筛选列」三处状态共用，保证同一个列在哪儿都是同一个 key。
 */
const colKeyOf = (column: JeTableColumn): string => column.prop ?? column.type ?? ''

/** 该列是否有可勾选的筛选项 */
const hasFilters = (column: JeTableColumn) => !!column.filters?.length

/** 是否允许拖拽调宽：默认允许，列上显式写 resizable: false 才关掉 */
const isResizable = (column: JeTableColumn) => column.resizable !== false

/**
 * 行 key 支持字符串字段名与函数两种写法。
 * 字符串按 `.` 拆层读取（`user.info.id`），是为了兼容 EP 的 row-key 用法；
 * 旧行为 `row[rowKey]` 是它的子集，所以对已有调用方没有任何影响。
 */
const getRowKey = (row: JeTableRow, index: number): string | number => {
  const source = props.rowKey
  let raw: unknown
  if (typeof source === 'function') {
    raw = source(row)
  } else {
    raw = source.split('.').reduce<unknown>((acc, segment) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[segment]
      return undefined
    }, row)
  }
  return typeof raw === 'string' || typeof raw === 'number' ? raw : index
}

/** 命令式 API 传入的行对象到 key 的换算；行不在当前 data 里时退回 index 0 只在读取时用 */
const keyOf = (row: JeTableRow): string | number => {
  const found = rowKeyIndex.value.byRow.get(row)
  if (found != null) return found
  const index = props.data.indexOf(row)
  return getRowKey(row, index === -1 ? 0 : index)
}

// ---------------- 树形数据 ----------------

/** 子行数组挂在行数据的哪个字段上 */
const treeChildrenKey = computed(() => props.treeProps?.children ?? 'children')

/** 「是否还有子行」的标记挂在哪个字段上，懒加载树靠它决定要不要画箭头 */
const treeHasChildrenKey = computed(() => props.treeProps?.hasChildren ?? 'hasChildren')

/** 行的直接子行；字段不是数组时视为没有子行 */
const treeChildrenOf = (row: JeTableRow): JeTableRow[] => {
  const raw = row[treeChildrenKey.value]
  return Array.isArray(raw) ? (raw as JeTableRow[]) : []
}

/** 是否有可展开的子行：实际挂了子行数组，或懒加载下声明了 hasChildren */
const hasTreeChildren = (row: JeTableRow): boolean =>
  treeChildrenOf(row).length > 0 || (props.lazy && row[treeHasChildrenKey.value] === true)

/** 顶层行里是否存在树形结构；没有的话整条树形渲染链路都空转，普通表格完全不受影响 */
const hasTreeData = computed(() => props.data.some((row) => hasTreeChildren(row)))

/**
 * 行对象 ↔ key 的双向索引。
 * 树形子行不在 props.data 顶层，`data.indexOf(row)` 找不到，所以整棵树都建上索引；
 * 非树形数据下它与原来的 indexOf 等价。
 */
const rowKeyIndex = computed(() => {
  const byRow = new Map<JeTableRow, string | number>()
  const byKey = new Map<string | number, JeTableRow>()
  const walk = (rows: JeTableRow[]) => {
    rows.forEach((row, index) => {
      const key = getRowKey(row, index)
      byRow.set(row, key)
      if (!byKey.has(key)) byKey.set(key, row)
      walk(treeChildrenOf(row))
    })
  }
  walk(props.data)
  return { byRow, byKey }
})

const rowByKey = (key: string | number | null | undefined): JeTableRow | null =>
  key == null ? null : rowKeyIndex.value.byKey.get(key) ?? null

/** 树形行的展开状态，与展开行（type=expand 列）的 expandedKeys 完全分开 */
const treeExpandedKeys = ref<Array<string | number>>([])

/** 正在懒加载的行 key，用于把箭头换成转圈 */
const treeLoadingKeys = ref<Array<string | number>>([])

/** 懒加载：同一条只拉一次，拉回来的子行直接写回该行的 children 字段 */
const loadTreeChildren = (row: JeTableRow, key: string | number) => {
  const load = props.load
  if (!load || treeLoadingKeys.value.includes(key)) return
  treeLoadingKeys.value = [...treeLoadingKeys.value, key]
  load(row, (children) => {
    row[treeChildrenKey.value] = Array.isArray(children) ? children : []
    row[treeHasChildrenKey.value] = false
    treeLoadingKeys.value = treeLoadingKeys.value.filter((item) => item !== key)
  })
}

const toggleTreeRow = (row: JeTableRow, index: number) => {
  const key = getRowKey(row, index)
  if (treeExpandedKeys.value.includes(key)) {
    treeExpandedKeys.value = treeExpandedKeys.value.filter((item) => item !== key)
    emit('tree-expand-change', row, false)
    return
  }
  if (props.lazy && !treeChildrenOf(row).length && row[treeHasChildrenKey.value] === true) {
    loadTreeChildren(row, key)
  }
  treeExpandedKeys.value = [...treeExpandedKeys.value, key]
  emit('tree-expand-change', row, true)
}

/** 递归收集所有含子行的 key，供 defaultExpandAll 一次性铺开 */
const collectTreeKeys = (rows: JeTableRow[]): Array<string | number> => {
  const keys: Array<string | number> = []
  rows.forEach((row, index) => {
    if (!hasTreeChildren(row)) return
    keys.push(getRowKey(row, index))
    keys.push(...collectTreeKeys(treeChildrenOf(row)))
  })
  return keys
}

// ---------------- 当前行高亮 ----------------

/** 传了 currentRowKey 就完全受控：内部不再落状态，全部以外部值为准 */
const currentControlled = computed(() => props.currentRowKey !== undefined)

const currentRow = computed<JeTableRow | null>(() => {
  const key = currentControlled.value ? props.currentRowKey : currentKey.value
  return rowByKey(key)
})

/**
 * 「是否高亮当前行」统一走这个 computed，而不是在模板与逻辑里各处直接读 props。
 * 好处是判定口径只有一处：以后要支持 highlight-current-row 的字符串写法或加默认值，
 * 只改这里，样式与交互不会分叉。
 */
const highlightEnabled = computed(() => props.highlightCurrentRow === true)

const isCurrentRow = (row: JeTableRow, index: number) => {
  const key = currentControlled.value ? props.currentRowKey : currentKey.value
  return key != null && getRowKey(row, index) === key
}

const setCurrentRowByKey = (key: string | number | null) => {
  if (currentControlled.value) return
  const previous = currentRow.value
  if (currentKey.value === key) return
  currentKey.value = key
  emit('current-change', currentRow.value, previous)
}

/** row-click 是高亮与行事件共用的入口：先决定高亮，再无条件抛出点击事件 */
const onRowClick = (row: JeTableRow, index: number) => {
  // 框选松手后的那一次 click 是拖拽的副产品，直接吃掉，不然会顺手把行高亮/展开
  if (suppressRowClick.value) {
    suppressRowClick.value = false
    return
  }
  if (highlightEnabled.value) {
    const key = getRowKey(row, index)
    setCurrentRowByKey(isCurrentRow(row, index) ? null : key)
  }
  emit('row-click', row, index)
}

// currentRowKey 被外部改动时也要通知出去，否则父组件拿不到「旧值」做清理
watch(
  () => props.currentRowKey,
  (key, oldKey) => {
    if (key === oldKey) return
    emit('current-change', rowByKey(key), rowByKey(oldKey))
  },
)

// ---------------- 多选 ----------------

/** selection 列可以按行禁用；被禁用（selectable 返回 false）的行不参与全选 */
const isSelectable = (row: JeTableRow, index: number) => {
  const column = leafColumns.value.find((item) => item.type === 'selection')
  return column?.selectable ? column.selectable(row, index) !== false : true
}

const selectableIndexes = computed(() =>
  props.data.reduce<number[]>((list, row, index) => {
    if (isSelectable(row, index)) list.push(index)
    return list
  }, []),
)

const isRowSelected = (row: JeTableRow, index: number) =>
  selectedKeys.value.includes(getRowKey(row, index))

const selectedRows = computed(() =>
  props.data.filter((row, index) => selectedKeys.value.includes(getRowKey(row, index))),
)

const allSelected = computed(
  () =>
    selectableIndexes.value.length > 0 &&
    selectableIndexes.value.every((index) =>
      selectedKeys.value.includes(getRowKey(props.data[index], index)),
    ),
)
const someSelected = computed(() => selectedRows.value.length > 0 && !allSelected.value)

const toggleRow = (row: JeTableRow, index: number) => {
  const key = getRowKey(row, index)
  selectedKeys.value = selectedKeys.value.includes(key)
    ? selectedKeys.value.filter((item) => item !== key)
    : [...selectedKeys.value, key]
  emit('selection-change', selectedRows.value)
}

const toggleAll = () => {
  selectedKeys.value = allSelected.value
    ? []
    : selectableIndexes.value.map((index) => getRowKey(props.data[index], index))
  emit('selection-change', selectedRows.value)
}

/**
 * data 变了一次就按 key 重新过滤选中项。
 * 不这么做的话，翻页 / 重新请求之后 key 已经不存在的行仍会被算进 selectedRows，
 * 「已选 N 行」和全选态都会跟着错。
 */
watch(
  [() => props.data, () => props.rowKey],
  () => {
    // 树形子行也算有效行，否则展开出来的子行勾选/高亮会被当成脏数据清掉
    const valid = new Set(rowKeyIndex.value.byRow.values())
    const next = selectedKeys.value.filter((key) => valid.has(key))
    if (next.length !== selectedKeys.value.length) selectedKeys.value = next

    // 当前高亮行同理；受控模式交给外部决定，不动内部状态
    if (!currentControlled.value && currentKey.value != null && !valid.has(currentKey.value)) {
      currentKey.value = null
    }
  },
  { deep: false },
)

// ---------------- 列树（多级表头） ----------------

/**
 * 叶子列：真正承载数据的列。
 * 多级表头下 columns 是一棵树，colgroup / 表体 / 固定列偏移 / 合并单元格 / 合计行只认叶子列，
 * 分组列（有 children 的列）只出现在表头里。
 */
const leafColumns = computed<JeTableColumn[]>(() => {
  const out: JeTableColumn[] = []
  const walk = (columns: JeTableColumn[]) => {
    columns.forEach((column) => {
      if (column.children?.length) walk(column.children)
      else out.push(column)
    })
  }
  walk(props.columns)
  return out
})

const leafColumnIndex = (column: JeTableColumn) => leafColumns.value.indexOf(column)

/** 分组列判定：写了非空 children 的列不承载数据 */
const isGroupColumn = (column: JeTableColumn) => !!column.children?.length

/** 全部列（含分组列）的先序展开：筛选判定要覆盖挂在分组列上的 filters */
const flatColumns = computed<JeTableColumn[]>(() => {
  const out: JeTableColumn[] = []
  const walk = (columns: JeTableColumn[]) => {
    columns.forEach((column) => {
      out.push(column)
      if (column.children?.length) walk(column.children)
    })
  }
  walk(props.columns)
  return out
})

/**
 * 列在排序 / 筛选上的「生效目标列」。
 * 叶子列就是它自己；分组列（有 children）委托给它最左侧的叶子列 ——
 * 于是分组表头也能挂 sortable / filters，点分组标题即按第一个子列排序 / 筛选。
 */
const delegateColumn = (column: JeTableColumn): JeTableColumn => {
  let target = column
  while (target.children?.length) target = target.children[0]
  return target
}

/** 参与排序 / 默认筛选的字段名：分组列取的是它委托叶子列的 prop */
const propOf = (column: JeTableColumn): string => delegateColumn(column).prop ?? ''

/** 提供排序入口的列：自己写了 sortable，且能解析出排序字段 */
const canSort = (column: JeTableColumn) => !!column.sortable && !!propOf(column)

/** 筛选状态键：分组列与它的委托叶子列共用同一个键，两边看到同一份筛选值 */
const filterKeyOf = (column: JeTableColumn): string => colKeyOf(delegateColumn(column))

interface JeTableHeaderCell {
  column: JeTableColumn
  colSpan: number
  rowSpan: number
}

const isGroupHeader = (cell: JeTableHeaderCell) => isGroupColumn(cell.column)

/**
 * 表头网格：把列树按层铺平。
 * 分组单元格只占自己那一层（横跨所有后代叶子列），叶子单元格一直垂到最底（rowspan 补齐）。
 * 没有分组列时就是「一行，全部 rowspan 1」，与改造前的表头完全一致。
 */
const headerRows = computed<JeTableHeaderCell[][]>(() => {
  const depth = (columns: JeTableColumn[]): number =>
    columns.reduce((max, column) => {
      if (!column.children?.length) return Math.max(max, 1)
      return Math.max(max, depth(column.children) + 1)
    }, 1)
  const countLeaves = (column: JeTableColumn): number =>
    column.children?.length
      ? column.children.reduce((sum, child) => sum + countLeaves(child), 0)
      : 1

  const rows: JeTableHeaderCell[][] = []
  const totalDepth = depth(props.columns)
  for (let i = 0; i < totalDepth; i += 1) rows.push([])

  const walk = (columns: JeTableColumn[], level: number) => {
    columns.forEach((column) => {
      if (column.children?.length) {
        rows[level].push({ column, colSpan: countLeaves(column), rowSpan: 1 })
        walk(column.children, level + 1)
      } else {
        rows[level].push({ column, colSpan: 1, rowSpan: totalDepth - level })
      }
    })
  }
  walk(props.columns, 0)
  return rows
})

// ---------------- 展开行 ----------------

const expandTypeColumn = computed(() => leafColumns.value.find((column) => column.type === 'expand'))

const hasExpandColumn = computed(() => !!expandTypeColumn.value)

/** 展开内容插槽名：列上写了 prop 用 `expand-<prop>`，否则用通用名 `expand` */
const expandSlotName = computed(() =>
  expandTypeColumn.value?.prop ? `expand-${expandTypeColumn.value.prop}` : 'expand',
)

const isExpanded = (row: JeTableRow, index: number) =>
  expandedKeys.value.includes(getRowKey(row, index))

const setRowExpanded = (row: JeTableRow, index: number, expanded: boolean) => {
  const key = getRowKey(row, index)
  const has = expandedKeys.value.includes(key)
  if (expanded === has) return
  expandedKeys.value = expanded
    ? [...expandedKeys.value, key]
    : expandedKeys.value.filter((item) => item !== key)
  emit('expand-change', row, expanded)
}

const toggleRowExpansionByIndex = (row: JeTableRow, index: number) => {
  setRowExpanded(row, index, !isExpanded(row, index))
}

const expandIcon = (row: JeTableRow, index: number): JeIconName =>
  isExpanded(row, index) ? 'chevron-down' : 'chevron-right'

// defaultExpandAll 只在初始化时铺一次：之后用户手动收起的行不该被重新展开
if (props.defaultExpandAll && hasExpandColumn.value) {
  expandedKeys.value = props.data.map((row, index) => getRowKey(row, index))
}
if (props.defaultExpandAll && hasTreeData.value) {
  treeExpandedKeys.value = collectTreeKeys(props.data)
}

// 受控 expandRowKeys 是「合并」语义：只把外部指定的 key 并进来，不覆盖用户的手动展开
watch(
  () => props.expandRowKeys,
  (keys) => {
    if (!keys?.length) return
    const merged = new Set(expandedKeys.value)
    keys.forEach((key) => merged.add(key))
    expandedKeys.value = [...merged]
  },
  { immediate: true, deep: false },
)

// ---------------- 排序 ----------------

/** 该列当前生效的筛选值（没有则为空数组） */
const filterValues = (column: JeTableColumn) => filterState.value[filterKeyOf(column)] ?? []

/** 该列是否处于「已筛选」状态，用于漏斗图标的高亮 */
const isFilterActive = (column: JeTableColumn) => filterValues(column).length > 0

/**
 * 不带 filterMethod 时的默认判定：拿选中值和该列 prop 的原始值（以及格式化后的文本）逐一比较。
 * 比 [value].includes(row[prop]) 宽松一点，行数据里存的是字符串、筛选项里是数字时也能对上。
 */
const defaultFilterMatch = (row: JeTableRow, column: JeTableColumn): boolean => {
  const values = filterValues(column)
  if (!values.length) return true
  const prop = propOf(column)
  const raw = prop ? row[prop] : undefined
  const text = raw == null ? '' : String(raw)
  return values.some((value) => value === raw || String(value) === text)
}

/** 单行的筛选判定：列上给了 filterMethod 就用它，否则走默认比对 */
const passesFilter = (row: JeTableRow, column: JeTableColumn): boolean => {
  const values = filterValues(column)
  if (!values.length) return true
  if (column.filterMethod) return column.filterMethod({ value: values, row, column })
  return defaultFilterMatch(row, column)
}

/**
 * 本地排序是否生效。sortable: 'custom' 是远程排序：排序状态照旧维护（表头箭头跟着变），
 * 但本地不做排序，顺序完全交给调用方重新请求后的数据；分组列委托叶子列时同样沿用分组列上的开关。
 */
const localSortActive = computed(() => !!sortState.value.order && !sortState.value.custom)

/**
 * 当前生效的筛选项列表（列上有 filters 且已激活），表头漏斗与行筛选共用。
 * 走 flatColumns 而不是 leafColumns：挂在分组列上的 filters 也要参与判定。
 * 分组列与它的委托叶子列共用同一个筛选键，按先序取第一个带该键的列，避免同一份条件被判两次。
 */
const activeFilterColumns = computed(() => {
  const seen = new Set<string>()
  return flatColumns.value.filter((column) => {
    if (!hasFilters(column) || !isFilterActive(column)) return false
    const key = filterKeyOf(column)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

/** 该行是否命中全部生效中的筛选条件；没有任何筛选时恒为 true */
const passesAllFilters = (row: JeTableRow): boolean =>
  activeFilterColumns.value.every((column) => passesFilter(row, column))

/** 单层排序；未激活本地排序时原样返回（不做无谓的复制） */
const sortRows = (rows: JeTableRow[]): JeTableRow[] => {
  const { prop, order } = sortState.value
  if (!prop || !order || !localSortActive.value) return rows
  const direction = order === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => compareValues(a[prop], b[prop]) * direction)
}

/** 渲染行：抽出树形层级与展开态的扁平行，行下标就是它在 displayRows 里的位置 */
interface JeTableRenderRow {
  row: JeTableRow
  key: string | number
  level: number
  hasChildren: boolean
  expanded: boolean
  loading: boolean
}

/**
 * 表体真正渲染的行：先筛选、后排序，树形数据下这两步在每一层递归进行。
 * 顺序不能反：先排序再筛选会白排一批马上就被丢掉的行，而且「筛选后仍保持原顺序」更符合直觉。
 *
 * 树形数据的筛选是「子行命中则父行保留」：否则用户筛出来的子行会因为父行被筛掉而看不见。
 * 收起的分支照样参与判定，但不进渲染结果 —— 展开后它能立刻接上，不会出现「筛完啥也没有」。
 */
const renderRows = computed<JeTableRenderRow[]>(() => {
  const buildEntries = (
    row: JeTableRow,
    level: number,
    index: number,
  ): { entries: JeTableRenderRow[]; kept: boolean } => {
    const childResults = sortRows(treeChildrenOf(row)).map((child, childIndex) =>
      buildEntries(child, level + 1, childIndex),
    )
    if (!passesAllFilters(row) && !childResults.some((result) => result.kept)) {
      return { entries: [], kept: false }
    }

    const key = getRowKey(row, index)
    const hasChildren = hasTreeChildren(row)
    const expanded = hasChildren && treeExpandedKeys.value.includes(key)
    const entries: JeTableRenderRow[] = [
      {
        row,
        key,
        level,
        hasChildren,
        expanded,
        loading: treeLoadingKeys.value.includes(key),
      },
    ]
    if (expanded) childResults.forEach((result) => entries.push(...result.entries))
    return { entries, kept: true }
  }

  const out: JeTableRenderRow[] = []
  sortRows(props.data).forEach((row, index) => {
    out.push(...buildEntries(row, 0, index).entries)
  })
  return out
})

/** 展平后的可见行数据，合计行 / 合并单元格 / 框选取值都以它为准 */
const displayRows = computed<JeTableRow[]>(() => renderRows.value.map((item) => item.row))

// ---------------- 按字段分组 + 各组小计 ----------------

/** 多级路径读取，字符串 groupBy 按 `.` 拆层（与 rowKey 同口径） */
const valueByPath = (row: JeTableRow, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[segment]
    return undefined
  }, row)

/** 该行所属的分组 key；没配 groupBy 时恒为空串 */
const groupKeyOf = (row: JeTableRow): string | number => {
  const source = props.groupBy
  if (!source) return ''
  const raw = typeof source === 'function' ? source(row) : valueByPath(row, source)
  return typeof raw === 'string' || typeof raw === 'number' ? raw : String(raw ?? '')
}

/** groupBy 与树形数据不共用：树形展平后的行再分组会把父子关系打散，所以树形数据下自动忽略分组 */
const groupingEnabled = computed(() => !!props.groupBy && !hasTreeData.value)

/** 一个分组：分组取值 + 组内的行（组内顺序沿用当前的筛选 / 排序结果） */
interface JeTableGroup {
  key: string | number
  rows: JeTableRow[]
}

/** 未分组时的占位分组，省掉模板里做非空判断 */
const emptyGroup: JeTableGroup = { key: '', rows: [] }

/** 按 groupBy 归组：同 key 的行聚到一起，组顺序按该 key 首次出现的顺序 */
const groups = computed<JeTableGroup[]>(() => {
  if (!groupingEnabled.value) return []
  const map = new Map<string | number, JeTableRow[]>()
  renderRows.value.forEach((entry) => {
    const key = groupKeyOf(entry.row)
    const bucket = map.get(key)
    if (bucket) bucket.push(entry.row)
    else map.set(key, [entry.row])
  })
  return [...map.entries()].map(([key, rows]) => ({ key, rows }))
})

/** 被收起的组取值（默认全部展开，所以这里存的是「被收起的那些」） */
const collapsedGroups = ref<Array<string | number>>([])

const groupExpanded = (key: string | number) => !collapsedGroups.value.includes(key)

const toggleGroup = (key: string | number) => {
  const collapsed = groupExpanded(key)
  collapsedGroups.value = collapsed
    ? [...collapsedGroups.value, key]
    : collapsedGroups.value.filter((item) => item !== key)
  emit('group-expand-change', { key, expanded: !collapsed })
}

// defaultGroupExpanded=false 只在初始化时铺一次：之后用户手动展开的组不该被重新收起
if (props.groupExpandable && props.defaultGroupExpanded === false) {
  collapsedGroups.value = groups.value.map((group) => group.key)
}

/** 模板遍历的渲染项：数据行 / 组头 / 组小计 */
interface JeTableRenderItem {
  kind: 'row' | 'group-header' | 'group-summary'
  /** v-for 的 key */
  key: string
  /** 数据行的 displayRows 下标；组行恒为 -1 */
  index: number
  /** 数据行条目；组行放占位对象（组行分支不会读到它） */
  item: JeTableRenderRow
  /** 所属分组；未分组时为占位分组 */
  group: JeTableGroup
}

/** 组行用的占位渲染行 */
const emptyRenderRow: JeTableRenderRow = {
  row: {},
  key: '',
  level: 0,
  hasChildren: false,
  expanded: false,
  loading: false,
}

/**
 * 分组模式下把「组头 + 组内数据行 + 组小计」插进渲染序列。
 * 行的 displayRows 下标不因分组而改变：合并单元格 / 合计行 / 框选仍按「已筛选 + 已本地排序 + 已树形展平」的
 * 原口径取值，分组只影响渲染顺序（把同组行聚到一起，并在组前后补上组头与小计）。
 */
const renderItems = computed<JeTableRenderItem[]>(() => {
  const rows = renderRows.value
  if (!groupingEnabled.value) {
    return rows.map((item, index) => ({
      kind: 'row',
      key: String(item.key),
      index,
      item,
      group: emptyGroup,
    }))
  }
  const indexOfRow = new Map<JeTableRow, number>()
  rows.forEach((item, index) => indexOfRow.set(item.row, index))
  const out: JeTableRenderItem[] = []
  groups.value.forEach((group) => {
    const expanded = groupExpanded(group.key)
    out.push({
      kind: 'group-header',
      key: `je-group-head-${group.key}`,
      index: -1,
      item: emptyRenderRow,
      group,
    })
    if (expanded) {
      group.rows.forEach((row) => {
        const index = indexOfRow.get(row) ?? 0
        out.push({
          kind: 'row',
          key: `je-group-row-${rows[index]?.key ?? index}`,
          index,
          item: rows[index] ?? emptyRenderRow,
          group,
        })
      })
    }
    if (expanded && props.groupSummary) {
      out.push({
        kind: 'group-summary',
        key: `je-group-sum-${group.key}`,
        index: -1,
        item: emptyRenderRow,
        group,
      })
    }
  })
  return out
})

/** 组小计逐列内容：给了 groupSummaryMethod 用它，否则第一数据列显示 groupSummaryText、其余留空 */
const groupSummaryValues = (group: JeTableGroup): Array<string | number> => {
  const columns = leafColumns.value
  const method = props.groupSummaryMethod
  if (method) {
    const result = method({ groupKey: group.key, rows: group.rows, columns })
    return columns.map((_, index) => result?.[index] ?? '')
  }
  return columns.map((_, index) =>
    index === firstDataColumnIndex.value ? props.groupSummaryText : '',
  )
}

// ---------------- 树形单元格缩进 ----------------

/** 树形箭头落在第一个普通列（非 selection / index / expand）上 */
const treeColumnIndex = computed(() => {
  const index = leafColumns.value.findIndex((column) => !column.type)
  return index === -1 ? 0 : index
})

const TREE_INDENT_STEP = 16
const TREE_TOGGLE_WIDTH = 24

/** 一层缩进的像素数：越深的层级左边距越大 */
const treeIndentWidth = (level: number) => level * TREE_INDENT_STEP

/** 缩进 + 箭头占掉的宽度，供省略文本（showOverflowTooltip）算出剩余可用宽度 */
const treeReservedWidth = (level: number, hasChildren: boolean) =>
  level * TREE_INDENT_STEP + (hasChildren ? TREE_TOGGLE_WIDTH : 0)

const isTreeCell = (item: JeTableRenderRow, columnIndex: number) =>
  hasTreeData.value &&
  columnIndex === treeColumnIndex.value &&
  (item.level > 0 || item.hasChildren)

// ---------------- 卡片形态 ----------------

const selectionColumn = computed(() => leafColumns.value.find((column) => column.type === 'selection'))
const indexColumn = computed(() => leafColumns.value.find((column) => column.type === 'index'))

/**
 * 卡片正文显示的列：勾选 / 序号 / 展开三类特殊列不占「列名 + 值」的行，改为在区块头部呈现。
 */
const cardColumns = computed(() => leafColumns.value.filter((column) => !column.type))

/** 区块头部是否有内容：勾选框、展开箭头、树形箭头、序号，任一存在才渲染头部 */
const cardHasHeader = (item: JeTableRenderRow) =>
  !!selectionColumn.value ||
  !!indexColumn.value ||
  hasExpandColumn.value ||
  isTreeCell(item, treeColumnIndex.value)

// ---------------- 虚拟滚动 ----------------

/**
 * 表格的滚动条换成了 JeScrollbar，真正的滚动容器是它内部的 wrap。
 * 虚拟滚动要量的视口高度、要读的滚动位置都从这个 wrap 上取。
 */
const scrollbarRef = ref<{ wrapRef: HTMLElement | null } | null>(null)
const wrapEl = () => scrollbarRef.value?.wrapRef ?? null

const scrollTop = ref(0)
const viewportHeight = ref(0)

/**
 * 只有显式开了 virtual 且真的存在纵向滚动容器（height / maxHeight）才生效。
 * 没有确定高度的容器里「视口」就是内容本身，切行只会让滚动条忽长忽短。
 * 分组模式下也自动关闭：组头与小计行不等高，占位行按 itemHeight 累加的高度会对不上。
 * 卡片模式下同样关闭：卡片高度随内容浮动，itemHeight 的等高假设不成立。
 */
const virtualEnabled = computed(
  () =>
    props.virtual === true &&
    hasFixedHeight.value &&
    !groupingEnabled.value &&
    !cardMode.value,
)

/**
 * 找「把 rowIndex 这一行并进去、且锚点在其上方」的合并块锚点行；没有返回 -1。
 * 只用于虚拟滚动的窗口校正：锚点行若被裁到窗口之上，被它 rowspan 覆盖的行会少渲染一个格子。
 */
const spanAnchorAbove = (rowIndex: number, columnIndex: number): number => {
  const matrix = spanMatrix.value
  if (!matrix) return -1
  for (let r = rowIndex - 1; r >= 0; r -= 1) {
    const span = matrix[r]?.[columnIndex]
    if (!span) break
    const rowspan = span.rowspan ?? 1
    if (rowspan > 1 && r + rowspan > rowIndex) return r
    // rowspan=0 表示这一格自己也被上方吸收，继续往上找；普通格子（rowspan=1）说明上方没有块覆盖到这里
    if (rowspan === 0) continue
    break
  }
  return -1
}

/**
 * 可视行区间。上下各多渲染 overscan 行，减少快速滚动时先看到空白再补上的观感。
 * 未测量到视口高度时按 10 行兜底，等 onMounted / ResizeObserver 量到真实值会立刻纠正。
 */
const virtualRange = computed(() => {
  const total = renderRows.value.length
  if (!virtualEnabled.value) return { start: 0, end: total, padTop: 0, padBottom: 0 }
  const height = props.itemHeight
  const fallbackRows = Math.max(props.overscan * 2, 10)
  let start = Math.max(0, Math.floor(scrollTop.value / height) - props.overscan)
  /*
   * 合并单元格：窗口上沿若落在某个合并块内部，锚点行被裁到窗口之上，
   * 块内剩余行会丢掉被 rowspan 覆盖的那一列，整行被浏览器往前挪、与表头错位。
   * 把上沿顶到覆盖首行的最靠上的锚点行，让锚点单元格重新进入渲染集即可（多渲染的行都在视口之上，不影响观感）。
   */
  if (spanMatrix.value) {
    let anchor = -1
    for (let columnIndex = 0; columnIndex < leafColumns.value.length; columnIndex += 1) {
      const above = spanAnchorAbove(start, columnIndex)
      if (above >= 0) anchor = anchor < 0 ? above : Math.min(anchor, above)
    }
    if (anchor >= 0 && anchor < start) start = anchor
  }
  const visible = Math.ceil((viewportHeight.value || height * fallbackRows) / height) + props.overscan * 2
  const end = Math.min(total, start + visible)
  return { start, end, padTop: start * height, padBottom: Math.max(total - end, 0) * height }
})

/** 模板实际遍历的渲染项：虚拟滚动下只切出可视区间（分组时虚拟滚动已自动关闭） */
const visibleItems = computed<JeTableRenderItem[]>(() =>
  virtualEnabled.value
    ? renderItems.value.slice(virtualRange.value.start, virtualRange.value.end)
    : renderItems.value,
)

const onScroll = (payload: { scrollTop: number; scrollLeft: number }) => {
  scrollTop.value = payload.scrollTop
  const el = wrapEl()
  if (el) viewportHeight.value = el.clientHeight
}

let viewportObserver: ResizeObserver | null = null

onMounted(() => {
  const el = wrapEl()
  if (!el) return
  viewportHeight.value = el.clientHeight
  if (typeof ResizeObserver !== 'undefined') {
    viewportObserver = new ResizeObserver(() => {
      viewportHeight.value = el.clientHeight
    })
    viewportObserver.observe(el)
  }
})

// ---------------- 单元格框选 ----------------

const cellSelectionEnabled = computed(() => props.cellSelection === true)

const cellSelectionStart = ref<{ rowIndex: number; columnIndex: number } | null>(null)
const cellSelectionEnd = ref<{ rowIndex: number; columnIndex: number } | null>(null)
const cellSelecting = ref(false)

/** 选区矩形（闭区间）；没有选区时为 null */
const selectionBounds = computed(() => {
  const start = cellSelectionStart.value
  const end = cellSelectionEnd.value
  if (!start || !end) return null
  return {
    minRow: Math.min(start.rowIndex, end.rowIndex),
    maxRow: Math.max(start.rowIndex, end.rowIndex),
    minColumn: Math.min(start.columnIndex, end.columnIndex),
    maxColumn: Math.max(start.columnIndex, end.columnIndex),
  }
})

const isCellSelected = (rowIndex: number, columnIndex: number) => {
  const bounds = selectionBounds.value
  if (!bounds) return false
  return (
    rowIndex >= bounds.minRow &&
    rowIndex <= bounds.maxRow &&
    columnIndex >= bounds.minColumn &&
    columnIndex <= bounds.maxColumn
  )
}

/**
 * 选区描边：只给最外圈的单元格画线，用内阴影（box-shadow）而不是 border，
 * 免得边框占掉布局、把单元格内容顶偏。四边可能同时命中，所以在 JS 里拼成一条完整声明。
 */
const cellSelectionShadow = (rowIndex: number, columnIndex: number): string | undefined => {
  const bounds = selectionBounds.value
  if (!bounds || !isCellSelected(rowIndex, columnIndex)) return undefined
  const lines: string[] = []
  if (rowIndex === bounds.minRow) lines.push('inset 0 2px 0 0 var(--je-primary)')
  if (rowIndex === bounds.maxRow) lines.push('inset 0 -2px 0 0 var(--je-primary)')
  if (columnIndex === bounds.minColumn) lines.push('inset 2px 0 0 0 var(--je-primary)')
  if (columnIndex === bounds.maxColumn) lines.push('inset -2px 0 0 0 var(--je-primary)')
  return lines.length ? lines.join(', ') : undefined
}

const endCellSelection = () => {
  if (!cellSelecting.value) return
  cellSelecting.value = false
  window.removeEventListener('pointerup', endCellSelection)
  window.removeEventListener('pointercancel', endCellSelection)
  const cells = getSelectedCellData()
  if (cells.length) emit('cell-selection-change', { cells })
}

const startCellSelection = (rowIndex: number, columnIndex: number, event: PointerEvent) => {
  if (!cellSelectionEnabled.value || event.button !== 0) return
  const target = event.target as HTMLElement | null
  // 勾选框 / 展开按钮 / 输入框这些交互元素自己接管手势，不从它们身上起框选
  if (target?.closest('button, input, label, a, select, textarea')) return
  // 阻止拖拽期间把整行文字刷蓝
  event.preventDefault()
  suppressRowClick.value = false
  cellSelecting.value = true
  cellSelectionStart.value = { rowIndex, columnIndex }
  cellSelectionEnd.value = { rowIndex, columnIndex }
  window.addEventListener('pointerup', endCellSelection)
  window.addEventListener('pointercancel', endCellSelection)
}

const extendCellSelection = (rowIndex: number, columnIndex: number) => {
  if (!cellSelecting.value) return
  const start = cellSelectionStart.value
  if (start && (start.rowIndex !== rowIndex || start.columnIndex !== columnIndex)) {
    // 拖过多个格子：这一轮的 click 只是拖拽的尾巴，不该再把行高亮/选中一遍
    suppressRowClick.value = true
  }
  cellSelectionEnd.value = { rowIndex, columnIndex }
}

const getSelectedCellData = (): JeTableCellRef[] => {
  const bounds = selectionBounds.value
  if (!bounds) return []
  const rows = renderRows.value
  const columns = leafColumns.value
  const out: JeTableCellRef[] = []
  for (let rowIndex = bounds.minRow; rowIndex <= bounds.maxRow; rowIndex += 1) {
    const item = rows[rowIndex]
    if (!item) continue
    for (let columnIndex = bounds.minColumn; columnIndex <= bounds.maxColumn; columnIndex += 1) {
      const column = columns[columnIndex]
      if (!column) continue
      out.push({ row: item.row, column, value: display(item.row, column) })
    }
  }
  return out
}

const clearCellSelection = () => {
  cellSelecting.value = false
  cellSelectionStart.value = null
  cellSelectionEnd.value = null
  window.removeEventListener('pointerup', endCellSelection)
  window.removeEventListener('pointercancel', endCellSelection)
}

onBeforeUnmount(() => {
  viewportObserver?.disconnect()
  window.removeEventListener('pointerup', endCellSelection)
  window.removeEventListener('pointercancel', endCellSelection)
})

// ---------------- 行拖拽排序 ----------------

/** 拖过这个像素数才算拖拽，避免把普通点击误判成拖拽 */
const ROW_DRAG_THRESHOLD = 4

/**
 * 行拖拽生效条件：显式开启、非树形、无本地排序、无生效中的筛选、未分组、未开框选。
 * 本地排序生效时显示顺序由排序决定，重排源数据不会改变渲染结果；
 * 筛选生效时渲染出来的只是原数据的一个子集，抛回去的「新行序」会丢掉被筛掉的行；
 * 框选会把 pointerdown 抢走（作用于单元格），两者不能共存，所以框选优先。
 */
const rowDraggableEnabled = computed(
  () =>
    props.rowDraggable === true &&
    !hasTreeData.value &&
    !localSortActive.value &&
    activeFilterColumns.value.length === 0 &&
    !groupingEnabled.value &&
    !cellSelectionEnabled.value,
)

interface JeTableRowDrag {
  /** 被拖起的行下标 */
  from: number
  /** 松手时会落到的行下标 */
  to: number
  startY: number
  active: boolean
}

const dragRow = ref<JeTableRowDrag | null>(null)

const rowDragActive = computed(() => dragRow.value?.active === true)
const draggingRowIndex = computed(() => (dragRow.value?.active ? dragRow.value.from : -1))
const dropTargetIndex = computed(() => (dragRow.value?.active ? dragRow.value.to : -1))

/** pointerdown 落在这些元素上时不启动拖拽：它们各自有交互，抢走会很难用 */
const isRowDragIgnored = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null
  return !!el?.closest?.(
    'input, button, a, label, select, textarea, [data-no-row-drag], .je-table__resizer, .je-table__filter',
  )
}

/** 指针当前落在哪个数据行上：按渲染行的矩形命中，落在所有行之外就按方向夹到首 / 末行 */
const rowDragTargetAt = (clientY: number): number => {
  const rows = rootRef.value?.querySelectorAll<HTMLElement>('tbody tr[data-row-index]')
  if (!rows?.length) return -1
  let target = -1
  rows.forEach((row) => {
    const rect = row.getBoundingClientRect()
    if (clientY >= rect.top && clientY <= rect.bottom) target = Number(row.dataset.rowIndex)
  })
  if (target >= 0) return target
  const first = rows[0].getBoundingClientRect()
  return clientY < first.top
    ? Number(rows[0].dataset.rowIndex)
    : Number(rows[rows.length - 1].dataset.rowIndex)
}

const onRowPointerMove = (event: PointerEvent) => {
  const drag = dragRow.value
  if (!drag) return
  if (!drag.active) {
    if (Math.abs(event.clientY - drag.startY) < ROW_DRAG_THRESHOLD) return
    drag.active = true
  }
  // 拖拽中禁止选中文本，否则鼠标划过表体会把整行文字刷蓝
  event.preventDefault()
  const target = rowDragTargetAt(event.clientY)
  if (target >= 0) drag.to = target
}

const onRowPointerUp = () => {
  window.removeEventListener('pointermove', onRowPointerMove)
  window.removeEventListener('pointerup', onRowPointerUp)
  window.removeEventListener('pointercancel', onRowPointerUp)
  const drag = dragRow.value
  dragRow.value = null
  if (!drag?.active) return
  // 拖拽松手后的那一次 click 是拖拽的副产品，吃掉它，免得顺带把行高亮 / 展开
  suppressRowClick.value = true
  const { from, to } = drag
  if (from === to) return
  const next = [...displayRows.value]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return
  next.splice(to, 0, moved)
  emit('row-drag-end', { from, to, rows: next, row: moved })
}

const onRowPointerDown = (index: number, event: PointerEvent) => {
  if (!rowDraggableEnabled.value || event.button !== 0) return
  if (isRowDragIgnored(event.target)) return
  dragRow.value = { from: index, to: index, startY: event.clientY, active: false }
  window.addEventListener('pointermove', onRowPointerMove)
  window.addEventListener('pointerup', onRowPointerUp)
  window.addEventListener('pointercancel', onRowPointerUp)
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onRowPointerMove)
  window.removeEventListener('pointerup', onRowPointerUp)
  window.removeEventListener('pointercancel', onRowPointerUp)
})

const toggleSort = (column: JeTableColumn) => {
  const prop = propOf(column)
  if (!column.sortable || !prop) return
  const current = sortState.value
  let order: JeTableSortOrder
  if (current.prop !== prop) order = 'asc'
  else if (current.order === 'asc') order = 'desc'
  else if (current.order === 'desc') order = null
  else order = 'asc'
  sortState.value = { prop: order ? prop : '', order, custom: column.sortable === 'custom' }
  emit('sort-change', { prop, order })
}

// ---------------- 列筛选 ----------------

/** 当前打开浮层的列 key；'' 表示没有打开 */
const openFilterProp = ref('')
/** 浮层里勾选的草稿值，点「确认」之前不影响表格数据 */
const draftFilterValues = ref<Array<string | number | boolean>>([])
const filterAnchor = ref<HTMLElement | null>(null)
const filterPanelRef = ref<HTMLElement | null>(null)

const filterOpen = computed(() => !!openFilterProp.value)
/** 窄屏改成贴底弹出层，不再跟随表头定位（isMobile 的订阅在文件上方统一声明） */
const filterZIndex = ref(nextZIndex())

const {
  x: filterX,
  y: filterY,
  update: updateFilterPanel,
} = useFloating({
  reference: filterAnchor,
  floating: filterPanelRef,
  open: filterOpen,
  placement: () => 'bottom-start',
  offset: 8,
})

const filterPanelStyle = computed(() => ({
  left: `${filterX.value}px`,
  top: `${filterY.value}px`,
  zIndex: filterZIndex.value,
}))

/**
 * 浮层锚点 ref：只有「正在打开的那一列」的漏斗按钮会绑上它。
 * 用函数式 ref 而不是给每个表头都挂一个 ref 数组，省掉「下标 ↔ 列」的来回换算。
 */
const setFilterAnchor = (column: JeTableColumn) => (el: unknown) => {
  if (filterKeyOf(column) === openFilterProp.value) {
    filterAnchor.value = (el as HTMLElement | null) ?? null
  }
}

const isFilterOpen = (column: JeTableColumn) => openFilterProp.value === filterKeyOf(column)

/**
 * 正在筛选的那一列：浮层标题、重置换算、确认提交都要用到它。
 * 记的是「被点开的那一列」本身（而不是按 key 回查）：分组列与它的委托叶子列共用同一个筛选键，
 * 回查只会命中先序的第一个，分组列挂在表头的那份 filters 就取不到了。
 */
const openFilterSource = ref<JeTableColumn | null>(null)

const openFilterColumn = computed(() => openFilterSource.value)

/** 正在筛选那一列的候选项：列被外部换掉时自动跟着变 */
const openFilterOptions = computed(() => openFilterColumn.value?.filters ?? [])

/** 正在筛选那一列当前是否已经带了生效的筛选值（决定「重置」按钮是否可点） */
const filterActiveOpen = computed(() =>
  openFilterColumn.value ? isFilterActive(openFilterColumn.value) : false,
)

const openFilter = (column: JeTableColumn) => {
  const key = filterKeyOf(column)
  if (openFilterProp.value === key) {
    closeFilter()
    return
  }
  // 后开的浮层压住先开的，和库里其它浮层共用同一条 z-index 游标
  filterZIndex.value = nextZIndex()
  openFilterProp.value = key
  openFilterSource.value = column
  // 浮层里先改草稿，点「确认」才落到 filterState 上，避免用户随手点两下就触发一次远程查询
  draftFilterValues.value = [...filterValues(column)]
  // 等锚点 ref 落到新按钮上再量位置，否则会拿上一次的坐标
  nextTick(() => updateFilterPanel())
}

/** 移动端点遮罩 / 按 Esc 关闭浮层 */
const onFilterKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !openFilterProp.value) return
  event.stopPropagation()
  closeFilter()
}

/**
 * 浮层是 position: fixed 的，表格自己滚动、外层页面滚动、窗口缩放都不会自动跟随，
 * 所以这三件事发生时手动重测一次。事件挂在捕获阶段，才能听到任意祖先滚动容器的滚动。
 */
watch(filterOpen, (open) => {
  if (open) {
    window.addEventListener('resize', updateFilterPanel)
    window.addEventListener('scroll', updateFilterPanel, true)
    document.addEventListener('keydown', onFilterKeydown)
  } else {
    window.removeEventListener('resize', updateFilterPanel)
    window.removeEventListener('scroll', updateFilterPanel, true)
    document.removeEventListener('keydown', onFilterKeydown)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateFilterPanel)
  window.removeEventListener('scroll', updateFilterPanel, true)
  document.removeEventListener('keydown', onFilterKeydown)
})

const closeFilter = () => {
  if (!openFilterProp.value) return
  openFilterProp.value = ''
  openFilterSource.value = null
  draftFilterValues.value = []
}

const toggleDraftValue = (value: string | number | boolean) => {
  draftFilterValues.value = draftFilterValues.value.includes(value)
    ? draftFilterValues.value.filter((item) => item !== value)
    : [...draftFilterValues.value, value]
}

/**
 * 点浮层与漏斗按钮之外的地方关闭浮层。
 * 触发按钮与面板一起视作「内部」，这样点同一个漏斗是「开 → 关」，不会被判定成 outside 后二次开合。
 */
useClickOutside([filterAnchor, filterPanelRef], () => {
  closeFilter()
})

/** 把草稿写回筛选状态；只在值真的变了的时候抛事件 */
const commitFilter = (column: JeTableColumn, values: Array<string | number | boolean>) => {
  const key = filterKeyOf(column)
  const previous = filterState.value[key] ?? []
  if (previous.length === values.length && previous.every((item, index) => item === values[index])) {
    return
  }
  filterState.value = { ...filterState.value, [key]: [...values] }
  emit('filter-change', { prop: key, values: [...values] })
}

const confirmFilter = (column: JeTableColumn) => {
  commitFilter(column, draftFilterValues.value)
  closeFilter()
}

const resetFilter = (column: JeTableColumn) => {
  draftFilterValues.value = []
  commitFilter(column, [])
}

/** 命令式清空筛选：不传列 key 表示清掉全部列 */
const clearFilter = (columnKeys?: string[]) => {
  const keys = (columnKeys?.length ? columnKeys : leafColumns.value.map(colKeyOf)).filter((key) =>
    key ? (filterState.value[key]?.length ?? 0) > 0 : false,
  )
  if (!keys.length) return
  const next = { ...filterState.value }
  keys.forEach((key) => {
    delete next[key]
    emit('filter-change', { prop: key, values: [] })
  })
  filterState.value = next
}

const ariaSort = (column: JeTableColumn): 'none' | 'ascending' | 'descending' | undefined => {
  if (!canSort(column)) return undefined
  if (sortState.value.prop !== propOf(column) || !sortState.value.order) return 'none'
  return sortState.value.order === 'asc' ? 'ascending' : 'descending'
}

const sortIcon = (column: JeTableColumn): JeIconName => {
  if (sortState.value.prop !== propOf(column) || !sortState.value.order) return 'arrow-up-down'
  return sortState.value.order === 'asc' ? 'arrow-up' : 'arrow-down'
}

// ---------------- 布局与样式 ----------------

/**
 * 尺寸归一化：数字按 px 处理，纯数字字符串（模板里写 height="320" 的常见写法）同样补 px，
 * 其余单位（%、em、calc() 等）原样透传。
 */
const toSize = (value: string | number) =>
  typeof value === 'number' || /^-?\d+(\.\d+)?$/.test(value) ? `${value}px` : value

/**
 * 固定高度 / 最大高度交给 JeScrollbar：height 定死滚动区，只给 maxHeight 时由它按内容收缩、
 * 超出才出现滚动条。表头由 position: sticky 固定在滚动区顶部。
 */
const hasFixedHeight = computed(() => props.height != null || props.maxHeight != null)

/**
 * 列宽交给 <colgroup>：表头与表体是同一张 table，宽度只分配一次，
 * table-layout: fixed 下固定列因此天然对齐，不需要再手工同步两套宽度。
 * 拖拽产生的宽度覆盖优先于列上的 width / minWidth。
 */
const colWidth = (column: JeTableColumn): string | undefined => {
  const override = resizedWidths.value[colKeyOf(column)]
  if (override != null) return toSize(override)
  if (column.width != null) return toSize(column.width)
  if (column.minWidth != null) return toSize(column.minWidth)
  return undefined
}

/**
 * 实际渲染宽度（px）：拖拽调宽与固定列偏移都靠它。
 * 宽度可能是百分比 / em 这类非 px 单位，此时退回列上的原始数字；都没有就算 0（由浏览器分配）。
 */
const resolvedWidth = (column: JeTableColumn): number => {
  const override = resizedWidths.value[colKeyOf(column)]
  if (override != null) return override
  const raw = column.width ?? column.minWidth
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string' && raw.endsWith('px')) return Number.parseFloat(raw)
  // 固定列不设宽度时在 table-layout: fixed 下也有个兜底尺寸，非固定列则真正是 0
  return column.fixed ? 120 : 0
}

/**
 * 表格总宽：一旦有列被调过宽，就把表宽钉成「各列宽度之和」。
 *
 * table-layout: fixed 下只要「表格宽 > 各列宽之和」，浏览器就会把多出来的空间再分给各列 ——
 * 这正是「拖一列、旁边几列跟着一起变」的根因。把表宽钉死成列宽之和，每列都按自己的宽度渲染，
 * 调宽时被改变的只有目标列（总宽超出容器时由外层 JeScrollbar 出横向滚动条）。
 * 有列测不出宽度（既没定宽、也没被冻结过）时不做干预，交回浏览器分配。
 */
const tableStyle = computed(() => {
  if (!Object.keys(resizedWidths.value).length) return undefined
  let sum = 0
  for (const column of leafColumns.value) {
    const width = resolvedWidth(column)
    if (!width) return undefined
    sum += width
  }
  return { width: `${sum}px`, minWidth: `${sum}px` }
})

/** 拖拽调宽的起止尺寸；列很窄时留一点余地，避免拖成 0 宽看不见内容 */
const MIN_COLUMN_WIDTH = 48

const hasFixed = computed(() => leafColumns.value.some((column) => !!column.fixed))

/**
 * 固定列需要累加同侧前置列的宽度才能互相不重叠。
 * 开了 spanMethod 就不再偏移：合并后同侧列的实际数量会变，硬算必然错位，
 * 此时固定列保持 0 偏移反而更可控（文档里也提示两者不要同时用）。
 */
const fixedOffset = (index: number, side: 'left' | 'right'): number => {
  if (props.spanMethod) return 0
  const columns = leafColumns.value
  let offset = 0
  if (side === 'left') {
    for (let i = 0; i < index; i += 1) {
      if (columns[i]?.fixed) offset += resolvedWidth(columns[i])
    }
  } else {
    for (let i = columns.length - 1; i > index; i -= 1) {
      if (columns[i]?.fixed) offset += resolvedWidth(columns[i])
    }
  }
  return offset
}

/** 投影只画在最外侧的固定列上：中间那几列跟着画会让整组固定列显得脏 */
const lastFixedLeftIndex = computed(() => {
  let found = -1
  leafColumns.value.forEach((column, index) => {
    if (column.fixed === 'left') found = index
  })
  return found
})

const firstFixedRightIndex = computed(() =>
  leafColumns.value.findIndex((column) => column.fixed === 'right'),
)

// ---------------- 合并单元格 ----------------

/**
 * 先把整张表的合并矩阵算出来再渲染。
 * 逐格分别调用 span-method 会出现「同一格被算两次、结果不一致」的问题，
 * 所以这里一次性算好，渲染时只查表。
 *
 * 参与计算的是 displayRows（已筛选 + 已本地排序 + 树形展平），这样 rowIndex 与真实渲染的行一一对应；
 * 不筛选、不排序且非树形数据时它与 props.data 完全等价，旧用法不受影响。
 * 没给 spanMethod 时直接返回 null：省掉「为了没有合并的表也建一张 rows×cols 的矩阵」这笔开销
 * （虚拟滚动下数据量可以很大，这一步不能白做）。
 */
const spanMatrix = computed<JeTableCellSpan[][] | null>(() => {
  const method = props.spanMethod
  if (!method) return null

  const rows = displayRows.value
  const columns = leafColumns.value
  const matrix: JeTableCellSpan[][] = rows.map(() =>
    columns.map(() => ({ rowspan: 1, colspan: 1 })),
  )

  rows.forEach((row, rowIndex) => {
    columns.forEach((column, columnIndex) => {
      const raw = method({ row, column, rowIndex, columnIndex })
      const span: JeTableCellSpan = Array.isArray(raw)
        ? { rowspan: raw[0], colspan: raw[1] }
        : raw ?? {}
      // 用 ?? 而不是 ||：调用方显式返回的 0（表示被合并）必须原样保留
      matrix[rowIndex][columnIndex] = {
        rowspan: span.rowspan ?? 1,
        colspan: span.colspan ?? 1,
      }
    })
  })
  return matrix
})

const cellSpan = (rowIndex: number, columnIndex: number): JeTableCellSpan =>
  spanMatrix.value?.[rowIndex]?.[columnIndex] ?? { rowspan: 1, colspan: 1 }

/** rowspan / colspan 为 0 的格子已被相邻单元格吸收，不再渲染 */
const isSpanHidden = (rowIndex: number, columnIndex: number) => {
  const span = cellSpan(rowIndex, columnIndex)
  return span.rowspan === 0 || span.colspan === 0
}

const cellRowspan = (rowIndex: number, columnIndex: number) =>
  Math.max(cellSpan(rowIndex, columnIndex).rowspan ?? 1, 1)
const cellColspan = (rowIndex: number, columnIndex: number) =>
  Math.max(cellSpan(rowIndex, columnIndex).colspan ?? 1, 1)

// ---------------- 单元格内容 ----------------

/** 有对应 `#col-xxx` 插槽时交给插槽渲染，否则走 formatter / 原始值 */
const hasColumnSlot = (column: JeTableColumn) => !!column.prop && !!slots[`col-${column.prop}`]
const hasHeaderSlot = (column: JeTableColumn) => !!column.prop && !!slots[`header-${column.prop}`]

const display = (row: JeTableRow, column: JeTableColumn): string => {
  if (column.formatter) return column.formatter(row, column)
  const value = column.prop ? row[column.prop] : undefined
  return value == null ? '' : String(value)
}

/** type=index 列的序号：支持数字偏移与自定义函数，分页时的全局序号靠它 */
const indexText = (column: JeTableColumn, index: number) => {
  const base = index + 1
  const custom = column.index
  if (typeof custom === 'function') return String(custom(index))
  if (typeof custom === 'number') return String(base + custom)
  return String(base)
}

/** 列对齐：表头没写 headerAlign 就跟随 align */
const cellStyle = (column: JeTableColumn, index: number): Record<string, string> => {
  const style: Record<string, string> = {}
  if (column.align) style.textAlign = column.align
  if (column.fixed === 'left') style.left = `${fixedOffset(index, 'left')}px`
  else if (column.fixed === 'right') style.right = `${fixedOffset(index, 'right')}px`
  return style
}

const headCellStyle = (column: JeTableColumn, index: number): Record<string, string> => {
  const style = cellStyle(column, index)
  const align = column.headerAlign ?? column.align
  if (align) style.textAlign = align
  return style
}

const cellClass = (column: JeTableColumn) => ({
  'is-fixed-left': column.fixed === 'left',
  'is-fixed-right': column.fixed === 'right',
  'is-ellipsis': !!column.showOverflowTooltip,
})

interface CellStylePayload {
  row: JeTableRow
  column: JeTableColumn
  rowIndex: number
  columnIndex: number
}

/** 函数式样式与对象式样式统一成对象，省得模板里各处判断 */
const resolveStyle = (
  style: JeTableCellStyle | undefined,
  payload: CellStylePayload,
): Record<string, string> => {
  const resolved = typeof style === 'function' ? style(payload) : style
  return resolved ? (resolved as Record<string, string>) : {}
}

/**
 * 单元格的 class / style 汇总。
 * 合并顺序是「表格级 → 列级 → 内置（对齐与固定偏移）」，
 * 越靠后越贴近单元格、优先级越高，调用方才不用为了覆盖对齐去写 !important。
 */
const cellBind = (row: JeTableRow, column: JeTableColumn, rowIndex: number, columnIndex: number) => {
  const payload: CellStylePayload = { row, column, rowIndex, columnIndex }
  const style = {
    ...resolveStyle(props.cellStyle, payload),
    ...resolveStyle(column.cellStyle, payload),
    ...cellStyle(column, columnIndex),
  }
  const shadow = cellSelectionShadow(rowIndex, columnIndex)
  if (shadow) style.boxShadow = shadow
  const classNames = [
    column.className,
    typeof props.cellClassName === 'function' ? props.cellClassName(payload) : props.cellClassName,
    column.cellClassName?.(payload),
    { 'is-cell-selected': isCellSelected(rowIndex, columnIndex) },
  ]
  return { style, class: classNames }
}

/** 树形列单元格的附加样式：只发一个自定义属性，省略文本据此算剩余宽度 */
const treeCellStyle = (item: JeTableRenderRow, columnIndex: number): Record<string, string> =>
  isTreeCell(item, columnIndex)
    ? { '--je-tree-indent': `${treeReservedWidth(item.level, item.hasChildren)}px` }
    : {}

const rowBind = (row: JeTableRow, rowIndex: number) => {
  const customStyle =
    typeof props.rowStyle === 'function' ? props.rowStyle({ row, rowIndex }) : props.rowStyle
  return {
    class: [
      typeof props.rowClassName === 'function'
        ? props.rowClassName({ row, rowIndex })
        : props.rowClassName,
      {
        'is-current': highlightEnabled.value && isCurrentRow(row, rowIndex),
        // 斑马纹走类名而不是 :nth-child(even)：展开行与虚拟滚动的占位行都会插进 tbody，
        // 用 DOM 序号会让斑马纹跟着错位
        'is-stripe-row': props.stripe && rowIndex % 2 === 1,
      },
    ],
    // 虚拟滚动必须每行等高，否则占位行的高度算不准
    style: virtualEnabled.value
      ? { ...(customStyle ?? {}), height: `${props.itemHeight}px` }
      : customStyle,
  }
}

const expandAriaLabel = (row: JeTableRow, index: number) =>
  isExpanded(row, index) ? '收起展开行' : '展开行'

// ---------------- 列宽拖拽 ----------------

/** 键盘每次调整的像素数：一次 16px，按住 Shift 放大到 64px，兼顾精调与快调 */
const KEYBOARD_RESIZE_STEP = 16
const KEYBOARD_RESIZE_STEP_LARGE = 64

const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

/** 列初始宽度：优先已拖过的覆盖值，其次列上的 width / minWidth，都没有就按浏览器的实际渲染宽度取 */
const currentColumnWidth = (column: JeTableColumn, handle: HTMLElement | null): number => {
  const override = resizedWidths.value[colKeyOf(column)]
  if (override != null) return override
  const raw = column.width ?? column.minWidth
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string' && raw.endsWith('px')) return Number.parseFloat(raw)
  const cell = handle?.parentElement
  return cell ? cell.getBoundingClientRect().width : 120
}

const setColumnWidth = (column: JeTableColumn, width: number) => {
  resizedWidths.value = {
    ...resizedWidths.value,
    [colKeyOf(column)]: Math.max(MIN_COLUMN_WIDTH, Math.round(width)),
  }
}

/**
 * 调宽之前先把「还没有定宽的列」按当前渲染宽度冻结下来。
 *
 * 不做这一步的话，只给一列写死宽度，其余没定宽的列会重新参与剩余空间分配，
 * 表现就是「拖一列、旁边几列一起变」。冻结之后每列都有明确宽度，表格总宽也随之定死（见 tableStyle）。
 */
const freezeColumnWidths = (table: HTMLTableElement | null) => {
  if (!table) return
  const colElements = table.querySelectorAll('col')
  const next = { ...resizedWidths.value }
  let frozen = 0
  leafColumns.value.forEach((column, index) => {
    const key = colKeyOf(column)
    if (next[key] != null) return
    const col = colElements[index]
    if (!col) return
    const width = col.getBoundingClientRect().width
    if (width <= 0) return
    // 不取整：取整会让各列之和与表格当前宽度差出几个 px，冻结瞬间就抖一下
    next[key] = Math.round(width * 100) / 100
    frozen += 1
  })
  if (frozen) resizedWidths.value = next
}

const startResize = (event: PointerEvent, column: JeTableColumn) => {
  const handle = event.currentTarget as HTMLElement | null
  freezeColumnWidths(handle?.closest('table') ?? null)
  draggingColKey.value = colKeyOf(column)
  dragOffsetX.value = 0
  resizeStartX.value = event.clientX
  resizeStartWidth.value = currentColumnWidth(column, handle)
  handle?.setPointerCapture(event.pointerId)
}

const onResizeMove = (event: PointerEvent, column: JeTableColumn) => {
  if (draggingColKey.value !== colKeyOf(column)) return
  dragOffsetX.value = event.clientX - resizeStartX.value
  setColumnWidth(column, resizeStartWidth.value + dragOffsetX.value)
}

/**
 * 拖拽结束：松手前把宽度定稿并抛事件。
 * 这里只抛最终值（不是每一帧都抛），远程保存列宽的场景不会被打爆。
 */
const onResizeEnd = (event: PointerEvent, column: JeTableColumn) => {
  if (draggingColKey.value !== colKeyOf(column)) return
  const handle = event.currentTarget as HTMLElement | null
  if (handle?.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId)
  draggingColKey.value = null
  dragOffsetX.value = 0
  const width = resizedWidths.value[colKeyOf(column)] ?? resizeStartWidth.value
  emit('column-resize', { prop: colKeyOf(column), width })
}

/**
 * 键盘调宽：左右方向键各调一步，不改变列顺序。
 * 按 Shift 步长放大到 64px，列数多的时候不用按十几次。
 */
const onResizeKeydown = (event: KeyboardEvent, column: JeTableColumn) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  event.stopPropagation()
  const handle = event.currentTarget as HTMLElement | null
  freezeColumnWidths(handle?.closest('table') ?? null)
  const step =
    (event.shiftKey ? KEYBOARD_RESIZE_STEP_LARGE : KEYBOARD_RESIZE_STEP) *
    (event.key === 'ArrowRight' ? 1 : -1)
  // 起点必须用「当前实际宽度」：没写 width 的列在 resolvedWidth 里是 0，直接加步长会被拍成 MIN_COLUMN_WIDTH
  const next = Math.max(MIN_COLUMN_WIDTH, currentColumnWidth(column, handle) + step)
  setColumnWidth(column, next)
  emit('column-resize', { prop: colKeyOf(column), width: next })
}

/**
 * 双击手柄按内容自适应列宽。
 * table-layout: fixed 下列宽只由 colgroup 决定，量不到「内容想要多宽」，
 * 所以临时把这一列的 col 宽度置空、让浏览器按 auto 布局量一次，再写回覆盖值。
 */
const autoFitColumn = (event: MouseEvent, column: JeTableColumn) => {
  const handle = event.currentTarget as HTMLElement | null
  const table = handle?.closest('table')
  const col = table?.querySelectorAll('col')[leafColumnIndex(column)]
  if (!table || !(col instanceof HTMLElement)) return
  // 先冻结其余列：否则自适应完这一列，剩下没定宽的列又会被重新分配剩余空间
  freezeColumnWidths(table)
  const target = colKeyOf(column)
  const next = { ...resizedWidths.value }
  delete next[target]
  resizedWidths.value = next
  /*
   * 量「内容想多宽」必须手动放开列宽与表格总宽：Vue 的 DOM 更新在下一个 tick，
   * 只改响应式状态的话，这一刻量到的还是上一帧的宽度（双击第二次就量不出东西）。
   */
  const colStyleWidth = col.style.width
  const tableStyleWidth = table.style.width
  const tableStyleMinWidth = table.style.minWidth
  const previousLayout = table.style.tableLayout
  col.style.width = ''
  table.style.width = 'auto'
  table.style.minWidth = '0'
  table.style.tableLayout = 'auto'
  const measured = col.getBoundingClientRect().width
  table.style.tableLayout = previousLayout
  col.style.width = colStyleWidth
  table.style.width = tableStyleWidth
  table.style.minWidth = tableStyleMinWidth
  if (measured > 0) {
    setColumnWidth(column, measured)
    emit('column-resize', { prop: target, width: Math.round(measured) })
  }
}

// ---------------- 合计行 ----------------

/** 特殊列（多选 / 序号 / 展开）不参与合计：它们本来就不是数据列 */
const isSpecialColumn = (column: JeTableColumn) => !!column.type

/** 第一个数据列的下标：默认合计文案（sumText）落在它上面，和 Element Plus 的口径一致 */
const firstDataColumnIndex = computed(() => {
  const index = leafColumns.value.findIndex((column) => !isSpecialColumn(column))
  return index === -1 ? 0 : index
})

/**
 * 合计行逐列的内容。
 * 给了 summaryMethod 就用它的返回数组；否则等价于「第一列显示 sumText，其余留空」。
 */
const summaryRowValues = computed<Array<string | number>>(() => {
  const columns = leafColumns.value
  const method = props.summaryMethod
  if (method) {
    const result = method({ columns, data: displayRows.value })
    return columns.map((_, index) => result?.[index] ?? '')
  }
  return columns.map((_, index) => (index === firstDataColumnIndex.value ? props.sumText : ''))
})

/** 合计行的 class / style：逐列复用 cellStyle / cellClassName，调用方不必为合计行再写一套 */
const summaryCellBind = (column: JeTableColumn, columnIndex: number) => {
  const payload: CellStylePayload = { row: {}, column, rowIndex: -1, columnIndex }
  const style = {
    ...resolveStyle(props.cellStyle, payload),
    ...resolveStyle(column.cellStyle, payload),
    ...cellStyle(column, columnIndex),
  }
  const classNames = [
    column.className,
    typeof props.cellClassName === 'function' ? props.cellClassName(payload) : props.cellClassName,
    column.cellClassName?.(payload),
  ]
  return { style, class: classNames }
}

// ---------------- 暴露给外部的命令式方法 ----------------

/** 清空选中；命令式调用不打 selection-change，避免父组件被自己的操作再触发一轮请求 */
const clearSelection = () => {
  selectedKeys.value = []
}

const getSelectionRows = () => selectedRows.value

const toggleRowSelection = (row: JeTableRow, selected?: boolean) => {
  const key = keyOf(row)
  const has = selectedKeys.value.includes(key)
  const next = selected ?? !has
  if (next === has) return
  selectedKeys.value = next
    ? [...selectedKeys.value, key]
    : selectedKeys.value.filter((item) => item !== key)
}

const toggleAllSelection = () => {
  toggleAll()
}

const toggleRowExpansion = (row: JeTableRow, expanded?: boolean) => {
  const index = props.data.indexOf(row)
  const at = index === -1 ? 0 : index
  setRowExpanded(row, at, expanded ?? !isExpanded(row, at))
}

const setCurrentRow = (row?: JeTableRow | null) => {
  setCurrentRowByKey(row ? keyOf(row) : null)
}

const clearSort = () => {
  if (!sortState.value.prop && !sortState.value.order) return
  sortState.value = { prop: '', order: null, custom: false }
  emit('sort-change', { prop: '', order: null })
}

/*
 * 简写属性没法挂 JSDoc，而 API 表是从这份 defineExpose 里取说明的，
 * 所以这里必须展开成「注释 + 名字」的形式，否则说明列会落到兜底词表甚至空白。
 */
defineExpose({
  /** 清空全部选中项（不动 data） */
  clearSelection,
  /** 返回当前选中的行数据数组 */
  getSelectionRows,
  /** 选中 / 取消选中某一行，第二个参数省略时取反 */
  toggleRowSelection,
  /** 全选 / 全不选，受列的 selectable 限制 */
  toggleAllSelection,
  /** 展开 / 收起某个展开行，第二个参数省略时取反 */
  toggleRowExpansion,
  /** 高亮指定行，传空则清除高亮 */
  setCurrentRow,
  /** 清空排序状态，并补发一次 sort-change */
  clearSort,
  /** 清空列筛选，不传列 key 表示清空所有列；每清一列补发一次 filter-change */
  clearFilter,
  /** 返回当前框选范围内的单元格数据（先行后列），没有选区时是空数组 */
  getSelectedCellData,
  /** 清空单元格框选 */
  clearCellSelection,
})
</script>

<template>
  <div
    ref="rootRef"
    class="je-table"
    :class="[
      `je-table--${size}`,
      {
        'is-border': border,
        'is-stripe': stripe,
        'is-fixed': hasFixed,
        'is-scroll-y': hasFixedHeight,
        'is-highlight': highlightEnabled,
        'is-col-resizing': !!draggingColKey,
        'is-tree': hasTreeData,
        'is-virtual': virtualEnabled,
        'is-cell-selection': cellSelectionEnabled,
        'is-grouped': groupingEnabled,
        'is-row-draggable': rowDraggableEnabled,
        'is-row-dragging': rowDragActive,
        'is-card': cardMode,
        'is-label-top': cardLabelPosition === 'top',
      },
    ]"
    :style="virtualEnabled ? { '--je-table-item-height': `${props.itemHeight}px` } : undefined"
  >
    <JeScrollbar
      ref="scrollbarRef"
      class="je-table__scroll"
      :height="props.height"
      :max-height="props.maxHeight"
      wrap-style="overscroll-behavior: contain"
      @scroll="onScroll"
    >
      <table v-if="!cardMode" class="je-table__table" aria-label="数据表格" :style="tableStyle">
        <colgroup>
          <col
            v-for="(column, columnIndex) in leafColumns"
            :key="`col-${colKeyOf(column) || columnIndex}`"
            :style="colWidth(column) ? { width: colWidth(column) } : undefined"
          >
        </colgroup>

        <thead v-if="showHeader" class="je-table__head">
          <tr
            v-for="(headerRow, headerRowIndex) in headerRows"
            :key="`head-${headerRowIndex}`"
            class="je-table__row je-table__row--head"
          >
            <th
              v-for="(cell, cellIndex) in headerRow"
              :key="`head-${headerRowIndex}-${cellIndex}-${colKeyOf(cell.column)}`"
              class="je-table__cell je-table__cell--head"
              :class="[
                cellClass(cell.column),
                cell.column.labelClassName,
                { 'is-group-head': isGroupHeader(cell) },
              ]"
              :style="headCellStyle(cell.column, isGroupHeader(cell) ? -1 : leafColumnIndex(cell.column))"
              :scope="isGroupHeader(cell) ? 'colgroup' : 'col'"
              :colspan="cell.colSpan > 1 ? cell.colSpan : undefined"
              :rowspan="cell.rowSpan > 1 ? cell.rowSpan : undefined"
              :aria-sort="ariaSort(cell.column)"
            >
              <label v-if="cell.column.type === 'selection'" class="je-table__check">
                <input
                  class="je-table__check-input"
                  type="checkbox"
                  aria-label="全选当前页"
                  :checked="allSelected"
                  :indeterminate.prop="someSelected"
                  @change="toggleAll"
                >
                <span class="je-table__check-box">
                  <JeIcon class="je-table__check-icon" name="check" :size="12" />
                  <span class="je-table__check-dash" />
                </span>
              </label>

              <!-- 表头插槽：无对应插槽时退回纯文本；列上写了 prop 时插槽名为 header-<prop> -->
              <slot
                v-else-if="hasHeaderSlot(cell.column)"
                :name="`header-${cell.column.prop}`"
                :column="cell.column"
              />

              <!--
                排序按钮包住整块表头内容：点标题也能切排序，热区比只点箭头大得多。
                分组表头同样能挂 sortable：它委托给自己第一个叶子子列，点分组标题即按该子列排序。
              -->
              <button
                v-else-if="canSort(cell.column)"
                type="button"
                class="je-table__sort"
                @click="toggleSort(cell.column)"
              >
                <span>{{ cell.column.label }}</span>
                <JeIcon
                  class="je-table__sort-icon"
                  :class="{
                    'is-active':
                      sortState.prop === propOf(cell.column) && !!sortState.order,
                  }"
                  :name="sortIcon(cell.column)"
                  :size="14"
                />
              </button>

              <span v-else>{{ cell.column.label }}</span>

              <!-- 筛选漏斗：和排序按钮并列，两个都开时同一格内并排显示；分组列上的 filters 委托给第一个叶子子列 -->
              <button
                v-if="hasFilters(cell.column)"
                :ref="setFilterAnchor(cell.column)"
                type="button"
                class="je-table__filter"
                :class="{
                  'is-active': isFilterActive(cell.column),
                  'is-open': isFilterOpen(cell.column),
                }"
                :aria-label="`筛选${cell.column.label}`"
                aria-haspopup="dialog"
                :aria-expanded="isFilterOpen(cell.column)"
                @click.stop="openFilter(cell.column)"
              >
                <JeIcon name="filter" :size="14" />
              </button>

              <!-- 列宽拖拽手柄：只挂在叶子列上（分组表头横跨多列，没有单一列宽可调） -->
              <span
                v-if="!isGroupHeader(cell) && isResizable(cell.column)"
                class="je-table__resizer"
                :class="{ 'is-dragging': draggingColKey === colKeyOf(cell.column) }"
                role="separator"
                aria-orientation="vertical"
                :aria-label="`调整「${cell.column.label}」列宽`"
                tabindex="0"
                @click.stop
                @pointerdown.stop="startResize($event, cell.column)"
                @pointermove="onResizeMove($event, cell.column)"
                @pointerup="onResizeEnd($event, cell.column)"
                @pointercancel="onResizeEnd($event, cell.column)"
                @keydown="onResizeKeydown($event, cell.column)"
                @dblclick.stop="autoFitColumn($event, cell.column)"
              >
                <span class="je-table__resizer-line" />
              </span>
            </th>
          </tr>
        </thead>

        <tbody class="je-table__body">
          <!-- 虚拟滚动上占位：把滚出视口的行用一个撑高的空行代替，滚动条比例才真实 -->
          <tr
            v-if="virtualEnabled && virtualRange.padTop > 0"
            class="je-table__row je-table__spacer"
            aria-hidden="true"
          >
            <td
              class="je-table__cell"
              :colspan="Math.max(leafColumns.length, 1)"
              :style="{ height: `${virtualRange.padTop}px`, padding: 0, border: 'none' }"
            />
          </tr>

          <template v-for="entry in visibleItems" :key="entry.key">
            <!-- 分组表头：整行一个单元格，group-expandable 时可点击折叠 -->
            <tr v-if="entry.kind === 'group-header'" class="je-table__row je-table__row--group">
              <td
                class="je-table__cell je-table__group-cell"
                :colspan="Math.max(leafColumns.length, 1)"
              >
                <button
                  v-if="groupExpandable"
                  type="button"
                  class="je-table__group-toggle"
                  :aria-expanded="groupExpanded(entry.group.key)"
                  :aria-label="`${groupExpanded(entry.group.key) ? '收起' : '展开'}分组 ${entry.group.key}`"
                  @click.stop="toggleGroup(entry.group.key)"
                >
                  <JeIcon
                    :name="groupExpanded(entry.group.key) ? 'chevron-down' : 'chevron-right'"
                    :size="16"
                  />
                </button>
                <!-- 分组表头内容，作用域 { groupKey, rows, expanded }；不写则显示分组取值 -->
                <slot
                  name="group-header"
                  :group-key="entry.group.key"
                  :rows="entry.group.rows"
                  :expanded="groupExpanded(entry.group.key)"
                >
                  <span class="je-table__group-label">{{ entry.group.key }}</span>
                </slot>
                <span class="je-table__group-count">{{ entry.group.rows.length }}</span>
              </td>
            </tr>

            <!-- 组小计行：逐列复用合计行的 class / style，内容优先走 #group-summary 插槽 -->
            <tr
              v-else-if="entry.kind === 'group-summary'"
              class="je-table__row je-table__row--group-summary"
            >
              <td
                v-for="(column, columnIndex) in leafColumns"
                :key="`group-sum-${colKeyOf(column) || columnIndex}`"
                class="je-table__cell je-table__cell--summary"
                :class="[cellClass(column), summaryCellBind(column, columnIndex).class]"
                :style="summaryCellBind(column, columnIndex).style"
              >
                <!-- 组小计内容，作用域 { column, columnIndex, groupKey, data }；不写则用 groupSummaryMethod 的纯文本 -->
                <slot
                  name="group-summary"
                  :column="column"
                  :column-index="columnIndex"
                  :group-key="entry.group.key"
                  :data="entry.group.rows"
                >
                  {{ groupSummaryValues(entry.group)[columnIndex] }}
                </slot>
              </td>
            </tr>

            <tr
              v-else
              class="je-table__row"
              :class="[
                rowBind(entry.item.row, entry.index).class,
                {
                  'is-dragging': entry.index === draggingRowIndex,
                  'is-drop-target':
                    entry.index === dropTargetIndex && entry.index !== draggingRowIndex,
                },
              ]"
              :style="rowBind(entry.item.row, entry.index).style"
              :data-row-index="entry.index"
              @click="onRowClick(entry.item.row, entry.index)"
              @pointerdown="onRowPointerDown(entry.index, $event)"
            >
              <template
                v-for="(column, columnIndex) in leafColumns"
                :key="colKeyOf(column) || columnIndex"
              >
                <td
                  v-if="!isSpanHidden(entry.index, columnIndex)"
                  class="je-table__cell"
                  :class="[
                    cellClass(column),
                    cellBind(entry.item.row, column, entry.index, columnIndex).class,
                    { 'is-tree-cell': isTreeCell(entry.item, columnIndex) },
                  ]"
                  :style="[
                    cellBind(entry.item.row, column, entry.index, columnIndex).style,
                    treeCellStyle(entry.item, columnIndex),
                  ]"
                  :rowspan="cellRowspan(entry.index, columnIndex)"
                  :colspan="cellColspan(entry.index, columnIndex)"
                  @pointerdown="startCellSelection(entry.index, columnIndex, $event)"
                  @pointerenter="extendCellSelection(entry.index, columnIndex)"
                >
                  <!-- 树形缩进 + 展开箭头：只画在树形列上，普通表格这一整块都不渲染 -->
                  <span
                    v-if="isTreeCell(entry.item, columnIndex)"
                    class="je-table__tree"
                    :style="{ paddingLeft: `${treeIndentWidth(entry.item.level)}px` }"
                  >
                    <button
                      v-if="entry.item.hasChildren"
                      type="button"
                      class="je-table__tree-toggle"
                      :aria-expanded="entry.item.expanded"
                      :aria-label="entry.item.expanded ? '收起子行' : '展开子行'"
                      @click.stop="toggleTreeRow(entry.item.row, entry.index)"
                    >
                      <JeIcon v-if="entry.item.loading" name="loading" spin :size="16" />
                      <JeIcon
                        v-else
                        :name="entry.item.expanded ? 'chevron-down' : 'chevron-right'"
                        :size="16"
                      />
                    </button>
                    <!-- 没有子行但有层级：留一个等宽占位，同级文字的左边距才对得齐 -->
                    <span v-else class="je-table__tree-placeholder" aria-hidden="true" />
                  </span>

                  <label v-if="column.type === 'selection'" class="je-table__check" @click.stop>
                    <input
                      class="je-table__check-input"
                      type="checkbox"
                      :aria-label="`选择第 ${entry.index + 1} 行`"
                      :checked="isRowSelected(entry.item.row, entry.index)"
                      :disabled="!isSelectable(entry.item.row, entry.index)"
                      @change="toggleRow(entry.item.row, entry.index)"
                    >
                    <span class="je-table__check-box">
                      <JeIcon class="je-table__check-icon" name="check" :size="12" />
                      <span class="je-table__check-dash" />
                    </span>
                  </label>

                  <button
                    v-else-if="column.type === 'expand'"
                    type="button"
                    class="je-table__expand"
                    :aria-expanded="isExpanded(entry.item.row, entry.index)"
                    :aria-label="expandAriaLabel(entry.item.row, entry.index)"
                    @click.stop="toggleRowExpansionByIndex(entry.item.row, entry.index)"
                  >
                    <!-- 图标位固定画箭头；展开内容走下方独立的展开行（同一个内容插槽） -->
                    <JeIcon :name="expandIcon(entry.item.row, entry.index)" :size="16" />
                  </button>

                  <template v-else-if="column.type === 'index'">
                    {{ indexText(column, entry.index) }}
                  </template>

                  <slot
                    v-else-if="hasColumnSlot(column)"
                    :name="`col-${column.prop}`"
                    :row="entry.item.row"
                    :index="entry.index"
                    :column="column"
                    :value="display(entry.item.row, column)"
                    :rowspan="cellRowspan(entry.index, columnIndex)"
                    :colspan="cellColspan(entry.index, columnIndex)"
                    :level="entry.item.level"
                    :has-children="entry.item.hasChildren"
                  />

                  <!-- 超出省略 + 悬浮提示：tooltip 只吃字符串，所以统一用 display() 的文本结果 -->
                  <JeTooltip
                    v-else-if="column.showOverflowTooltip"
                    class="je-table__ellipsis"
                    :id="tooltipId(entry.index, columnIndex)"
                    :content="display(entry.item.row, column)"
                    placement="top"
                    :disabled="!display(entry.item.row, column)"
                  >
                    <span class="je-table__ellipsis-text">{{ display(entry.item.row, column) }}</span>
                  </JeTooltip>

                  <template v-else>{{ display(entry.item.row, column) }}</template>

                  <!-- 固定列的方向性投影：用渐变而不是 box-shadow，高倍屏上不会出现 1px 缝 -->
                  <span
                    v-if="columnIndex === lastFixedLeftIndex"
                    class="je-table__fixed-shadow is-left"
                    aria-hidden="true"
                  />
                  <span
                    v-else-if="columnIndex === firstFixedRightIndex"
                    class="je-table__fixed-shadow is-right"
                    aria-hidden="true"
                  />
                </td>
              </template>
            </tr>

            <!-- 展开行：整行一个单元格，colspan 铺满所有列；只跟在数据行后面 -->
            <tr
              v-if="
                entry.kind === 'row' && hasExpandColumn && isExpanded(entry.item.row, entry.index)
              "
              class="je-table__row je-table__row--expand"
            >
              <td
                class="je-table__cell je-table__expand-cell"
                :colspan="Math.max(leafColumns.length, 1)"
              >
                <div class="je-table__expand-content">
                  <!-- 展开内容插槽：列上写了 prop 时插槽名为 expand-<prop>，否则为 expand -->
                  <slot
                    :name="expandSlotName"
                    :row="entry.item.row"
                    :index="entry.index"
                    :expanded="true"
                  />
                </div>
              </td>
            </tr>
          </template>

          <!-- 虚拟滚动下占位：撑起下方未渲染行的高度 -->
          <tr
            v-if="virtualEnabled && virtualRange.padBottom > 0"
            class="je-table__row je-table__spacer"
            aria-hidden="true"
          >
            <td
              class="je-table__cell"
              :colspan="Math.max(leafColumns.length, 1)"
              :style="{ height: `${virtualRange.padBottom}px`, padding: 0, border: 'none' }"
            />
          </tr>

          <!-- 空状态：开了合计行时由合计行兜底显示 emptyText，避免同一个提示出现两遍 -->
          <tr v-if="!displayRows.length && !showSummary" class="je-table__row je-table__row--empty">
            <td
              class="je-table__cell je-table__empty-cell"
              :colspan="Math.max(leafColumns.length, 1)"
            >
              <JeEmpty :description="emptyText" :image-size="80" />
            </td>
          </tr>

          <!-- 合计行：数据为空时也渲染（EP 同样如此），此时空状态文案交给合计行，不再多铺一行 -->
          <tr v-if="showSummary" class="je-table__row je-table__row--summary">
            <td
              v-if="!displayRows.length"
              class="je-table__cell je-table__cell--summary"
              :colspan="Math.max(leafColumns.length, 1)"
            >
              {{ emptyText }}
            </td>
            <template
              v-else
              v-for="(column, columnIndex) in leafColumns"
              :key="`summary-${colKeyOf(column) || columnIndex}`"
            >
              <td
                v-if="!isSpanHidden(displayRows.length, columnIndex)"
                class="je-table__cell je-table__cell--summary"
                :class="[cellClass(column), summaryCellBind(column, columnIndex).class]"
                :style="summaryCellBind(column, columnIndex).style"
                :rowspan="cellRowspan(displayRows.length, columnIndex)"
                :colspan="cellColspan(displayRows.length, columnIndex)"
              >
                <!-- 合计行单元格内容，作用域 { column, columnIndex, data }；不写则用 summaryMethod 算出的纯文本 -->
                <slot name="summary" :column="column" :column-index="columnIndex" :data="displayRows">
                  {{ summaryRowValues[columnIndex] }}
                </slot>
              </td>
            </template>
          </tr>
        </tbody>
      </table>

      <!--
        卡片形态：每条记录渲染成一个独立区块，块内按列逐行显示「列名 + 值」，
        列名位置由 cardLabelPosition 决定（left 在左、top 在上）。
        勾选 / 序号 / 展开 / 树形箭头不占「列名 + 值」的行，统一放在区块头部。
      -->
      <div v-else class="je-table__cards">
        <div v-if="!renderRows.length" class="je-table__cards-empty">
          <JeEmpty :description="emptyText" :image-size="80" />
        </div>

        <article
          v-for="(item, rowIndex) in renderRows"
          :key="item.key"
          class="je-table-card"
          :class="rowBind(item.row, rowIndex).class"
          :style="rowBind(item.row, rowIndex).style"
          :data-row-index="rowIndex"
          @click="onRowClick(item.row, rowIndex)"
        >
          <header v-if="cardHasHeader(item)" class="je-table-card__head">
            <label v-if="selectionColumn" class="je-table__check" @click.stop>
              <input
                class="je-table__check-input"
                type="checkbox"
                :aria-label="`选择第 ${rowIndex + 1} 行`"
                :checked="isRowSelected(item.row, rowIndex)"
                :disabled="!isSelectable(item.row, rowIndex)"
                @change="toggleRow(item.row, rowIndex)"
              >
              <span class="je-table__check-box">
                <JeIcon class="je-table__check-icon" name="check" :size="12" />
                <span class="je-table__check-dash" />
              </span>
            </label>

            <!-- 树形箭头：卡片模式不做缩进，用箭头直接表达「能否展开子行」 -->
            <button
              v-if="isTreeCell(item, treeColumnIndex)"
              type="button"
              class="je-table__tree-toggle"
              :aria-expanded="item.expanded"
              :aria-label="item.expanded ? '收起子行' : '展开子行'"
              @click.stop="toggleTreeRow(item.row, rowIndex)"
            >
              <JeIcon v-if="item.loading" name="loading" spin :size="16" />
              <JeIcon v-else :name="item.expanded ? 'chevron-down' : 'chevron-right'" :size="16" />
            </button>

            <button
              v-if="hasExpandColumn"
              type="button"
              class="je-table__expand"
              :aria-expanded="isExpanded(item.row, rowIndex)"
              :aria-label="expandAriaLabel(item.row, rowIndex)"
              @click.stop="toggleRowExpansionByIndex(item.row, rowIndex)"
            >
              <JeIcon :name="expandIcon(item.row, rowIndex)" :size="16" />
            </button>

            <span v-if="indexColumn" class="je-table-card__index">
              {{ indexText(indexColumn, rowIndex) }}
            </span>
          </header>

          <dl class="je-table-card__body">
            <div
              v-for="(column, columnIndex) in cardColumns"
              :key="colKeyOf(column) || columnIndex"
              class="je-table-card__field"
            >
              <dt class="je-table-card__label">{{ column.label }}</dt>
              <dd class="je-table-card__value">
                <!-- 与表格形态共用 col-xxx 插槽，作用域保持一致；rowspan / colspan 在卡片里恒为 1 -->
                <slot
                  v-if="hasColumnSlot(column)"
                  :name="`col-${column.prop}`"
                  :row="item.row"
                  :index="rowIndex"
                  :column="column"
                  :value="display(item.row, column)"
                  :rowspan="1"
                  :colspan="1"
                  :level="item.level"
                  :has-children="item.hasChildren"
                />
                <template v-else>{{ display(item.row, column) }}</template>
              </dd>
            </div>
          </dl>

          <!-- 展开内容：与表格形态共用同一个插槽名与作用域 -->
          <div
            v-if="hasExpandColumn && isExpanded(item.row, rowIndex)"
            class="je-table-card__expand"
          >
            <slot :name="expandSlotName" :row="item.row" :index="rowIndex" :expanded="true" />
          </div>
        </article>
      </div>
    </JeScrollbar>

    <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
      <!-- 窄屏遮罩：点一下关掉浮层，和库里其它底部弹出层保持一致 -->
      <div
        v-if="isMobile"
        class="je-table-filter__scrim"
        :class="{ 'is-open': filterOpen }"
        :style="{ zIndex: filterZIndex - 1 }"
        aria-hidden="true"
        @click="closeFilter"
      />

      <div
        ref="filterPanelRef"
        class="je-table-filter"
        :class="{ 'is-open': filterOpen, 'is-mobile': isMobile }"
        :style="isMobile ? { zIndex: filterZIndex } : filterPanelStyle"
        role="dialog"
        aria-label="列筛选"
        :aria-hidden="!filterOpen"
        @click.stop
      >
        <div class="je-table-filter__title">
          {{ openFilterColumn?.label }}
        </div>

        <div class="je-table-filter__body">
          <label
            v-for="(option, optionIndex) in openFilterOptions"
            :key="`${option.value}-${optionIndex}`"
            class="je-table-filter__option"
          >
            <input
              class="je-table-filter__input"
              type="checkbox"
              :checked="draftFilterValues.includes(option.value)"
              @change="toggleDraftValue(option.value)"
            >
            <span class="je-table-filter__box">
              <JeIcon class="je-table-filter__icon" name="check" :size="12" />
            </span>
            <span class="je-table-filter__text">{{ option.text }}</span>
          </label>

          <p v-if="!openFilterOptions.length" class="je-table-filter__empty">暂无可选筛选项</p>
        </div>

        <div class="je-table-filter__footer">
          <button
            type="button"
            class="je-table-filter__btn"
            :disabled="!draftFilterValues.length && !filterActiveOpen"
            @click="openFilterColumn && resetFilter(openFilterColumn)"
          >
            重置
          </button>
          <button
            type="button"
            class="je-table-filter__btn is-primary"
            @click="openFilterColumn && confirmFilter(openFilterColumn)"
          >
            确认
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-table {
  --je-table-cell-padding-y: 12px;
  --je-table-cell-padding-x: 14px;
  --je-table-font-size: 14px;

  box-sizing: border-box;
  font-family: inherit;
  overflow: hidden;
  border-radius: var(--je-radius);
}

.je-table--small {
  --je-table-cell-padding-y: 8px;
  --je-table-cell-padding-x: 12px;
  --je-table-font-size: 13px;
}

.je-table--large {
  --je-table-cell-padding-y: 16px;
  --je-table-cell-padding-x: 18px;
  --je-table-font-size: 15px;
}

/*
 * 表头单元格内部排成一行：标题、排序按钮、筛选漏斗、拖拽手柄。
 *
 * 这里绝对不能写 display: flex —— th 一旦不再是 table-cell，浏览器会把它包进匿名单元格，
 * 整个 thead 会从「一行」散成「竖排」（实测踩过这个坑）。所以让子元素各自 inline-flex，
 * th 保持 table-cell，这样 headCellStyle 里的 text-align 也还能正常控制左 / 中 / 右。
 */
.je-table__cell--head > * {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

/* 原来 flex 的 gap 由相邻外边距补回来 */
.je-table__cell--head > * + * {
  margin-inline-start: 4px;
}

.je-table__cell--head > :first-child {
  min-width: 0;
}

/* 筛选漏斗：收起态低调，已筛选 / 展开时点亮主色 */
.je-table__filter {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 24px;
  min-height: 24px;
  padding: 2px;
  color: var(--je-text-faint);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.je-table__filter:hover,
.je-table__filter.is-open,
.je-table__filter.is-active {
  color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 18%, transparent);
}

.je-table__filter:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 1px;
}

/* 列宽拖拽手柄：命中区 10px 宽，但只有 1px 的线可见，不会把表头挤开 */
.je-table__resizer {
  position: absolute;
  top: 0;
  right: -5px;
  bottom: 0;
  z-index: 5;
  width: 10px;
  cursor: col-resize;
  /* 触屏上横拖表头不该触发滚动，手柄自己接管手势 */
  touch-action: none;
  user-select: none;
}

.je-table__resizer-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 4px;
  width: 2px;
  background: transparent;
  transition: background 0.16s ease;
}

/**
 * 按住手柄、拖拽中、键盘聚焦三条路径都点亮，用户始终知道当前在调哪一列。
 * 拖拽时手柄会被 pointer capture 抓住，hover 态一直保持，所以不需要额外的位移反馈。
 */
.je-table__resizer:hover .je-table__resizer-line,
.je-table__resizer.is-dragging .je-table__resizer-line {
  background: var(--je-primary);
}

.je-table__resizer:focus-visible .je-table__resizer-line {
  background: var(--je-primary);
}

.je-table__resizer:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

/* 拖拽中锁住文本选中，否则鼠标划过表体会把整行文字刷蓝 */
.je-table.is-col-resizing {
  user-select: none;
}

/* 合计行：底色比斑马纹更实一点，一眼能和数据行区分开 */
.je-table__cell--summary {
  font-weight: 700;
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 10%, transparent);
}

/*
 * 合计行可能只有一个单元格（有合并列时），此时裸 flex 会把文字挤到最左、
 * 也拿不到单元格自己的 text-align，所以用 auto 外边距 + 该单元格的 text-align 还原对齐。
 */
.je-table__row--summary > .je-table__cell:only-child {
  display: flex;
  align-items: center;
  justify-content: center;
}

.je-table__row--summary > .je-table__cell:only-child[style*='text-align: left'] {
  justify-content: flex-start;
}

.je-table__row--summary > .je-table__cell:only-child[style*='text-align: right'] {
  justify-content: flex-end;
}

.je-table__row--summary:hover {
  background: transparent;
}

.je-table.is-border {
  border: var(--je-border);
}

/*
 * 用原生 table 而不是 flex 行来排布：
 * table-layout: fixed + <colgroup> 能让表头与表体的宽度分配只算一次，固定列 / 合并单元格都不会错位；
 * min-width 而不是 width，则是为了在列宽总和超过容器时把内容撑开、交给外层横向滚动。
 */
.je-table__table {
  width: 100%;
  min-width: 100%;
  table-layout: fixed;
  /*
   * 用 separate 而不是 collapse：collapse 下相邻单元格边框会合并，
   * 同时单元格带 position: sticky 时 Chrome 会丢掉 sticky 效果；separate + spacing 0 两边都能兼顾。
   */
  border-collapse: separate;
  border-spacing: 0;
}

/*
 * 滚动条换成 JeScrollbar 后，真正的滚动交给它内部的 wrap（overflow: auto），
 * 这里只保留占位宽度；窄屏不让表格撑破页面靠的仍是表格自身的 min-width。
 */
.je-table__scroll {
  width: 100%;
}

/* sticky 要落在 thead 上；落在 tr 上部分浏览器不生效 */
.je-table.is-scroll-y .je-table__head {
  position: sticky;
  top: 0;
  z-index: 3;
}

.je-table__row {
  background: transparent;
  transition: background 0.2s ease;
}

.je-table__row--head {
  background: var(--je-popup);
}

.je-table__row:hover {
  background: var(--je-surface-hover);
}

.je-table.is-highlight .je-table__row.is-current {
  background: color-mix(in srgb, var(--je-primary) 18%, transparent);
}

/*
 * 斑马纹用主色现算，换肤时自动跟随；不新增全局 token。
 * 走 is-stripe-row 类而不是 :nth-child(even)：展开行与虚拟滚动的占位行都会插进 tbody，
 * 按 DOM 序号取偶数会让斑马纹整体错位。
 */
.je-table.is-stripe .je-table__body .je-table__row.is-stripe-row {
  background: color-mix(in srgb, var(--je-primary) 8%, transparent);
}

.je-table.is-stripe .je-table__body .je-table__row.is-stripe-row:hover {
  background: var(--je-surface-hover);
}

.je-table.is-stripe .je-table__body .je-table__row.is-stripe-row.is-current {
  background: color-mix(in srgb, var(--je-primary) 22%, transparent);
}

/* 虚拟滚动的占位行只是个撑高的空壳，别让它参与 hover 高亮 */
.je-table__spacer,
.je-table__spacer:hover {
  background: transparent;
  pointer-events: none;
}

.je-table__cell {
  box-sizing: border-box;
  padding: var(--je-table-cell-padding-y) var(--je-table-cell-padding-x);
  overflow: hidden;
  font-size: var(--je-table-font-size);
  line-height: 1.45;
  color: var(--je-text-muted);
  text-align: left;
  vertical-align: middle;
  text-overflow: ellipsis;
}

.je-table__cell--head {
  /*
   * 列宽拖拽手柄是 position: absolute 的，必须有一个就近的定位祖先。
   * 少了这一行，th 是 static，手柄会以「初始包含块」为参照，整列的手柄全叠到整页右上角去。
   */
  position: relative;
  font-weight: 600;
  color: var(--je-text);
  background: var(--je-popup);
}

/*
 * 虚拟滚动要求每行等高：<tr> 上的 height 在 CSS 表格里只是「最小高度」，
 * 内容一折行行高就被撑开，与按 itemHeight 累加的占位行高度对不上（滚动条总高与实际渲染漂移）。
 * 所以虚拟模式下把数据单元格钉成 itemHeight 并禁止折行，超出部分交给既有的 overflow: hidden + 省略号裁掉。
 * 展开行 / 空数据行整行一个单元格，不受此约束。
 */
.je-table.is-virtual .je-table__body .je-table__cell:not(.je-table__expand-cell):not(.je-table__empty-cell) {
  height: var(--je-table-item-height);
  white-space: nowrap;
}

/* 展开行 / 空数据行整行一个单元格，内边距交给内部容器，避免被 hover 底色切一刀 */
.je-table__expand-cell,
.je-table__empty-cell {
  padding: 0;
  text-align: left;
}

.je-table__expand-content {
  padding: var(--je-table-cell-padding-y) var(--je-table-cell-padding-x);
}

.je-table__expand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 24px;
  min-height: 24px;
  padding: 2px;
  color: var(--je-text-muted);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.je-table__expand:hover {
  color: var(--je-primary);
}

.je-table__expand:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/*
 * 树形缩进与展开箭头：inline-flex 而不是 flex，这样它才能和同一格里的省略文本 / 普通文字
 * 排在同一行（td 仍是 table-cell，块级元素会把内容顶到下一行）。
 */
.je-table__tree {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.je-table__tree-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--je-text-muted);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.je-table__tree-toggle:hover {
  color: var(--je-primary);
}

.je-table__tree-toggle:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 没有子行的层级占位：宽度与箭头一致，同级文字的左边距才对得齐 */
.je-table__tree-placeholder {
  display: inline-block;
  flex-shrink: 0;
  width: 24px;
}

/* 白名单式的 nowrap：只有显式开启 show-overflow-tooltip 的列才不换行，
   默认仍按内容换行，旧用法的观感不变 */
.je-table__cell.is-ellipsis {
  white-space: nowrap;
}

.je-table__ellipsis {
  display: block;
  width: 100%;
  min-width: 0;
}

/* 树形列上的省略文本要和缩进 + 箭头挤在同一行，宽度扣掉缩进占位 */
.je-table__cell.is-tree-cell .je-table__ellipsis {
  display: inline-block;
  width: calc(100% - var(--je-tree-indent, 0px));
  vertical-align: middle;
}

.je-table__ellipsis-text {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---------------- 单元格框选 ---------------- */

.je-table.is-cell-selection .je-table__cell {
  user-select: none;
}

.je-table.is-cell-selection .je-table__body .je-table__cell {
  cursor: cell;
}

/* 选区底色实时用主色现算，换肤自动跟随；描边由 cellBind 拼出的 box-shadow 负责 */
.je-table__cell.is-cell-selected {
  background: color-mix(in srgb, var(--je-primary) 16%, transparent);
}

/* ---------------- 多级表头 ---------------- */

/* 分组表头单元格：居中且比叶子表头更实，一眼区分「分组标题」与「数据列标题」 */
.je-table__cell--head.is-group-head {
  text-align: center;
  background: color-mix(in srgb, var(--je-primary) 8%, var(--je-popup));
}

/* ---------------- 按字段分组 + 组小计 ---------------- */

/* 组头整行一个单元格：底色比斑马纹更实，和组小计行一起把分组「框」起来 */
.je-table__row--group > .je-table__group-cell {
  font-weight: 700;
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
}

.je-table__group-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 24px;
  min-height: 24px;
  margin-right: 6px;
  padding: 2px;
  color: var(--je-text-faint);
  background: none;
  border: none;
  border-radius: 6px;
  vertical-align: middle;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.je-table__group-toggle:hover {
  color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 18%, transparent);
}

.je-table__group-toggle:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 1px;
}

.je-table__group-count {
  margin-left: 8px;
  font-weight: 400;
  font-size: 0.85em;
  color: var(--je-text-faint);
}

/* 组小计比表尾合计轻一档，两者同时出现时不会看混 */
.je-table__row--group-summary > .je-table__cell--summary {
  font-weight: 600;
  background: color-mix(in srgb, var(--je-primary) 6%, transparent);
}

.je-table__row--group-summary:hover {
  background: transparent;
}

/* ---------------- 行拖拽排序 ---------------- */

.je-table.is-row-draggable .je-table__body .je-table__row[data-row-index] {
  cursor: grab;
}

/* 拖拽中锁住文本选中，否则鼠标划过表体会把整行文字刷蓝 */
.je-table.is-row-dragging {
  user-select: none;
}

.je-table__row.is-dragging {
  opacity: 0.5;
}

/* 落点提示：在目标行上沿画一条主色线，方向一眼可见 */
.je-table__row.is-drop-target > .je-table__cell {
  box-shadow: inset 0 2px 0 0 var(--je-primary);
}

.je-table.is-border .je-table__cell {
  border-right: var(--je-border);
}

/* 最后一列不画右边框，否则与外框叠成双线 */
.je-table.is-border .je-table__cell:last-child {
  border-right: none;
}

.je-table.is-border .je-table__body .je-table__row + .je-table__row .je-table__cell {
  border-top: var(--je-border);
}

/* 固定列：横向滚动时用 sticky 吸附；必须自带不透明底色，否则下层内容会透出来 */
.je-table__cell.is-fixed-left,
.je-table__cell.is-fixed-right {
  position: sticky;
  z-index: 2;
  background: var(--je-popup);
}

.je-table__cell--head.is-fixed-left,
.je-table__cell--head.is-fixed-right {
  z-index: 4;
}

.je-table__fixed-shadow {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 12px;
  pointer-events: none;
}

.je-table__fixed-shadow.is-left {
  right: -12px;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.3), transparent);
}

.je-table__fixed-shadow.is-right {
  left: -12px;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.3), transparent);
}

.je-table__sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
}

.je-table__sort-icon {
  color: var(--je-text-faint);
  transition: color 0.2s ease;
}

.je-table__sort-icon.is-active {
  color: var(--je-primary);
}

.je-table__sort:hover .je-table__sort-icon,
.je-table__sort:focus-visible .je-table__sort-icon {
  color: var(--je-primary);
}

.je-table__sort:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 自绘勾选框 */
.je-table__check {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.je-table__check-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.je-table__check-box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  /* 勾只在选中 / 半选（渐变底）时出现，固定浅色 */
  color: var(--je-text-on-color);
  border: 2px solid var(--je-border-color);
  border-radius: 6px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.je-table__check-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.je-table__check-dash {
  position: absolute;
  width: 8px;
  height: 2px;
  /* 半选横杠压在渐变底上，固定浅色 */
  background: var(--je-text-on-color);
  border-radius: 2px;
  opacity: 0;
}

.je-table__check-input:checked + .je-table__check-box,
.je-table__check-input:indeterminate + .je-table__check-box {
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-color: transparent;
}

.je-table__check-input:disabled + .je-table__check-box {
  cursor: not-allowed;
  opacity: 0.45;
}

.je-table__check-input:checked + .je-table__check-box .je-table__check-icon {
  opacity: 1;
}

.je-table__check-input:indeterminate + .je-table__check-box .je-table__check-dash {
  opacity: 1;
}

.je-table__check-input:focus-visible + .je-table__check-box {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* ---------------- 列筛选浮层 ---------------- */

/* 桌面端跟随表头定位（position: fixed + 每帧重测），窄屏贴底弹出 */
.je-table-filter {
  position: fixed;
  box-sizing: border-box;
  width: 200px;
  max-height: 320px;
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
  /* 常驻 DOM，收起态用 visibility 而不是 v-if，否则量不到尺寸、定位会错 */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(0.94) translateY(-6px);
  transform-origin: top left;
  transition: transform 0.28s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.28s;
}

.je-table-filter.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: scale(1) translateY(0);
  transition: transform 0.34s var(--je-ease-out-back), opacity 0.22s ease-out;
}

.je-table-filter__title {
  padding: 12px 14px 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--je-text);
  border-bottom: var(--je-border);
}

.je-table-filter__body {
  max-height: 220px;
  padding: 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.je-table-filter__option {
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  padding: 10px 8px;
  font-size: 13px;
  color: var(--je-text-muted);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.je-table-filter__option:hover {
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 14%, transparent);
}

.je-table-filter__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.je-table-filter__box {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  /* 勾只在选中 / 半选（渐变底）时出现，固定浅色 */
  color: var(--je-text-on-color);
  border: 2px solid var(--je-border-color);
  border-radius: 6px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.je-table-filter__icon {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.je-table-filter__input:checked + .je-table-filter__box {
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-color: transparent;
}

.je-table-filter__input:checked + .je-table-filter__box .je-table-filter__icon {
  opacity: 1;
}

.je-table-filter__input:focus-visible + .je-table-filter__box {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-table-filter__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-table-filter__empty {
  margin: 0;
  padding: 14px 8px;
  font-size: 13px;
  text-align: center;
  color: var(--je-text-faint);
}

.je-table-filter__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 8px 10px 10px;
  border-top: var(--je-border);
}

.je-table-filter__btn {
  box-sizing: border-box;
  min-height: 32px;
  padding: 6px 14px;
  font-family: inherit;
  font-size: 13px;
  color: var(--je-text-muted);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}

.je-table-filter__btn:hover:not(:disabled) {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-table-filter__btn.is-primary {
  /* 主按钮压在品牌渐变上，文字固定浅色 */
  color: var(--je-text-on-color);
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-color: transparent;
}

/* 覆盖上面泛用的 hover 灰底，否则主按钮一悬停就丢掉渐变、浅色文字也没了底 */
.je-table-filter__btn.is-primary:hover:not(:disabled) {
  color: var(--je-text-on-color);
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
}

.je-table-filter__btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.je-table-filter__btn:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 窄屏遮罩 */
.je-table-filter__scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-table-filter__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

/* 窄屏：浮层改成贴底弹出层，标题与选项都放大，热区不低于 44px */
@media (max-width: 768px) {
  .je-table__cell {
    min-height: 44px;
  }

  .je-table__head .je-table__cell--head {
    min-height: 44px;
  }

  .je-table__expand {
    min-width: 44px;
    min-height: 44px;
  }

  .je-table__filter {
    min-width: 44px;
    min-height: 44px;
  }

  /* 触屏没有精确指针，拖拽手柄收窄，避免抢掉表头点击 */
  .je-table__resizer {
    right: -4px;
    width: 8px;
  }

  .je-table-filter.is-mobile {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    max-height: 72vh;
    border-radius: 22px 22px 0 0;
    border-bottom: none;
    transform: translateY(100%);
    transform-origin: bottom center;
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-table-filter.is-mobile.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }

  .je-table-filter.is-mobile .je-table-filter__title {
    padding: 16px 16px 10px;
    font-size: 15px;
    text-align: center;
  }

  .je-table-filter.is-mobile .je-table-filter__body {
    max-height: 52vh;
    padding: 6px 12px calc(6px + env(safe-area-inset-bottom, 0px));
  }

  .je-table-filter__option {
    min-height: 48px;
    font-size: 15px;
  }

  .je-table-filter__box {
    width: 20px;
    height: 20px;
  }

  .je-table-filter.is-mobile .je-table-filter__footer {
    padding: 10px 12px calc(14px + env(safe-area-inset-bottom, 0px));
  }

  .je-table-filter__btn {
    flex: 1 1 0;
    min-height: 44px;
    font-size: 15px;
  }
}

/* ---------------- 卡片形态 ----------------
 * 每条记录一个区块，块内按列逐行显示「列名 + 值」。
 * 这里不依赖任何表格布局（table-cell / colgroup 都没有），所以不受固定列、列宽、合并的影响。
 */

.je-table__cards {
  box-sizing: border-box;
  padding: 12px;
  background: var(--je-surface);
}

.je-table__cards-empty {
  padding: 24px 0;
}

.je-table-card {
  box-sizing: border-box;
  margin-bottom: 12px;
  overflow: hidden;
  background: var(--je-surface);
  border: 1px solid var(--je-border-color);
  border-radius: var(--je-radius);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

/* 相邻卡片之间用 margin 分隔，最后一张不留尾巴 */
.je-table-card:last-child {
  margin-bottom: 0;
}

.je-table-card.is-current {
  border-color: var(--je-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--je-primary) 16%, transparent);
}

.je-table-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--je-surface-hover);
  border-bottom: 1px solid var(--je-border-color);
}

/* 序号靠右，勾选 / 展开 / 树形箭头从左边依次排开 */
.je-table-card__index {
  margin-inline-start: auto;
  font-size: 13px;
  color: var(--je-text-muted);
}

.je-table-card__body {
  margin: 0;
  padding: 2px 12px;
}

.je-table-card__field {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--je-border-color);
}

/* 字段之间不重复画线，最后一条交给卡片自身的下边框 */
.je-table-card__field:last-child {
  border-bottom: none;
}

.je-table-card__label {
  flex: 0 0 88px;
  font-size: 13px;
  color: var(--je-text-muted);
  word-break: break-word;
}

.je-table-card__value {
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  font-size: 14px;
  color: var(--je-text);
  word-break: break-word;
}

/* 列名在上：标签独占一行，值另起一行 */
.je-table.is-card.is-label-top .je-table-card__field {
  flex-direction: column;
  gap: 4px;
}

.je-table.is-card.is-label-top .je-table-card__label {
  flex: 0 0 auto;
}

.je-table-card__expand {
  padding: 12px;
  background: var(--je-surface-hover);
  border-top: 1px solid var(--je-border-color);
}

@media (max-width: 768px) {
  .je-table__cards {
    padding: 8px;
  }

  .je-table-card {
    margin-bottom: 8px;
  }

  /* 触屏下勾选框同样要够得着 */
  .je-table__cards .je-table__check {
    min-width: 44px;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-table__row,
  .je-table-card,
  .je-table__sort-icon,
  .je-table__check-box,
  .je-table__check-icon,
  .je-table__expand,
  .je-table__tree-toggle,
  .je-table__group-toggle,
  .je-table__resizer-line,
  .je-table__filter,
  .je-table-filter,
  .je-table-filter.is-open,
  .je-table-filter.is-mobile,
  .je-table-filter.is-mobile.is-open,
  .je-table-filter__scrim {
    transition: none;
  }
}
</style>
