<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  JeButton,
  JeInput,
  JeOrgChart,
  type JeOrgChartLinkStyle,
  type JeOrgChartNode,
  type JeOrgChartRenderNode,
  type JeOrgChartSpouse,
} from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/* -------------------------------------------------- 演示数据：近 3000 人的四层组织 */

const SURNAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨']
const GIVEN = ['子涵', '浩然', '雨桐', '思远', '嘉懿', '若曦', '沐辰', '书瑶', '弈辰', '语桐', '景行', '清越', '知远', '舒然', '亦扬', '芷晴']
const DEPARTMENTS = ['产品研发', '平台架构', '市场增长', '客户成功', '财务法务', '人力行政']
const GROUPS = ['前端', '后端', '数据', '算法', '质量保障', '基础架构', '设计', '运营', '渠道', '交付']

/** 内联 SVG 头像（离线可用，不依赖任何图片服务） */
const avatarOf = (hue: number): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue} 62% 52%)"/><circle cx="32" cy="25" r="11" fill="rgba(255,255,255,.92)"/><path d="M8 64c2-15 11-22 24-22s22 7 24 22z" fill="rgba(255,255,255,.92)"/></svg>`,
  )}`

let nameSeed = 0
const nextName = (): string => {
  const surname = SURNAMES[nameSeed % SURNAMES.length]
  const given = GIVEN[(nameSeed * 5 + Math.floor(nameSeed / SURNAMES.length)) % GIVEN.length]
  nameSeed += 1
  return `${surname}${given}`
}

/**
 * 造一棵四层组织：1 个 CEO → 6 个部门 → 每部门 5 个组 → 每组 10 人 → 每人 8 个下属，
 * 合计 2737 人。数据是**扁平**的（id + parentId），交给组件自己去建树。
 */
const buildOrg = (): JeOrgChartNode[] => {
  const nodes: JeOrgChartNode[] = []
  let seq = 0
  const push = (
    parentId: string | null,
    name: string,
    title: string,
    depth: number,
    dept: string,
    staff: number,
  ): string => {
    const id = `n${seq}`
    seq += 1
    nodes.push({
      id,
      parentId,
      name,
      title,
      dept,
      staff,
      avatar: depth <= 2 ? avatarOf((seq * 37) % 360) : undefined,
    })
    return id
  }

  const rootId = push(null, '欧阳明远', '集团 CEO', 0, '集团总部', DEPARTMENTS.length)
  DEPARTMENTS.forEach((dept, deptIndex) => {
    const deptId = push(rootId, nextName(), `${dept}部 总经理`, 1, dept, 5)
    for (let g = 0; g < 5; g += 1) {
      const groupName = GROUPS[(g + deptIndex * 2) % GROUPS.length]
      const groupId = push(deptId, nextName(), `${dept} · ${groupName}组 组长`, 2, dept, 10)
      for (let m = 0; m < 10; m += 1) {
        const memberId = push(groupId, nextName(), m % 3 === 0 ? '高级工程师' : '工程师', 3, dept, 8)
        for (let s = 0; s < 8; s += 1) {
          push(memberId, nextName(), s % 2 === 0 ? '实习生' : '专员', 4, dept, 0)
        }
      }
    }
  })
  return nodes
}

const orgNodes = buildOrg()

/** 一个「一级特别宽」的组织：根下挂 12 个部门，专门用来对比三种连线的可读性 */
const wideNodes: JeOrgChartNode[] = (() => {
  const list: JeOrgChartNode[] = [
    { id: 'w0', parentId: null, name: '集团总部', title: '直属 12 个部门', dept: '总部' },
  ]
  for (let i = 0; i < 12; i += 1) {
    const id = `w${i + 1}`
    list.push({
      id,
      parentId: 'w0',
      name: nextName(),
      title: `第 ${i + 1} 部门 负责人`,
      dept: '总部',
    })
    for (let j = 0; j < 2; j += 1) {
      list.push({ id: `${id}-${j}`, parentId: id, name: nextName(), title: '组员', dept: '总部' })
    }
  }
  return list
})()

/* -------------------------------------------------- 演示数据：一棵小族谱 */

/**
 * 族谱节点 = 组件要求的 id / parentId / name… 之外，再挂几个业务字段。
 * 组件只认固定那几个字段，其余原样保留、点击时带出，类型完全由使用方自己声明。
 */
interface FamilyPerson extends JeOrgChartNode {
  /** 性别：演示里用来给头像与描边上色 */
  gender?: 'male' | 'female'
  /** 是否已故：卡片降透明并在右上角打「故」角标 */
  deceased?: boolean
  /** 在世者的年龄 */
  age?: number
  /** 生卒年，如「1928 - 2005」「1982 - 至今」 */
  period?: string
}

/** 配偶带同一批业务字段：renderNode 的 zone 为 spouse 时画的就是它 */
interface FamilySpouse extends JeOrgChartSpouse {
  gender?: 'male' | 'female'
  deceased?: boolean
  age?: number
  period?: string
}

const familyNodes: FamilyPerson[] = [
  { id: 'f1', parentId: null, name: '林启山', title: '第一代 · 曾祖', gender: 'male', deceased: true, period: '1928 - 2005', spouse: { name: '苏婉', title: '曾祖母', gender: 'female', deceased: true, period: '1931 - 2010' } as FamilySpouse },
  { id: 'f2', parentId: 'f1', name: '林伯远', title: '长子 · 第二代', gender: 'male', deceased: true, period: '1951 - 2019', spouse: { name: '苏兰', title: '长媳', gender: 'female', deceased: true, period: '1954 - 2021' } as FamilySpouse },
  { id: 'f3', parentId: 'f1', name: '林仲清', title: '次子 · 第二代', gender: 'male', age: 71, period: '1954 - 至今', spouse: { name: '周慧', title: '次媳', gender: 'female', age: 70, period: '1956 - 至今' } as FamilySpouse },
  { id: 'f4', parentId: 'f2', name: '林知微', title: '第三代', gender: 'female', age: 45, period: '1980 - 至今', spouse: { name: '陈序', title: '女婿', gender: 'male', age: 47, period: '1979 - 至今' } as FamilySpouse },
  { id: 'f5', parentId: 'f2', name: '林知远', title: '第三代', gender: 'male', age: 43, period: '1982 - 至今', spouse: [{ name: '郑婉', title: '长媳', gender: 'female', age: 42, period: '1983 - 至今' }, { name: '何静', title: '次媳', gender: 'female', age: 39, period: '1986 - 至今' }] as FamilySpouse[] },
  { id: 'f6', parentId: 'f3', name: '林知微', title: '第三代', gender: 'female', age: 41, period: '1984 - 至今' },
  { id: 'f7', parentId: 'f3', name: '林知行', title: '第三代', gender: 'male', age: 38, period: '1987 - 至今' },
  { id: 'f8', parentId: 'f4', name: '林一诺', title: '第四代', gender: 'female', age: 18, period: '2007 - 至今' },
  { id: 'f9', parentId: 'f4', name: '林一言', title: '第四代', gender: 'male', age: 16, period: '2009 - 至今' },
  { id: 'f10', parentId: 'f5', name: '林一诺', title: '第四代', gender: 'female', age: 15, period: '2010 - 至今' },
  { id: 'f11', parentId: 'f7', name: '林一禾', title: '第四代', gender: 'male', age: 12, period: '2013 - 至今' },
  { id: 'f12', parentId: 'f8', name: '林砚', title: '第五代', gender: 'male', age: 6, period: '2019 - 至今' },
  { id: 'f13', parentId: 'f11', name: '林书', title: '第五代', gender: 'female', age: 3, period: '2022 - 至今' },
]

/** 演示用的性别色：真实项目可以换成自己的语义色 */
const GENDER_FILL = { male: '#3f7cf6', female: '#ec4899' } as const

/* -------------------------------------------------- 基础用法：点谁看谁 */

const eventTip = ref('点击节点查看详情，点击卡片下方圆点折叠 / 展开')

const onNodeClick = (node: JeOrgChartNode) => {
  eventTip.value = `node-click：${String(node.name)}`
}

const onSpouseClick = (spouse: JeOrgChartSpouse) => {
  eventTip.value = `spouse-click：${spouse.name}`
}

/* -------------------------------------------------- 连线样式 */

const linkStyle = ref<JeOrgChartLinkStyle>('curve')

/* -------------------------------------------------- 表单编辑 */

/**
 * 可编辑演示用的小数据集：十几个人，改起来看得清。
 * 组件是受控的 —— 它只通过 update:nodes 抛新的扁平数组，改不改、存不存由父级决定。
 */
const editableNodes = ref<JeOrgChartNode[]>([
  { id: 'e0', parentId: null, name: '产品中心', title: '一级部门' },
  { id: 'e1', parentId: 'e0', name: '林知远', title: '产品总监' },
  { id: 'e2', parentId: 'e0', name: '苏沐', title: '数据产品' },
  { id: 'e3', parentId: 'e1', name: '陈嘉懿', title: '产品经理' },
  { id: 'e4', parentId: 'e1', name: '周雨桐', title: '交互设计' },
  { id: 'e5', parentId: 'e2', name: '郑奕辰', title: '用户研究' },
  { id: 'e6', parentId: 'e3', name: '吴清越', title: '产品助理' },
])

const editableTip = ref('点任意卡片即可改名 / 改职位（取消或按 Esc 关闭）')

const onNodesUpdate = (list: JeOrgChartNode[]) => {
  const before = new Map(editableNodes.value.map((node) => [String(node.id), node]))
  const changed = list.find((node) => {
    const old = before.get(String(node.id))
    return old && (old.name !== node.name || old.title !== node.title)
  })
  editableNodes.value = list
  if (changed) editableTip.value = `update:nodes → ${String(changed.name)} / ${String(changed.title ?? '')}`
}

/* -------------------------------------------------- 拖拽改层级 */

/**
 * 拖拽演示用的小组织：三层，拖起来层级变化一眼能看出来。
 * 与表单编辑一样是受控的 —— node-move 只用来做提示，数据仍靠 update:nodes 写回。
 */
const dragNodes = ref<JeOrgChartNode[]>([
  { id: 'd0', parentId: null, name: '总部', title: '集团' },
  { id: 'd1', parentId: 'd0', name: '研发中心', title: '一级部门' },
  { id: 'd2', parentId: 'd0', name: '市场中心', title: '一级部门' },
  { id: 'd3', parentId: 'd1', name: '前端组', title: '二级' },
  { id: 'd4', parentId: 'd1', name: '后端组', title: '二级' },
  { id: 'd5', parentId: 'd2', name: '品牌组', title: '二级' },
  { id: 'd6', parentId: 'd3', name: '实习生 A', title: '三级' },
  { id: 'd7', parentId: 'd4', name: '实习生 B', title: '三级' },
])

const dragTip = ref('按住任意卡片拖到另一张卡片上松手，即可改挂到它下面（拖回原位 / 拖到自己的后代会被忽略）')

const nameOf = (id: string | null) =>
  id === null ? '根' : String(dragNodes.value.find((node) => String(node.id) === id)?.name ?? id)

const onNodeMove = (node: JeOrgChartNode, oldParentId: string | null, newParentId: string | null) => {
  dragTip.value = `node-move → ${String(node.name)}：${nameOf(oldParentId)} → ${nameOf(newParentId)}`
}

const onDragUpdate = (list: JeOrgChartNode[]) => {
  dragNodes.value = list
}

/* -------------------------------------------------- 增删节点与撤销重做 */

/**
 * 增删演示用的小组织：addable / removable / undoable 全开。
 * 数据仍是受控的 —— 组件把自己发起的每一次变更（增删 / 编辑 / 拖拽）走同一条漏斗抛 update:nodes。
 */
const crudNodes = ref<JeOrgChartNode[]>([
  { id: 'c0', parentId: null, name: '研发中心', title: '一级部门' },
  { id: 'c1', parentId: 'c0', name: '前端组', title: '二级' },
  { id: 'c2', parentId: 'c0', name: '后端组', title: '二级' },
  { id: 'c3', parentId: 'c1', name: '实习生 A', title: '三级' },
  { id: 'c4', parentId: 'c2', name: '实习生 B', title: '三级' },
])

const crudRef = ref<InstanceType<typeof JeOrgChart> | null>(null)
const crudTip = ref('点主卡：可添加下级、删除（连同整棵下级，需二次确认）；右上角按钮撤销 / 重做')
const crudCanUndo = ref(false)
const crudCanRedo = ref(false)

const onCrudUpdate = (list: JeOrgChartNode[]) => {
  crudNodes.value = list
}

const onNodeAdd = (node: JeOrgChartNode, parentId: string | null) => {
  crudTip.value = `node-add → 「${String(node.name)}」挂到「${parentId ?? '根'}」下`
}

const onNodeRemove = (removed: JeOrgChartNode[], node: JeOrgChartNode) => {
  crudTip.value = `node-remove → 删除「${String(node.name)}」及其 ${removed.length - 1} 个下级`
}

const onHistoryChange = (canUndo: boolean, canRedo: boolean) => {
  crudCanUndo.value = canUndo
  crudCanRedo.value = canRedo
}

const doUndo = () => {
  crudRef.value?.undo()
}

const doRedo = () => {
  crudRef.value?.redo()
}

/* -------------------------------------------------- 全屏演示 */

const fullscreen = ref(false)

const openFullscreen = () => {
  fullscreen.value = true
}

const closeFullscreen = () => {
  fullscreen.value = false
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !fullscreen.value) return
  // 全屏图里若有卡片浮层开着，这一次 Esc 归浮层（组件自己监听 window 收到并收起），
  // 不要连着把全屏也退掉 —— 要退全屏得再按一次。
  if (document.querySelector('.org-fs .je-org-chart__popup')) return
  closeFullscreen()
}

/* -------------------------------------------------- 搜索定位 */

const keyword = ref('若曦')
const searchTip = ref('')

const searchRef = ref<InstanceType<typeof JeOrgChart> | null>(null)

const doSearch = () => {
  const instance = searchRef.value
  if (!instance) return
  const hit = instance.locate(keyword.value)
  searchTip.value = hit ? `已定位到「${keyword.value}」` : `没有找到「${keyword.value}」`
}

/* -------------------------------------------------- 折叠控制 */

const foldRef = ref<InstanceType<typeof JeOrgChart> | null>(null)
const visibleCount = ref(0)

const refreshCount = () => {
  visibleCount.value = foldRef.value?.getVisibleIds().length ?? 0
}

const runAndCount = (action: (instance: InstanceType<typeof JeOrgChart>) => void) => {
  const instance = foldRef.value
  if (!instance) return
  action(instance)
  refreshCount()
}

/* -------------------------------------------------- 导出 */

const exportRef = ref<InstanceType<typeof JeOrgChart> | null>(null)
const exportTip = ref('')

const downloadPng = async () => {
  await exportRef.value?.download('org-chart.png')
  exportTip.value = '已导出 PNG'
}

const downloadDouble = async () => {
  await exportRef.value?.download('org-chart@2x.png', { scale: 2 })
  exportTip.value = '已导出两倍图'
}

const inspectSize = async () => {
  const blob = await exportRef.value?.toBlob()
  if (!blob) {
    exportTip.value = '导出失败'
    return
  }
  exportTip.value = `toBlob 拿到 PNG，约 ${(blob.size / 1024).toFixed(0)} KB`
}

/* -------------------------------------------------- 族谱适配 */

const familyRef = ref<InstanceType<typeof JeOrgChart> | null>(null)
const fitFamily = () => familyRef.value?.fit()

/* -------------------------------------------------- 自定义样式 */

const customMode = ref<'vars' | 'render'>('vars')

const CANVAS_FONT = '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif'

const roundedPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const radius = Math.min(r, h / 2, w / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/**
 * 自定义人物块：ctx 已平移到卡片左上角，从 (0, 0) 起按设计稿 px 画；
 * 返回 false 表示内置卡片不用再画。配色从 context.theme 里取，换肤自动跟上。
 */
const renderCustomNode: JeOrgChartRenderNode = (context) => {
  const { ctx, node, width, height, theme, hovered, active, scale, radius } = context

  const fill = ctx.createLinearGradient(0, 0, width, height)
  fill.addColorStop(0, hovered || active ? theme.nodeFillHover : theme.nodeFill)
  fill.addColorStop(1, theme.nodeFillEnd)
  roundedPath(ctx, 0, 0, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = active || hovered ? theme.nodeBorderActive : theme.nodeBorder
  ctx.lineWidth = (active ? 2 : 1) / scale
  ctx.stroke()

  // 左侧一道强调色竖条，代替头像
  roundedPath(ctx, 12, height / 2 - 17, 5, 34, 2.5)
  ctx.fillStyle = theme.accent
  ctx.fill()

  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = theme.text
  ctx.font = `600 15px ${CANVAS_FONT}`
  ctx.fillText(String(node.name ?? ''), 28, height / 2 - 9)
  ctx.fillStyle = theme.textMuted
  ctx.font = `400 12px ${CANVAS_FONT}`
  ctx.fillText(String(node.title ?? ''), 28, height / 2 + 11)
  return false
}

/* -------------------------------------------------- 自定义字段（业务数据进卡片） */

/**
 * 把业务字段画进卡片：男女用不同头像色、已故整体降透明并在右上角打「故」角标、
 * 卡面多画一行生卒（period）。返回 false = 内置卡片不再画，全部由这里接管。
 *
 * 主卡与配偶卡共用这一个回调：`zone === 'spouse'` 时画的是配偶卡，数据在 `spouse` 上。
 */
const renderPersonNode: JeOrgChartRenderNode = (context) => {
  const { ctx, node, zone, spouse, width, height, theme, hovered, active, scale, radius } = context
  const compact = zone === 'spouse'
  const person = (compact ? spouse : node) as FamilyPerson
  const female = person.gender === 'female'
  const deceased = person.deceased === true

  ctx.save()
  if (deceased) ctx.globalAlpha = 0.58

  // 卡面：悬停 / 选中提亮，主卡走内置主题渐变，配偶卡走更淡的配偶底色
  roundedPath(ctx, 0, 0, width, height, radius)
  if (compact) {
    ctx.fillStyle = hovered || active ? theme.nodeFillHover : theme.spouseFill
  } else {
    const fill = ctx.createLinearGradient(0, 0, width, height)
    fill.addColorStop(0, hovered || active ? theme.nodeFillHover : theme.nodeFill)
    fill.addColorStop(1, theme.nodeFillEnd)
    ctx.fillStyle = fill
  }
  ctx.fill()
  ctx.strokeStyle = female || hovered || active ? theme.nodeBorderActive : theme.nodeBorder
  ctx.lineWidth = (active ? 2 : 1) / scale
  ctx.stroke()

  // 首字头像：性别决定填充色（配偶卡整体缩一号）
  const avatarRadius = compact ? 13 : 14
  const cx = compact ? 20 : 24
  const cy = height / 2
  ctx.beginPath()
  ctx.arc(cx, cy, avatarRadius, 0, Math.PI * 2)
  ctx.fillStyle = GENDER_FILL[female ? 'female' : 'male']
  ctx.fill()
  ctx.fillStyle = theme.onColor
  ctx.font = `600 ${compact ? 12 : 13}px ${CANVAS_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(person.name ?? '').slice(0, 1) || '?', cx, cy + 1)

  // 文字：主卡三行（姓名 / 称谓 / 生卒），配偶卡两行（姓名 / 生卒），生卒就是自定义字段
  const left = compact ? 40 : 46
  ctx.textAlign = 'left'
  const text = (value: string, font: string, color: string, y: number) => {
    ctx.fillStyle = color
    ctx.font = font
    ctx.fillText(value, left, y)
  }
  if (compact) {
    text(String(person.name ?? ''), `600 13px ${CANVAS_FONT}`, theme.text, cy - 8)
    text(String(person.period ?? person.title ?? ''), `400 10px ${CANVAS_FONT}`, theme.textMuted, cy + 9)
  } else {
    text(String(person.name ?? ''), `600 14px ${CANVAS_FONT}`, theme.text, cy - 15)
    text(String(person.title ?? ''), `400 11px ${CANVAS_FONT}`, theme.textMuted, cy + 2)
    text(String(person.period ?? ''), `400 11px ${CANVAS_FONT}`, theme.textMuted, cy + 17)
  }

  // 已故角标
  if (deceased) {
    const label = '故'
    ctx.font = `600 10px ${CANVAS_FONT}`
    const badgeWidth = ctx.measureText(label).width + 10
    const bx = width - badgeWidth - 6
    roundedPath(ctx, bx, 6, badgeWidth, 15, 7.5)
    ctx.fillStyle = theme.textMuted
    ctx.fill()
    ctx.fillStyle = theme.onColor
    ctx.textAlign = 'center'
    ctx.fillText(label, bx + badgeWidth / 2, 13.5)
  }

  ctx.restore()
  return false
}

/** 详情浮层里要列的字段：主卡传节点数据、配偶卡传配偶数据，两边字段同名 */
const fieldRows = (source?: unknown) => {
  const person = source as (FamilyPerson & FamilySpouse) | null | undefined
  return [
    { label: '性别', value: person?.gender === 'female' ? '女' : person?.gender === 'male' ? '男' : '未知' },
    { label: '状态', value: person?.deceased ? '已故' : '在世' },
    { label: '年龄', value: person?.age ? `${person.age} 岁` : '—' },
    { label: '生卒', value: person?.period ?? '—' },
  ]
}

/* -------------------------------------------------- 生命周期 */

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  refreshCount()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <DemoPage
    title="OrgChart 组织架构图"
    description="Canvas 绘制的树形结构图，为「上千甚至上万人」设计：布局只算一次并缓存，缩放 / 平移只重绘视口内的节点，缩得越小越自动省掉文字与头像（分级 LOD），再叠加子树折叠，万级数据也能保持顺滑。节点是圆形头像 + 姓名 + 职位的卡片，支持滚轮缩放、拖拽平移、点击就近弹出详情、折叠展开、搜索定位、连线样式切换、全屏演示与导出图片，族谱还能并排展示配偶。"
  >
    <DemoBlock
      title="基础用法"
      description="nodes 是扁平数组（id + parentId），组件自己建树。默认展开两层，滚轮或双指缩放、拖拽平移；点击卡片会在人物旁边弹出详情浮层并用箭头指向本人，点卡片下方的圆形按钮折叠或展开下级（卡片右上角的角标是直属下级人数，为 0 时不显示）。"
    >
      <div class="org-toolbar">
        <je-button type="primary" @click="openFullscreen()">全屏演示</je-button>
        <span class="org-toolbar__tip">{{ eventTip }}</span>
      </div>
      <je-org-chart
        class="org-demo__chart"
        :nodes="orgNodes"
        :default-expand-depth="2"
        :link-style="linkStyle"
        label="示例组织架构图"
        @node-click="onNodeClick"
        @spouse-click="onSpouseClick"
      >
        <template #node-popup="{ node, close }">
          <div class="org-pop">
            <div class="org-pop__head">
              <span class="org-pop__name">{{ node?.name }}</span>
              <button class="org-pop__close" type="button" aria-label="关闭" @click="close">×</button>
            </div>
            <div class="org-pop__title">{{ node?.title }}</div>
            <div class="org-pop__meta">
              {{ String(node?.dept ?? '') }} · 直属下级 {{ Number(node?.staff ?? 0) }} 人
            </div>
          </div>
        </template>
      </je-org-chart>
    </DemoBlock>

    <DemoBlock
      title="表单编辑（editable）"
      description="editable 默认 false，纯展示；开启后点主卡会弹出内置编辑浮层（主标题 / 副标题），点确定触发 update:nodes 并抛出替换后的完整扁平数组，配合 v-model:nodes 即可双向绑定。组件仍是受控的 —— 只抛数据，落库、校验、撤销由业务侧决定；改完视口与折叠状态保持不变。"
    >
      <div class="org-toolbar">
        <span class="org-toolbar__tip">{{ editableTip }}</span>
      </div>
      <je-org-chart
        class="org-demo__chart"
        :nodes="editableNodes"
        editable
        :default-expand-depth="3"
        label="可编辑的组织架构图"
        @update:nodes="onNodesUpdate"
      />
    </DemoBlock>

    <DemoBlock
      title="拖拽调整层级（draggable）"
      description="draggable 默认 false，不可拖拽；开启后按住任意主卡拖到另一张主卡上松手，即把它改挂到目标节点下、连线随之重排。拖回原位、拖到自己的后代（会成环）都会被忽略；松手时同时抛 node-move（供记账 / 提示）与 update:nodes（喂给 v-model:nodes）。拖动中会画虚线引导线并高亮落点。"
    >
      <div class="org-toolbar">
        <span class="org-toolbar__tip">{{ dragTip }}</span>
      </div>
      <je-org-chart
        class="org-demo__chart"
        :nodes="dragNodes"
        draggable
        :default-expand-depth="3"
        label="可拖拽调整层级的组织架构图"
        @node-move="onNodeMove"
        @update:nodes="onDragUpdate"
      />
    </DemoBlock>

    <DemoBlock
      title="增删节点与撤销重做（addable / removable / undoable）"
      description="三个开关默认都关。addable 在内置浮层里给出「添加下级」，点它会在该节点下追加一个新节点（id 自动生成、名称取当前语言包的「新节点」）；removable 给出「删除」，删的是整棵子树、需二次确认（确认条会显示下级数量）；undoable 则为组件自己发起的每一次变更（增删 / 编辑 / 拖拽）记一份历史，用暴露的 undo() / redo() / clearHistory() 调用，可用状态变化时抛 history-change。与其他能力一样是受控的：node-add / node-remove 只做语义提示，数据仍靠 update:nodes 写回；宿主若换掉整份数据（不是组件刚抛出的那份），历史自动清空。"
    >
      <div class="org-toolbar">
        <je-button :disabled="!crudCanUndo" @click="doUndo()">撤销</je-button>
        <je-button :disabled="!crudCanRedo" @click="doRedo()">重做</je-button>
        <span class="org-toolbar__tip">{{ crudTip }}</span>
      </div>
      <je-org-chart
        ref="crudRef"
        class="org-demo__chart"
        :nodes="crudNodes"
        addable
        removable
        undoable
        :default-expand-depth="3"
        label="可增删与撤销重做的组织架构图"
        @node-add="onNodeAdd"
        @node-remove="onNodeRemove"
        @history-change="onHistoryChange"
        @update:nodes="onCrudUpdate"
      />
    </DemoBlock>

    <DemoBlock
      title="连线样式"
      description="linkStyle 三选一：curve 曲线（缺省）、elbow 直角肘形、straight 斜线。下面这棵树的根节点直接挂了 12 个部门 —— 换成肘形就能看到相邻连线会在同一高度连成一片，曲线则每条各自垂直出发、垂直落下，一级人越多差别越明显。"
    >
      <div class="org-toolbar">
        <span class="org-toolbar__tip">连线样式</span>
        <je-button
          size="small"
          :type="linkStyle === 'curve' ? 'primary' : 'default'"
          @click="linkStyle = 'curve'"
        >
          曲线
        </je-button>
        <je-button
          size="small"
          :type="linkStyle === 'elbow' ? 'primary' : 'default'"
          @click="linkStyle = 'elbow'"
        >
          肘形
        </je-button>
        <je-button
          size="small"
          :type="linkStyle === 'straight' ? 'primary' : 'default'"
          @click="linkStyle = 'straight'"
        >
          斜线
        </je-button>
      </div>
      <je-org-chart
        class="org-demo__chart"
        :nodes="wideNodes"
        :default-expand-depth="9"
        :link-style="linkStyle"
        label="连线样式对比"
      />
    </DemoBlock>

    <DemoBlock
      title="搜索与定位"
      description="locate() 先按 id 精确匹配，再按 name / title 模糊匹配：命中后自动展开它到根的整条路径、居中放大并高亮，同时触发 locate 事件。配合一个输入框就是「搜索并定位到人」。"
    >
      <div class="org-toolbar">
        <je-input
          v-model="keyword"
          class="org-toolbar__input"
          placeholder="输入姓名或职位，例如 若曦 / 组长"
          @keyup.enter="doSearch"
        />
        <je-button type="primary" @click="doSearch()">定位</je-button>
        <span class="org-toolbar__tip">{{ searchTip }}</span>
      </div>
      <je-org-chart
        ref="searchRef"
        class="org-demo__chart org-demo__chart--tall"
        :nodes="orgNodes"
        :default-expand-depth="1"
        label="搜索定位示例"
      />
    </DemoBlock>

    <DemoBlock
      title="折叠与适配"
      description="三个方法控制折叠状态：expandAll() 全部展开、collapseTo(depth) 折叠到指定层级（0 即只留根）、fit() 把整张图缩进视口。折叠只改可见节点集合，布局代价与可见节点数同阶，不随总人数增长。"
    >
      <div class="org-toolbar">
        <je-button @click="runAndCount((instance) => instance.expandAll())">全部展开</je-button>
        <je-button @click="runAndCount((instance) => instance.collapseTo(0))">只留根</je-button>
        <je-button @click="runAndCount((instance) => instance.collapseTo(2))">展开两层</je-button>
        <je-button @click="runAndCount((instance) => instance.fit())">适配全图</je-button>
        <span class="org-toolbar__tip">共 {{ orgNodes.length }} 人，当前可见 {{ visibleCount }} 个节点</span>
      </div>
      <je-org-chart
        ref="foldRef"
        class="org-demo__chart"
        :nodes="orgNodes"
        :default-expand-depth="2"
        label="折叠控制示例"
        @click="refreshCount"
      />
    </DemoBlock>

    <DemoBlock
      title="导出图片"
      description="download() 直接触发下载，toDataURL() 拿 dataURL，toBlob() 拿 Blob；scale 控制倍率（两倍图更清晰），background 可指定底色。导出走独立离屏画布、按当前可见节点重绘，因此预览里的悬停、选中高亮与详情浮层都不会被画进去。"
    >
      <div class="org-toolbar">
        <je-button type="primary" @click="downloadPng()">下载 PNG</je-button>
        <je-button @click="downloadDouble()">导出两倍图</je-button>
        <je-button variant="ghost" @click="inspectSize()">toBlob 取大小</je-button>
        <span class="org-toolbar__tip">{{ exportTip }}</span>
      </div>
      <je-org-chart
        ref="exportRef"
        class="org-demo__chart"
        :nodes="orgNodes"
        :default-expand-depth="2"
        label="导出示例"
      />
    </DemoBlock>

    <DemoBlock
      title="族谱与配偶"
      description="同一套内核也能画族谱：每人一个上级就是一棵树。给节点加 spouse（单个或多个）即可在主卡右侧并排展示配偶卡，中间用一条婚姻连线相连，下级仍挂在主卡上；布局会把「主卡 + 配偶卡」当成一整块居中，不会互相压到。点主卡弹 node-popup，点配偶卡则弹 spouse-popup（插槽参数 spouse / host / close），浮层都跟着卡片走、上方放不下会自动翻到下方。"
    >
      <div class="org-toolbar">
        <je-button @click="fitFamily()">适配全图</je-button>
        <span class="org-toolbar__tip">林知远有两个配偶，可看多张配偶卡的排布；点配偶卡看详情</span>
      </div>
      <je-org-chart
        ref="familyRef"
        class="org-demo__chart org-demo__chart--tall"
        :nodes="familyNodes"
        :node-width="150"
        :node-height="60"
        :spouse-width="150"
        :spouse-gap="18"
        :gap-x="20"
        :gap-y="52"
        :default-expand-depth="9"
        :link-style="linkStyle"
        label="示例族谱图"
        @spouse-click="onSpouseClick"
      >
        <template #spouse-popup="{ spouse, host, close }">
          <div class="org-pop">
            <div class="org-pop__head">
              <span class="org-pop__name">{{ spouse?.name }}</span>
              <button class="org-pop__close" type="button" aria-label="关闭" @click="close">×</button>
            </div>
            <div class="org-pop__title">{{ spouse?.title }}</div>
            <div class="org-pop__meta">配偶关系：{{ host?.name }} 的配偶</div>
          </div>
        </template>
      </je-org-chart>
    </DemoBlock>

    <DemoBlock
      title="自定义样式"
      description="两条路线，都不需要改组件：① 直接覆盖 --je-org-* 变量（node-fill / node-fill-end / node-accent / edge / spouse-fill…），零 JS 就能换一套皮；② 传 renderNode 接管绘制，回调拿到的 ctx 已平移到卡片左上角，返回 false 即跳过内置卡片。配偶卡的卡面同样会走这个回调（用 context.zone === 'spouse' 区分），渲染顺序、折叠按钮、计数徽标与婚姻连线仍由组件负责。"
    >
      <div class="org-toolbar">
        <je-button
          size="small"
          :type="customMode === 'vars' ? 'primary' : 'default'"
          @click="customMode = 'vars'"
        >
          CSS 变量换肤
        </je-button>
        <je-button
          size="small"
          :type="customMode === 'render' ? 'primary' : 'default'"
          @click="customMode = 'render'"
        >
          renderNode 自绘
        </je-button>
      </div>
      <je-org-chart
        class="org-demo__chart"
        :class="{ 'org-demo__chart--sunset': customMode === 'vars' }"
        :nodes="orgNodes"
        :default-expand-depth="2"
        :render-node="customMode === 'render' ? renderCustomNode : undefined"
        label="自定义样式示例"
      />
    </DemoBlock>

    <DemoBlock
      title="自定义字段"
      description="业务字段不用改组件：节点与配偶上直接多写 gender、deceased、age、period，点击时原样带出，类型由使用方自己声明。内置卡片只画姓名与职位，所以这里用 renderNode 依据这些字段现算观感 —— 男女用不同头像色、已故整体降透明并在右上角打「故」角标、卡面多画一行生卒。renderNode 对主卡与配偶卡都会调用：用 context.zone（'node' / 'spouse'）区分，zone 为 spouse 时数据在 context.spouse 上。详情浮层则用 node-popup / spouse-popup 两个插槽把四个字段列全。"
    >
      <div class="org-toolbar">
        <span class="org-toolbar__tip">
          点主卡或配偶卡：卡片样式由 renderNode 按 gender / deceased 现算，浮层里的年龄与生卒来自自定义字段
        </span>
      </div>
      <je-org-chart
        class="org-demo__chart org-demo__chart--tall"
        :nodes="familyNodes"
        :node-width="168"
        :node-height="68"
        :spouse-width="150"
        :spouse-gap="18"
        :gap-x="20"
        :gap-y="52"
        :default-expand-depth="9"
        :link-style="linkStyle"
        :render-node="renderPersonNode"
        label="自定义字段示例"
        @spouse-click="onSpouseClick"
      >
        <template #node-popup="{ node, close }">
          <div class="org-pop">
            <div class="org-pop__head">
              <span class="org-pop__name">{{ node?.name }}</span>
              <button class="org-pop__close" type="button" aria-label="关闭" @click="close">×</button>
            </div>
            <div class="org-pop__title">{{ node?.title }}</div>
            <dl class="org-pop__fields">
              <template v-for="row in fieldRows(node)" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </template>
            </dl>
          </div>
        </template>
        <template #spouse-popup="{ spouse, host, close }">
          <div class="org-pop">
            <div class="org-pop__head">
              <span class="org-pop__name">{{ spouse?.name }}</span>
              <button class="org-pop__close" type="button" aria-label="关闭" @click="close">×</button>
            </div>
            <div class="org-pop__title">{{ host?.name }} 的配偶</div>
            <dl class="org-pop__fields">
              <template v-for="row in fieldRows(spouse)" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </template>
            </dl>
          </div>
        </template>
      </je-org-chart>
    </DemoBlock>

    <DemoBlock
      title="数据结构"
      description="nodes 是扁平的节点数组（id + parentId），组件自己建树 —— 上万人的数据只需一次 O(n) 建表，折叠、搜索与增量更新都不必重排整棵树。除下表字段外，节点上还可以带任意业务字段（如 dept、staff），点击时会原样带出，方便外部渲染详情；族谱的配偶写在节点的 spouse 上（单个或数组）。"
    >
      <h4 class="org-ref__cap">节点 JeOrgChartNode</h4>
      <div class="org-ref__wrap">
        <table class="org-ref">
          <thead>
            <tr>
              <th>字段</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="org-ref__name">id</td>
              <td class="org-ref__type">string | number</td>
              <td>唯一标识，重复 id 只取第一个</td>
            </tr>
            <tr>
              <td class="org-ref__name">parentId</td>
              <td class="org-ref__type">string | number | null</td>
              <td>上级 id；留空或指向不存在的节点都会当作根</td>
            </tr>
            <tr>
              <td class="org-ref__name">name</td>
              <td class="org-ref__type">string</td>
              <td>主标题（姓名）</td>
            </tr>
            <tr>
              <td class="org-ref__name">title</td>
              <td class="org-ref__type">string</td>
              <td>副标题（职位 / 部门），不传则只画姓名一行</td>
            </tr>
            <tr>
              <td class="org-ref__name">avatar</td>
              <td class="org-ref__type">string</td>
              <td>头像图片地址；缺省或加载失败时退化为姓名首字色的圆形色块</td>
            </tr>
            <tr>
              <td class="org-ref__name">spouse</td>
              <td class="org-ref__type">JeOrgChartSpouse | JeOrgChartSpouse[]</td>
              <td>族谱用的配偶：单个或多个都会并排画在主卡右侧，下级仍挂在主卡上</td>
            </tr>
            <tr>
              <td class="org-ref__name">[key: string]</td>
              <td class="org-ref__type">unknown</td>
              <td>任意业务字段（如 gender、deceased、age、period），点击节点时原样带出。内置卡片只画 name / title / avatar，业务字段要出现在卡片上需用 renderNode 自绘（配偶卡同样会走这个回调，zone 为 spouse）、要出现在详情里用 node-popup / spouse-popup 插槽（见上面的「自定义字段」）</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="org-ref__cap">配偶 JeOrgChartSpouse</h4>
      <div class="org-ref__wrap">
        <table class="org-ref">
          <thead>
            <tr>
              <th>字段</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="org-ref__name">id</td>
              <td class="org-ref__type">string | number</td>
              <td>可选 id；给了就能被 locate() 搜到</td>
            </tr>
            <tr>
              <td class="org-ref__name">name</td>
              <td class="org-ref__type">string</td>
              <td>姓名</td>
            </tr>
            <tr>
              <td class="org-ref__name">title</td>
              <td class="org-ref__type">string</td>
              <td>副标题（称谓 / 备注），不传则只画姓名一行</td>
            </tr>
            <tr>
              <td class="org-ref__name">avatar</td>
              <td class="org-ref__type">string</td>
              <td>头像图片地址；缺省或加载失败时退化为姓名首字色的圆形色块</td>
            </tr>
            <tr>
              <td class="org-ref__name">[key: string]</td>
              <td class="org-ref__type">unknown</td>
              <td>任意业务字段（与节点同名地挂在配偶上）；renderNode 在 zone 为 spouse 时会读到它，spouse-popup 插槽能拿到整个配偶对象</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DemoBlock>

    <DemoBlock
      title="CSS 变量"
      description="卡片、连线、徽标与详情浮层的颜色全部取自 CSS 变量，组件内每一项都写成 var(--je-org-xxx, 内置派生值)：不写一行 JS 就能整体换肤；不设变量时用组件内 color-mix() 现算的派生色，因此会跟随明暗主题、也不新增全局 token。把变量写在任意祖先节点上即可生效（见上面的「自定义样式」）。"
    >
      <div class="org-ref__wrap">
        <table class="org-ref">
          <thead>
            <tr>
              <th>变量</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="org-ref__name">--je-org-node-fill</td>
              <td>卡片底色（纵向渐变上端），缺省 --je-surface</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-node-fill-end</td>
              <td>卡片底色的渐变下端，缺省为表面色与页面底色的混合</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-node-fill-hover</td>
              <td>悬停 / 选中时的卡片底色，缺省为页面底色与主色的混合</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-node-border</td>
              <td>卡片描边色，缺省 --je-border-color</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-node-accent</td>
              <td>强调色：选中 / 悬停描边、折叠按钮、计数徽标、头像渐变起点，缺省 --je-primary</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-node-accent-end</td>
              <td>强调色渐变终点，缺省 --je-primary-end</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-node-text</td>
              <td>卡片正文色，缺省 --je-text</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-node-text-muted</td>
              <td>卡片次要文字色，缺省 --je-text-muted</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-node-on-color</td>
              <td>彩色表面（头像、徽标）上的文字与图标色，缺省 --je-text-on-color</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-edge</td>
              <td>连线与折叠按钮描边色，缺省 --je-border-color</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-spouse-fill</td>
              <td>配偶卡底色，缺省为页面底色与表面色的混合（用来和主卡拉开层次）</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-spouse-avatar-fill</td>
              <td>配偶卡无头像时姓名首字圆形色块的底色，缺省 --je-border-color</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-popup-bg</td>
              <td>详情浮层底色（含箭头），缺省 --je-surface</td>
            </tr>
            <tr>
              <td class="org-ref__name">--je-org-popup-border</td>
              <td>详情浮层描边色，缺省 --je-border-color</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DemoBlock>

    <DemoBlock
      title="renderNode 绘制上下文"
      description="renderNode 回调拿到的上下文：坐标都是设计稿 px、原点在卡片左上角（ctx 已平移到卡片左上角并套好视口缩放），从这里起画即可。返回 false 表示跳过内置卡片，返回 true 或不返回则内置卡片照画。主卡与配偶卡共用这一个回调，用 zone 区分。theme 里的每个颜色都与上面的 --je-org-* 一一对应，所以自定义画法会自动跟上换肤。"
    >
      <div class="org-ref__wrap">
        <table class="org-ref">
          <thead>
            <tr>
              <th>字段</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="org-ref__name">ctx</td>
              <td class="org-ref__type">CanvasRenderingContext2D</td>
              <td>画布上下文：已平移到卡片左上角、并套好视口缩放，从 (0, 0) 起按设计稿 px 画即可</td>
            </tr>
            <tr>
              <td class="org-ref__name">node</td>
              <td class="org-ref__type">JeOrgChartNode</td>
              <td>绘制目标的业务数据：主卡是本节点，配偶卡是该配偶所属的主卡节点</td>
            </tr>
            <tr>
              <td class="org-ref__name">zone</td>
              <td class="org-ref__type">'node' | 'spouse'</td>
              <td>绘制目标：主卡为 node、配偶卡为 spouse，同一个回调两处都会调用，靠它区分</td>
            </tr>
            <tr>
              <td class="org-ref__name">spouse</td>
              <td class="org-ref__type">JeOrgChartSpouse</td>
              <td>zone 为 spouse 时的配偶数据（含它自己的业务字段），主卡时为 undefined</td>
            </tr>
            <tr>
              <td class="org-ref__name">layout</td>
              <td class="org-ref__type">JeTreeLayoutNode</td>
              <td>该节点在布局里的位置与占用宽度（配偶卡传的是它所属主卡的布局节点）</td>
            </tr>
            <tr>
              <td class="org-ref__name">width / height</td>
              <td class="org-ref__type">number</td>
              <td>卡片宽 / 高（设计稿 px）</td>
            </tr>
            <tr>
              <td class="org-ref__name">scale</td>
              <td class="org-ref__type">number</td>
              <td>当前缩放；想画出屏幕像素恒定的线宽就写 n / scale</td>
            </tr>
            <tr>
              <td class="org-ref__name">hovered / active</td>
              <td class="org-ref__type">boolean</td>
              <td>是否处于悬停 / 选中态（导出时恒为 false）</td>
            </tr>
            <tr>
              <td class="org-ref__name">theme</td>
              <td class="org-ref__type">JeOrgChartTheme</td>
              <td>当前主题色，键与上面的 --je-org-* 一一对应</td>
            </tr>
            <tr>
              <td class="org-ref__name">radius</td>
              <td class="org-ref__type">number</td>
              <td>卡片圆角（设计稿 px）</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DemoBlock>

    <Teleport to="body">
      <div v-if="fullscreen" class="org-fs">
        <div class="org-fs__bar">
          <span class="org-fs__title">全屏演示 · {{ orgNodes.length }} 人的组织架构图</span>
          <div class="org-fs__actions">
            <je-button
              size="small"
              :type="linkStyle === 'curve' ? 'primary' : 'default'"
              @click="linkStyle = 'curve'"
            >
              曲线
            </je-button>
            <je-button
              size="small"
              :type="linkStyle === 'elbow' ? 'primary' : 'default'"
              @click="linkStyle = 'elbow'"
            >
              肘形
            </je-button>
            <je-button
              size="small"
              :type="linkStyle === 'straight' ? 'primary' : 'default'"
              @click="linkStyle = 'straight'"
            >
              斜线
            </je-button>
            <je-button size="small" variant="ghost" @click="closeFullscreen()">
              退出全屏（Esc）
            </je-button>
          </div>
        </div>
        <je-org-chart
          class="org-fs__chart"
          :nodes="orgNodes"
          :default-expand-depth="2"
          :link-style="linkStyle"
          label="全屏组织架构图"
          @node-click="onNodeClick"
          @spouse-click="onSpouseClick"
        >
          <template #node-popup="{ node, close }">
            <div class="org-pop">
              <div class="org-pop__head">
                <span class="org-pop__name">{{ node?.name }}</span>
                <button class="org-pop__close" type="button" aria-label="关闭" @click="close">
                  ×
                </button>
              </div>
              <div class="org-pop__title">{{ node?.title }}</div>
              <div class="org-pop__meta">
                {{ String(node?.dept ?? '') }} · 直属下级 {{ Number(node?.staff ?? 0) }} 人
              </div>
            </div>
          </template>
        </je-org-chart>
      </div>
    </Teleport>
  </DemoPage>
</template>

<style scoped>
.org-demo__chart {
  height: 520px;
  border: 1px solid var(--je-border-color);
  border-radius: 16px;
  background: var(--je-bg-page-from);
  overflow: hidden;
}

.org-demo__chart--tall {
  height: 460px;
}

/* CSS 变量换肤：只覆盖 --je-org-* ，组件一行没改；用 color-mix 拼 token 才能跟着明暗一起变 */
.org-demo__chart--sunset {
  --je-org-node-fill: color-mix(in srgb, var(--je-warning) 12%, var(--je-surface));
  --je-org-node-fill-end: color-mix(in srgb, var(--je-warning) 26%, var(--je-surface));
  --je-org-node-accent: var(--je-warning);
  --je-org-edge: color-mix(in srgb, var(--je-warning) 45%, var(--je-border-color));
  --je-org-spouse-fill: color-mix(in srgb, var(--je-warning) 8%, var(--je-surface));
  --je-org-spouse-avatar-fill: color-mix(in srgb, var(--je-warning) 35%, var(--je-border-color));
}

.org-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.org-toolbar__input {
  width: 260px;
}

.org-toolbar__tip {
  font-size: 13px;
  color: var(--je-text-muted);
}

/* -------------------------------------------------- 数据结构 / CSS 变量参考表 */

.org-ref__cap {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--je-text);
}

/* 窄屏下表格横向滚动，不撑破正文列 */
.org-ref__wrap {
  overflow-x: auto;
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.org-ref {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.6;
  text-align: left;
}

.org-ref th,
.org-ref td {
  padding: 9px 12px;
  vertical-align: top;
  border-bottom: 1px solid var(--je-border-color);
}

.org-ref th {
  font-size: 12px;
  font-weight: 600;
  color: var(--je-text-muted);
  white-space: nowrap;
}

.org-ref tbody tr:last-child td {
  border-bottom: none;
}

.org-ref td {
  color: var(--je-text-muted);
}

.org-ref__name,
.org-ref__type {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.org-ref__name {
  font-weight: 600;
  color: var(--je-text);
  white-space: nowrap;
}

.org-ref__type {
  color: color-mix(in srgb, var(--je-primary) 40%, var(--je-text));
}

/* -------------------------------------------------- 详情浮层内容 */

.org-pop__head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.org-pop__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--je-text);
}

.org-pop__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--je-text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.org-pop__close:hover {
  background: var(--je-surface-hover);
  color: var(--je-text);
}

.org-pop__title {
  margin-top: 2px;
  font-size: 12px;
  color: var(--je-text-muted);
}

.org-pop__meta {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--je-border-color);
  font-size: 12px;
  color: var(--je-text-faint);
}

/* 自定义字段列表：两列网格，dt 是标签、dd 是值 */
.org-pop__fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--je-border-color);
  font-size: 12px;
}

.org-pop__fields dt {
  color: var(--je-text-faint);
}

.org-pop__fields dd {
  margin: 0;
  color: var(--je-text);
}

/* -------------------------------------------------- 全屏演示 */

.org-fs {
  position: fixed;
  inset: 0;
  z-index: 2400;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: var(--je-bg-page-from);
}

.org-fs__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--je-border-color);
  background: var(--je-surface);
}

.org-fs__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--je-text);
}

.org-fs__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.org-fs__chart {
  min-height: 0;
}

@media (max-width: 768px) {
  .org-toolbar__input {
    width: 100%;
  }
}
</style>
