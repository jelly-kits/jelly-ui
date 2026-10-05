export { jePresets, type JePresetName } from './core/presets'
export { springTo, type SpringCancel, type SpringConfig } from './core/spring'
export { useSpring, type UseSpringReturn } from './core/useSpring'
export { useMediaQuery, useIsMobile } from './core/useMediaQuery'
export { useScrollLock } from './core/useScrollLock'
export { useSheetDrag } from './core/useSheetDrag'
export { JE_Z_INDEX_BASE, getZIndexBase, nextZIndex } from './core/useZIndex'
export {
  configureJelly,
  getJellyConfig,
  resolveTeleportElement,
  type JeGlobalConfig,
  type JeTeleportTarget,
} from './core/globalConfig'
export {
  useColorMode,
  useThemeTokens,
  setColorMode,
  toggleColorMode,
  setThemeTokens,
  resetThemeTokens,
  themeInitScript,
  themeInitSnippet,
  JE_COLOR_MODE_KEY,
  JE_THEME_TOKENS_KEY,
  type JeColorMode,
  type UseColorModeReturn,
  type UseThemeTokensReturn,
} from './core/theme'
export { useClickOutside, type JeOutsideTarget } from './core/useClickOutside'
export { useFocusTrap } from './core/useFocusTrap'
export {
  useFloating,
  type JeAlign,
  type JePlacementValue,
  type JeSide,
  type UseFloatingOptions,
  type UseFloatingReturn,
} from './core/useFloating'
export {
  encodeQrcode,
  type JeQrcodeEncodeOptions,
  type JeQrcodeEncodeResult,
  type JeQrcodeLevel,
} from './core/qrcode'
export { type JeImageFit, type JeQrcodeShape } from './core/canvas'
export {
  layoutTree,
  treeAncestors,
  treeParentMap,
  type JeTreeEdge,
  type JeTreeLayout,
  type JeTreeLayoutNode,
  type JeTreeLayoutOptions,
  type JeTreeSourceNode,
} from './core/treeLayout'

export {
  JeButton,
  type JeButtonSize,
  type JeButtonType,
  type JeButtonVariant,
} from './components/JeButton'
export { JeButtonGroup } from './components/JeButtonGroup'
export { JeCard } from './components/JeCard'
export {
  JeCheckboxGroup,
  type JeCheckboxOption,
} from './components/JeCheckboxGroup'
export { JeDivider } from './components/JeDivider'
export { JeField } from './components/JeField'
export {
  JeForm,
  JeFormItem,
  type JeFormLabelPosition,
  type JeFormRule,
  type JeFormRules,
  type JeFormTrigger,
} from './components/JeForm'
export { JeIcon, jeIcons, type JeIconName } from './components/JeIcon'
export {
  JeInput,
  type JeInputAutosize,
  type JeInputIcon,
  type JeInputMode,
  type JeInputProps,
  type JeInputResize,
  type JeInputSize,
  type JeInputTextareaStyle,
  type JeInputType,
  type JeInputWordLimitPosition,
} from './components/JeInput'
export { JeInputNumber } from './components/JeInputNumber'
export { JeLink } from './components/JeLink'
export { JeRate } from './components/JeRate'
export { JeRadioGroup, type JeRadioOption } from './components/JeRadioGroup'
export {
  JeSegmented,
  type JeSegmentedOption,
} from './components/JeSegmented'
export { JeSelect, type JeSelectOption } from './components/JeSelect'
export { JeSlider } from './components/JeSlider'
export { JeSpace } from './components/JeSpace'
export { JeSwitch, type JeSwitchValue } from './components/JeSwitch'
export { JeText } from './components/JeText'
export { JeTimePicker } from './components/JeTimePicker'
export { JeToast } from './components/JeToast'
export { JeTooltip, type JeTooltipPlacement } from './components/JeTooltip'
export {
  JeDialog,
  showDialog,
  jeDialog,
  type JeDialogAction,
  type JeDialogApi,
  type JeDialogBeforeClose,
  type JeDialogDone,
  type JeDialogFooterLayout,
  type JeDialogHandler,
  type JeDialogOptions,
  type JeDialogProps,
} from './components/JeDialog'

/* 布局 */
export { JeRow } from './components/JeRow'
export { JeCol } from './components/JeCol'
export { JeContainer, type JeContainerDirection } from './components/JeContainer'
export { JeHeader } from './components/JeHeader'
export { JeAside } from './components/JeAside'
export { JeMain } from './components/JeMain'
export { JeFooter } from './components/JeFooter'
export { JeSplitter, JeSplitterPanel } from './components/JeSplitter'

/* 基础展示 */
export { JeTag } from './components/JeTag'
export { JeBadge } from './components/JeBadge'
export { JeAvatar } from './components/JeAvatar'
export { JeWatermark } from './components/JeWatermark'

/* 数据展示 */
export { JeDescriptions, JeDescriptionsItem } from './components/JeDescriptions'
export { JeStatistic } from './components/JeStatistic'
export { JeTimeline, JeTimelineItem } from './components/JeTimeline'
export { JeCollapse, JeCollapseItem } from './components/JeCollapse'
export { JeImage } from './components/JeImage'
export { JeCarousel, JeCarouselItem } from './components/JeCarousel'
export { JeTable } from './components/JeTable'
export { JeTree } from './components/JeTree'
export { JeCalendar } from './components/JeCalendar'

/* 导航 */
export { JeTabs, JeTabPane } from './components/JeTabs'
export { JeBreadcrumb, JeBreadcrumbItem } from './components/JeBreadcrumb'
export { JeSteps, JeStep } from './components/JeSteps'
export { JeDropdown, JeDropdownItem } from './components/JeDropdown'
export { JeMenu, JeMenuItem, JeSubMenu } from './components/JeMenu'
export { JePagination } from './components/JePagination'
export { JeBacktop } from './components/JeBacktop'
export { JeAnchor, JeAnchorLink } from './components/JeAnchor'
export { JeAffix } from './components/JeAffix'
export { JeScrollbar } from './components/JeScrollbar'

/* 反馈 */
export { JeAlert } from './components/JeAlert'
export { JePopover } from './components/JePopover'
export { JePopconfirm } from './components/JePopconfirm'
export { JeDrawer } from './components/JeDrawer'
export { JeMessage, showMessage, jeMessage } from './components/JeMessage'
export { JeNotification, jeNotify } from './components/JeNotification'
export { JeLoading, showLoading, jeLoading } from './components/JeLoading'
export { JeProgress } from './components/JeProgress'
export { JeSkeleton, JeSkeletonItem } from './components/JeSkeleton'
export { JeEmpty } from './components/JeEmpty'
export { JeResult } from './components/JeResult'
export { JeTour } from './components/JeTour'

/* 复杂控件 */
export { JeTransfer } from './components/JeTransfer'
export { JeUpload, type JeUploadFile, type JeUploadRequestOptions } from './components/JeUpload'
export { JeDatePicker } from './components/JeDatePicker'
export { JeTimeSelect } from './components/JeTimeSelect'
export { JeCascader } from './components/JeCascader'
export { JeTreeSelect } from './components/JeTreeSelect'
export { JeColorPicker } from './components/JeColorPicker'
export { JeAutoComplete } from './components/JeAutoComplete'

/* 移动端 */
export { JeCell, JeCellGroup } from './components/JeCell'
export { JeGrid, JeGridItem } from './components/JeGrid'
export { JeNavBar } from './components/JeNavBar'
export { JeTabbar, JeTabbarItem } from './components/JeTabbar'
export { JePullRefresh } from './components/JePullRefresh'
export { JeInfiniteScroll } from './components/JeInfiniteScroll'
export {
  JeActionSheet,
  type JeActionSheetAction,
} from './components/JeActionSheet'
export {
  JePicker,
  type JePickerColumn,
  type JePickerOption,
} from './components/JePicker'
export { JeSearch } from './components/JeSearch'
export { JeStepper } from './components/JeStepper'
export { JeNumberKeyboard } from './components/JeNumberKeyboard'
export { JePasswordInput } from './components/JePasswordInput'
export { JeNoticeBar } from './components/JeNoticeBar'
export { JeCountDown, type JeCountDownCurrent } from './components/JeCountDown'
export { JePopup } from './components/JePopup'
export { JeFloatingBubble } from './components/JeFloatingBubble'
export { JeSwipeCell } from './components/JeSwipeCell'
export { JeLazyload } from './components/JeLazyload'
export {
  JeIndexBar,
  JeIndexAnchor,
  type JeIndexAnchorItem,
  type JeIndexBarContext,
} from './components/JeIndexBar'
export {
  JeSidebar,
  JeSidebarItem,
  type JeSidebarContext,
} from './components/JeSidebar'
export {
  JeCoupon,
  type JeCouponStatus,
  type JeCouponType,
} from './components/JeCoupon'
export { JeSubmitBar } from './components/JeSubmitBar'
export { JeArea, type JeAreaOption } from './components/JeArea'
export { JeAddressList, type JeAddressItem } from './components/JeAddressList'
export {
  JeDropdownMenu,
  JeDropdownMenuItem,
  jeDropdownMenuKey,
  type JeDropdownMenuContext,
  type JeDropdownOption,
  type JeDropdownValue,
} from './components/JeDropdownMenu'
export {
  JeTab,
  JeTabItem,
  jeTabKey,
  type JeTabContext,
  type JeTabName,
} from './components/JeTab'
export { JeActionBar, JeActionBarIcon, JeActionBarButton } from './components/JeActionBar'
export { JeCircle } from './components/JeCircle'
export { JeQrcode } from './components/JeQrcode'
export {
  JePoster,
  type JePosterBackground,
  type JePosterBorder,
  type JePosterElement,
  type JePosterExportOptions,
  type JePosterImageElement,
  type JePosterQrcodeElement,
  type JePosterTextElement,
} from './components/JePoster'
export {
  JeOrgChart,
  type JeOrgChartExportOptions,
  type JeOrgChartHit,
  type JeOrgChartLinkStyle,
  type JeOrgChartNode,
  type JeOrgChartProps,
  type JeOrgChartRenderContext,
  type JeOrgChartRenderNode,
  type JeOrgChartSpouse,
  type JeOrgChartTheme,
} from './components/JeOrgChart'
export { JeImagePreview } from './components/JeImagePreview'
export { JeHighlight, type JeHighlightSegment } from './components/JeHighlight'
export { JeSignature } from './components/JeSignature'
export { JeFloatingPanel } from './components/JeFloatingPanel'
export { JeShareSheet, type JeShareOption } from './components/JeShareSheet'

/* 工程能力 */
export {
  JeConfigProvider,
  jeConfigKey,
  useJeConfig,
  useTeleportTarget,
  type JeConfigContext,
  type JeConfigSize,
} from './components/JeConfigProvider'
export {
  JeLocale,
  formatMessage,
  jeEnUS,
  jeLocaleKey,
  jeZhCN,
  provideJeLocale,
  registerJellyLocale,
  resolveLocale,
  useJeLocale,
  type JeBuiltinLocaleName,
  type JeLocaleAdapter,
  type JeLocaleContext,
  type JeLocaleInput,
  type JeLocaleMessages,
  type JeLocaleName,
} from './components/JeLocale'

/* 全量导入（Vue 插件）：`app.use(JellyUI)`，与按需具名导入二选一 */
export { JellyUI, default } from './plugin'