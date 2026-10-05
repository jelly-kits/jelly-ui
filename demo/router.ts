import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import type { Component } from 'vue'

import HomePage from './pages/HomePage.vue'
import InstallPage from './pages/InstallPage.vue'
import SpacePage from './pages/SpacePage.vue'
import DividerPage from './pages/DividerPage.vue'
import IconPage from './pages/IconPage.vue'
import TextPage from './pages/TextPage.vue'
import LinkPage from './pages/LinkPage.vue'
import CardPage from './pages/CardPage.vue'
import ButtonPage from './pages/ButtonPage.vue'
import InputPage from './pages/InputPage.vue'
import InputNumberPage from './pages/InputNumberPage.vue'
import SwitchPage from './pages/SwitchPage.vue'
import SliderPage from './pages/SliderPage.vue'
import RatePage from './pages/RatePage.vue'
import SegmentedPage from './pages/SegmentedPage.vue'
import SelectPage from './pages/SelectPage.vue'
import CheckboxPage from './pages/CheckboxPage.vue'
import RadioPage from './pages/RadioPage.vue'
import TimePickerPage from './pages/TimePickerPage.vue'
import FormPage from './pages/FormPage.vue'
import ToastPage from './pages/ToastPage.vue'
import ScrollbarPage from './pages/ScrollbarPage.vue'

import TooltipPage from './pages/TooltipPage.vue'
import DialogPage from './pages/DialogPage.vue'
import PopoverPage from './pages/PopoverPage.vue'
import PopconfirmPage from './pages/PopconfirmPage.vue'
import DrawerPage from './pages/DrawerPage.vue'
import AlertPage from './pages/AlertPage.vue'
import MessagePage from './pages/MessagePage.vue'
import NotificationPage from './pages/NotificationPage.vue'
import ProgressPage from './pages/ProgressPage.vue'
import SkeletonPage from './pages/SkeletonPage.vue'
import EmptyPage from './pages/EmptyPage.vue'
import ResultPage from './pages/ResultPage.vue'
import LoadingPage from './pages/LoadingPage.vue'
import TourPage from './pages/TourPage.vue'

import TagPage from './pages/TagPage.vue'
import BadgePage from './pages/BadgePage.vue'
import AvatarPage from './pages/AvatarPage.vue'
import WatermarkPage from './pages/WatermarkPage.vue'
import QrcodePage from './pages/QrcodePage.vue'
import PosterPage from './pages/PosterPage.vue'
import OrgChartPage from './pages/OrgChartPage.vue'
import DescriptionsPage from './pages/DescriptionsPage.vue'
import StatisticPage from './pages/StatisticPage.vue'
import TimelinePage from './pages/TimelinePage.vue'
import CollapsePage from './pages/CollapsePage.vue'
import ImagePage from './pages/ImagePage.vue'
import CarouselPage from './pages/CarouselPage.vue'
import TablePage from './pages/TablePage.vue'
import TreePage from './pages/TreePage.vue'
import CalendarPage from './pages/CalendarPage.vue'

import TabsPage from './pages/TabsPage.vue'
import BreadcrumbPage from './pages/BreadcrumbPage.vue'
import StepsPage from './pages/StepsPage.vue'
import DropdownPage from './pages/DropdownPage.vue'
import MenuPage from './pages/MenuPage.vue'
import PaginationPage from './pages/PaginationPage.vue'
import BacktopPage from './pages/BacktopPage.vue'
import AnchorPage from './pages/AnchorPage.vue'
import AffixPage from './pages/AffixPage.vue'

import LayoutPage from './pages/LayoutPage.vue'
import ContainerPage from './pages/ContainerPage.vue'
import SplitterPage from './pages/SplitterPage.vue'

import TransferPage from './pages/TransferPage.vue'
import UploadPage from './pages/UploadPage.vue'
import DatePickerPage from './pages/DatePickerPage.vue'
import TimeSelectPage from './pages/TimeSelectPage.vue'
import CascaderPage from './pages/CascaderPage.vue'
import TreeSelectPage from './pages/TreeSelectPage.vue'
import ColorPickerPage from './pages/ColorPickerPage.vue'
import AutoCompletePage from './pages/AutoCompletePage.vue'

import CellPage from './pages/CellPage.vue'
import GridPage from './pages/GridPage.vue'
import NavBarPage from './pages/NavBarPage.vue'
import TabbarPage from './pages/TabbarPage.vue'
import PullRefreshPage from './pages/PullRefreshPage.vue'
import InfiniteScrollPage from './pages/InfiniteScrollPage.vue'
import ActionSheetPage from './pages/ActionSheetPage.vue'
import PickerPage from './pages/PickerPage.vue'
import SearchPage from './pages/SearchPage.vue'
import StepperPage from './pages/StepperPage.vue'
import NumberKeyboardPage from './pages/NumberKeyboardPage.vue'
import PasswordInputPage from './pages/PasswordInputPage.vue'
import NoticeBarPage from './pages/NoticeBarPage.vue'
import CountDownPage from './pages/CountDownPage.vue'
import PopupPage from './pages/PopupPage.vue'
import FloatingBubblePage from './pages/FloatingBubblePage.vue'
import SwipeCellPage from './pages/SwipeCellPage.vue'
import LazyloadPage from './pages/LazyloadPage.vue'
import IndexBarPage from './pages/IndexBarPage.vue'
import SidebarPage from './pages/SidebarPage.vue'
import CouponPage from './pages/CouponPage.vue'
import SubmitBarPage from './pages/SubmitBarPage.vue'
import AreaPage from './pages/AreaPage.vue'
import AddressListPage from './pages/AddressListPage.vue'
import DropdownMenuPage from './pages/DropdownMenuPage.vue'
import TabPage from './pages/TabPage.vue'
import ActionBarPage from './pages/ActionBarPage.vue'
import CirclePage from './pages/CirclePage.vue'
import ImagePreviewPage from './pages/ImagePreviewPage.vue'
import HighlightPage from './pages/HighlightPage.vue'
import SignaturePage from './pages/SignaturePage.vue'
import FloatingPanelPage from './pages/FloatingPanelPage.vue'
import ShareSheetPage from './pages/ShareSheetPage.vue'
import ConfigProviderPage from './pages/ConfigProviderPage.vue'
import LocalePage from './pages/LocalePage.vue'
import ThemePage from './pages/ThemePage.vue'
import { getPreferredLocale, setDemoLocale, type DemoLocale } from './i18n'

interface DemoRoute {
  path: string
  title: string
  group: string
  /** 二级分组：条目过多的组（如「移动端」）再分一层，缺省时直接挂在 group 下 */
  subgroup?: string
  component: Component
}

/** 左侧菜单的二级分组 */
export interface DemoNavSubgroup {
  title: string
  items: DemoRoute[]
}

/** 左侧菜单的分组：items 是直属条目，subgroups 是再分一层的条目（两者可共存） */
export interface DemoNavGroup {
  title: string
  items: DemoRoute[]
  subgroups: DemoNavSubgroup[]
}

/** 路由与左侧菜单共用的唯一数据源 */
export const demoRoutes: DemoRoute[] = [
  { path: '/', title: '总览', group: '开始', component: HomePage },
  { path: '/install', title: 'Install 安装', group: '开始', component: InstallPage },

  { path: '/space', title: 'Space 间距', group: '布局', component: SpacePage },
  { path: '/divider', title: 'Divider 分割线', group: '布局', component: DividerPage },
  { path: '/card', title: 'Card 卡片', group: '布局', component: CardPage },
  { path: '/layout', title: 'Layout 栅格布局', group: '布局', component: LayoutPage },
  { path: '/container', title: 'Container 布局容器', group: '布局', component: ContainerPage },
  { path: '/splitter', title: 'Splitter 分割面板', group: '布局', component: SplitterPage },
  { path: '/scrollbar', title: 'Scrollbar 滚动条', group: '布局', component: ScrollbarPage },

  { path: '/icon', title: 'Icon 图标', group: '基础', component: IconPage },
  { path: '/text', title: 'Text 文本', group: '基础', component: TextPage },
  { path: '/link', title: 'Link 链接', group: '基础', component: LinkPage },
  { path: '/button', title: 'Button 按钮', group: '基础', component: ButtonPage },
  { path: '/tag', title: 'Tag 标签', group: '基础', component: TagPage },
  { path: '/badge', title: 'Badge 徽标', group: '基础', component: BadgePage },
  { path: '/avatar', title: 'Avatar 头像', group: '基础', component: AvatarPage },
  { path: '/watermark', title: 'Watermark 水印', group: '基础', component: WatermarkPage },

  { path: '/input', title: 'Input 输入框', group: '表单', component: InputPage },
  { path: '/input-number', title: 'InputNumber 计数器', group: '表单', component: InputNumberPage },
  { path: '/select', title: 'Select 选择器', group: '表单', component: SelectPage },
  { path: '/autocomplete', title: 'AutoComplete 自动补全', group: '表单', component: AutoCompletePage },
  { path: '/radio', title: 'Radio 单选框', group: '表单', component: RadioPage },
  { path: '/checkbox', title: 'Checkbox 多选框', group: '表单', component: CheckboxPage },
  { path: '/switch', title: 'Switch 开关', group: '表单', component: SwitchPage },
  { path: '/slider', title: 'Slider 滑块', group: '表单', component: SliderPage },
  { path: '/rate', title: 'Rate 评分', group: '表单', component: RatePage },
  { path: '/segmented', title: 'Segmented 分段', group: '表单', component: SegmentedPage },
  { path: '/color-picker', title: 'ColorPicker 取色器', group: '表单', component: ColorPickerPage },
  { path: '/time-picker', title: 'TimePicker 时间', group: '表单', component: TimePickerPage },
  { path: '/time-select', title: 'TimeSelect 时间选择', group: '表单', component: TimeSelectPage },
  { path: '/date-picker', title: 'DatePicker 日期', group: '表单', component: DatePickerPage },
  { path: '/cascader', title: 'Cascader 级联', group: '表单', component: CascaderPage },
  { path: '/tree-select', title: 'TreeSelect 树选择', group: '表单', component: TreeSelectPage },
  { path: '/transfer', title: 'Transfer 穿梭框', group: '表单', component: TransferPage },
  { path: '/upload', title: 'Upload 上传', group: '表单', component: UploadPage },
  { path: '/form', title: 'Form 表单', group: '表单', component: FormPage },

  { path: '/descriptions', title: 'Descriptions 描述列表', group: '数据展示', component: DescriptionsPage },
  { path: '/statistic', title: 'Statistic 统计数值', group: '数据展示', component: StatisticPage },
  { path: '/timeline', title: 'Timeline 时间线', group: '数据展示', component: TimelinePage },
  { path: '/collapse', title: 'Collapse 折叠面板', group: '数据展示', component: CollapsePage },
  { path: '/image', title: 'Image 图片', group: '数据展示', component: ImagePage },
  { path: '/carousel', title: 'Carousel 走马灯', group: '数据展示', component: CarouselPage },
  { path: '/table', title: 'Table 表格', group: '数据展示', component: TablePage },
  { path: '/tree', title: 'Tree 树形控件', group: '数据展示', component: TreePage },
  { path: '/calendar', title: 'Calendar 日历', group: '数据展示', component: CalendarPage },
  { path: '/qrcode', title: 'Qrcode 二维码', group: '数据展示', component: QrcodePage },
  { path: '/poster', title: 'Poster 海报', group: '数据展示', component: PosterPage },
  { path: '/org-chart', title: 'OrgChart 组织架构图', group: '数据展示', component: OrgChartPage },

  { path: '/tabs', title: 'Tabs 标签页', group: '导航', component: TabsPage },
  { path: '/breadcrumb', title: 'Breadcrumb 面包屑', group: '导航', component: BreadcrumbPage },
  { path: '/steps', title: 'Steps 步骤条', group: '导航', component: StepsPage },
  { path: '/dropdown', title: 'Dropdown 下拉菜单', group: '导航', component: DropdownPage },
  { path: '/menu', title: 'Menu 菜单', group: '导航', component: MenuPage },
  { path: '/pagination', title: 'Pagination 分页', group: '导航', component: PaginationPage },
  { path: '/backtop', title: 'Backtop 回到顶部', group: '导航', component: BacktopPage },
  { path: '/anchor', title: 'Anchor 锚点', group: '导航', component: AnchorPage },
  { path: '/affix', title: 'Affix 固钉', group: '导航', component: AffixPage },

  { path: '/toast', title: 'Toast 提示', group: '反馈', component: ToastPage },
  { path: '/alert', title: 'Alert 提示', group: '反馈', component: AlertPage },
  { path: '/message', title: 'Message 消息', group: '反馈', component: MessagePage },
  { path: '/notification', title: 'Notification 通知', group: '反馈', component: NotificationPage },
  { path: '/loading', title: 'Loading 加载', group: '反馈', component: LoadingPage },
  { path: '/progress', title: 'Progress 进度条', group: '反馈', component: ProgressPage },
  { path: '/skeleton', title: 'Skeleton 骨架屏', group: '反馈', component: SkeletonPage },
  { path: '/empty', title: 'Empty 空状态', group: '反馈', component: EmptyPage },
  { path: '/result', title: 'Result 结果页', group: '反馈', component: ResultPage },

  // 浮层：都有「触发点 + 就近浮出的面板」，与上面那组「把状态告诉用户」的反馈不是一类
  { path: '/tooltip', title: 'Tooltip 文字提示', group: '浮层', component: TooltipPage },
  { path: '/popover', title: 'Popover 气泡卡片', group: '浮层', component: PopoverPage },
  { path: '/popconfirm', title: 'Popconfirm 气泡确认', group: '浮层', component: PopconfirmPage },
  { path: '/drawer', title: 'Drawer 抽屉', group: '浮层', component: DrawerPage },
  { path: '/dialog', title: 'Dialog 对话框', group: '浮层', component: DialogPage },
  { path: '/tour', title: 'Tour 漫游式引导', group: '浮层', component: TourPage },

  // 移动端条目过多，按能力再分一层（subgroup），菜单里渲染成二级分组
  { path: '/cell', title: 'Cell 列表项', group: '移动端', subgroup: '基础展示', component: CellPage },
  { path: '/grid', title: 'Grid 宫格', group: '移动端', subgroup: '基础展示', component: GridPage },
  {
    path: '/count-down',
    title: 'CountDown 倒计时',
    group: '移动端',
    subgroup: '基础展示',
    component: CountDownPage,
  },
  {
    path: '/circle',
    title: 'Circle 环形进度',
    group: '移动端',
    subgroup: '基础展示',
    component: CirclePage,
  },
  {
    path: '/lazyload',
    title: 'Lazyload 图片懒加载',
    group: '移动端',
    subgroup: '基础展示',
    component: LazyloadPage,
  },
  {
    path: '/highlight',
    title: 'Highlight 关键字高亮',
    group: '移动端',
    subgroup: '基础展示',
    component: HighlightPage,
  },

  { path: '/picker', title: 'Picker 选择器', group: '移动端', subgroup: '表单输入', component: PickerPage },
  { path: '/search', title: 'Search 搜索框', group: '移动端', subgroup: '表单输入', component: SearchPage },
  {
    path: '/stepper',
    title: 'Stepper 步进器',
    group: '移动端',
    subgroup: '表单输入',
    component: StepperPage,
  },
  {
    path: '/number-keyboard',
    title: 'NumberKeyboard 数字键盘',
    group: '移动端',
    subgroup: '表单输入',
    component: NumberKeyboardPage,
  },
  {
    path: '/password-input',
    title: 'PasswordInput 密码输入框',
    group: '移动端',
    subgroup: '表单输入',
    component: PasswordInputPage,
  },
  {
    path: '/area',
    title: 'Area 省市区选择',
    group: '移动端',
    subgroup: '表单输入',
    component: AreaPage,
  },
  {
    path: '/signature',
    title: 'Signature 手写签名',
    group: '移动端',
    subgroup: '表单输入',
    component: SignaturePage,
  },

  { path: '/nav-bar', title: 'NavBar 导航栏', group: '移动端', subgroup: '导航', component: NavBarPage },
  {
    path: '/tabbar',
    title: 'Tabbar 底部导航',
    group: '移动端',
    subgroup: '导航',
    component: TabbarPage,
  },
  { path: '/tab', title: 'Tab 标签页', group: '移动端', subgroup: '导航', component: TabPage },
  {
    path: '/index-bar',
    title: 'IndexBar 索引栏',
    group: '移动端',
    subgroup: '导航',
    component: IndexBarPage,
  },
  {
    path: '/sidebar',
    title: 'Sidebar 侧边导航',
    group: '移动端',
    subgroup: '导航',
    component: SidebarPage,
  },
  {
    path: '/dropdown-menu',
    title: 'DropdownMenu 下拉筛选菜单',
    group: '移动端',
    subgroup: '导航',
    component: DropdownMenuPage,
  },
  {
    path: '/action-bar',
    title: 'ActionBar 动作栏',
    group: '移动端',
    subgroup: '导航',
    component: ActionBarPage,
  },

  { path: '/popup', title: 'Popup 弹出层', group: '移动端', subgroup: '反馈与浮层', component: PopupPage },
  {
    path: '/action-sheet',
    title: 'ActionSheet 动作面板',
    group: '移动端',
    subgroup: '反馈与浮层',
    component: ActionSheetPage,
  },
  {
    path: '/share-sheet',
    title: 'ShareSheet 分享面板',
    group: '移动端',
    subgroup: '反馈与浮层',
    component: ShareSheetPage,
  },
  {
    path: '/floating-panel',
    title: 'FloatingPanel 浮动面板',
    group: '移动端',
    subgroup: '反馈与浮层',
    component: FloatingPanelPage,
  },
  {
    path: '/image-preview',
    title: 'ImagePreview 图片预览',
    group: '移动端',
    subgroup: '反馈与浮层',
    component: ImagePreviewPage,
  },
  {
    path: '/notice-bar',
    title: 'NoticeBar 通知栏',
    group: '移动端',
    subgroup: '反馈与浮层',
    component: NoticeBarPage,
  },

  {
    path: '/pull-refresh',
    title: 'PullRefresh 下拉刷新',
    group: '移动端',
    subgroup: '手势交互',
    component: PullRefreshPage,
  },
  {
    path: '/infinite-scroll',
    title: 'InfiniteScroll 无限滚动',
    group: '移动端',
    subgroup: '手势交互',
    component: InfiniteScrollPage,
  },
  {
    path: '/swipe-cell',
    title: 'SwipeCell 滑动单元格',
    group: '移动端',
    subgroup: '手势交互',
    component: SwipeCellPage,
  },
  {
    path: '/floating-bubble',
    title: 'FloatingBubble 悬浮球',
    group: '移动端',
    subgroup: '手势交互',
    component: FloatingBubblePage,
  },

  { path: '/coupon', title: 'Coupon 优惠券', group: '移动端', subgroup: '业务组件', component: CouponPage },
  {
    path: '/submit-bar',
    title: 'SubmitBar 提交栏',
    group: '移动端',
    subgroup: '业务组件',
    component: SubmitBarPage,
  },
  {
    path: '/address-list',
    title: 'AddressList 地址列表',
    group: '移动端',
    subgroup: '业务组件',
    component: AddressListPage,
  },

  {
    path: '/config-provider',
    title: 'ConfigProvider 子树配置',
    group: '工程能力',
    component: ConfigProviderPage,
  },
  { path: '/theme', title: 'Theme 全局主题', group: '工程能力', component: ThemePage },
  { path: '/locale', title: 'Locale 国际化', group: '工程能力', component: LocalePage },
]

/**
 * 按 group / subgroup 聚合出左侧菜单的层级。
 * 组与二级分组的先后顺序都取「首次出现」的顺序，所以调整菜单顺序只需调整 demoRoutes 的书写顺序。
 */
export const navGroups = demoRoutes.reduce<DemoNavGroup[]>((groups, route) => {
  let group = groups.find((item) => item.title === route.group)
  if (!group) {
    group = { title: route.group, items: [], subgroups: [] }
    groups.push(group)
  }
  if (!route.subgroup) {
    group.items.push(route)
    return groups
  }
  let sub = group.subgroups.find((item) => item.title === route.subgroup)
  if (!sub) {
    sub = { title: route.subgroup, items: [] }
    group.subgroups.push(sub)
  }
  sub.items.push(route)
  return groups
}, [])

/** 语言进路由时 URL 里的语言段写法（`:locale(zh-CN|en-US)`） */
const LOCALE_PATTERN = 'zh-CN|en-US'

/**
 * 路径是否已经带了语言段。
 * 尾部的 `/` 必须用**前瞻** `(?=\/|$)` 断言、不能真的吃进匹配 ——
 * 否则 `'/zh-CN/space'.replace(LOCALE_RE, '')` 会得到 `'space'`（丢了前导斜杠），
 * 再交给 withLocale 拼成 `'en-US' + 'space'` = `/en-USspace`（实际踩过）。
 * 用前瞻后 `/zh-CN/space` → `/space`，`/zh-CN` → `''`（由 `|| '/'` 兜回根路径）。
 */
const LOCALE_RE = new RegExp(`^/(${LOCALE_PATTERN})(?=/|$)`)

/**
 * 给「不带语言段」的页面路径补上语言段：`/` → `/zh-CN`、`/button` → `/zh-CN/button`。
 * 页面自己拼链接（菜单 / 首页卡片 / 品牌）时用它，避免走一次重定向。
 */
export const withLocale = (locale: DemoLocale, path: string): string =>
  path === '/' ? `/${locale}` : `/${locale}${path}`

/** 把路径的语言段换成另一种语言（页面与 preview 段原样保留），供顶栏语言切换用 */
export const swapLocale = (path: string, locale: DemoLocale): string =>
  withLocale(locale, path.replace(LOCALE_RE, '') || '/')

/**
 * 预览路由：与文档页共用同一个页面组件，区别只在 App.vue 的外壳（无顶栏 / 侧栏）。
 * 只并入 router.routes，**不进 demoRoutes** —— 后者是左侧菜单的唯一数据源，
 * 混进去会让菜单凭空多出一倍条目。
 */
const previewRoutes: RouteRecordRaw[] = demoRoutes.map((route) => ({
  path: `/:locale(${LOCALE_PATTERN})/preview${route.path}`,
  name: `preview${route.path}`,
  component: route.component,
  meta: { preview: true, basePath: route.path },
}))

/*
 * 语言段**只在这里注入**：demoRoutes 的 path 保持原样，
 * 因为它既是左侧菜单的数据源，也是 scripts/gen-api.mjs 生成 pageApi / pageSource 的键
 * （两张表都按「无语言段」的页面路径索引）。页面要查表就读 meta.basePath。
 */
const routes: RouteRecordRaw[] = [
  ...demoRoutes.map((route) => ({
    path: `/:locale(${LOCALE_PATTERN})${route.path === '/' ? '' : route.path}`,
    name: route.path,
    component: route.component,
    meta: { basePath: route.path },
  })),
  ...previewRoutes,
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/*
 * 没带语言段的地址（根路径、老书签、外部链接的 `#/button`）在这里补上首选语言；
 * 带了语言段就把语言同步进 i18n 状态（URL 是语言的唯一真相）。
 * 判断用路径前缀而不是 to.matched：两者都拦得住，但前缀判断能让
 * `/zh-CN/不存在的页面` 只重定向一次而不是无限套娃。
 */
router.beforeEach((to) => {
  const matched = LOCALE_RE.exec(to.path)
  if (matched) {
    setDemoLocale(matched[1])
    return true
  }
  return withLocale(getPreferredLocale(), to.fullPath)
})

