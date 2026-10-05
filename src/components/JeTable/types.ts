import type { CSSProperties, VNodeChild } from 'vue'
import type { JeTeleportTarget } from '../../core/globalConfig'

/**
 * 表格行数据。
 *
 * 用 index signature 而不是 unknown：JeTable.vue 里通过 `row[column.prop]` 取值，
 * 只有 any/unknown 索引签名才允许这种动态读取；调用方传具体行类型（如 UserRow[]）时
 * 依然能结构化匹配。单元格插槽 / formatter 内部再做收窄，避免把 any 泄到使用方。
 */
export type JeTableRow = Record<string, any>

/** 排序顺序：升序 / 降序 / 取消排序 */
export type JeTableSortOrder = 'asc' | 'desc' | null

/** 列筛选项：一个可勾选的候选值 */
export interface JeTableFilterOption {
  /** 展示文案 */
  text: string
  /** 传给 filterMethod / filter-change 的值，与展示文案解耦 */
  value: string | number | boolean
}

/**
 * 列筛选判定函数。
 *
 * 与 Element Plus 的差异：EP 是 filterMethod(value, row, column)，这里改成对象入参，
 * 一是免得调用方记参数顺序，二是要判定的字段在 column.prop 上，不必再传一遍。
 */
export type JeTableFilterMethod = (payload: {
  /** 本次选中的筛选项值，空数组表示「清除筛选」 */
  value: Array<string | number | boolean>
  /** 当前行数据 */
  row: JeTableRow
  /** 当前列配置 */
  column: JeTableColumn
}) => boolean

/**
 * 合计行的取值函数。
 *
 * 返回数组与叶子列一一对应，下标 i 的值渲染到第 i 个叶子列；
 * 返回 "" / null 表示该列留空。返回元素请用字符串（或数字），组件按纯文本渲染。
 */
export type JeTableSummaryMethod = (payload: {
  /** 当前叶子列配置（含 type 为 selection / index / expand 的特殊列，不含分组列） */
  columns: JeTableColumn[]
  /** 当前参与渲染的行数据（已应用排序与筛选，树形数据为展平后的可见行） */
  data: JeTableRow[]
}) => Array<string | number | null | undefined>

/** 分组依据：字段名（支持 `a.b` 多级路径）或按行返回分组取值的函数 */
export type JeTableGroupBy = string | ((row: JeTableRow) => string | number)

/** 组小计取值函数：返回与叶子列一一对应的数组，下标 i 的值渲染到第 i 个叶子列 */
export type JeTableGroupSummaryMethod = (payload: {
  /** 该分组的取值 */
  groupKey: string | number
  /** 该组内的行（已应用排序与筛选） */
  rows: JeTableRow[]
  /** 当前叶子列配置 */
  columns: JeTableColumn[]
}) => Array<string | number | null | undefined>

/** 合并单元格的返回结构，等价于 [rowspan, colspan] */
export interface JeTableCellSpan {
  /** 纵向合并的行数；返回 0 表示该单元格被上面的单元格合并掉，不再渲染 */
  rowspan?: number
  /** 横向合并的列数；返回 0 表示该单元格被左侧的单元格合并掉，不再渲染 */
  colspan?: number
}

/**
 * 合并单元格回调。
 *
 * 与 Element Plus 的差异：EP 要求「返回 [rowspan, colspan] 数组，调用方自己补 undefined」，
 * 这里额外允许直接返回 { rowspan, colspan } 对象，并且两者都省略 key 就等价于 [1, 1]，
 * 少写很多样板代码。
 *
 * 注意 rowIndex 的口径：它是**当前渲染出来的行**下标（已应用列筛选、本地排序与树形展平），
 * 不筛选不排序且非树形数据时与 data 的下标一致；配合筛选 / 树形使用时请按 row 本身做判定，
 * 不要回查 data[rowIndex]。columnIndex 同理，是**叶子列**的下标。
 */
export type JeTableSpanMethod = (payload: {
  row: JeTableRow
  column: JeTableColumn
  rowIndex: number
  columnIndex: number
}) => JeTableCellSpan | [number, number] | undefined

/** 行样式：对象表示所有行共用，函数则按行返回 */
export type JeTableRowStyle = CSSProperties | ((payload: { row: JeTableRow; rowIndex: number }) => CSSProperties)

/** 单元格样式：列上的 cellStyle 优先于表格上的 cellStyle */
export type JeTableCellStyle =
  | CSSProperties
  | ((payload: {
      row: JeTableRow
      column: JeTableColumn
      rowIndex: number
      columnIndex: number
    }) => CSSProperties)

/** 表格列定义 */
export interface JeTableColumn {
  /** 取值字段名；selection / index / expand 类型列可省略 */
  prop?: string
  /** 表头文案 */
  label: string
  /**
   * 列宽，数字按 px 处理。
   * 需要「固定宽度 + 其余列按比例分剩余空间」时，只给关键列写 width，
   * 不写 width 的列在 table-layout: fixed 下会平均分掉剩余宽度。
   */
  width?: number | string
  /**
   * 列最小宽度，仅在未设置 width 时生效：把它当成该列参与分配剩余宽度的权重。
   * 用于「列多但不希望某一列被压到看不见」的场景。
   */
  minWidth?: number | string
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /**
   * 表头对齐方式。
   * 不写则跟随 align —— 只有「数值右对齐但表头想保持左对齐」这种少数场景才需要单独设置。
   */
  headerAlign?: 'left' | 'center' | 'right'
  /**
   * 是否可排序（点击表头按 升 → 降 → 取消 循环）。
   * 写 'custom' 表示「远程排序」：只抛 sort-change，不对 data 做本地排序。
   */
  sortable?: boolean | 'custom'
  /**
   * 列筛选项：给了就在表头渲染漏斗按钮，点开是多选浮层。
   * 浮层里点「确认」后才生效，并抛出 filter-change 事件。
   */
  filters?: JeTableFilterOption[]
  /**
   * 筛选判定函数：返回 true 的行保留。
   * 不传时退化为「按 prop 的原始值是否命中选中项」的默认筛选。
   */
  filterMethod?: JeTableFilterMethod
  /**
   * 是否允许拖拽该列右边界调整列宽，默认允许。
   * 写 false 可关掉单列的拖拽手柄（比如紧挨着固定列的窄列）。
   */
  resizable?: boolean
  /** 固定列；固定列在横向滚动时吸附在表格左右两侧 */
  fixed?: 'left' | 'right'
  /**
   * 特殊列类型：
   * - selection：多选勾选列
   * - index：序号列
   * - expand：展开行，点箭头后在该行下方插入一整行 `#expand-<prop>` 插槽内容
   */
  type?: 'selection' | 'index' | 'expand'
  /** 单元格文本格式化；返回值会原样渲染 */
  formatter?: (row: JeTableRow, column: JeTableColumn) => string
  /**
   * 内容超出列宽时省略成一行，并在悬浮 / 聚焦时用 JeTooltip 显示完整文本。
   * 注意：开启后该列不再换行展示，长文本必须靠 tooltip 查看。
   */
  showOverflowTooltip?: boolean
  /** 追加到该列所有单元格上的类名，便于外部用选择器精确覆盖样式 */
  className?: string
  /** 追加到该列表头单元格上的类名 */
  labelClassName?: string
  /** 该列单元格的行内样式，会覆盖表格级 cellStyle 的同名属性 */
  cellStyle?: JeTableCellStyle
  /** 该列单元格的附加类名回调，与 className 叠加生效 */
  cellClassName?: (payload: {
    row: JeTableRow
    column: JeTableColumn
    rowIndex: number
    columnIndex: number
  }) => string
  /** selection 列：返回 false 的行不渲染勾选框（禁用态），全选时也会跳过 */
  selectable?: (row: JeTableRow, index: number) => boolean
  /**
   * index 列的序号偏移量：写 1 则第一行显示 2。
   * 分页场景把 (当前页 - 1) * pageSize 传进来即可显示全局序号。
   */
  index?: number | ((index: number) => number)
  /**
   * 分组表头的子列。
   *
   * 写了 children 的列不会承载数据，它在表头里只占一个横跨所有子列的单元格；
   * colgroup / 表体 / 固定列偏移 / 合并单元格 / 合计行一律只认递归展开后的**叶子列**，
   * 所以 spanMethod 与 summaryMethod 里的 column / columnIndex 都是叶子列口径。
   */
  children?: JeTableColumn[]
}

/** JeTable 的 props。单独抽成接口是为了让 gen-api.mjs 能直接引用（同目录 types.ts 会被扫描） */
export interface JeTableProps {
  /** 表格数据 */
  data: JeTableRow[]
  /** 列配置 */
  columns: JeTableColumn[]
  /** 是否显示纵向边框 */
  border?: boolean
  /** 是否显示斑马纹 */
  stripe?: boolean
  /** 表格尺寸 */
  size?: 'small' | 'default' | 'large'
  /**
   * 显示形态：auto 由屏幕宽度决定（窄屏用卡片、宽屏用表格），table 恒为表格，card 恒为卡片，默认 auto。
   *
   * 卡片模式下每条记录渲染为一个独立区块，区块内按列逐行显示「列名 + 值」，适合窄屏表单式浏览。
   * 该模式下不渲染表头，因此排序与筛选入口一并隐藏（程序化调用 clearSort / clearFilter 仍有效）；
   * 固定列、列宽拖拽、合并单元格（spanMethod）、单元格框选（cellSelection）与虚拟滚动（virtual）在该模式下自动关闭。
   * 勾选列、序号列与展开列不占「列名 + 值」的行，改为显示在区块头部；树形数据仍可用箭头展开 / 收起子行。
   * 分组（groupBy）与合计行（showSummary）在卡片模式下不生效。
   */
  layout?: 'auto' | 'table' | 'card'
  /**
   * 卡片模式下列名的位置：left 列名在左、值在右（默认），top 列名在上、值在下。仅在卡片形态下生效。
   */
  cardLabelPosition?: 'left' | 'top'
  /** 固定高度：超出后表头固定、表体纵向滚动 */
  height?: string | number
  /** 最大高度：数据少时按内容撑开，超出后才出现纵向滚动 */
  maxHeight?: string | number
  /** 数据为空时的提示文案 */
  emptyText?: string
  /** 行唯一键的字段名（支持 `user.info.id` 这种多级路径），或自定义取值函数 */
  rowKey?: string | ((row: JeTableRow) => string | number)
  /** 是否显示表头 */
  showHeader?: boolean
  /** 点击行时高亮该行，并把选中行通过 current-change 抛出 */
  highlightCurrentRow?: boolean
  /** 由外部指定当前高亮行的 key；传入后当前行状态完全受控 */
  currentRowKey?: string | number
  /** 行类名，字符串表示所有行共用，函数按行返回 */
  rowClassName?: string | ((payload: { row: JeTableRow; rowIndex: number }) => string)
  /** 行内样式，字符串表示所有行共用，函数按行返回 */
  rowStyle?: JeTableRowStyle
  /** 单元格类名，字符串表示所有单元格共用，函数按行列返回 */
  cellClassName?:
    | string
    | ((payload: {
        row: JeTableRow
        column: JeTableColumn
        rowIndex: number
        columnIndex: number
      }) => string)
  /** 单元格行内样式；列上的 cellStyle 会覆盖此处返回的同名属性 */
  cellStyle?: JeTableCellStyle
  /**
   * 合并单元格；返回 0 的单元格会被相邻单元格吸收。
   *
   * 口径：rowIndex 是「当前渲染行」的下标（已应用列筛选、本地排序与树形展平），columnIndex 是「叶子列」下标（分组列不算）。
   * 列筛选 / 本地排序 / 树形展开生效时 rowIndex 与 data 下标不再一致，请用回调传入的 row / column 做判定，不要回查 data[rowIndex]。
   */
  spanMethod?: JeTableSpanMethod
  /** 默认展开所有展开行（表格内有 type: 'expand' 列时生效） */
  defaultExpandAll?: boolean
  /** 受控的展开行 key 列表，需配合 rowKey 使用 */
  expandRowKeys?: Array<string | number>
  /** 是否在表尾显示合计行 */
  showSummary?: boolean
  /**
   * 合计行的取值函数：返回与 columns 等长的数组，逐列决定合计内容。
   *
   * 入参 data 是「已应用排序与筛选后」的行（树形数据为展平后的可见行），所以合计值与屏幕上看到的行一致；
   * columns 是「叶子列」（含 selection / index / expand，不含分组列），返回数组下标与之一一对应。
   */
  summaryMethod?: JeTableSummaryMethod
  /** 未提供 summaryMethod 时，合计行第一列的文案 */
  sumText?: string
  /**
   * 树形数据配置：children 指明子行数组挂在行数据的哪个字段上，hasChildren 指明「是否还有子节点」的标记字段。
   * 默认 { children: 'children', hasChildren: 'hasChildren' }；树形数据必须配 rowKey。
   */
  treeProps?: { children?: string; hasChildren?: string }
  /** 懒加载树：子节点不在初始数据里，展开时调用 load 拉取，同一条只拉一次 */
  lazy?: boolean
  /** 懒加载回调：把子行数组交给 resolve 即可，组件会把它写回该行的 children 字段 */
  load?: (row: JeTableRow, resolve: (children: JeTableRow[]) => void) => void
  /** 开启单元格框选：在表体上按住拖拽画出矩形选区，按住行内的按钮 / 输入框不会触发 */
  cellSelection?: boolean
  /**
   * 虚拟滚动：只渲染可视区域内的行，滚出视口的行用占位行撑高。
   * 需要同时给出 height / maxHeight（否则没有滚动容器，自动退回普通渲染），且每行必须等高。
   */
  virtual?: boolean
  /** 虚拟滚动的行高（px），默认 48；行内容换行会破坏等高假设，建议配合 showOverflowTooltip 使用 */
  itemHeight?: number
  /** 虚拟滚动在可视区上下额外渲染的行数，默认 4，用于减轻快速滚动时的白屏 */
  overscan?: number
  /**
   * 是否允许按住行拖拽调整顺序。拖拽结束只抛 row-drag-end（回传重排后的行数组），data 由调用方写回（受控）。
   * 生效条件：非树形、无本地排序、无生效中的筛选、未分组、未开 cellSelection（框选会抢走 pointerdown）。虚拟滚动下同样可用。
   */
  rowDraggable?: boolean
  /**
   * 按字段（或函数返回的值）把行分组：同值的行聚到一起，组顺序按该值首次出现。
   * 分组作用于「已筛选 + 已本地排序」后的行，但行的渲染下标不变，所以 spanMethod / summaryMethod 的口径不受影响。
   * 与树形数据（treeProps / lazy）不共用：树形数据下自动忽略分组。启用后虚拟滚动自动关闭。
   */
  groupBy?: JeTableGroupBy
  /** 是否在每组末尾插入一行组小计（配合 groupBy 使用） */
  groupSummary?: boolean
  /**
   * 组小计的取值函数：返回与叶子列等长的数组，逐列决定组小计内容。
   * 入参 rows 是该组内的行（已筛选 / 已排序），columns 是叶子列（含 selection / index / expand，不含分组列）。
   */
  groupSummaryMethod?: JeTableGroupSummaryMethod
  /** 未提供 groupSummaryMethod 时，组小计行第一数据列的文案，默认「小计」 */
  groupSummaryText?: string
  /** 组头是否可点击折叠；折叠状态由组件内部维护，变化时抛 group-expand-change */
  groupExpandable?: boolean
  /** groupExpandable 生效时初始是否展开全部组，默认 true（只在初始化时铺一次） */
  defaultGroupExpanded?: boolean
  /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
  teleportTo?: JeTeleportTarget | false
}

/** 单元格插槽作用域：col-xxx / header-xxx / expand-xxx 共用 */
export interface JeTableCellSlotScope {
  /** 当前行数据 */
  row: JeTableRow
  /** 当前行下标（相对传入的 data，未受排序影响） */
  index: number
  /** 当前列配置 */
  column: JeTableColumn
  /** 单元格格式化后的文本，插槽内做兜底展示很方便 */
  value: string
  /** 合并后的纵向跨度 */
  rowspan: number
  /** 合并后的横向跨度 */
  colspan: number
  /** 树形层级，从 0 开始；非树形数据恒为 0 */
  level: number
  /** 该行是否还有可展开的子行（懒加载时按 hasChildren 标记判定） */
  hasChildren: boolean
}

/** 展开行插槽作用域 */
export interface JeTableExpandSlotScope {
  /** 当前行数据 */
  row: JeTableRow
  /** 当前行下标 */
  index: number
  /** 当前是否已展开（#expand-column 这类自定义展开图标插槽里用来切换图标） */
  expanded: boolean
}

/** 单元格框选命中的一个单元格 */
export interface JeTableCellRef {
  /** 行数据 */
  row: JeTableRow
  /** 叶子列配置 */
  column: JeTableColumn
  /** 单元格格式化后的文本 */
  value: string
}

/** defineExpose 暴露出去的方法集合 */
export interface JeTableExpose {
  /** 清空当前选中 */
  clearSelection: () => void
  /** 读取当前选中行，用于提交表单等场景 */
  getSelectionRows: () => JeTableRow[]
  /** 单选一行（不传 selected 表示取反）；等价于 Element Plus 的 toggleRowSelection */
  toggleRowSelection: (row: JeTableRow, selected?: boolean) => void
  /** 切换全选 / 全不选 */
  toggleAllSelection: () => void
  /** 展开或收起某行的展开行 */
  toggleRowExpansion: (row: JeTableRow, expanded?: boolean) => void
  /** 设置当前高亮行，传空即清除 */
  setCurrentRow: (row?: JeTableRow | null) => void
  /** 清空排序状态并恢复 data 的原始顺序 */
  clearSort: () => void
  /** 清空某一列（或全部列）的筛选条件，并补发一次 filter-change */
  clearFilter: (columnKeys?: string[]) => void
  /** 读取当前框选的单元格数据，未开启 cellSelection 或没有选区时返回空数组 */
  getSelectedCellData: () => JeTableCellRef[]
  /** 清空单元格框选 */
  clearCellSelection: () => void
}

/** 插槽内容的宽松类型，避免把 VNodeChild 之外的东西（如 number）挡在外面 */
export type JeTableSlotContent = VNodeChild
