/**
 * `JeOrgChart` 的类型定义。
 *
 * 数据是**扁平的节点数组**（id + parentId），而不是嵌套树：这样上万人的数据只需要
 * 一次 O(n) 建表，折叠 / 搜索 / 增量更新都不用重排整棵树，业务侧也更好从接口拿数据。
 */

import type { JeTreeLayoutNode } from '../../core/treeLayout'

/**
 * 族谱里的配偶：并排画在主卡右侧，不参与树的层级（下级仍挂在主卡上）。
 *
 * 卡面同样会走 `renderNode`（此时 `zone` 为 `'spouse'`），点击后可用 `spouse-popup` 插槽展示详情。
 */
export interface JeOrgChartSpouse {
  /** 可选 id；给了就能被 `locate()` 搜到 */
  id?: string | number
  /** 姓名 */
  name: string
  /** 副标题（称谓 / 备注），不传则只画姓名一行 */
  title?: string
  /** 头像图片地址；缺省或加载失败时退化为姓名首字色的圆形色块 */
  avatar?: string
  /** 任意业务字段，点击时原样带出 */
  [key: string]: unknown
}

/** 组织架构 / 族谱里的一个人（或一个部门节点） */
export interface JeOrgChartNode {
  /** 唯一标识，重复 id 只取第一个 */
  id: string | number
  /** 上级 id；留空或指向不存在的节点都会当作根 */
  parentId?: string | number | null
  /** 主标题（姓名） */
  name: string
  /** 副标题（职位 / 部门），不传则只画姓名一行 */
  title?: string
  /** 头像图片地址；缺省或加载失败时退化为姓名首字色的圆形色块 */
  avatar?: string
  /** 族谱用的配偶：单个或多个都会并排画在主卡右侧 */
  spouse?: JeOrgChartSpouse | JeOrgChartSpouse[]
  /** 任意业务字段，点击节点时原样带出，方便外部渲染详情 */
  [key: string]: unknown
}

/** 连线样式：曲线（缺省）/ 直角肘形 / 斜线 */
export type JeOrgChartLinkStyle = 'curve' | 'elbow' | 'straight'

/** 解析好的主题色，原样透传给 `renderNode` 让自定义画法跟得上换肤 */
export interface JeOrgChartTheme {
  /** 卡片底色（纵向渐变的上端） */
  nodeFill: string
  /** 卡片底色的渐变下端 */
  nodeFillEnd: string
  /** 悬停 / 选中时的卡片底色 */
  nodeFillHover: string
  /** 卡片描边色 */
  nodeBorder: string
  /** 选中 / 悬停的描边色（即强调色） */
  nodeBorderActive: string
  /** 正文色 */
  text: string
  /** 次要文字色 */
  textMuted: string
  /** 连线色 */
  edge: string
  /** 强调色（折叠按钮、计数徽标、头像渐变起点） */
  accent: string
  /** 强调色渐变终点 */
  accentEnd: string
  /** 彩色表面上的文字 / 图标色 */
  onColor: string
  /** 配偶卡底色 */
  spouseFill: string
  /** 配偶卡无头像时的姓名首字圆形底色（对应 `--je-org-spouse-avatar-fill`） */
  spouseAvatarFill: string
}

/** `renderNode` 拿到的绘制上下文，坐标都是**设计稿 px**、原点在卡片左上角 */
export interface JeOrgChartRenderContext {
  /** 画布上下文：已平移到卡片左上角、并套好视口缩放，从 (0, 0) 起按设计稿 px 画即可 */
  ctx: CanvasRenderingContext2D
  /**
   * 当前绘制目标的业务数据：主卡是本节点，配偶卡是**该配偶所属的主卡节点**
   * （配偶本人的数据在 `spouse` 里）
   */
  node: JeOrgChartNode
  /** 绘制目标：`'node'` 为主卡，`'spouse'` 为配偶卡 —— 同一个 renderNode 两处都会调用，靠它区分 */
  zone: 'node' | 'spouse'
  /** `zone` 为 `'spouse'` 时的配偶数据，主卡时为 undefined */
  spouse?: JeOrgChartSpouse
  /** 该节点在布局里的位置与占用宽度（配偶卡传的是它所属主卡的布局节点） */
  layout: JeTreeLayoutNode
  /** 卡片宽（设计稿 px） */
  width: number
  /** 卡片高（设计稿 px） */
  height: number
  /** 当前缩放；想画出屏幕像素恒定的线宽就写 `n / scale` */
  scale: number
  /** 是否处于悬停态（导出时恒为 false） */
  hovered: boolean
  /** 是否处于选中态（导出时恒为 false） */
  active: boolean
  /** 当前主题色 */
  theme: Readonly<JeOrgChartTheme>
  /** 卡片圆角（设计稿 px） */
  radius: number
}

/**
 * 自定义人物块画法。
 *
 * 传了它就能接管卡面的绘制：在回调里按设计稿坐标（原点在卡片左上角）随便画。
 * **返回 `false` 表示「我画完了，别再画内置卡片」**（跳过底色 / 描边 / 头像 / 姓名 / 职位）；
 * 返回 `true` 或不返回则内置卡片照画，适合只往上面叠装饰的场景。
 *
 * 主卡与**配偶卡**共用这一个回调，用 `context.zone`（`'node'` / `'spouse'`）区分；
 * 婚姻连线、折叠按钮与计数徽标不受它影响，仍由组件绘制。
 */
export type JeOrgChartRenderNode = (context: JeOrgChartRenderContext) => boolean | void

export interface JeOrgChartProps {
  /** 扁平节点数组 */
  nodes: JeOrgChartNode[]
  /** 指定根节点 id；缺省时把 parentId 为空（或指向不存在的节点）的都当作根 */
  rootId?: string | number
  /** 节点卡片宽度（设计稿 px） */
  nodeWidth?: number
  /** 节点卡片高度（设计稿 px） */
  nodeHeight?: number
  /** 兄弟节点之间的水平间距（设计稿 px） */
  gapX?: number
  /** 层级之间的垂直间距（设计稿 px） */
  gapY?: number
  /** 配偶卡宽度（设计稿 px），缺省与 nodeWidth 一致 */
  spouseWidth?: number
  /** 配偶卡与主卡之间的间距（设计稿 px） */
  spouseGap?: number
  /** 初始展开层级：0 表示只显示根节点，2 表示根往下展开两层（depth 0/1/2 可见） */
  defaultExpandDepth?: number
  /** 缩放下限 */
  minScale?: number
  /** 缩放上限 */
  maxScale?: number
  /** 连线样式，缺省 curve 曲线（一级人多时曲线比肘形更容易看清归属） */
  linkStyle?: JeOrgChartLinkStyle
  /**
   * 是否开启表单编辑：缺省 false 即纯展示、不可编辑。
   * 传 true 后点击主卡会弹出内置编辑浮层（主标题 / 副标题两个字段），保存时通过 update:nodes
   * 事件抛出替换后的完整扁平数组（配合 v-model:nodes 使用）。组件仍是受控的，只抛数据，
   * 落库 / 校验 / 撤销由业务侧决定；配偶卡不参与编辑。
   */
  editable?: boolean
  /**
   * 是否开启拖拽改层级：缺省 false 即不可拖拽。
   * 传 true 后可按住某张主卡拖到另一张主卡上，松手即把它改挂到目标节点下，通过 node-move 与
   * update:nodes 抛出结果（配合 v-model:nodes 使用）。同样是受控组件，只抛数据；拖回原位、
   * 拖到自己的后代等非法落点会被忽略，配偶卡与折叠按钮不可拖。
   */
  draggable?: boolean
  /**
   * 是否开启「添加下级」：缺省 false。
   * 传 true 后点击主卡弹出的内置浮层里会多一个「添加下级」按钮，点它即在该节点下追加一个新节点
   * （id 自动生成为**字符串**、name 取当前语言包里的「新节点」），并抛 node-add 与 update:nodes。
   * 提供了 node-popup 插槽时内置浮层不出现，可改用暴露的 addChild(id) 自行调用。
   */
  addable?: boolean
  /**
   * 是否开启「删除节点」：缺省 false。
   * 传 true 后内置浮层里会多一个「删除」按钮，点击需**二次确认**；确认后删除该节点**及其全部下级**
   * （整棵子树），抛 node-remove（被删的整棵子树）与 update:nodes。提供了 node-popup 插槽时
   * 改用暴露的 removeNode(id) 自行调用。
   */
  removable?: boolean
  /**
   * 是否开启撤销 / 重做：缺省 false。
   * 传 true 后组件会为**自己发起的每一次变更**（编辑保存 / 拖拽改层级 / 增删节点）记一份历史，
   * 通过暴露的 undo() / redo() / clearHistory() 调用，每次可用状态变化抛 history-change。
   * 宿主若换掉整份数据（不是组件刚抛出的那份），历史自动清空。
   */
  undoable?: boolean
  /** 自定义人物块画法，见 JeOrgChartRenderNode */
  renderNode?: JeOrgChartRenderNode
  /** 画布底色，缺省透明；导出时未单独指定则沿用 */
  background?: string
  /** 无障碍描述，缺省「组织架构图」 */
  label?: string
}

/** 导出参数 */
export interface JeOrgChartExportOptions {
  /** 导出倍率（相对设计稿尺寸），缺省 1，传 2 即两倍图 */
  scale?: number
  /** 导出底色，缺省沿用组件的 background；都没有则透明 */
  background?: string
  /** 图片类型，缺省 image/png */
  type?: string
  /** JPEG / WebP 的质量（0 - 1） */
  quality?: number
}

/** 命中测试结果：节点卡片、它下方的折叠按钮，还是旁边的配偶卡 */
export interface JeOrgChartHit {
  id: string
  /** body 为本人卡片，toggle 为折叠按钮，spouse 为配偶卡 */
  zone: 'body' | 'toggle' | 'spouse'
  /** zone 为 spouse 时，是第几个配偶（从 0 开始） */
  spouseIndex?: number
}
