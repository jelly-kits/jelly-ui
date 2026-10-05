import type { App, Component, Plugin } from 'vue'

import { JeButton } from './components/JeButton'
import { JeButtonGroup } from './components/JeButtonGroup'
import { JeCard } from './components/JeCard'
import { JeCheckboxGroup } from './components/JeCheckboxGroup'
import { JeDivider } from './components/JeDivider'
import { JeField } from './components/JeField'
import { JeForm, JeFormItem } from './components/JeForm'
import { JeIcon } from './components/JeIcon'
import { JeInput } from './components/JeInput'
import { JeInputNumber } from './components/JeInputNumber'
import { JeLink } from './components/JeLink'
import { JeRate } from './components/JeRate'
import { JeRadioGroup } from './components/JeRadioGroup'
import { JeSegmented } from './components/JeSegmented'
import { JeSelect } from './components/JeSelect'
import { JeSlider } from './components/JeSlider'
import { JeSpace } from './components/JeSpace'
import { JeSwitch } from './components/JeSwitch'
import { JeText } from './components/JeText'
import { JeTimePicker } from './components/JeTimePicker'
import { JeToast } from './components/JeToast'
import { JeTooltip } from './components/JeTooltip'
import { JeDialog } from './components/JeDialog'

/* 布局 */
import { JeRow } from './components/JeRow'
import { JeCol } from './components/JeCol'
import { JeContainer } from './components/JeContainer'
import { JeHeader } from './components/JeHeader'
import { JeAside } from './components/JeAside'
import { JeMain } from './components/JeMain'
import { JeFooter } from './components/JeFooter'
import { JeSplitter, JeSplitterPanel } from './components/JeSplitter'

/* 基础展示 */
import { JeTag } from './components/JeTag'
import { JeBadge } from './components/JeBadge'
import { JeAvatar } from './components/JeAvatar'
import { JeWatermark } from './components/JeWatermark'

/* 数据展示 */
import { JeDescriptions, JeDescriptionsItem } from './components/JeDescriptions'
import { JeStatistic } from './components/JeStatistic'
import { JeTimeline, JeTimelineItem } from './components/JeTimeline'
import { JeCollapse, JeCollapseItem } from './components/JeCollapse'
import { JeImage } from './components/JeImage'
import { JeCarousel, JeCarouselItem } from './components/JeCarousel'
import { JeTable } from './components/JeTable'
import { JeTree } from './components/JeTree'
import { JeCalendar } from './components/JeCalendar'

/* 导航 */
import { JeTabs, JeTabPane } from './components/JeTabs'
import { JeBreadcrumb, JeBreadcrumbItem } from './components/JeBreadcrumb'
import { JeSteps, JeStep } from './components/JeSteps'
import { JeDropdown, JeDropdownItem } from './components/JeDropdown'
import { JeMenu, JeMenuItem, JeSubMenu } from './components/JeMenu'
import { JePagination } from './components/JePagination'
import { JeBacktop } from './components/JeBacktop'
import { JeAnchor, JeAnchorLink } from './components/JeAnchor'
import { JeAffix } from './components/JeAffix'
import { JeScrollbar } from './components/JeScrollbar'

/* 反馈 */
import { JeAlert } from './components/JeAlert'
import { JePopover } from './components/JePopover'
import { JePopconfirm } from './components/JePopconfirm'
import { JeDrawer } from './components/JeDrawer'
import { JeMessage } from './components/JeMessage'
import { JeNotification } from './components/JeNotification'
import { JeLoading } from './components/JeLoading'
import { JeProgress } from './components/JeProgress'
import { JeSkeleton, JeSkeletonItem } from './components/JeSkeleton'
import { JeEmpty } from './components/JeEmpty'
import { JeResult } from './components/JeResult'
import { JeTour } from './components/JeTour'

/* 复杂控件 */
import { JeTransfer } from './components/JeTransfer'
import { JeUpload } from './components/JeUpload'
import { JeDatePicker } from './components/JeDatePicker'
import { JeTimeSelect } from './components/JeTimeSelect'
import { JeCascader } from './components/JeCascader'
import { JeTreeSelect } from './components/JeTreeSelect'
import { JeColorPicker } from './components/JeColorPicker'
import { JeAutoComplete } from './components/JeAutoComplete'

/* 移动端 */
import { JeCell, JeCellGroup } from './components/JeCell'
import { JeGrid, JeGridItem } from './components/JeGrid'
import { JeNavBar } from './components/JeNavBar'
import { JeTabbar, JeTabbarItem } from './components/JeTabbar'
import { JePullRefresh } from './components/JePullRefresh'
import { JeInfiniteScroll } from './components/JeInfiniteScroll'
import { JeActionSheet } from './components/JeActionSheet'
import { JePicker } from './components/JePicker'
import { JeSearch } from './components/JeSearch'
import { JeStepper } from './components/JeStepper'
import { JeNumberKeyboard } from './components/JeNumberKeyboard'
import { JePasswordInput } from './components/JePasswordInput'
import { JeNoticeBar } from './components/JeNoticeBar'
import { JeCountDown } from './components/JeCountDown'
import { JePopup } from './components/JePopup'
import { JeFloatingBubble } from './components/JeFloatingBubble'
import { JeSwipeCell } from './components/JeSwipeCell'
import { JeLazyload } from './components/JeLazyload'
import { JeIndexBar, JeIndexAnchor } from './components/JeIndexBar'
import { JeSidebar, JeSidebarItem } from './components/JeSidebar'
import { JeCoupon } from './components/JeCoupon'
import { JeSubmitBar } from './components/JeSubmitBar'
import { JeArea } from './components/JeArea'
import { JeAddressList } from './components/JeAddressList'
import { JeDropdownMenu, JeDropdownMenuItem } from './components/JeDropdownMenu'
import { JeTab, JeTabItem } from './components/JeTab'
import { JeActionBar, JeActionBarIcon, JeActionBarButton } from './components/JeActionBar'
import { JeCircle } from './components/JeCircle'
import { JeQrcode } from './components/JeQrcode'
import { JePoster } from './components/JePoster'
import { JeOrgChart } from './components/JeOrgChart'
import { JeImagePreview } from './components/JeImagePreview'
import { JeHighlight } from './components/JeHighlight'
import { JeSignature } from './components/JeSignature'
import { JeFloatingPanel } from './components/JeFloatingPanel'
import { JeShareSheet } from './components/JeShareSheet'

/* 工程能力 */
import { JeConfigProvider } from './components/JeConfigProvider'
import { JeLocale } from './components/JeLocale'

/**
 * 全量注册用的组件表：键为注册名（PascalCase），值为组件实现。
 * 模板里照常写 kebab-case（`<je-button>`），Vue 会自动解析成 PascalCase。
 */
export const jeComponents: Record<string, Component> = {
  JeButton,
  JeButtonGroup,
  JeCard,
  JeCheckboxGroup,
  JeDivider,
  JeField,
  JeForm,
  JeFormItem,
  JeIcon,
  JeInput,
  JeInputNumber,
  JeLink,
  JeRate,
  JeRadioGroup,
  JeSegmented,
  JeSelect,
  JeSlider,
  JeSpace,
  JeSwitch,
  JeText,
  JeTimePicker,
  JeToast,
  JeTooltip,
  JeDialog,
  JeRow,
  JeCol,
  JeContainer,
  JeHeader,
  JeAside,
  JeMain,
  JeFooter,
  JeSplitter,
  JeSplitterPanel,
  JeTag,
  JeBadge,
  JeAvatar,
  JeWatermark,
  JeDescriptions,
  JeDescriptionsItem,
  JeStatistic,
  JeTimeline,
  JeTimelineItem,
  JeCollapse,
  JeCollapseItem,
  JeImage,
  JeCarousel,
  JeCarouselItem,
  JeTable,
  JeTree,
  JeCalendar,
  JeTabs,
  JeTabPane,
  JeBreadcrumb,
  JeBreadcrumbItem,
  JeSteps,
  JeStep,
  JeDropdown,
  JeDropdownItem,
  JeMenu,
  JeMenuItem,
  JeSubMenu,
  JePagination,
  JeBacktop,
  JeAnchor,
  JeAnchorLink,
  JeAffix,
  JeScrollbar,
  JeAlert,
  JePopover,
  JePopconfirm,
  JeDrawer,
  JeMessage,
  JeNotification,
  JeLoading,
  JeProgress,
  JeSkeleton,
  JeSkeletonItem,
  JeEmpty,
  JeResult,
  JeTour,
  JeTransfer,
  JeUpload,
  JeDatePicker,
  JeTimeSelect,
  JeCascader,
  JeTreeSelect,
  JeColorPicker,
  JeAutoComplete,
  JeCell,
  JeCellGroup,
  JeGrid,
  JeGridItem,
  JeNavBar,
  JeTabbar,
  JeTabbarItem,
  JePullRefresh,
  JeInfiniteScroll,
  JeActionSheet,
  JePicker,
  JeSearch,
  JeStepper,
  JeNumberKeyboard,
  JePasswordInput,
  JeNoticeBar,
  JeCountDown,
  JePopup,
  JeFloatingBubble,
  JeSwipeCell,
  JeLazyload,
  JeIndexBar,
  JeIndexAnchor,
  JeSidebar,
  JeSidebarItem,
  JeCoupon,
  JeSubmitBar,
  JeArea,
  JeAddressList,
  JeDropdownMenu,
  JeDropdownMenuItem,
  JeTab,
  JeTabItem,
  JeActionBar,
  JeActionBarIcon,
  JeActionBarButton,
  JeCircle,
  JeQrcode,
  JePoster,
  JeOrgChart,
  JeImagePreview,
  JeHighlight,
  JeSignature,
  JeFloatingPanel,
  JeShareSheet,
  JeConfigProvider,
  JeLocale,
}

/**
 * 全量导入插件：`app.use(JellyUI)` 之后所有 `<je-*>` 组件即可直接用，
 * 业务文件里不必再逐个 `import`（样式仍需单独引入一次 `style.css`）。
 *
 * 代价：全量注册会把整包拉进依赖图，打包器无法再摇掉未用到的组件；
 * 体积敏感的场景请继续用按需具名导入 `import { JeButton } from '@jelly-kits/jelly-ui'`。
 */
export const JellyUI: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(jeComponents)) {
      app.component(name, component)
    }
  },
}

export default JellyUI
