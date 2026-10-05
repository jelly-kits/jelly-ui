<script setup lang="ts">
import { computed, ref } from 'vue'
import { JeButton, JeSwitch, JeTable, JeTag } from '@jelly-kits/jelly-ui'
import type {
  JeTableCellRef,
  JeTableColumn,
  JeTableFilterOption,
  JeTableGroupSummaryMethod,
  JeTableRow,
  JeTableSortOrder,
  JeTableSpanMethod,
  JeTableSummaryMethod,
} from '../../src/components/JeTable/types'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

type UserRow = {
  id: number
  name: string
  role: string
  city: string
  joined: string
  score: number
  intro: string
}

const rows: UserRow[] = [
  {
    id: 1,
    name: '林小满',
    role: '产品经理',
    city: '杭州',
    joined: '2022-03-14',
    score: 92,
    intro: '负责供应链中台的整体规划，主导过三次跨部门大型重构，流程梳理与需求拆解经验丰富。',
  },
  {
    id: 2,
    name: '周衍',
    role: '前端工程师',
    city: '上海',
    joined: '2021-11-02',
    score: 88,
    intro: '组件库与构建工具的主要维护者，性能优化与工程化方向经验较多。',
  },
  {
    id: 3,
    name: '沈玉',
    role: '交互设计师',
    city: '深圳',
    joined: '2023-06-21',
    score: 95,
    intro: '主导设计系统落地，擅长把复杂业务抽象成可复用的交互模式。',
  },
  {
    id: 4,
    name: '陆知行',
    role: '数据分析师',
    city: '成都',
    joined: '2020-08-09',
    score: 79,
    intro: '负责指标体系与数据看板建设。',
  },
]

/** 基础列：给关键列写 width，其余列在 table-layout: fixed 下平均分掉剩余宽度 */
const columns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 140, fixed: 'left' },
  { prop: 'role', label: '角色', minWidth: 120 },
  { prop: 'city', label: '城市', width: 110, align: 'center' },
  { prop: 'joined', label: '入职日期', sortable: true, width: 140 },
  { prop: 'score', label: '评分', sortable: true, align: 'right', width: 100 },
]

const simpleColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名' },
  { prop: 'role', label: '角色' },
  { prop: 'city', label: '城市' },
  { prop: 'score', label: '评分', align: 'right' },
]

const selectColumns: JeTableColumn[] = [
  { type: 'selection', label: '' },
  { type: 'index', label: '序号', width: 80 },
  { prop: 'name', label: '姓名', width: 140, fixed: 'left' },
  { prop: 'role', label: '角色' },
  { prop: 'city', label: '城市' },
  { prop: 'joined', label: '入职日期', sortable: true },
  { prop: 'score', label: '评分', align: 'right', width: 100 },
]

const selected = ref<JeTableRow[]>([])
const sortInfo = ref<{ prop: string; order: 'asc' | 'desc' | null }>({ prop: '', order: null })

// ---------------- 卡片形态 ----------------

/** 卡片形态演示：勾选列与序号列不占「列名 + 值」的行，改为显示在区块头部 */
const cardColumns: JeTableColumn[] = [
  { type: 'selection', label: '' },
  { type: 'index', label: '序号' },
  { prop: 'name', label: '姓名' },
  { prop: 'role', label: '角色' },
  { prop: 'city', label: '城市' },
  { prop: 'score', label: '评分', align: 'right' },
]

/** 卡片模式下列名位置：默认 left（列名在左、值在右），切到 top 则列名在上、值在下 */
const cardLabelTop = ref(false)

// ---------------- 溢出提示 + 行/单元格样式 ----------------

const ellipsisColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 110, fixed: 'left' },
  { prop: 'role', label: '角色', width: 130 },
  // 长文本列：不换行，超出部分省略，悬浮 / 聚焦时用 JeTooltip 看全文
  { prop: 'intro', label: '个人简介', minWidth: 160, showOverflowTooltip: true },
  { prop: 'city', label: '城市', width: 90, align: 'center' },
  { prop: 'score', label: '评分', width: 90, align: 'right' },
]

// ---------------- 合计行 ----------------

/** 合计行：sumText 落在第一个数据列上，summaryMethod 想跳过某列直接返回空串即可 */
const sumColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 140 },
  { prop: 'role', label: '角色' },
  { prop: 'city', label: '城市', width: 120 },
  { prop: 'score', label: '评分', width: 120, align: 'right', sortable: true },
]

/**
 * summaryMethod 收到的是「已排序 + 已筛选」之后的 data，所以合计值会和屏幕上看到的行一致；
 * 返回数组与 columns 一一对应，想留空的列返回空串即可。
 */
const summaryMethod: JeTableSummaryMethod = ({ columns: columnList, data }) =>
  columnList.map((column, index) => {
    if (column.prop === 'score') {
      return data.reduce((total, row) => total + Number(row.score ?? 0), 0)
    }
    return index === 0 ? '合计' : ''
  })

// ---------------- 列筛选 + 远程排序 + 列宽拖拽 ----------------

const cityOptions: JeTableFilterOption[] = [
  { text: '杭州', value: '杭州' },
  { text: '上海', value: '上海' },
  { text: '深圳', value: '深圳' },
  { text: '成都', value: '成都' },
]

const roleOptions: JeTableFilterOption[] = [
  { text: '产品经理', value: '产品经理' },
  { text: '前端工程师', value: '前端工程师' },
  { text: '交互设计师', value: '交互设计师' },
  { text: '数据分析师', value: '数据分析师' },
]

const filterColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 140 },
  // 城市列给了 filters 就会在表头出现漏斗按钮，不写 filterMethod 时按 prop 的原值精确匹配
  { prop: 'city', label: '城市', width: 130, filters: cityOptions },
  {
    prop: 'role',
    label: '角色',
    minWidth: 140,
    filters: roleOptions,
    // 自定义判定：这里演示「按选中项做前缀匹配」的写法
    filterMethod: ({ value, row }) =>
      value.some((item) => String(row.role ?? '').includes(String(item))),
  },
  // sortable: 'custom' 表示远程排序：组件只发 sort-change，不本地排序
  { prop: 'joined', label: '入职日期（远程排序）', width: 180, sortable: 'custom' },
  { prop: 'score', label: '评分', width: 110, align: 'right', sortable: true },
]

const filterInfo = ref('未筛选')
const remoteRows = ref<UserRow[]>([...rows])
const remoteSortInfoText = ref('未排序')
const remoteSortInfo = ref<JeTableSortOrder>(null)
const remoteLoading = ref(false)
const resizeInfo = ref('未调整')

/** 演示远程排序：拿到 sort-change 后「请求」一次服务端，再把排好序的数据换回去 */
const handleRemoteSort = (payload: { prop: string; order: JeTableSortOrder }) => {
  remoteSortInfo.value = payload.order
  remoteSortInfoText.value = payload.order ? `${payload.prop} / ${payload.order}` : '未排序'
  if (!payload.order || payload.prop !== 'joined') return
  remoteLoading.value = true
  window.setTimeout(() => {
    remoteRows.value = [...remoteRows.value].sort((a, b) => {
      const diff = Date.parse(a.joined.replace(' ', 'T')) - Date.parse(b.joined.replace(' ', 'T'))
      return payload.order === 'asc' ? diff : -diff
    })
    remoteLoading.value = false
  }, 400)
}

const handleFilterChange = (payload: { prop: string; values: Array<string | number | boolean> }) => {
  filterInfo.value = payload.values.length
    ? `${payload.prop}：${payload.values.join('、')}`
    : `${payload.prop}：已清除`
}

const handleColumnResize = (payload: { prop: string; width: number }) => {
  resizeInfo.value = `${payload.prop} → ${payload.width}px`
}

// ---------------- 合并单元格 ----------------

type OrderRow = {
  id: number
  orderNo: string
  customer: string
  amount: number
  status: string
}

const orderRows: OrderRow[] = [
  { id: 1, orderNo: 'SO-2401', customer: '云栖科技', amount: 12800, status: '已发货' },
  { id: 2, orderNo: 'SO-2401', customer: '云栖科技', amount: 3600, status: '已发货' },
  { id: 3, orderNo: 'SO-2402', customer: '合川实业', amount: 9800, status: '待付款' },
  { id: 4, orderNo: 'SO-2403', customer: '南星贸易', amount: 4500, status: '已完成' },
]

const spanColumns: JeTableColumn[] = [
  { prop: 'orderNo', label: '订单号', width: 130 },
  { prop: 'customer', label: '客户' },
  { prop: 'amount', label: '金额', width: 120, align: 'right' },
  { prop: 'status', label: '状态', width: 120, align: 'center' },
]

/**
 * 相同订单号纵向合并：第一行给出 rowspan，后续行返回 0 让位。
 * 这里向回找「连续段」的第一行再向后数长度，避免同类行中间夹了别的订单号时算错。
 * 注意 rowIndex 是「当前渲染行」的下标：本表没有筛选 / 排序 / 树形，所以它与 orderRows 下标一致、可以直接回查；
 * 一旦启用这些能力，下标就会变，届时应改用 row 自身的字段判定，不要回查 data[rowIndex]。
 */
const spanMethod: JeTableSpanMethod = ({ row, column, rowIndex }) => {
  if (column.prop !== 'orderNo') return undefined
  const data = orderRows as unknown as JeTableRow[]
  const sameAsPrev = rowIndex > 0 && String(data[rowIndex - 1]?.orderNo) === String(row.orderNo)
  if (sameAsPrev) return { rowspan: 0, colspan: 0 }
  let span = 1
  while (rowIndex + span < data.length && String(data[rowIndex + span]?.orderNo) === String(row.orderNo)) {
    span += 1
  }
  return { rowspan: span, colspan: 1 }
}

// ---------------- 展开行 ----------------

const expandColumns: JeTableColumn[] = [
  // prop 同时决定展开内容插槽名：这里对应 #expand-detail
  { type: 'expand', prop: 'detail', label: '', width: 60 },
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'role', label: '角色' },
  { prop: 'city', label: '城市', width: 100 },
  { prop: 'score', label: '评分', width: 100, align: 'right' },
]

// ---------------- 当前行高亮 + 自定义样式 ----------------

const highlight = ref(true)
const currentName = ref('')
const striped = ref(true)

const currentRowKey = computed(() => {
  const hit = rows.find((row) => row.name === currentName.value)
  return hit?.id
})

const handleCurrentChange = (row: JeTableRow | null) => {
  currentName.value = row ? String(row.name) : ''
}

/** 分数低于 80 的行整体标红：row-class-name 返回的类名会落到 <tr> 上 */
const rowClassName = ({ row }: { row: JeTableRow; rowIndex: number }) =>
  Number(row.score) < 80 ? 'row-warning' : ''

/** 单元格级样式：这里让「角色」列加粗，演示函数式 cell-style */
const cellStyle = ({
  column,
  row,
}: {
  row: JeTableRow
  column: JeTableColumn
  rowIndex: number
  columnIndex: number
}) => (column.prop === 'role' && Number(row.score) >= 90 ? { fontWeight: '700' } : {})

// ---------------- 操作列（自定义插槽） ----------------

/**
 * 「操作」列不承载字段：只声明 prop 与 label，单元格内容交给 #col-<prop> 插槽绘制。
 * 这里放「编辑」「删除」两个按钮，fixed: 'right' 让窄屏横向滚动时保持吸附。
 */
const actionColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 140 },
  { prop: 'role', label: '角色', minWidth: 130 },
  { prop: 'city', label: '城市', width: 110, align: 'center' },
  { prop: 'score', label: '评分', width: 100, align: 'right' },
  { prop: 'action', label: '操作', width: 150, fixed: 'right' },
]

const actionInfo = ref('未操作')

const handleEdit = (row: JeTableRow) => {
  actionInfo.value = `编辑「${row.name}」`
}

const handleRemove = (row: JeTableRow) => {
  actionInfo.value = `删除「${row.name}」`
}

// ---------------- 树形数据 / 懒加载 ----------------

type DeptRow = {
  id: number
  name: string
  owner: string
  city: string
  headcount: number
  children?: DeptRow[]
  /** 懒加载模式下标记「还有没拉过的子节点」 */
  hasChildren?: boolean
}

/** 树形数据：子行写在 children 字段里（字段名可用 tree-props 改），组件按递归展平后渲染 */
const treeRows: DeptRow[] = [
  {
    id: 1,
    name: '产品中心',
    owner: '林小满',
    city: '杭州',
    headcount: 24,
    children: [
      { id: 11, name: '产品设计组', owner: '沈玉', city: '深圳', headcount: 9 },
      {
        id: 12,
        name: '产品运营组',
        owner: '周衍',
        city: '上海',
        headcount: 15,
        children: [{ id: 121, name: '内容运营', owner: '陆知行', city: '成都', headcount: 5 }],
      },
    ],
  },
  {
    id: 2,
    name: '研发中心',
    owner: '周衍',
    city: '上海',
    headcount: 48,
    children: [
      { id: 21, name: '前端组', owner: '周衍', city: '上海', headcount: 16 },
      { id: 22, name: '后端组', owner: '陆知行', city: '成都', headcount: 20 },
      { id: 23, name: '测试组', owner: '沈玉', city: '深圳', headcount: 12 },
    ],
  },
]

/** 树形缩进只作用在第一个数据列上：组件找到首个非 selection/index/expand 的叶子列 */
const treeColumns: JeTableColumn[] = [
  { prop: 'name', label: '组织 / 部门', minWidth: 220 },
  { prop: 'owner', label: '负责人', width: 140 },
  { prop: 'city', label: '所在城市', width: 120, align: 'center' },
  { prop: 'headcount', label: '人数', width: 100, align: 'right' },
]

const treeExpandInfo = ref('')

const handleTreeExpand = (row: JeTableRow, expanded: boolean) => {
  treeExpandInfo.value = `${row.name} ${expanded ? '展开' : '收起'}`
}

/** 懒加载数据：顶层只给「有没有子节点」的标记，真正的子行等展开时再由 load 拉取 */
const lazyRows = ref<DeptRow[]>([
  { id: 1, name: '产品中心', owner: '林小满', city: '杭州', headcount: 24, hasChildren: true },
  { id: 2, name: '研发中心', owner: '周衍', city: '上海', headcount: 48, hasChildren: true },
  { id: 3, name: '设计中心', owner: '沈玉', city: '深圳', headcount: 12, hasChildren: false },
])

const lazyLoading = ref(false)

/** 组件捕获到展开时回调 load(row, resolve)，resolve 传回子行即可（子行同样可再带 hasChildren） */
const loadDeptChildren = (row: JeTableRow, resolve: (children: JeTableRow[]) => void) => {
  lazyLoading.value = true
  window.setTimeout(() => {
    lazyLoading.value = false
    resolve([
      { id: Number(row.id) * 10 + 1, name: `${row.name} · 一组`, owner: row.owner, city: row.city, headcount: 6 },
      { id: Number(row.id) * 10 + 2, name: `${row.name} · 二组`, owner: row.owner, city: row.city, headcount: 4 },
    ])
  }, 600)
}

// ---------------- 多级表头 ----------------

/** 分组列只写 label + children：它不承载数据，表头里横跨所有子列，表体与固定列只认叶子列 */
const groupColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 130, fixed: 'left' },
  {
    label: '基本信息',
    children: [
      { prop: 'role', label: '角色', minWidth: 130 },
      { prop: 'city', label: '城市', width: 110, align: 'center' },
    ],
  },
  {
    label: '职位信息',
    children: [
      { prop: 'joined', label: '入职日期', width: 140, sortable: true },
      { prop: 'score', label: '评分', width: 100, align: 'right', sortable: true },
    ],
  },
]

// ---------------- 分组列上的排序 / 筛选（委托叶子子列） ----------------

/**
 * 分组列自己写 sortable / filters 时会委托给自己第一个叶子子列：
 * 点「基本信息」标题即按「角色」排序，漏斗也是按「角色」筛选，与直接挂在角色列上等效。
 */
const delegatedGroupColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 130, fixed: 'left' },
  {
    label: '基本信息',
    sortable: true,
    filters: roleOptions,
    children: [
      { prop: 'role', label: '角色', minWidth: 130 },
      { prop: 'city', label: '城市', width: 110, align: 'center' },
    ],
  },
  { prop: 'score', label: '评分', width: 100, align: 'right', sortable: true },
]

const delegatedFilterInfo = ref('未筛选')

const handleDelegatedFilter = (payload: {
  prop: string
  values: Array<string | number | boolean>
}) => {
  delegatedFilterInfo.value = payload.values.length
    ? `${payload.prop}：${payload.values.join('、')}`
    : `${payload.prop}：已清除`
}

// ---------------- 按字段分组 + 各组小计 ----------------

type TeamRow = {
  id: number
  name: string
  dept: string
  city: string
  score: number
}

/** 同一部门有多行，「按部门分组」才看得出组头 / 组小计的作用 */
const teamRows: TeamRow[] = [
  { id: 1, name: '林小满', dept: '产品部', city: '杭州', score: 92 },
  { id: 2, name: '沈玉', dept: '产品部', city: '深圳', score: 95 },
  { id: 3, name: '周衍', dept: '研发部', city: '上海', score: 88 },
  { id: 4, name: '陆知行', dept: '研发部', city: '成都', score: 79 },
  { id: 5, name: '简宁', dept: '研发部', city: '杭州', score: 84 },
  { id: 6, name: '苏晚', dept: '设计部', city: '深圳', score: 90 },
]

const groupSummaryColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 140, fixed: 'left' },
  { prop: 'dept', label: '部门', minWidth: 120 },
  { prop: 'city', label: '城市', width: 110, align: 'center' },
  { prop: 'score', label: '评分', width: 100, align: 'right', sortable: true },
]

/** 组小计：返回数组与叶子列一一对应；这里部门列显示人数、评分列显示组内合计 */
const groupSummaryMethod: JeTableGroupSummaryMethod = ({ rows: groupRows, columns: columnList }) =>
  columnList.map((column) => {
    if (column.prop === 'score') {
      return groupRows.reduce((total, row) => total + Number(row.score ?? 0), 0)
    }
    if (column.prop === 'dept') return `共 ${groupRows.length} 人`
    return ''
  })

const groupExpandInfo = ref('未操作')

const handleGroupExpand = (payload: { key: string | number; expanded: boolean }) => {
  groupExpandInfo.value = `${payload.key} ${payload.expanded ? '展开' : '收起'}`
}

// ---------------- 行拖拽排序（受控） ----------------

const draggableRows = ref<UserRow[]>([...rows])
const rowDragInfo = ref('未拖动')

/** 组件抛回的是「重排后的完整行数组」，调用方把它写回自己的 data 即完成排序 */
const handleRowDragEnd = (payload: { from: number; to: number; rows: JeTableRow[] }) => {
  draggableRows.value = payload.rows as UserRow[]
  rowDragInfo.value = `第 ${payload.from + 1} 行 → 第 ${payload.to + 1} 行`
}

const dragColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 140 },
  { prop: 'role', label: '角色', minWidth: 130 },
  { prop: 'city', label: '城市', width: 110, align: 'center' },
  { prop: 'score', label: '评分', width: 100, align: 'right' },
]

// ---------------- 单元格框选 ----------------

const selectedCells = ref<JeTableCellRef[]>([])
const cellSelectionRef = ref<InstanceType<typeof JeTable> | null>(null)

const handleCellSelection = (payload: { cells: JeTableCellRef[] }) => {
  selectedCells.value = payload.cells
}

const handleClearCellSelection = () => {
  cellSelectionRef.value?.clearCellSelection()
  selectedCells.value = []
}

// ---------------- 虚拟滚动 ----------------

type VirtualRow = {
  id: number
  name: string
  role: string
  city: string
  score: number
}

const VIRTUAL_ROLES = ['产品经理', '前端工程师', '交互设计师', '数据分析师']
const VIRTUAL_CITIES = ['杭州', '上海', '深圳', '成都']

/** 300 行数据：virtual 模式下只渲染可视区（含 overscan）的行，其余用上下占位撑高 */
const virtualRows: VirtualRow[] = Array.from({ length: 300 }, (_, index) => ({
  id: index + 1,
  name: `员工 ${String(index + 1).padStart(3, '0')}`,
  role: VIRTUAL_ROLES[index % VIRTUAL_ROLES.length],
  city: VIRTUAL_CITIES[index % VIRTUAL_CITIES.length],
  score: 60 + ((index * 7) % 40),
}))

const virtualColumns: JeTableColumn[] = [
  { prop: 'name', label: '姓名', width: 160 },
  { prop: 'role', label: '角色', minWidth: 140 },
  { prop: 'city', label: '城市', width: 120, align: 'center' },
  { prop: 'score', label: '评分', width: 110, align: 'right', sortable: true },
]

const tableRef = ref<InstanceType<typeof JeTable> | null>(null)

const handleClearSort = () => tableRef.value?.clearSort()
</script>

<template>
  <DemoPage
    title="Table 表格"
    description="列宽拖拽 / 合计行 / 列筛选 / 远程排序 / 合并单元格 / 展开行 / 树形数据 / 多级表头 / 按字段分组与组小计 / 行拖拽排序 / 单元格框选 / 虚拟滚动 / 内容溢出提示 / 当前行高亮 / 自定义行与单元格样式；表头点击按 升序 → 降序 → 取消 循环。窄屏外层横向滚动，行高不低于 44px，筛选浮层改为贴底弹出。"
  >
    <DemoBlock title="基础用法" description="点击「入职日期」「评分」表头排序，评分列用自定义插槽渲染。">
      <je-table :data="rows" :columns="columns" @sort-change="sortInfo = $event">
        <template #col-score="{ row }">
          <span class="score">{{ row.score }} 分</span>
        </template>
      </je-table>
      <p class="state">
        排序状态：{{ sortInfo.prop ? `${sortInfo.prop} / ${sortInfo.order}` : '未排序' }}
      </p>
    </DemoBlock>

    <DemoBlock
      title="操作列（自定义插槽）"
      description="列不承载字段时照样可以显示内容：「操作」列只声明 prop（这里用 action）与 label，单元格交给 #col-<prop> 插槽绘制，插槽收到 row / index / column / value 等。示例放「编辑」「删除」两个文字按钮，点击只更新下方提示；按钮上加了 .stop 阻止冒泡，避免同时触发表格的 row-click。给该列配 fixed: 'right' 能让窄屏横向滚动时保持右侧吸附，卡片形态下它也会随其余列一起渲染成「列名 + 值」。"
    >
      <je-table :data="rows" :columns="actionColumns" border>
        <template #col-action="{ row }">
          <div class="table-actions">
            <JeButton size="small" type="primary" text @click.stop="handleEdit(row)">编辑</JeButton>
            <JeButton size="small" type="danger" text @click.stop="handleRemove(row)">删除</JeButton>
          </div>
        </template>
      </je-table>
      <p class="state">最近一次操作：{{ actionInfo }}</p>
    </DemoBlock>

    <DemoBlock title="边框、斑马纹与尺寸">
      <je-table :data="rows" :columns="simpleColumns" border stripe size="small" />
    </DemoBlock>

    <DemoBlock
      title="多选、序号与固定列"
      description="勾选后表格滚动时固定列保持吸附；窄屏可横向滑动查看全部列。"
    >
      <je-table
        :data="rows"
        :columns="selectColumns"
        max-height="240"
        @selection-change="selected = $event"
      />
      <p class="state">已选 {{ selected.length }} 行</p>
    </DemoBlock>

    <DemoBlock title="空数据" description="无数据时展示内置空状态。">
      <je-table :data="[]" :columns="simpleColumns" empty-text="还没有员工记录" />
    </DemoBlock>

    <DemoBlock
      title="内容溢出提示"
      description="「个人简介」列开启 show-overflow-tooltip：超出列宽省略成一行，悬浮或键盘聚焦时用 Tooltip 展示全文。"
    >
      <je-table :data="rows" :columns="ellipsisColumns" border max-height="260" />
    </DemoBlock>

    <DemoBlock
      title="合计行"
      description="show-summary 打开表尾合计行；summary-method 收到的是「已排序 + 已筛选」的行数据，返回数组与 columns 一一对应。第一列文案也可以直接用 sum-text。"
    >
      <je-table :data="rows" :columns="sumColumns" border show-summary :summary-method="summaryMethod" />
      <p class="state">合计行的「评分」列由 summary-method 现算，其余列返回空串即留空。</p>
    </DemoBlock>

    <DemoBlock
      title="列筛选"
      description="列上写 filters 即出现表头漏斗按钮，点开是多选浮层：勾选只是草稿，点「确认」才生效并抛出 filter-change。不写 filterMethod 时按 prop 原值精确匹配，「角色」列演示了自定义判定。"
    >
      <je-table
        :data="rows"
        :columns="filterColumns"
        border
        max-height="280"
        @filter-change="handleFilterChange"
      />
      <p class="state">最近一次筛选：{{ filterInfo }}</p>
    </DemoBlock>

    <DemoBlock
      title="远程排序（sortable: custom）"
      description="「入职日期」列的 sortable 写成 'custom'：组件只维护排序状态并抛 sort-change，数据顺序完全由调用方决定。这里延迟 400ms 模拟一次服务端请求。"
    >
      <je-table
        :data="remoteRows"
        :columns="filterColumns"
        border
        max-height="280"
        @sort-change="handleRemoteSort"
        @filter-change="handleFilterChange"
      />
      <p class="state">
        排序状态：{{ remoteSortInfoText }}<span v-if="remoteLoading"> · 请求中…</span>
        <span v-if="remoteSortInfo === null">（点表头试试点「入职日期（远程排序）」）</span>
      </p>
    </DemoBlock>

    <DemoBlock
      title="列宽拖拽"
      description="拖拽表头单元格右边界的手柄可以调列宽，双击手柄按内容自适应；手柄聚焦后按左右方向键也能调（按住 Shift 步长更大）。松手时抛 column-resize。调宽只影响被调的那一列：开始调宽时会把其余列按当前渲染宽度冻结，表格总宽随之变成各列宽度之和，超出容器时由外层横向滚动。"
    >
      <je-table
        :data="rows"
        :columns="simpleColumns"
        border
        @column-resize="handleColumnResize"
      />
      <p class="state">最近一次调整：{{ resizeInfo }}</p>
    </DemoBlock>

    <DemoBlock
      title="合并单元格"
      description="span-method 返回 { rowspan, colspan }；返回 0 的格子会被上方单元格吸收。相同订单号的「订单号」列已纵向合并。注意口径：rowIndex 是「当前渲染行」下标（列筛选 / 本地排序 / 树形展开都会改变它），columnIndex 是叶子列下标，判定请用回调传入的 row / column，不要回查 data[rowIndex]。"
    >
      <je-table :data="orderRows" :columns="spanColumns" border :span-method="spanMethod" />
    </DemoBlock>

    <DemoBlock
      title="展开行"
      description="列配置 type: 'expand' 后，点箭头在该行下方插入一整行；内容来自 #expand-<prop> 插槽。"
    >
      <je-table :data="rows" :columns="expandColumns" border row-key="id">
        <template #expand-detail="{ row }">
          <div class="detail">
            <p class="detail__name">{{ row.name }} · {{ row.role }}</p>
            <p class="detail__text">{{ row.intro }}</p>
          </div>
        </template>
      </je-table>
    </DemoBlock>

    <DemoBlock
      title="树形数据"
      description="行数据带 children（字段名默认 children，可用 tree-props 改）即自动展平为树：首列按层级缩进，有子节点的行出现展开箭头。default-expand-all 一次性铺开，tree-expand-change 抛展开状态。筛选时「子行命中则父行保留」。"
    >
      <je-table
        :data="treeRows"
        :columns="treeColumns"
        border
        row-key="id"
        default-expand-all
        @tree-expand-change="handleTreeExpand"
      />
      <p class="state">最近一次展开：{{ treeExpandInfo || '未操作' }}</p>
    </DemoBlock>

    <DemoBlock
      title="懒加载（lazy + load）"
      description="顶层行只带 hasChildren 标记，展开时才调 load(row, resolve) 拉子行；加载期间箭头变成转圈。resolve 回来的子行可以再带 hasChildren，继续往下懒加载。"
    >
      <je-table :data="lazyRows" :columns="treeColumns" border row-key="id" lazy :load="loadDeptChildren" />
      <p class="state">{{ lazyLoading ? '正在拉取子行…' : '点开箭头试试懒加载' }}</p>
    </DemoBlock>

    <DemoBlock
      title="多级表头"
      description="列带 children 就是分组列：它在表头里只占一个横跨子列的单元格，自己不承载数据。colgroup、表体、固定列偏移、合并单元格与合计行一律只认递归展开后的叶子列。"
    >
      <je-table :data="rows" :columns="groupColumns" border />
    </DemoBlock>

    <DemoBlock
      title="分组列上的排序与筛选"
      description="分组列自己写 sortable / filters 时会委托给它第一个叶子子列：点「基本信息」标题即按「角色」排序，漏斗也按「角色」筛选，与把开关直接写在角色列上等效。这种委托只下发给第一个叶子子列，多子列时请把开关写到真正要用的那个叶子列上。"
    >
      <je-table
        :data="rows"
        :columns="delegatedGroupColumns"
        border
        max-height="280"
        @filter-change="handleDelegatedFilter"
      />
      <p class="state">最近一次筛选：{{ delegatedFilterInfo }}</p>
    </DemoBlock>

    <DemoBlock
      title="按字段分组与组小计"
      description="group-by 传字段名（支持 a.b 多级路径）或函数，同值的行聚到一组，组头与组小计行自动插入。group-summary 打开组小计，group-summary-method 返回与叶子列一一对应的数组；group-expandable 后组头出现折叠箭头。分组与树形数据互斥（树形数据下自动忽略），虚拟滚动也会自动关闭。"
    >
      <je-table
        :data="teamRows"
        :columns="groupSummaryColumns"
        border
        group-by="dept"
        group-summary
        group-expandable
        :group-summary-method="groupSummaryMethod"
        @group-expand-change="handleGroupExpand"
      >
        <template #group-header="{ groupKey, rows: groupRows }">
          <span class="group-label">{{ groupKey }}</span>
          <span class="group-tip">{{ groupRows.length }} 条记录</span>
        </template>
      </je-table>
      <p class="state">最近一次折叠：{{ groupExpandInfo }}</p>
    </DemoBlock>

    <DemoBlock
      title="行拖拽排序"
      description="row-draggable 打开后按住任意数据行上下拖动即可重排（松手抛 row-drag-end，带上新顺序的完整行数组）。这是受控能力：组件不改你的 data，把事件里的 rows 写回即可。树形数据、本地排序、生效中的筛选、分组与单元格框选下自动关闭 —— 它们的显示顺序不是源数据顺序，重排结果会丢行或看不出效果。"
    >
      <je-table
        :data="draggableRows"
        :columns="dragColumns"
        border
        row-draggable
        @row-drag-end="handleRowDragEnd"
      />
      <p class="state">最近一次拖动：{{ rowDragInfo }}</p>
    </DemoBlock>

    <DemoBlock
      title="单元格框选"
      description="打开 cell-selection 后按住左键在表体上拖出矩形选区（单击则选一个格），松手抛 cell-selection-change；配合 getSelectedCellData / clearCellSelection 取用或清空。"
    >
      <div class="toolbar">
        <JeButton size="small" @click="handleClearCellSelection">清空框选</JeButton>
        <span class="toolbar__label">已选 {{ selectedCells.length }} 个单元格</span>
      </div>
      <je-table
        ref="cellSelectionRef"
        :data="rows"
        :columns="simpleColumns"
        border
        cell-selection
        @cell-selection-change="handleCellSelection"
      />
      <p class="state">
        {{
          selectedCells.length
            ? selectedCells
                .slice(0, 4)
                .map((cell) => cell.value)
                .join(' / ') + (selectedCells.length > 4 ? ' …' : '')
            : '在表格里拖选一片区域试试'
        }}
      </p>
    </DemoBlock>

    <DemoBlock
      title="虚拟滚动"
      description="300 行数据：virtual 只渲染可视区（加上 overscan）的行，其余用上下占位行撑出滚动高度，固定表头与列宽不受影响。需要确定高度（height 或 max-height）才生效。"
    >
      <je-table
        :data="virtualRows"
        :columns="virtualColumns"
        border
        height="320"
        virtual
        :item-height="48"
      />
      <p class="state">只渲染可视行，表格里仍是原生 table 结构。</p>
    </DemoBlock>

    <DemoBlock
      title="当前行高亮与自定义行 / 单元格样式"
      description="highlight-current-row 点行高亮并通过 current-change 抛出；row-class-name 给低分行整体标红，cell-style 让高分行的「角色」列加粗。"
    >
      <div class="toolbar">
        <JeSwitch v-model="highlight" />
        <span class="toolbar__label">高亮当前行</span>
        <JeSwitch v-model="striped" />
        <span class="toolbar__label">斑马纹</span>
        <JeButton size="small" @click="handleClearSort">清空排序</JeButton>
      </div>
      <je-table
        ref="tableRef"
        :data="rows"
        :columns="columns"
        border
        :stripe="striped"
        :highlight-current-row="highlight"
        :current-row-key="currentRowKey"
        :row-class-name="rowClassName"
        :cell-style="cellStyle"
        @current-change="handleCurrentChange"
      >
        <template #header-score="{ column }">
          <span class="header-cell">
            {{ column.label }}
            <JeTag size="small" type="primary">重点</JeTag>
          </span>
        </template>
      </je-table>
      <p class="state">当前行：{{ currentName || '未选中' }}</p>
    </DemoBlock>

    <DemoBlock
      title="卡片形态（窄屏表单）"
      description="layout 设为 card 时，每条记录渲染成一个独立区块，块内按列逐行显示「列名 + 值」，适合窄屏表单式浏览；列名位置由 card-label-position 控制，默认 left（列名在左、值在右），可切到 top（列名在上、值在下）。勾选列与序号列不占「列名 + 值」的行，改为显示在区块头部。layout 默认 auto，窄屏自动走卡片、宽屏走表格，这里固定成 card 方便在宽屏文档里预览。卡片模式下不渲染表头，因此排序 / 筛选入口不可用；固定列、列宽拖拽、合并单元格、单元格框选与虚拟滚动也一并关闭。"
    >
      <div class="toolbar">
        <JeSwitch v-model="cardLabelTop" />
        <span class="toolbar__label">列名在上（top）</span>
      </div>
      <je-table
        :data="rows"
        :columns="cardColumns"
        layout="card"
        :card-label-position="cardLabelTop ? 'top' : 'left'"
      />
      <p class="state">窄屏下用 layout="auto" 即可自动切到这种形态。</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.score {
  font-weight: 600;
  color: var(--je-primary);
}

.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.toolbar__label {
  margin-right: 8px;
  font-size: 13px;
  color: var(--je-text-muted);
}

.header-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.table-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.detail {
  padding: 4px 0;
}

.detail__name {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--je-text);
}

.detail__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--je-text-muted);
}

.group-label {
  font-weight: 600;
}

.group-tip {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: var(--je-text-faint);
}

/* row-class-name 返回的类名落在 <tr> 上，这里按低分标红 */
:deep(.je-table__row.row-warning) .je-table__cell {
  color: var(--je-danger);
}
</style>
