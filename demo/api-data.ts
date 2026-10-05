/**
 * 本文件由 scripts/gen-api.mjs 自动生成，请勿手动修改。
 * 重新生成：npm run gen:api
 */

/** 一行 API 记录，四个分组共用 */
export interface ApiRow {
  name: string
  /** 说明：组件源码里的 JSDoc 优先，没写时取 scripts/api-glossary.mjs 的通用说明 */
  description?: string
  /** 类型签名 */
  type?: string
  /** 默认值，仅属性有 */
  default?: string
}

export interface ComponentApi {
  attributes: ApiRow[]
  events: ApiRow[]
  slots: ApiRow[]
  exposes: ApiRow[]
}

/** 组件名 → API */
export const componentApi: Record<string, ComponentApi> = {
  "JeActionBar": {
    "attributes": [
      {
        "name": "fixed",
        "description": "固定在视口底部",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "placeholder",
        "description": "fixed 时用占位元素撑住原高度，避免遮挡页面底部内容",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "safeAreaInsetBottom",
        "description": "底部预留安全区（全面屏手势条）",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "border",
        "description": "顶部 1px 分隔线",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "zIndex",
        "description": "fixed 时的层级",
        "type": "number",
        "default": "100"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeActionBarButton": {
    "attributes": [
      {
        "name": "text",
        "description": "按钮文字，默认插槽可覆盖",
        "type": "string",
        "default": "''"
      },
      {
        "name": "type",
        "description": "语义类型",
        "type": "JeButtonType",
        "default": "'primary'"
      },
      {
        "name": "size",
        "description": "尺寸，不传时取全局配置",
        "type": "JeButtonSize"
      },
      {
        "name": "loading",
        "description": "加载中",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "禁用",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "click",
        "description": "点击按钮",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeActionBarIcon": {
    "attributes": [
      {
        "name": "icon",
        "description": "图标名",
        "type": "JeIconName"
      },
      {
        "name": "text",
        "description": "图标下方的文字",
        "type": "string",
        "default": "''"
      },
      {
        "name": "badge",
        "description": "角标内容",
        "type": "string | number"
      },
      {
        "name": "dot",
        "description": "是否显示小红点",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "color",
        "description": "图标与文字颜色，缺省用次级文字色",
        "type": "string",
        "default": "''"
      },
      {
        "name": "iconSize",
        "description": "图标尺寸，数字按 px 处理",
        "type": "number | string",
        "default": "20"
      },
      {
        "name": "disabled",
        "description": "禁用后不可点击且变淡",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "click",
        "description": "点击图标按钮（禁用时不触发）",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeActionSheet": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "actions",
        "description": "操作项列表",
        "type": "JeActionSheetAction[]",
        "default": "() => []"
      },
      {
        "name": "title",
        "description": "面板标题",
        "type": "string"
      },
      {
        "name": "description",
        "description": "标题下方的说明文字",
        "type": "string"
      },
      {
        "name": "cancelText",
        "description": "取消按钮文字，传空字符串则不显示取消按钮",
        "type": "string",
        "default": "'取消'"
      },
      {
        "name": "closeOnClickAction",
        "description": "点击操作项后自动关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnClickModal",
        "description": "点击遮罩关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnEscape",
        "description": "按 Esc 关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "select",
        "description": "选中某个操作项",
        "type": "(action: JeActionSheetAction, index: number) => void"
      },
      {
        "name": "cancel",
        "description": "点了取消或遮罩",
        "type": "() => void"
      },
      {
        "name": "open",
        "description": "打开时触发",
        "type": "() => void"
      },
      {
        "name": "close",
        "description": "关闭时触发",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "header",
        "description": "顶部区域"
      }
    ],
    "exposes": []
  },
  "JeAddressList": {
    "attributes": [
      {
        "name": "list",
        "description": "地址列表数据",
        "type": "JeAddressItem[]",
        "default": "() => []"
      },
      {
        "name": "defaultTagText",
        "description": "默认地址标签文案",
        "type": "string",
        "default": "'默认'"
      },
      {
        "name": "disabled",
        "description": "整体禁用，禁用后不可选中 / 编辑 / 删除",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "switchable",
        "description": "点击整卡即选中（移动端常见的下单选地址场景）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "showEdit",
        "description": "显示「编辑」按钮",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "showDelete",
        "description": "显示「删除」按钮",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "select",
        "description": "点击整卡选中一条地址",
        "type": "(item: JeAddressItem, index: number) => void"
      },
      {
        "name": "edit",
        "description": "点击编辑",
        "type": "(item: JeAddressItem, index: number) => void"
      },
      {
        "name": "delete",
        "description": "点击删除",
        "type": "(item: JeAddressItem, index: number) => void"
      },
      {
        "name": "setDefault",
        "description": "点击「设为默认」",
        "type": "(item: JeAddressItem, index: number) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeAffix": {
    "attributes": [
      {
        "name": "offset",
        "description": "与目标边界的距离（px）",
        "type": "number",
        "default": "0"
      },
      {
        "name": "target",
        "description": "吸附所参照的容器选择器，缺省为窗口",
        "type": "string",
        "default": "''"
      },
      {
        "name": "position",
        "description": "吸附方向",
        "type": "JeAffixPosition",
        "default": "'top'"
      },
      {
        "name": "zIndex",
        "description": "固定后的层级",
        "type": "number"
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(fixed: boolean) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeAlert": {
    "attributes": [
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "description",
        "description": "描述文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "type",
        "description": "语义类型：success / info / warning / error",
        "type": "JeAlertType",
        "default": "'info'"
      },
      {
        "name": "closable",
        "description": "显示右上角关闭按钮",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "showIcon",
        "description": "显示左侧语义图标",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "center",
        "description": "图标与文字居中",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "close",
        "description": "关闭时触发",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "title",
        "description": "标题区域"
      },
      {
        "name": "description",
        "description": "描述内容"
      }
    ],
    "exposes": []
  },
  "JeAnchor": {
    "attributes": [
      {
        "name": "container",
        "description": "滚动容器选择器，留空表示监听窗口",
        "type": "string",
        "default": "''"
      },
      {
        "name": "offset",
        "description": "判定高亮的阈值：目标顶部进入容器该偏移内即视为当前项",
        "type": "number",
        "default": "0"
      },
      {
        "name": "targetOffset",
        "description": "点击滚动后目标停留在容器顶部的位置，默认与 offset 一致",
        "type": "number"
      },
      {
        "name": "direction",
        "description": "方向",
        "type": "JeAnchorDirection",
        "default": "'vertical'"
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(href: string) => void"
      },
      {
        "name": "click",
        "description": "点击时触发",
        "type": "(href: string) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeAnchorLink": {
    "attributes": [
      {
        "name": "href",
        "description": "目标选择器，如 #section-1",
        "type": "string"
      },
      {
        "name": "title",
        "description": "文字，也可用默认插槽",
        "type": "string",
        "default": "''"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeArea": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "已选值，按「省 / 市 / 区」顺序",
        "type": "(string | number)[]",
        "default": "() => []"
      },
      {
        "name": "areaList",
        "description": "省市区树形数据",
        "type": "JeAreaOption[]",
        "default": "() => []"
      },
      {
        "name": "title",
        "description": "面板标题",
        "type": "string",
        "default": "'所在地区'"
      },
      {
        "name": "columnsNum",
        "description": "级数，一般 3 级",
        "type": "number",
        "default": "3"
      },
      {
        "name": "placeholder",
        "description": "未选择时触发按钮上的占位文字",
        "type": "string",
        "default": "'请选择所在地区'"
      },
      {
        "name": "columnsPlaceholder",
        "description": "未选择的标签页上的占位文字",
        "type": "string",
        "default": "'请选择'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "confirmText",
        "description": "确认按钮文案",
        "type": "string",
        "default": "'确认'"
      },
      {
        "name": "cancelText",
        "description": "取消按钮文案",
        "type": "string",
        "default": "'取消'"
      },
      {
        "name": "showToolbar",
        "description": "是否显示工具栏",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "visibleItemCount",
        "description": "可见选项数量",
        "type": "number",
        "default": "5"
      },
      {
        "name": "itemHeight",
        "description": "单行高度（px）",
        "type": "number",
        "default": "44"
      },
      {
        "name": "closeOnClickModal",
        "description": "点击遮罩是否关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(values: (string | number)[]) => void"
      },
      {
        "name": "change",
        "description": "某一列滚动停下后",
        "type": "(values: (string | number)[]) => void"
      },
      {
        "name": "confirm",
        "description": "点击确认",
        "type": "(values: (string | number)[]) => void"
      },
      {
        "name": "cancel",
        "description": "点击取消或遮罩",
        "type": "() => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeAside": {
    "attributes": [
      {
        "name": "width",
        "description": "侧边栏宽度，数字按 px 处理",
        "type": "string | number",
        "default": "300"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeAutoComplete": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "string",
        "default": "''"
      },
      {
        "name": "fetchSuggestions",
        "description": "根据输入关键字返回候选；支持同步或异步",
        "type": "(\n      query: string,\n    ) => JeAutoCompleteOption[] | Promise<JeAutoCompleteOption[]>"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "''"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "clearable",
        "description": "是否可一键清空",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "triggerOnFocus",
        "description": "聚焦时立即拉取一次候选",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "debounce",
        "description": "输入防抖毫秒数",
        "type": "number",
        "default": "300"
      },
      {
        "name": "loadingText",
        "description": "加载中的文案",
        "type": "string",
        "default": "'加载中…'"
      },
      {
        "name": "emptyText",
        "description": "数据为空时的文案",
        "type": "string",
        "default": "'无匹配结果'"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: string) => void"
      },
      {
        "name": "select",
        "description": "选中某项时触发",
        "type": "(option: JeAutoCompleteOption) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(value: string) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeAvatar": {
    "attributes": [
      {
        "name": "src",
        "description": "资源地址",
        "type": "string",
        "default": "''"
      },
      {
        "name": "size",
        "description": "尺寸",
        "type": "JeAvatarSize",
        "default": "'default'"
      },
      {
        "name": "shape",
        "description": "外形",
        "type": "JeAvatarShape",
        "default": "'circle'"
      },
      {
        "name": "icon",
        "description": "图标",
        "type": "JeIconName",
        "default": "'user'"
      },
      {
        "name": "alt",
        "description": "原生 alt 文本",
        "type": "string",
        "default": "''"
      },
      {
        "name": "fit",
        "description": "内容填充方式",
        "type": "JeAvatarFit",
        "default": "'cover'"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeBacktop": {
    "attributes": [
      {
        "name": "target",
        "description": "滚动容器选择器，缺省监听窗口",
        "type": "string",
        "default": "''"
      },
      {
        "name": "visibilityHeight",
        "description": "滚动超过该距离后出现",
        "type": "number",
        "default": "200"
      },
      {
        "name": "right",
        "description": "距视口右侧距离（px）",
        "type": "number",
        "default": "40"
      },
      {
        "name": "bottom",
        "description": "距视口底部距离（px）",
        "type": "number",
        "default": "40"
      }
    ],
    "events": [
      {
        "name": "click",
        "description": "点击时触发",
        "type": "(event: MouseEvent) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeBadge": {
    "attributes": [
      {
        "name": "value",
        "description": "数值 / 当前值",
        "type": "string | number"
      },
      {
        "name": "max",
        "description": "允许的最大值",
        "type": "number",
        "default": "99"
      },
      {
        "name": "isDot",
        "description": "是否使用小圆点样式",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "type",
        "description": "类型",
        "type": "JeBadgeType",
        "default": "'danger'"
      },
      {
        "name": "hidden",
        "description": "是否隐藏",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "color",
        "description": "颜色",
        "type": "string"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeBreadcrumb": {
    "attributes": [
      {
        "name": "separator",
        "description": "千分位分隔符",
        "type": "string",
        "default": "'/'"
      },
      {
        "name": "separatorIcon",
        "description": "分隔图标",
        "type": "JeIconName"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeBreadcrumbItem": {
    "attributes": [
      {
        "name": "to",
        "description": "目标路由",
        "type": "string",
        "default": "''"
      },
      {
        "name": "replace",
        "description": "跳转时替换当前历史记录（仅在提供 to 时生效）",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeButton": {
    "attributes": [
      {
        "name": "type",
        "description": "语义类型，默认 primary。default 是中性底色，其余与 JeText 的语义色一一对应；\n放在按钮组里可省略，由组统一下发。",
        "type": "JeButtonType"
      },
      {
        "name": "variant",
        "description": "皮肤，type 的别名，额外支持 ghost（半透明的次级按钮）。\n与 type 同时传入时以 variant 为准。",
        "type": "JeButtonVariant"
      },
      {
        "name": "nativeType",
        "description": "透传给原生 button，默认 button 以免误触发表单提交",
        "type": "'button' | 'submit' | 'reset'",
        "default": "'button'"
      },
      {
        "name": "size",
        "description": "尺寸，默认 default；放在按钮组里可省略、由组统一下发",
        "type": "JeButtonSize"
      },
      {
        "name": "plain",
        "description": "素色按钮：主题色描边与文字，底色是主题色的半透明",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "dashed",
        "description": "虚线描边按钮",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "text",
        "description": "文字按钮：无边框无底色",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "link",
        "description": "链接按钮：形如超链接，hover 出现下划线",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "round",
        "description": "圆角胶囊按钮",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "circle",
        "description": "正圆按钮，通常只放一个图标",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "loading",
        "description": "加载中：禁止点击并在文字前显示转圈图标",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "icon",
        "description": "文字前（circle 时是唯一内容）的图标",
        "type": "JeIconName"
      },
      {
        "name": "block",
        "description": "撑满父容器宽度，移动端的主操作按钮用它",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeButtonGroup": {
    "attributes": [
      {
        "name": "type",
        "description": "组内按钮的默认语义类型，子按钮可用自身 type / variant 覆盖",
        "type": "JeButtonType"
      },
      {
        "name": "size",
        "description": "组内按钮的默认尺寸，子按钮可用自身 size 覆盖",
        "type": "JeButtonSize"
      },
      {
        "name": "direction",
        "description": "排列方向",
        "type": "'horizontal' | 'vertical'",
        "default": "'horizontal'"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeCalendar": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "Date"
      },
      {
        "name": "range",
        "description": "区间高亮：[起点, 终点]",
        "type": "[Date, Date]"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: Date) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(value: Date) => void"
      },
      {
        "name": "panel-change",
        "description": "面板切换时触发",
        "type": "(value: Date) => void"
      }
    ],
    "slots": [
      {
        "name": "date-cell",
        "description": "自定义日期单元格",
        "type": "{ date, data }"
      }
    ],
    "exposes": []
  },
  "JeCard": {
    "attributes": [],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeCarousel": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "number",
        "default": "0"
      },
      {
        "name": "height",
        "description": "高度",
        "type": "string",
        "default": "'240px'"
      },
      {
        "name": "autoplay",
        "description": "是否自动播放",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "interval",
        "description": "自动播放间隔，单位 ms",
        "type": "number",
        "default": "3000"
      },
      {
        "name": "loop",
        "description": "是否循环播放",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "direction",
        "description": "方向",
        "type": "'horizontal' | 'vertical'",
        "default": "'horizontal'"
      },
      {
        "name": "indicatorPosition",
        "description": "指示点的位置",
        "type": "'inside' | 'outside' | 'none'",
        "default": "'inside'"
      },
      {
        "name": "arrow",
        "description": "箭头显示时机",
        "type": "'hover' | 'always' | 'never'",
        "default": "'hover'"
      },
      {
        "name": "trigger",
        "description": "触发方式",
        "type": "'click' | 'hover'",
        "default": "'click'"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: number) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(index: number) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeCarouselItem": {
    "attributes": [
      {
        "name": "name",
        "description": "名称",
        "type": "string | number"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeCascader": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "JeCascaderValue",
        "default": "() => []"
      },
      {
        "name": "options",
        "description": "可选项列表",
        "type": "JeCascaderOption[]"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "'请选择'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "clearable",
        "description": "是否可一键清空",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: JeCascaderValue) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(value: JeCascaderValue) => void"
      },
      {
        "name": "clear",
        "description": "点击清空按钮时触发",
        "type": "() => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeCell": {
    "attributes": [
      {
        "name": "title",
        "description": "左侧标题",
        "type": "string"
      },
      {
        "name": "value",
        "description": "右侧内容，也可以用 value 插槽或默认插槽自定义",
        "type": "string | number"
      },
      {
        "name": "label",
        "description": "标题下方的说明文字",
        "type": "string"
      },
      {
        "name": "icon",
        "description": "标题左侧的图标",
        "type": "JeIconName"
      },
      {
        "name": "isLink",
        "description": "显示右侧箭头，表示整行可跳转",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "required",
        "description": "表单场景：在标题前显示必填星号",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "center",
        "description": "内容垂直居中（默认顶对齐，多行说明时更好读）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "size",
        "description": "尺寸",
        "type": "'default' | 'large'",
        "default": "'default'"
      },
      {
        "name": "border",
        "description": "底部的一像素分隔线；分组里最后一项由 JeCellGroup 自动去掉",
        "type": "boolean",
        "default": "true"
      }
    ],
    "events": [
      {
        "name": "click",
        "description": "点击整行；键盘回车 / 空格也会触发",
        "type": "(event: MouseEvent | KeyboardEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "icon",
        "description": "图标区域"
      },
      {
        "name": "title",
        "description": "标题区域"
      },
      {
        "name": "label",
        "description": "标签内容"
      },
      {
        "name": "value",
        "description": "数值内容"
      },
      {
        "name": "right-icon",
        "description": "右侧图标"
      }
    ],
    "exposes": []
  },
  "JeCellGroup": {
    "attributes": [
      {
        "name": "title",
        "description": "分组标题",
        "type": "string"
      },
      {
        "name": "description",
        "description": "分组标题下方的说明",
        "type": "string"
      },
      {
        "name": "inset",
        "description": "内嵌模式：整体收成一张带边框和圆角的卡片，并在左右留白",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "surface",
        "description": "分组内容区是否铺一层底色",
        "type": "boolean",
        "default": "true"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "title",
        "description": "标题区域"
      }
    ],
    "exposes": []
  },
  "JeCheckboxGroup": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "(string | number)[]",
        "default": "() => []"
      },
      {
        "name": "options",
        "description": "可选项列表",
        "type": "JeCheckboxOption[]"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: (string | number)[]) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeCircle": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "当前值",
        "type": "number",
        "default": "0"
      },
      {
        "name": "rate",
        "description": "总量（modelValue 达到它时画满一圈）",
        "type": "number",
        "default": "100"
      },
      {
        "name": "size",
        "description": "直径，数字按 px 处理",
        "type": "number | string",
        "default": "100"
      },
      {
        "name": "color",
        "description": "进度色，支持单色、色数组或按当前值取色的函数",
        "type": "string | string[] | ((current: number) => string)",
        "default": "() => ['var(--je-primary)', 'var(--je-primary-end)']"
      },
      {
        "name": "layerColor",
        "description": "轨道底色",
        "type": "string",
        "default": "'var(--je-surface)'"
      },
      {
        "name": "fill",
        "description": "填充模式：none 只描边 / solid 单色填充 / gradient 渐变填充",
        "type": "'none' | 'solid' | 'gradient'",
        "default": "'none'"
      },
      {
        "name": "strokeWidth",
        "description": "环宽，占半径的百分比",
        "type": "number",
        "default": "40"
      },
      {
        "name": "clockwise",
        "description": "是否顺时针",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "strokeLinecap",
        "description": "线帽",
        "type": "'round' | 'square' | 'butt'",
        "default": "'round'"
      },
      {
        "name": "startPosition",
        "description": "弧形起始位置",
        "type": "'top' | 'right' | 'bottom' | 'left'",
        "default": "'top'"
      },
      {
        "name": "speed",
        "description": "动画速度，值越大越快",
        "type": "number",
        "default": "100"
      },
      {
        "name": "text",
        "description": "中心文字",
        "type": "string"
      },
      {
        "name": "linearGradient",
        "description": "自定义渐变（取前两色），不传时用 color 数组前两色现算",
        "type": "string[]"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: number) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeCol": {
    "attributes": [
      {
        "name": "span",
        "description": "栅格占位格数",
        "type": "number",
        "default": "24"
      },
      {
        "name": "offset",
        "description": "偏移量（px）",
        "type": "number",
        "default": "0"
      },
      {
        "name": "push",
        "description": "栅格向右偏移格数",
        "type": "number",
        "default": "0"
      },
      {
        "name": "pull",
        "description": "栅格向左偏移格数",
        "type": "number",
        "default": "0"
      },
      {
        "name": "xs",
        "description": "超小屏（<768px）下的占位格数",
        "type": "JeResponsiveValue"
      },
      {
        "name": "sm",
        "description": "小屏（≥768px）下的占位格数",
        "type": "JeResponsiveValue"
      },
      {
        "name": "md",
        "description": "中屏（≥992px）下的占位格数",
        "type": "JeResponsiveValue"
      },
      {
        "name": "lg",
        "description": "大屏（≥1200px）下的占位格数",
        "type": "JeResponsiveValue"
      },
      {
        "name": "xl",
        "description": "超大屏（≥1920px）下的占位格数",
        "type": "JeResponsiveValue"
      },
      {
        "name": "tag",
        "description": "标签名",
        "type": "string",
        "default": "'div'"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeCollapse": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "JeCollapseName[]",
        "default": "() => []"
      },
      {
        "name": "accordion",
        "description": "是否手风琴模式（同时只展开一个）",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: JeCollapseName[]) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(name: JeCollapseName, value: JeCollapseName[]) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeCollapseItem": {
    "attributes": [
      {
        "name": "name",
        "description": "名称",
        "type": "string | number"
      },
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "title",
        "description": "标题区域"
      },
      {
        "name": "extra",
        "description": "附加内容"
      }
    ],
    "exposes": []
  },
  "JeColorPicker": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "十六进制颜色，showAlpha 开启时为 8 位 #RRGGBBAA",
        "type": "string",
        "default": "'#667eea'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "showAlpha",
        "description": "是否支持透明度",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "predefine",
        "description": "预定义颜色",
        "type": "string[]"
      },
      {
        "name": "size",
        "description": "尺寸",
        "type": "JeColorPickerSize",
        "default": "'default'"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(color: string) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(color: string) => void"
      },
      {
        "name": "active-change",
        "description": "高亮项变化时触发",
        "type": "(color: string) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeConfigProvider": {
    "attributes": [
      {
        "name": "size",
        "description": "子树默认组件尺寸；应用级缺省用 configureJelly({ size })",
        "type": "JeConfigSize"
      },
      {
        "name": "theme",
        "description": "主题变量覆盖，键可带或不带 --je- 前缀",
        "type": "Record<string, string>"
      },
      {
        "name": "locale",
        "description": "语言包，传语言名或部分覆盖对象",
        "type": "JeLocaleInput"
      },
      {
        "name": "teleportTo",
        "description": "浮层默认挂载节点，选择器或元素；缺省时挂在 body",
        "type": "JeTeleportTarget"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeContainer": {
    "attributes": [
      {
        "name": "direction",
        "description": "子元素排列方向；留空时由子元素自动判定",
        "type": "JeContainerDirection",
        "default": "''"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeCountDown": {
    "attributes": [
      {
        "name": "time",
        "description": "倒计时总时长，单位毫秒",
        "type": "number",
        "default": "0"
      },
      {
        "name": "format",
        "description": "时间格式，支持 DD/HH/mm/ss/S/SS/SSS",
        "type": "string",
        "default": "'HH:mm:ss'"
      },
      {
        "name": "autoStart",
        "description": "挂载后是否自动开始",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "millisecond",
        "description": "开启毫秒级渲染（会提高刷新频率，配合 S/SS/SSS 使用）",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "change",
        "description": "展示值发生变化",
        "type": "(current: JeCountDownCurrent) => void"
      },
      {
        "name": "finish",
        "description": "倒计时结束",
        "type": "() => void"
      }
    ],
    "slots": [],
    "exposes": [
      {
        "name": "start",
        "description": "开始倒计时"
      },
      {
        "name": "pause",
        "description": "暂停倒计时"
      },
      {
        "name": "reset",
        "description": "重置到初始状态"
      },
      {
        "name": "current",
        "description": "当前倒计时数值"
      }
    ]
  },
  "JeCoupon": {
    "attributes": [
      {
        "name": "value",
        "description": "面额或折扣值",
        "type": "number | string"
      },
      {
        "name": "currency",
        "description": "面额左侧的货币符号",
        "type": "string",
        "default": "'¥'"
      },
      {
        "name": "unit",
        "description": "面额右侧的单位，如 元 / 折",
        "type": "string",
        "default": "'元'"
      },
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "description",
        "description": "补充说明",
        "type": "string",
        "default": "''"
      },
      {
        "name": "condition",
        "description": "使用条件，如「满 100 元可用」",
        "type": "string",
        "default": "''"
      },
      {
        "name": "validity",
        "description": "有效期文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "tag",
        "description": "右上角角标，如「限时」",
        "type": "string",
        "default": "''"
      },
      {
        "name": "type",
        "description": "语义色",
        "type": "JeCouponType",
        "default": "'primary'"
      },
      {
        "name": "status",
        "description": "状态，非 unused 时置灰并展示角章",
        "type": "JeCouponStatus",
        "default": "'unused'"
      },
      {
        "name": "disabled",
        "description": "不可点击",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "click",
        "description": "点击整张券",
        "type": "(event: MouseEvent | KeyboardEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "title",
        "description": "标题区域"
      }
    ],
    "exposes": []
  },
  "JeDatePicker": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "JeDatePickerModelValue",
        "default": "null"
      },
      {
        "name": "type",
        "description": "类型",
        "type": "JeDatePickerType",
        "default": "'date'"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "'请选择日期'"
      },
      {
        "name": "format",
        "description": "展示 / 解析用的格式，datetime 默认 YYYY-MM-DD HH:mm",
        "type": "string"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "clearable",
        "description": "是否可一键清空",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "disabledDate",
        "description": "判断某天是否不可选的函数",
        "type": "(date: Date) => boolean"
      },
      {
        "name": "weekStart",
        "description": "一周起始日，0 = 周日，1 = 周一",
        "type": "number",
        "default": "1"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: JeDatePickerModelValue) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(value: JeDatePickerModelValue) => void"
      },
      {
        "name": "clear",
        "description": "点击清空按钮时触发",
        "type": "() => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeDescriptions": {
    "attributes": [
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "column",
        "description": "列配置",
        "type": "number",
        "default": "3"
      },
      {
        "name": "border",
        "description": "是否显示边框",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "direction",
        "description": "方向",
        "type": "JeDescriptionsDirection",
        "default": "'horizontal'"
      },
      {
        "name": "size",
        "description": "尺寸",
        "type": "JeDescriptionsSize",
        "default": "'default'"
      },
      {
        "name": "labelWidth",
        "description": "标签宽度",
        "type": "string | number"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "title",
        "description": "标题区域"
      }
    ],
    "exposes": []
  },
  "JeDescriptionsItem": {
    "attributes": [
      {
        "name": "label",
        "description": "标签文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "span",
        "description": "栅格占位格数",
        "type": "number",
        "default": "1"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "label",
        "description": "标签内容"
      }
    ],
    "exposes": []
  },
  "JeDialog": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "控制显隐（v-model）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "title",
        "description": "标题文案；用 header 插槽时它仍作为无障碍名称",
        "type": "string",
        "default": "''"
      },
      {
        "name": "width",
        "description": "数字按 px 处理；窄屏会自动占满可用宽度",
        "type": "string | number",
        "default": "520"
      },
      {
        "name": "showClose",
        "description": "是否显示右上角关闭按钮",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeIcon",
        "description": "自定义关闭图标：传图标名走内置 JeIcon，传组件则原样渲染",
        "type": "JeIconName | Component",
        "default": "'close'"
      },
      {
        "name": "closeOnClickModal",
        "description": "点击遮罩关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnPressEscape",
        "description": "按 Esc 关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnEscape",
        "description": "closeOnEscape 的同义项（closeOnPressEscape 优先），保留是为了不破坏老代码",
        "type": "boolean"
      },
      {
        "name": "beforeClose",
        "description": "关闭前的钩子：拿到 done 后自己决定何时放行。\n「点关闭按钮 / 点遮罩 / 按 Esc」以及「点内置页脚的确认 / 取消按钮」都会走它；\n页脚用 #footer 插槽自绘按钮时不经过这里，请在按钮自己的事件里处理",
        "type": "JeDialogBeforeClose"
      },
      {
        "name": "confirmButtonText",
        "description": "确认按钮文案；传入即渲染内置页脚（默认不传，页脚仍由 #footer 插槽负责）",
        "type": "string"
      },
      {
        "name": "cancelButtonText",
        "description": "取消按钮文案；传入即在内置页脚里显示取消按钮",
        "type": "string"
      },
      {
        "name": "showCancelButton",
        "description": "显示内置页脚的取消按钮（未传 cancelButtonText 时用默认文案「取消」；二者满足其一即显示）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "footerLayout",
        "description": "内置页脚的布局，默认 auto（窄屏竖排、宽屏横排）；使用 #footer 插槽时该属性不生效",
        "type": "JeDialogFooterLayout",
        "default": "'auto'"
      },
      {
        "name": "destroyOnClose",
        "description": "关闭后销毁默认插槽内容（配合 v-if 的惰性渲染，减少关闭态下的 DOM 开销）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "draggable",
        "description": "允许拖拽标题栏移动面板",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "fullscreen",
        "description": "占满整个视口，忽略 width / top / draggable",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "alignCenter",
        "description": "内容整体居中（面板水平垂直居中，同时页头页脚文字居中）",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "center",
        "description": "仅页头文字与页脚按钮水平居中，面板位置不变",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "top",
        "description": "面板与视口顶部的距离（如 15vh），传入即改为顶部对齐排版",
        "type": "string",
        "default": "''"
      },
      {
        "name": "bottomSheet",
        "description": "窄屏（≤768px）改成贴底弹出层（移动端 action sheet 形态）。\n默认 false：移动端与 Element Plus / Vant 的对话框一致，仍是一张垂直居中的卡片。\n贴底适合「一屏放不下、要露出后面内容」的场景，但会失去垂直居中，按需开启。",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "appendTo",
        "description": "浮层挂载的节点选择器或元素；嵌套对话框时用于脱离父级层叠上下文（旧写法，请优先用 teleportTo）",
        "type": "string | HTMLElement"
      },
      {
        "name": "appendToBody",
        "description": "强制挂到 body 上，优先级高于 appendTo（旧写法，请优先用 teleportTo）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      },
      {
        "name": "lockScroll",
        "description": "打开时锁定页面滚动",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "trapFocus",
        "description": "把 Tab 焦点圈在面板内",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "zIndex",
        "description": "面板层级，不传则按打开顺序自动递增",
        "type": "number"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "open",
        "description": "开始打开，此时面板还没跑完入场动画",
        "type": "() => void"
      },
      {
        "name": "opened",
        "description": "打开动画结束后触发，首次要摸 DOM 时用它",
        "type": "() => void"
      },
      {
        "name": "close",
        "description": "面板确实开始收起时触发；被 before-close 拦下则不会触发",
        "type": "() => void"
      },
      {
        "name": "closed",
        "description": "收起动画结束、面板不可见后触发",
        "type": "() => void"
      },
      {
        "name": "confirm",
        "description": "内置页脚的确认按钮走完流程后触发（被 before-close 拦下时不触发）",
        "type": "() => void"
      },
      {
        "name": "cancel",
        "description": "内置页脚的取消按钮走完流程后触发（被 before-close 拦下时不触发）",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "header",
        "description": "页头内容，替换后标题文案不再显示（关闭按钮保留）"
      },
      {
        "name": "footer",
        "description": "底部区域"
      }
    ],
    "exposes": [
      {
        "name": "handleClose",
        "description": "走一遍完整的关闭流程（含 before-close），供外部按钮复用"
      },
      {
        "name": "resetPosition",
        "description": "把拖拽产生的位移清零，回到初始位置"
      },
      {
        "name": "handleConfirm",
        "description": "走「确认」这条收尾路径：先发 confirm 事件，再过 before-close"
      },
      {
        "name": "handleCancel",
        "description": "走「取消」这条收尾路径：过 before-close 后发 cancel 事件，命令式 API 靠它区分取消"
      }
    ]
  },
  "JeDivider": {
    "attributes": [
      {
        "name": "direction",
        "description": "水平分割线带文字，垂直分割线用于行内分隔",
        "type": "'horizontal' | 'vertical'",
        "default": "'horizontal'"
      },
      {
        "name": "borderStyle",
        "description": "边框样式",
        "type": "'solid' | 'dashed' | 'dotted'",
        "default": "'solid'"
      },
      {
        "name": "contentPosition",
        "description": "文字位置，仅水平方向生效",
        "type": "'left' | 'center' | 'right'",
        "default": "'center'"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeDrawer": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "direction",
        "description": "面板滑入方向：rtl 右 / ltr 左 / ttb 上 / btt 下",
        "type": "'rtl' | 'ltr' | 'ttb' | 'btt'",
        "default": "'rtl'"
      },
      {
        "name": "size",
        "description": "数字按 px 处理，字符串原样使用；窄屏 rtl/ltr 自动改为 86vw",
        "type": "string | number",
        "default": "320"
      },
      {
        "name": "showClose",
        "description": "右上角关闭按钮",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnClickModal",
        "description": "点击遮罩关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnEscape",
        "description": "按 Esc 关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "open",
        "description": "打开时触发",
        "type": "() => void"
      },
      {
        "name": "close",
        "description": "关闭时触发",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "header",
        "description": "顶部区域"
      },
      {
        "name": "footer",
        "description": "底部区域"
      }
    ],
    "exposes": []
  },
  "JeDropdown": {
    "attributes": [
      {
        "name": "trigger",
        "description": "桌面端触发方式；窄屏一律点击切换",
        "type": "'hover' | 'click'",
        "default": "'click'"
      },
      {
        "name": "placement",
        "description": "浮层出现的位置",
        "type": "JePlacementValue",
        "default": "'bottom-start'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "closeOnClick",
        "description": "选中某一项后是否自动收起",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "splitButton",
        "description": "触发区拆成「主按钮 + 箭头」两段，主按钮内容同样来自 trigger 插槽",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "maxHeight",
        "description": "菜单最大高度（px），超出可滚动",
        "type": "number",
        "default": "280"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "command",
        "description": "点击下拉项时触发",
        "type": "(value: string | number) => void"
      },
      {
        "name": "visible-change",
        "description": "浮层显示状态变化时触发",
        "type": "(visible: boolean) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "trigger",
        "description": "触发器内容"
      }
    ],
    "exposes": []
  },
  "JeDropdownItem": {
    "attributes": [
      {
        "name": "command",
        "description": "选中时通过父级 command 事件抛出的值",
        "type": "string | number"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "divided",
        "description": "与上一项之间画一条分隔线",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "icon",
        "description": "图标",
        "type": "JeIconName"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeDropdownMenu": {
    "attributes": [
      {
        "name": "overlay",
        "description": "展开时是否显示遮罩",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnClickOverlay",
        "description": "点击遮罩是否收起",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnClickOutside",
        "description": "点击菜单之外是否收起",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnClickOption",
        "description": "点击选项后是否自动收起",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "direction",
        "description": "面板展开方向，up 时在条目栏上方弹出",
        "type": "'down' | 'up'",
        "default": "'down'"
      },
      {
        "name": "duration",
        "description": "展开 / 收起过渡时长（毫秒）",
        "type": "number",
        "default": "200"
      },
      {
        "name": "activeColor",
        "description": "选中 / 展开态文字颜色，缺省用主题色",
        "type": "string",
        "default": "''"
      },
      {
        "name": "inactiveColor",
        "description": "未选中态文字颜色，缺省用次级文字色",
        "type": "string",
        "default": "''"
      }
    ],
    "events": [
      {
        "name": "open",
        "description": "第 index 项展开",
        "type": "(index: number) => void"
      },
      {
        "name": "close",
        "description": "收起，回传收起前展开的那一项下标",
        "type": "(index: number) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeDropdownMenuItem": {
    "attributes": [
      {
        "name": "title",
        "description": "条目栏文案，未选中选项自带 title 时显示选项的 title",
        "type": "string",
        "default": "''"
      },
      {
        "name": "options",
        "description": "选项列表",
        "type": "JeDropdownOption[]",
        "default": "() => []"
      },
      {
        "name": "modelValue",
        "description": "当前选中值，multiple 时为数组",
        "type": "JeDropdownValue | JeDropdownValue[]"
      },
      {
        "name": "multiple",
        "description": "是否多选",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "禁用后条目不可展开",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: JeDropdownValue | JeDropdownValue[]) => void"
      },
      {
        "name": "change",
        "description": "选中值变化",
        "type": "(value: JeDropdownValue | JeDropdownValue[]) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeEmpty": {
    "attributes": [
      {
        "name": "description",
        "description": "描述文案",
        "type": "string",
        "default": "'暂无数据'"
      },
      {
        "name": "imageSize",
        "description": "默认插画尺寸（px）",
        "type": "number",
        "default": "100"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容",
        "type": "{ size }"
      },
      {
        "name": "description",
        "description": "描述内容"
      },
      {
        "name": "extra",
        "description": "附加内容"
      }
    ],
    "exposes": []
  },
  "JeFloatingBubble": {
    "attributes": [
      {
        "name": "offset",
        "description": "当前坐标（相对视口左上角，单位 px）",
        "type": "{ x: number; y: number }"
      },
      {
        "name": "axis",
        "description": "允许拖拽的方向",
        "type": "'x' | 'y' | 'xy'",
        "default": "'y'"
      },
      {
        "name": "magnetic",
        "description": "松手后吸附到哪条边",
        "type": "'x' | 'y'"
      },
      {
        "name": "icon",
        "description": "气泡内的图标",
        "type": "JeIconName"
      },
      {
        "name": "gap",
        "description": "与屏幕边缘保持的距离",
        "type": "number",
        "default": "24"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:offset",
        "description": "v-model 的 offset 更新时触发",
        "type": "(value: { x: number; y: number }) => void"
      },
      {
        "name": "offsetChange",
        "description": "坐标变化（拖拽中与吸附后都会触发）",
        "type": "(value: { x: number; y: number }) => void"
      },
      {
        "name": "click",
        "description": "位移小于阈值时视为点击",
        "type": "(event: MouseEvent | KeyboardEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeFloatingPanel": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "当前面板高度（px），配合 v-model 使用",
        "type": "number"
      },
      {
        "name": "anchors",
        "description": "可吸附的高度档位（px），缺省为 100 与视口高度的 60%",
        "type": "number[]",
        "default": "() => [100, typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.6) : 400]"
      },
      {
        "name": "duration",
        "description": "高度过渡时长，数字按秒处理，字符串原样使用",
        "type": "number | string",
        "default": "0.3"
      },
      {
        "name": "draggable",
        "description": "是否可拖拽抓手调整高度",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "safeAreaInsetBottom",
        "description": "底部预留安全区",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeable",
        "description": "是否显示关闭按钮",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "title",
        "description": "面板标题",
        "type": "string"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(height: number) => void"
      },
      {
        "name": "heightChange",
        "description": "高度吸附落定后派发",
        "type": "(height: number) => void"
      },
      {
        "name": "close",
        "description": "点击关闭按钮",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "header",
        "description": "顶部区域"
      }
    ],
    "exposes": [
      {
        "name": "setHeight",
        "description": "设置高度，会吸附到最近档位"
      },
      {
        "name": "closestAnchor",
        "description": "返回距离指定高度最近的档位"
      }
    ]
  },
  "JeFooter": {
    "attributes": [
      {
        "name": "height",
        "description": "底栏高度，数字按 px 处理",
        "type": "string | number",
        "default": "60"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeForm": {
    "attributes": [
      {
        "name": "model",
        "description": "表单数据对象，字段通过 prop 路径读写",
        "type": "Record<string, unknown>"
      },
      {
        "name": "rules",
        "description": "校验规则，键为字段路径",
        "type": "JeFormRules",
        "default": "() => ({})"
      },
      {
        "name": "labelPosition",
        "description": "标签位置；窄屏一律堆叠到控件上方",
        "type": "JeFormLabelPosition",
        "default": "'top'"
      },
      {
        "name": "labelWidth",
        "description": "左 / 右标签的固定宽度，数字按 px 处理",
        "type": "string | number",
        "default": "''"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "validate",
        "description": "表单校验后触发",
        "type": "(prop: string, valid: boolean, message: string) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": [
      {
        "name": "validate",
        "description": "校验整个表单"
      },
      {
        "name": "validateField",
        "description": "校验指定字段"
      },
      {
        "name": "resetFields",
        "description": "重置字段并清除校验态"
      },
      {
        "name": "clearValidate",
        "description": "清除校验提示"
      }
    ]
  },
  "JeFormItem": {
    "attributes": [
      {
        "name": "prop",
        "description": "字段路径，需与表单 model 对应",
        "type": "string",
        "default": "''"
      },
      {
        "name": "label",
        "description": "标签文案",
        "type": "string"
      },
      {
        "name": "labelWidth",
        "description": "覆盖表单级的标签宽度",
        "type": "string | number"
      },
      {
        "name": "required",
        "description": "强制显示必填星号",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "rules",
        "description": "覆盖表单级规则",
        "type": "JeFormRule[]"
      },
      {
        "name": "error",
        "description": "手动指定的错误信息，优先级最高",
        "type": "string"
      },
      {
        "name": "showMessage",
        "description": "是否显示校验错误文案",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "htmlFor",
        "description": "关联控件的 id，便于点击标签聚焦",
        "type": "string"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeGrid": {
    "attributes": [
      {
        "name": "column",
        "description": "每行几列",
        "type": "number",
        "default": "4"
      },
      {
        "name": "border",
        "description": "画出外框与格子之间的分隔线",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "square",
        "description": "单元格强制正方形，图标宫格用它",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeGridItem": {
    "attributes": [
      {
        "name": "icon",
        "description": "图标",
        "type": "JeIconName"
      },
      {
        "name": "text",
        "description": "图标下方的文字",
        "type": "string"
      },
      {
        "name": "badge",
        "description": "图标右上角的角标",
        "type": "string | number"
      },
      {
        "name": "dot",
        "description": "只显示一个小圆点角标",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "click",
        "description": "点击格子；键盘回车 / 空格也会触发",
        "type": "(event: MouseEvent | KeyboardEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "icon",
        "description": "图标区域"
      },
      {
        "name": "text",
        "description": "文本内容"
      }
    ],
    "exposes": []
  },
  "JeHeader": {
    "attributes": [
      {
        "name": "height",
        "description": "顶栏高度，数字按 px 处理",
        "type": "string | number",
        "default": "60"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeHighlight": {
    "attributes": [
      {
        "name": "text",
        "description": "源文本",
        "type": "string",
        "default": "''"
      },
      {
        "name": "keywords",
        "description": "需要高亮的关键字，支持单个或多个",
        "type": "string | string[]",
        "default": "() => [] as string[]"
      },
      {
        "name": "caseSensitive",
        "description": "大小写敏感",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "highlightClass",
        "description": "命中片段的类名",
        "type": "string"
      },
      {
        "name": "unhighlightClass",
        "description": "未命中片段的类名",
        "type": "string"
      },
      {
        "name": "highlightTag",
        "description": "命中片段的标签名",
        "type": "string",
        "default": "'span'"
      },
      {
        "name": "unhighlightTag",
        "description": "未命中片段的标签名",
        "type": "string",
        "default": "'span'"
      },
      {
        "name": "autoEscape",
        "description": "对关键字做正则转义",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "tag",
        "description": "最外层标签名",
        "type": "string",
        "default": "'span'"
      }
    ],
    "events": [],
    "slots": [],
    "exposes": [
      {
        "name": "segments",
        "description": "高亮分片的数组"
      }
    ]
  },
  "JeIcon": {
    "attributes": [
      {
        "name": "name",
        "description": "名称",
        "type": "JeIconName"
      },
      {
        "name": "size",
        "description": "图标尺寸，数字按 px 处理",
        "type": "number | string",
        "default": "16"
      },
      {
        "name": "spin",
        "description": "是否旋转（加载态）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "filled",
        "description": "用填充代替描边（评分星星等）",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [],
    "exposes": []
  },
  "JeImage": {
    "attributes": [
      {
        "name": "src",
        "description": "资源地址",
        "type": "string"
      },
      {
        "name": "alt",
        "description": "原生 alt 文本",
        "type": "string",
        "default": "''"
      },
      {
        "name": "width",
        "description": "数字按 px 处理",
        "type": "string | number"
      },
      {
        "name": "height",
        "description": "高度",
        "type": "string | number"
      },
      {
        "name": "fit",
        "description": "内容填充方式",
        "type": "JeImageFit",
        "default": "'cover'"
      },
      {
        "name": "radius",
        "description": "数字按 px 处理",
        "type": "string | number"
      },
      {
        "name": "preview",
        "description": "点击图片打开全屏查看器",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "previewSrcList",
        "description": "查看器里可左右切换的图片列表，留空则只用 src",
        "type": "string[]",
        "default": "() => []"
      },
      {
        "name": "lazy",
        "description": "交给原生懒加载",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "placeholder",
        "description": "加载中显示的占位图，不传则显示微光骨架",
        "type": "string",
        "default": "''"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "load",
        "description": "加载完成时触发",
        "type": "() => void"
      },
      {
        "name": "error",
        "description": "出错时触发",
        "type": "() => void"
      },
      {
        "name": "close",
        "description": "关闭时触发",
        "type": "() => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeImagePreview": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "是否显示",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "images",
        "description": "图片地址列表",
        "type": "string[]",
        "default": "() => []"
      },
      {
        "name": "startPosition",
        "description": "初始显示第几张",
        "type": "number",
        "default": "0"
      },
      {
        "name": "showIndex",
        "description": "顶部索引指示",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "showIndicators",
        "description": "底部小圆点指示",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "infinite",
        "description": "首尾循环切换",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "loop",
        "description": "infinite 的别名，二者取或",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "swipeDuration",
        "description": "切图动画时长",
        "type": "number",
        "default": "300"
      },
      {
        "name": "maxZoom",
        "description": "最大缩放倍数",
        "type": "number",
        "default": "3"
      },
      {
        "name": "minZoom",
        "description": "最小缩放倍数",
        "type": "number",
        "default": "1"
      },
      {
        "name": "closeable",
        "description": "显示关闭按钮",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeIcon",
        "description": "关闭按钮图标",
        "type": "JeIconName",
        "default": "'close'"
      },
      {
        "name": "closeOnClickOverlay",
        "description": "点击图片外的空白区域关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "change",
        "description": "当前图片下标变化",
        "type": "(index: number) => void"
      },
      {
        "name": "close",
        "description": "关闭",
        "type": "() => void"
      },
      {
        "name": "scale",
        "description": "缩放倍数变化",
        "type": "(scale: number) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeIndexAnchor": {
    "attributes": [
      {
        "name": "index",
        "description": "对应索引栏里的索引值",
        "type": "string | number"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "index",
        "description": "索引区域"
      }
    ],
    "exposes": []
  },
  "JeIndexBar": {
    "attributes": [
      {
        "name": "indexList",
        "description": "右侧索引列表",
        "type": "(string | number)[]",
        "default": "() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')"
      },
      {
        "name": "sticky",
        "description": "锚点头部是否吸顶",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "stickyOffsetTop",
        "description": "吸顶时距离容器顶部的距离",
        "type": "number",
        "default": "0"
      },
      {
        "name": "highlightColor",
        "description": "高亮项的背景色，传任意 CSS 颜色",
        "type": "string"
      }
    ],
    "events": [
      {
        "name": "select",
        "description": "点击某个索引",
        "type": "(index: string | number) => void"
      },
      {
        "name": "change",
        "description": "当前高亮索引发生变化",
        "type": "(index: string | number) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeInfiniteScroll": {
    "attributes": [
      {
        "name": "loading",
        "description": "是否正在加载",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "finished",
        "description": "是否已全部加载完，置 true 后不再触发 load",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "error",
        "description": "是否加载失败，点击状态区可重试",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "offset",
        "description": "距滚动容器底部多少像素时触发加载",
        "type": "number",
        "default": "300"
      },
      {
        "name": "immediateCheck",
        "description": "挂载时立即检查一次（内容不足一屏时很有用）",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "loadingText",
        "description": "加载中提示",
        "type": "string",
        "default": "'加载中...'"
      },
      {
        "name": "finishedText",
        "description": "加载完成提示",
        "type": "string",
        "default": "'没有更多了'"
      },
      {
        "name": "errorText",
        "description": "加载失败提示",
        "type": "string",
        "default": "'加载失败，点击重试'"
      }
    ],
    "events": [
      {
        "name": "load",
        "description": "滚动到底部附近，需要加载下一页",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容",
        "type": "{ text }"
      }
    ],
    "exposes": []
  },
  "JeInput": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "string | number",
        "default": "''"
      },
      {
        "name": "type",
        "description": "输入框类型，默认 text",
        "type": "JeInputType",
        "default": "'text'"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "''"
      },
      {
        "name": "maxlength",
        "description": "原生 maxlength，字数上限",
        "type": "string | number"
      },
      {
        "name": "minlength",
        "description": "原生 minlength，字数下限",
        "type": "string | number"
      },
      {
        "name": "showWordLimit",
        "description": "是否显示字数统计，仅在 text / textarea 下生效",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "wordLimitPosition",
        "description": "字数统计的位置，showWordLimit 为 true 时生效",
        "type": "JeInputWordLimitPosition",
        "default": "'inside'"
      },
      {
        "name": "clearable",
        "description": "是否可一键清空",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "clearIcon",
        "description": "自定义清空图标",
        "type": "JeInputIcon",
        "default": "'close'"
      },
      {
        "name": "formatter",
        "description": "显示值的格式化函数，通常与 parser 成对使用。\n组件只把它作用在「显示」上，v-model 里始终是 parser 解析后的值。",
        "type": "(value: string | number) => string"
      },
      {
        "name": "parser",
        "description": "把格式化后的字符串还原成真实值的函数",
        "type": "(value: string) => string"
      },
      {
        "name": "showPassword",
        "description": "是否显示「切换密码可见性」按钮，type 为 password 时生效",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "readonly",
        "description": "是否只读",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "size",
        "description": "尺寸，不传时取 JeConfigProvider 的全局尺寸",
        "type": "JeInputSize"
      },
      {
        "name": "prefixIcon",
        "description": "前置图标",
        "type": "JeInputIcon"
      },
      {
        "name": "suffixIcon",
        "description": "后置图标",
        "type": "JeInputIcon"
      },
      {
        "name": "rows",
        "description": "文本域行数，type 为 textarea 时生效",
        "type": "number",
        "default": "2"
      },
      {
        "name": "autosize",
        "description": "文本域是否自适应高度",
        "type": "JeInputAutosize",
        "default": "false"
      },
      {
        "name": "autocomplete",
        "description": "原生 autocomplete",
        "type": "string",
        "default": "'off'"
      },
      {
        "name": "name",
        "description": "原生 name",
        "type": "string"
      },
      {
        "name": "max",
        "description": "原生 max，type 为 number 时生效",
        "type": "string | number"
      },
      {
        "name": "min",
        "description": "原生 min，type 为 number 时生效",
        "type": "string | number"
      },
      {
        "name": "step",
        "description": "原生 step，type 为 number 时生效",
        "type": "string | number"
      },
      {
        "name": "resize",
        "description": "文本域右下角的拖拽方向",
        "type": "JeInputResize"
      },
      {
        "name": "autofocus",
        "description": "挂载后自动聚焦",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "form",
        "description": "原生 form 属性，用于关联到表单外的 <form>",
        "type": "string"
      },
      {
        "name": "tabindex",
        "description": "原生 tabindex",
        "type": "string | number"
      },
      {
        "name": "validateEvent",
        "description": "是否触发表单校验，false 时不把 change / focusout 冒泡给 JeFormItem",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "inputStyle",
        "description": "直接作用在内部 input / textarea 上的样式",
        "type": "StyleValue"
      },
      {
        "name": "inputmode",
        "description": "原生 inputmode，移动端唤起指定键盘",
        "type": "JeInputMode"
      },
      {
        "name": "ariaLabel",
        "description": "无可见标签时提供给读屏软件的说明",
        "type": "string"
      },
      {
        "name": "countGraphemes",
        "description": "自定义「字数」计数函数（例如按字形簇统计 emoji）。\n传入后原生 maxlength / minlength 不再生效，改由组件按字形簇截断。",
        "type": "(value: string) => number"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: string) => void"
      },
      {
        "name": "input",
        "description": "输入时触发",
        "type": "(value: string) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(value: string, evt: Event) => void"
      },
      {
        "name": "clear",
        "description": "点击清空按钮时触发",
        "type": "(evt: MouseEvent) => void"
      },
      {
        "name": "focus",
        "description": "获得焦点时触发",
        "type": "(event: FocusEvent) => void"
      },
      {
        "name": "blur",
        "description": "失去焦点时触发",
        "type": "(event: FocusEvent) => void"
      },
      {
        "name": "keydown",
        "description": "按下按键时触发",
        "type": "(event: KeyboardEvent) => void"
      },
      {
        "name": "mouseenter",
        "description": "鼠标移入时触发",
        "type": "(event: MouseEvent) => void"
      },
      {
        "name": "mouseleave",
        "description": "鼠标移出时触发",
        "type": "(event: MouseEvent) => void"
      },
      {
        "name": "compositionstart",
        "description": "输入法开始组词时触发",
        "type": "(event: CompositionEvent) => void"
      },
      {
        "name": "compositionupdate",
        "description": "输入法组词更新时触发",
        "type": "(event: CompositionEvent) => void"
      },
      {
        "name": "compositionend",
        "description": "输入法结束组词时触发",
        "type": "(event: CompositionEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "prepend",
        "description": "前置内容"
      },
      {
        "name": "prefix",
        "description": "前缀内容"
      },
      {
        "name": "suffix",
        "description": "后缀内容"
      },
      {
        "name": "password-icon",
        "description": "密码可见性图标",
        "type": "{ visible }"
      },
      {
        "name": "append",
        "description": "后置内容"
      }
    ],
    "exposes": [
      {
        "name": "input",
        "description": "内部原生 input 元素"
      },
      {
        "name": "textarea",
        "description": "内部原生 textarea 元素"
      },
      {
        "name": "ref",
        "description": "内部原生元素（input 或 textarea）"
      },
      {
        "name": "textareaStyle",
        "description": "文本域当前的行内样式"
      },
      {
        "name": "isComposing",
        "description": "是否正在输入法组词"
      },
      {
        "name": "passwordVisible",
        "description": "密码是否处于明文状态"
      },
      {
        "name": "focus",
        "description": "让输入控件获得焦点"
      },
      {
        "name": "blur",
        "description": "让输入控件失去焦点"
      },
      {
        "name": "select",
        "description": "选中输入框内的文本"
      },
      {
        "name": "clear",
        "description": "清空当前值"
      },
      {
        "name": "resizeTextarea",
        "description": "重新计算文本域高度"
      }
    ]
  },
  "JeInputNumber": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "number | null",
        "default": "null"
      },
      {
        "name": "min",
        "description": "允许的最小值",
        "type": "number",
        "default": "-Infinity"
      },
      {
        "name": "max",
        "description": "允许的最大值",
        "type": "number",
        "default": "Infinity"
      },
      {
        "name": "step",
        "description": "步长",
        "type": "number",
        "default": "1"
      },
      {
        "name": "precision",
        "description": "小数位数，不传则由 step 推导",
        "type": "number"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "''"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "controls",
        "description": "是否显示加减按钮",
        "type": "boolean",
        "default": "true"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: number | null) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeLazyload": {
    "attributes": [
      {
        "name": "src",
        "description": "图片地址",
        "type": "string",
        "default": "''"
      },
      {
        "name": "alt",
        "description": "替代文本",
        "type": "string",
        "default": "''"
      },
      {
        "name": "rootMargin",
        "description": "距离视口多远开始加载，对应 IntersectionObserver 的 rootMargin",
        "type": "string",
        "default": "'0px'"
      },
      {
        "name": "loading",
        "description": "eager 表示不做懒加载，直接渲染",
        "type": "'lazy' | 'eager'",
        "default": "'lazy'"
      },
      {
        "name": "placeholder",
        "description": "占位图地址，也可以直接用 placeholder 插槽",
        "type": "string",
        "default": "''"
      },
      {
        "name": "error",
        "description": "加载失败时的兜底图地址",
        "type": "string",
        "default": "''"
      },
      {
        "name": "width",
        "description": "容器宽度，数字按 px 处理",
        "type": "number | string"
      },
      {
        "name": "height",
        "description": "容器高度，数字按 px 处理",
        "type": "number | string"
      },
      {
        "name": "objectFit",
        "description": "图片填充方式",
        "type": "'fill' | 'contain' | 'cover' | 'none' | 'scale-down'",
        "default": "'cover'"
      }
    ],
    "events": [
      {
        "name": "load",
        "description": "图片加载完成",
        "type": "(event: Event) => void"
      },
      {
        "name": "error",
        "description": "图片加载失败（有兜底图时会触发两次：原图失败一次、兜底图再失败一次）",
        "type": "(event: Event) => void"
      }
    ],
    "slots": [
      {
        "name": "placeholder",
        "description": "占位内容"
      }
    ],
    "exposes": []
  },
  "JeLink": {
    "attributes": [
      {
        "name": "type",
        "description": "类型",
        "type": "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'",
        "default": "'default'"
      },
      {
        "name": "underline",
        "description": "下划线策略；触屏设备没有 hover，hover 会自动降级为常显",
        "type": "'always' | 'hover' | 'never'",
        "default": "'hover'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "href",
        "description": "链接地址",
        "type": "string"
      },
      {
        "name": "target",
        "description": "原生 target",
        "type": "string"
      },
      {
        "name": "rel",
        "description": "原生 rel",
        "type": "string"
      }
    ],
    "events": [
      {
        "name": "click",
        "description": "点击时触发",
        "type": "(event: MouseEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "icon",
        "description": "图标区域"
      }
    ],
    "exposes": []
  },
  "JeLoading": {
    "attributes": [
      {
        "name": "loading",
        "description": "是否显示加载遮罩",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "text",
        "description": "转圈下方的提示文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "fullscreen",
        "description": "全屏：遮罩传送到 body 并覆盖整个视口",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "background",
        "description": "覆盖遮罩底色，留空使用默认半透明黑",
        "type": "string",
        "default": "''"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeLocale": {
    "attributes": [
      {
        "name": "locale",
        "description": "语言名（'zh-CN' / 'en-US'）或部分覆盖的语言包对象",
        "type": "JeLocaleInput"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeMain": {
    "attributes": [],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeMenu": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "JeMenuIndex | null",
        "default": "null"
      },
      {
        "name": "mode",
        "description": "模式",
        "type": "'vertical' | 'horizontal'",
        "default": "'vertical'"
      },
      {
        "name": "collapse",
        "description": "仅纵向模式有效：折叠后只显示图标，标题用 Tooltip 提示",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "uniqueOpened",
        "description": "纵向模式下同时只展开一个子菜单",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "defaultOpeneds",
        "description": "初始展开的子菜单",
        "type": "JeMenuIndex[]",
        "default": "() => []"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: JeMenuIndex) => void"
      },
      {
        "name": "select",
        "description": "选中某项时触发",
        "type": "(index: JeMenuIndex, indexPath: JeMenuIndex[]) => void"
      },
      {
        "name": "open",
        "description": "打开时触发",
        "type": "(index: JeMenuIndex) => void"
      },
      {
        "name": "close",
        "description": "关闭时触发",
        "type": "(index: JeMenuIndex) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeMenuItem": {
    "attributes": [
      {
        "name": "index",
        "description": "序号",
        "type": "JeMenuIndex"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "icon",
        "description": "图标",
        "type": "JeIconName"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "title",
        "description": "标题区域"
      }
    ],
    "exposes": []
  },
  "JeSubMenu": {
    "attributes": [
      {
        "name": "index",
        "description": "序号",
        "type": "JeMenuIndex"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "icon",
        "description": "图标",
        "type": "JeIconName"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "title",
        "description": "标题区域"
      }
    ],
    "exposes": []
  },
  "JeMessage": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "是否显示，配 v-model 使用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "type",
        "description": "类型",
        "type": "JeMessageType",
        "default": "'info'"
      },
      {
        "name": "message",
        "description": "提示文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "duration",
        "description": "自动关闭延迟（毫秒），0 表示不自动关闭",
        "type": "number",
        "default": "3000"
      },
      {
        "name": "showClose",
        "description": "是否显示关闭按钮",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "offset",
        "description": "距视口顶部的偏移（px）",
        "type": "number",
        "default": "20"
      },
      {
        "name": "teleport",
        "description": "内部使用：命令式容器里由父级统一布局，关闭自身 Teleport 与自定位（旧写法，请优先用 teleportTo）",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "close",
        "description": "关闭时触发",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeNavBar": {
    "attributes": [
      {
        "name": "title",
        "description": "中间标题",
        "type": "string"
      },
      {
        "name": "description",
        "description": "标题下方的说明文字",
        "type": "string"
      },
      {
        "name": "leftText",
        "description": "左侧文字；不传时只显示返回箭头",
        "type": "string"
      },
      {
        "name": "leftArrow",
        "description": "是否显示左侧返回箭头",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "rightText",
        "description": "右侧文字",
        "type": "string"
      },
      {
        "name": "fixed",
        "description": "固定到视口顶部，长列表里保持可见",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "placeholder",
        "description": "fixed 时是否用占位元素把导航栏原来的高度补回来",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "safeArea",
        "description": "顶部安全区留白（刘海屏），fixed 时尤其需要",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "border",
        "description": "底部分隔线",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "zIndex",
        "description": "fixed 时的层级，与项目其它固定头栏（文档站顶栏 200）保持同一量级",
        "type": "number",
        "default": "100"
      }
    ],
    "events": [
      {
        "name": "click-left",
        "description": "点击左侧区域",
        "type": "(event: MouseEvent) => void"
      },
      {
        "name": "click-right",
        "description": "点击右侧区域",
        "type": "(event: MouseEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "left",
        "description": "左侧内容"
      },
      {
        "name": "title",
        "description": "标题区域"
      },
      {
        "name": "right",
        "description": "右侧内容"
      }
    ],
    "exposes": []
  },
  "JeNoticeBar": {
    "attributes": [
      {
        "name": "text",
        "description": "通知内容",
        "type": "string",
        "default": "''"
      },
      {
        "name": "mode",
        "description": "模式，可用空格组合 link 与 closeable",
        "type": "string",
        "default": "''"
      },
      {
        "name": "color",
        "description": "文字颜色，传任意 CSS 颜色",
        "type": "string",
        "default": "''"
      },
      {
        "name": "background",
        "description": "背景色，传任意 CSS 颜色",
        "type": "string",
        "default": "''"
      },
      {
        "name": "leftIcon",
        "description": "左侧图标",
        "type": "JeIconName",
        "default": "'volume'"
      },
      {
        "name": "scrollable",
        "description": "文字超出时是否横向滚动",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "speed",
        "description": "滚动速度，单位 px/s",
        "type": "number",
        "default": "60"
      },
      {
        "name": "delay",
        "description": "开始滚动前的停留时长，单位秒",
        "type": "number",
        "default": "1"
      },
      {
        "name": "wrapable",
        "description": "允许多行换行展示（开启后不再滚动）",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "click",
        "description": "mode 含 link 时点击整条通知栏",
        "type": "(event: MouseEvent) => void"
      },
      {
        "name": "close",
        "description": "mode 含 closeable 时点击关闭按钮",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeNotification": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "是否显示，配 v-model 使用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "message",
        "description": "提示文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "type",
        "description": "类型",
        "type": "JeNotificationType",
        "default": "'info'"
      },
      {
        "name": "duration",
        "description": "自动关闭延迟（毫秒），0 表示不自动关闭",
        "type": "number",
        "default": "4500"
      },
      {
        "name": "position",
        "description": "位置",
        "type": "JeNotificationPosition",
        "default": "'top-right'"
      },
      {
        "name": "showClose",
        "description": "是否显示关闭按钮",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleport",
        "description": "内部使用：命令式容器里由父级统一布局，关闭自身 Teleport 与自定位（旧写法，请优先用 teleportTo）",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "close",
        "description": "关闭时触发",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeNumberKeyboard": {
    "attributes": [
      {
        "name": "show",
        "description": "显示 / 隐藏键盘，一旦传入它就是可见性的唯一来源（对齐 Vant，受控写法：@blur=\"show = false\"）",
        "type": "boolean"
      },
      {
        "name": "modelValue",
        "description": "显示 / 隐藏键盘；没有传 show 时由它决定，保证旧的 v-model 用法不变",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "title",
        "description": "面板标题，为空则不渲染标题栏文字",
        "type": "string",
        "default": "''"
      },
      {
        "name": "theme",
        "description": "主题：default 带标题栏（含关闭按钮），custom 无标题栏 —— 面板内不再有独立收起按钮，收起交给 hideOnClickOutside 或调用方自己的 UI",
        "type": "'default' | 'custom'",
        "default": "'default'"
      },
      {
        "name": "extraKey",
        "description": "左下角额外按键，如 . 或 00；custom 主题下可传两个（['00', '.']）占满最后一排",
        "type": "string | string[]",
        "default": "''"
      },
      {
        "name": "value",
        "description": "当前已输入内容，用于 maxlength 判断",
        "type": "string",
        "default": "''"
      },
      {
        "name": "maxlength",
        "description": "最多可输入的长度，达到后数字键不可用（删除键与关闭键始终可用）",
        "type": "number"
      },
      {
        "name": "showDeleteKey",
        "description": "是否显示删除键",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "deleteIcon",
        "description": "删除键图标，deleteButtonText 非空时以文字优先",
        "type": "JeIconName",
        "default": "'backspace'"
      },
      {
        "name": "deleteButtonText",
        "description": "删除键文字，为空则显示删除图标",
        "type": "string",
        "default": "''"
      },
      {
        "name": "closeButtonText",
        "description": "关闭按钮文案：default 主题用作标题栏按钮文字，custom 主题（无标题栏）用作网格左下角「完成」键的文字",
        "type": "string",
        "default": "'完成'"
      },
      {
        "name": "closeButtonLoading",
        "description": "关闭按钮是否加载中：作用于标题栏的按钮与网格左下角的「完成」键",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "randomKeyOrder",
        "description": "是否随机打乱数字键顺序",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "closeOnClickOutside",
        "description": "点击键盘以外区域自动关闭（hideOnClickOutside 的旧名，保留兼容；新名默认已开启，这里显式传 true 同样生效）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "hideOnClickOutside",
        "description": "点击键盘以外区域自动关闭（命名对齐 Vant），默认开启；要关掉请显式传 false",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "blurOnClose",
        "description": "收起时是否触发 blur；关掉后受控调用方需要自己监听 close 来收起",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "safeAreaInsetBottom",
        "description": "底部预留安全区（全面屏手势条）",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "transition",
        "description": "是否开启展开 / 收起动画",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "zIndex",
        "description": "指定层级，不传则自动取全局递增层级",
        "type": "number"
      },
      {
        "name": "teleport",
        "description": "挂载节点，false 表示就地渲染（旧写法，请优先用 teleportTo）",
        "type": "JeTeleportTarget | false"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "input",
        "description": "点击数字或额外按键",
        "type": "(key: string) => void"
      },
      {
        "name": "delete",
        "description": "点击删除键",
        "type": "() => void"
      },
      {
        "name": "close",
        "description": "点击关闭按钮（键盘本身不负责改值）",
        "type": "() => void"
      },
      {
        "name": "show",
        "description": "由隐藏转为显示",
        "type": "() => void"
      },
      {
        "name": "hide",
        "description": "由显示转为隐藏，不等过场动画结束",
        "type": "() => void"
      },
      {
        "name": "blur",
        "description": "请求收起：点击关闭按钮或键盘外部时触发，受控 show 的调用方据此把 show 置为 false",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "自定义按键：插槽内容直接成为网格单元。default 主题且未配 extraKey 时会填进左下角那个空位（键盘仍是 4 排），其余情况追加在固定按键之后"
      },
      {
        "name": "title-left",
        "description": "标题栏左侧内容：Vant 的收起箭头就是放在这个插槽里，组件本身不带箭头"
      },
      {
        "name": "delete",
        "description": "删除键内容：可替换成任意图标或文字（Vant 同名插槽）"
      },
      {
        "name": "extra-key",
        "description": "左下角额外按键内容：custom 主题配两个额外键时两个键共用这段内容"
      }
    ],
    "exposes": []
  },
  "JeOrgChart": {
    "attributes": [
      {
        "name": "nodes",
        "description": "扁平节点数组",
        "type": "JeOrgChartNode[]"
      },
      {
        "name": "rootId",
        "description": "指定根节点 id；缺省时把 parentId 为空（或指向不存在的节点）的都当作根",
        "type": "string | number"
      },
      {
        "name": "nodeWidth",
        "description": "节点卡片宽度（设计稿 px）",
        "type": "number",
        "default": "208"
      },
      {
        "name": "nodeHeight",
        "description": "节点卡片高度（设计稿 px）",
        "type": "number",
        "default": "76"
      },
      {
        "name": "gapX",
        "description": "兄弟节点之间的水平间距（设计稿 px）",
        "type": "number",
        "default": "32"
      },
      {
        "name": "gapY",
        "description": "层级之间的垂直间距（设计稿 px）",
        "type": "number",
        "default": "64"
      },
      {
        "name": "spouseWidth",
        "description": "配偶卡宽度（设计稿 px），缺省与 nodeWidth 一致",
        "type": "number"
      },
      {
        "name": "spouseGap",
        "description": "配偶卡与主卡之间的间距（设计稿 px）",
        "type": "number",
        "default": "20"
      },
      {
        "name": "defaultExpandDepth",
        "description": "初始展开层级：0 表示只显示根节点，2 表示根往下展开两层（depth 0/1/2 可见）",
        "type": "number",
        "default": "2"
      },
      {
        "name": "minScale",
        "description": "缩放下限",
        "type": "number",
        "default": "0.12"
      },
      {
        "name": "maxScale",
        "description": "缩放上限",
        "type": "number",
        "default": "2.5"
      },
      {
        "name": "linkStyle",
        "description": "连线样式，缺省 curve 曲线（一级人多时曲线比肘形更容易看清归属）",
        "type": "JeOrgChartLinkStyle",
        "default": "'curve'"
      },
      {
        "name": "editable",
        "description": "是否开启表单编辑：缺省 false 即纯展示、不可编辑。\n传 true 后点击主卡会弹出内置编辑浮层（主标题 / 副标题两个字段），保存时通过 update:nodes\n事件抛出替换后的完整扁平数组（配合 v-model:nodes 使用）。组件仍是受控的，只抛数据，\n落库 / 校验 / 撤销由业务侧决定；配偶卡不参与编辑。",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "draggable",
        "description": "是否开启拖拽改层级：缺省 false 即不可拖拽。\n传 true 后可按住某张主卡拖到另一张主卡上，松手即把它改挂到目标节点下，通过 node-move 与\nupdate:nodes 抛出结果（配合 v-model:nodes 使用）。同样是受控组件，只抛数据；拖回原位、\n拖到自己的后代等非法落点会被忽略，配偶卡与折叠按钮不可拖。",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "addable",
        "description": "是否开启「添加下级」：缺省 false。\n传 true 后点击主卡弹出的内置浮层里会多一个「添加下级」按钮，点它即在该节点下追加一个新节点\n（id 自动生成为**字符串**、name 取当前语言包里的「新节点」），并抛 node-add 与 update:nodes。\n提供了 node-popup 插槽时内置浮层不出现，可改用暴露的 addChild(id) 自行调用。",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "removable",
        "description": "是否开启「删除节点」：缺省 false。\n传 true 后内置浮层里会多一个「删除」按钮，点击需**二次确认**；确认后删除该节点**及其全部下级**\n（整棵子树），抛 node-remove（被删的整棵子树）与 update:nodes。提供了 node-popup 插槽时\n改用暴露的 removeNode(id) 自行调用。",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "undoable",
        "description": "是否开启撤销 / 重做：缺省 false。\n传 true 后组件会为**自己发起的每一次变更**（编辑保存 / 拖拽改层级 / 增删节点）记一份历史，\n通过暴露的 undo() / redo() / clearHistory() 调用，每次可用状态变化抛 history-change。\n宿主若换掉整份数据（不是组件刚抛出的那份），历史自动清空。",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "renderNode",
        "description": "自定义人物块画法，见 JeOrgChartRenderNode",
        "type": "JeOrgChartRenderNode"
      },
      {
        "name": "background",
        "description": "画布底色，缺省透明；导出时未单独指定则沿用",
        "type": "string",
        "default": "''"
      },
      {
        "name": "label",
        "description": "无障碍描述，缺省「组织架构图」",
        "type": "string",
        "default": "'组织架构图'"
      }
    ],
    "events": [
      {
        "name": "node-click",
        "description": "点击节点卡片时触发（点折叠按钮与配偶卡不会触发它），第二个参数是原始鼠标 / 触摸事件",
        "type": "(node: JeOrgChartNode, event: MouseEvent) => void"
      },
      {
        "name": "spouse-click",
        "description": "点击配偶卡时触发，第二、三个参数是配偶所属的主节点与原始鼠标 / 触摸事件",
        "type": "(spouse: JeOrgChartSpouse, host: JeOrgChartNode, event: MouseEvent) => void"
      },
      {
        "name": "toggle",
        "description": "折叠或展开一个节点后触发，collapsed 是切换后的状态",
        "type": "(node: JeOrgChartNode, collapsed: boolean) => void"
      },
      {
        "name": "locate",
        "description": "locate() 命中一个节点后触发",
        "type": "(node: JeOrgChartNode) => void"
      },
      {
        "name": "update:nodes",
        "description": "编辑保存后触发（仅 editable 为 true 时会有），抛出替换后的完整扁平数组，\n配合 v-model:nodes 使用；组件只抛数据，落库 / 校验 / 撤销由业务侧决定",
        "type": "(nodes: JeOrgChartNode[]) => void"
      },
      {
        "name": "node-move",
        "description": "拖拽改层级松手后触发（仅 draggable 为 true 且落点合法时会有）：依次是移动的节点、\n原父 id、新父 id（无父时为 null）。与 update:nodes 同时抛出，前者供业务记账 / 提示，\n后者直接喂给 v-model:nodes",
        "type": "(node: JeOrgChartNode, oldParentId: string | null, newParentId: string | null) => void"
      },
      {
        "name": "node-add",
        "description": "新增节点后触发（仅 addable 为 true 时会有）：依次是新建的节点与它的父 id。\n与 update:nodes 同时抛出 —— 前者供业务记账 / 提示，后者直接喂给 v-model:nodes",
        "type": "(node: JeOrgChartNode, parentId: string | null) => void"
      },
      {
        "name": "node-remove",
        "description": "删除节点后触发（仅 removable 为 true 时会有）：依次是被删除的整棵子树（含该节点自身）\n与被点的那个节点。与 update:nodes 同时抛出",
        "type": "(removed: JeOrgChartNode[], node: JeOrgChartNode) => void"
      },
      {
        "name": "history-change",
        "description": "撤销 / 重做的可用状态变化时触发（需 undoable），两个参数分别是「能否撤销」「能否重做」",
        "type": "(canUndo: boolean, canRedo: boolean) => void"
      }
    ],
    "slots": [
      {
        "name": "node-popup",
        "description": "主卡详情浮层：插槽参数 node 是当前节点数据，close 收起浮层",
        "type": "{ node, close }"
      },
      {
        "name": "spouse-popup",
        "description": "配偶详情浮层：插槽参数 spouse 是配偶数据、host 是配偶所属的主卡、close 收起浮层",
        "type": "{ spouse, host, close }"
      }
    ],
    "exposes": [
      {
        "name": "locate",
        "description": "定位到某个节点（id 精确匹配或 name / title 模糊匹配），自动展开祖先并居中高亮"
      },
      {
        "name": "expandTo",
        "description": "展开从根到指定节点 id 的整条路径"
      },
      {
        "name": "expandAll",
        "description": "展开全部节点"
      },
      {
        "name": "collapseTo",
        "description": "折叠到指定层级，缺省 0 即只留根节点"
      },
      {
        "name": "fit",
        "description": "把整张图适配进当前视口"
      },
      {
        "name": "getVisibleIds",
        "description": "当前可见节点的 id 列表"
      },
      {
        "name": "addChild",
        "description": "在指定节点下追加一个下级（需 addable），成功返回 true；插槽自定义 UI 时可用"
      },
      {
        "name": "removeNode",
        "description": "删除某节点及其全部下级（需 removable），成功返回 true；插槽自定义 UI 时可用"
      },
      {
        "name": "undo",
        "description": "撤销上一次「增删 / 编辑 / 拖拽」（需 undoable）；成功返回 true，没得撤返回 false"
      },
      {
        "name": "redo",
        "description": "重做被撤销的变更（需 undoable）；成功返回 true，没得重做返回 false"
      },
      {
        "name": "clearHistory",
        "description": "清空历史（需 undoable），之后 canUndo / canRedo 都为 false"
      },
      {
        "name": "toDataURL",
        "description": "把当前可见内容导出为 dataURL"
      },
      {
        "name": "toBlob",
        "description": "把当前可见内容导出为 Blob"
      },
      {
        "name": "download",
        "description": "导出并触发下载"
      }
    ]
  },
  "JePagination": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "number",
        "default": "1"
      },
      {
        "name": "total",
        "description": "总条数",
        "type": "number",
        "default": "0"
      },
      {
        "name": "pageSize",
        "description": "每页条数",
        "type": "number",
        "default": "10"
      },
      {
        "name": "pageSizes",
        "description": "可选的每页条数",
        "type": "number[]",
        "default": "() => [10, 20, 50, 100]"
      },
      {
        "name": "layout",
        "description": "支持 total / sizes / prev / pager / next / jumper，逗号分隔且按顺序渲染",
        "type": "string",
        "default": "'prev, pager, next'"
      },
      {
        "name": "background",
        "description": "是否显示背景",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "small",
        "description": "是否使用紧凑样式",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "hideOnSinglePage",
        "description": "只有一页时是否隐藏",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "pagerCount",
        "description": "页码按钮的数量",
        "type": "number",
        "default": "7"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(page: number) => void"
      },
      {
        "name": "update:pageSize",
        "description": "v-model 的 pageSize 更新时触发",
        "type": "(size: number) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(page: number, pageSize: number) => void"
      },
      {
        "name": "current-change",
        "description": "当前页变化时触发",
        "type": "(page: number) => void"
      },
      {
        "name": "size-change",
        "description": "每页条数变化时触发",
        "type": "(size: number) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JePasswordInput": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "已输入的密码内容",
        "type": "string",
        "default": "''"
      },
      {
        "name": "length",
        "description": "密码位数",
        "type": "number",
        "default": "6"
      },
      {
        "name": "mask",
        "description": "输入后是否用圆点遮挡",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "gutter",
        "description": "格子之间的间距，传数字按 px 处理",
        "type": "number | string",
        "default": "0"
      },
      {
        "name": "info",
        "description": "下方说明文字",
        "type": "string",
        "default": "''"
      },
      {
        "name": "errorInfo",
        "description": "传了即进入错误态：覆盖 info 文案，并抖动一次提醒",
        "type": "string",
        "default": "''"
      },
      {
        "name": "focused",
        "description": "受控聚焦状态，支持 v-model:focused 双向绑定",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "是否禁用输入，同时屏蔽点击聚焦与关闭按钮",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "showCursor",
        "description": "聚焦时是否显示闪烁光标",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "cursorColor",
        "description": "光标颜色，默认取主题主色",
        "type": "string",
        "default": "''"
      },
      {
        "name": "accept",
        "description": "允许输入的字符集：numeric 只收数字（验证码场景），text 不做过滤。\n这里用枚举值而不是「正则字符串」，是为了不把用户传的规则写进 HTML 属性——\n值只活在 JS 里，就不会被当成代码或样式解析，也省去正则语法出错时的静默失败。",
        "type": "'numeric' | 'text'",
        "default": "'numeric'"
      },
      {
        "name": "clearable",
        "description": "是否显示右上角关闭按钮，点击后清空内容并派发 close",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "autofocus",
        "description": "挂载后自动聚焦（移动端受「无用户手势不弹键盘」限制，见文档说明）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "always",
        "description": "未聚焦时也显示光标（适合配合 JeNumberKeyboard 自定义键盘）。\n它只放宽显示条件，不改变光标落点——光标始终停在下一个待填的格子上。",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "密码内容变化（配合 v-model 使用）",
        "type": "(value: string) => void"
      },
      {
        "name": "update:focused",
        "description": "受控聚焦状态变化，与 v-model:focused 成对，供父组件同步键盘显隐",
        "type": "(value: boolean) => void"
      },
      {
        "name": "change",
        "description": "内容发生实际变化时触发，参数为最新的完整内容",
        "type": "(value: string) => void"
      },
      {
        "name": "focus",
        "description": "输入框获得焦点",
        "type": "(event: FocusEvent) => void"
      },
      {
        "name": "blur",
        "description": "输入框失去焦点",
        "type": "(event: FocusEvent) => void"
      },
      {
        "name": "close",
        "description": "点击右上角关闭按钮，内容已由组件清空",
        "type": "() => void"
      },
      {
        "name": "complete",
        "description": "输入位数达到 length 时触发，可用于自动提交",
        "type": "(value: string) => void"
      }
    ],
    "slots": [
      {
        "name": "close-icon",
        "description": "关闭图标，可用 #close-icon 替换"
      },
      {
        "name": "info",
        "description": "底部说明区，传了即整体替换 info / errorInfo 文案",
        "type": "{ error, value }"
      }
    ],
    "exposes": [
      {
        "name": "focus",
        "description": "聚焦到隐藏输入框（聚焦后才会唤起系统键盘）"
      },
      {
        "name": "blur",
        "description": "让输入框失去焦点，并同步把聚焦状态写回 v-model:focused"
      },
      {
        "name": "clear",
        "description": "清空已输入内容"
      }
    ]
  },
  "JePicker": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "每列已选中的值，长度与 columns 对应",
        "type": "(string | number)[]",
        "default": "() => []"
      },
      {
        "name": "columns",
        "description": "列定义",
        "type": "JePickerColumn[]",
        "default": "() => []"
      },
      {
        "name": "title",
        "description": "面板标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "placeholder",
        "description": "未选择时触发按钮上的占位文字",
        "type": "string",
        "default": "'请选择'"
      },
      {
        "name": "disabled",
        "description": "禁用整个选择器",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "confirmText",
        "description": "确认按钮文字",
        "type": "string",
        "default": "'确认'"
      },
      {
        "name": "cancelText",
        "description": "取消按钮文字",
        "type": "string",
        "default": "'取消'"
      },
      {
        "name": "showToolbar",
        "description": "是否显示顶部工具栏（取消 / 标题 / 确认）",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "visibleItemCount",
        "description": "每列可见的选项行数，建议用奇数",
        "type": "number",
        "default": "5"
      },
      {
        "name": "itemHeight",
        "description": "单行高度",
        "type": "number",
        "default": "44"
      },
      {
        "name": "closeOnClickModal",
        "description": "点击遮罩关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(values: (string | number)[]) => void"
      },
      {
        "name": "change",
        "description": "某一列滚动停下后",
        "type": "(values: (string | number)[], options: (JePickerOption | undefined)[]) => void"
      },
      {
        "name": "confirm",
        "description": "点击确认",
        "type": "(values: (string | number)[], options: (JePickerOption | undefined)[]) => void"
      },
      {
        "name": "cancel",
        "description": "点击取消或遮罩",
        "type": "() => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JePopconfirm": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "content",
        "description": "内容",
        "type": "string",
        "default": "''"
      },
      {
        "name": "confirmText",
        "description": "确认按钮文案",
        "type": "string",
        "default": "'确定'"
      },
      {
        "name": "cancelText",
        "description": "取消按钮文案",
        "type": "string",
        "default": "'取消'"
      },
      {
        "name": "placement",
        "description": "浮层出现的位置",
        "type": "JePlacementValue",
        "default": "'top'"
      },
      {
        "name": "type",
        "description": "确认按钮语义色",
        "type": "JePopconfirmType",
        "default": "'primary'"
      },
      {
        "name": "width",
        "description": "数字按 px 处理；窄屏固定为底部弹出层的整宽",
        "type": "string | number",
        "default": "220"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "confirm",
        "description": "确认时触发",
        "type": "() => void"
      },
      {
        "name": "cancel",
        "description": "取消时触发",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "reference",
        "description": "触发元素"
      },
      {
        "name": "content",
        "description": "内容区域"
      }
    ],
    "exposes": []
  },
  "JePopover": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "trigger",
        "description": "桌面端触发方式；窄屏一律改为点击切换",
        "type": "JePopoverTrigger",
        "default": "'hover'"
      },
      {
        "name": "placement",
        "description": "浮层出现的位置",
        "type": "JePlacementValue",
        "default": "'bottom'"
      },
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "width",
        "description": "数字按 px 处理；窄屏会收缩到视口内",
        "type": "string | number",
        "default": "260"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "offset",
        "description": "与触发元素的间距",
        "type": "number",
        "default": "10"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "show",
        "description": "显示时触发",
        "type": "() => void"
      },
      {
        "name": "hide",
        "description": "隐藏时触发",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "title",
        "description": "标题区域"
      },
      {
        "name": "content",
        "description": "内容区域"
      }
    ],
    "exposes": []
  },
  "JePopup": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "显示 / 隐藏",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "position",
        "description": "弹出位置",
        "type": "'center' | 'top' | 'bottom' | 'left' | 'right'",
        "default": "'center'"
      },
      {
        "name": "round",
        "description": "圆角（按位置自动决定哪几条边）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "closeable",
        "description": "右上角等位置的关闭按钮",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "closeIcon",
        "description": "关闭按钮图标",
        "type": "JeIconName",
        "default": "'close'"
      },
      {
        "name": "closeIconPosition",
        "description": "关闭按钮位置",
        "type": "'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'",
        "default": "'top-right'"
      },
      {
        "name": "overlay",
        "description": "是否显示遮罩",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "closeOnClickOverlay",
        "description": "点击遮罩关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "lockScroll",
        "description": "打开时锁定页面滚动",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "safeAreaInsetBottom",
        "description": "底部预留安全区",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "safeAreaInsetTop",
        "description": "顶部预留安全区",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "duration",
        "description": "展开 / 收起的过渡时长，单位毫秒，同时用于 opened / closed 事件时机",
        "type": "number",
        "default": "300"
      },
      {
        "name": "zIndex",
        "description": "指定层级，不传则自动取全局递增层级",
        "type": "number"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "open",
        "description": "开始展开",
        "type": "() => void"
      },
      {
        "name": "opened",
        "description": "展开动画结束",
        "type": "() => void"
      },
      {
        "name": "close",
        "description": "开始收起",
        "type": "() => void"
      },
      {
        "name": "closed",
        "description": "收起动画结束",
        "type": "() => void"
      },
      {
        "name": "clickOverlay",
        "description": "点击遮罩",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JePoster": {
    "attributes": [
      {
        "name": "width",
        "description": "设计稿宽度（px），元素坐标 / 尺寸 / 字号都按这个口径书写",
        "type": "number",
        "default": "750"
      },
      {
        "name": "height",
        "description": "设计稿高度（px）",
        "type": "number",
        "default": "1334"
      },
      {
        "name": "background",
        "description": "背景：底色 + 可选背景图",
        "type": "JePosterBackground",
        "default": "() => ({})"
      },
      {
        "name": "elements",
        "description": "元素列表，按数组顺序叠放",
        "type": "JePosterElement[]",
        "default": "() => []"
      },
      {
        "name": "mode",
        "description": "渲染方式：canvas 所见即所得（默认，与导出一致）；dom 为真实 DOM 预览，可用同名具名插槽替换元素（插槽不影响导出）",
        "type": "'canvas' | 'dom'",
        "default": "'canvas'"
      },
      {
        "name": "radius",
        "description": "海报圆角（设计稿 px）",
        "type": "number",
        "default": "0"
      },
      {
        "name": "label",
        "description": "无障碍描述",
        "type": "string",
        "default": "'海报'"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": [
      {
        "name": "toDataURL",
        "description": "导出为图片 dataURL（默认 PNG），与预览同一条绘制链"
      },
      {
        "name": "toBlob",
        "description": "导出为 Blob（适合上传 / File 场景），失败返回 null"
      },
      {
        "name": "download",
        "description": "导出并触发浏览器下载，filename 缺省为 poster.png"
      }
    ]
  },
  "JeProgress": {
    "attributes": [
      {
        "name": "percentage",
        "description": "当前进度（0 ~ 100，超出自动收敛）",
        "type": "number"
      },
      {
        "name": "type",
        "description": "line 线性 / circle 环形",
        "type": "JeProgressType",
        "default": "'line'"
      },
      {
        "name": "strokeWidth",
        "description": "线宽，line 为高度、circle 为环宽",
        "type": "number",
        "default": "8"
      },
      {
        "name": "color",
        "description": "自定义进度色，留空则使用品牌渐变",
        "type": "string",
        "default": "''"
      },
      {
        "name": "showText",
        "description": "是否显示百分比文案",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "status",
        "description": "状态色，优先级高于 color",
        "type": "JeProgressStatus",
        "default": "''"
      },
      {
        "name": "striped",
        "description": "条纹填充",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "animated",
        "description": "条纹滚动",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "indeterminate",
        "description": "不确定进度：无限滑动，忽略 percentage",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [],
    "exposes": []
  },
  "JePullRefresh": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "是否处于加载中，刷新完成后由调用方置回 false",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "禁用下拉手势",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "headHeight",
        "description": "触发刷新需要的下拉距离",
        "type": "number",
        "default": "50"
      },
      {
        "name": "successDuration",
        "description": "刷新成功后提示的停留时长（毫秒）",
        "type": "number",
        "default": "500"
      },
      {
        "name": "pullingText",
        "description": "下拉中提示",
        "type": "string",
        "default": "'下拉即可刷新'"
      },
      {
        "name": "loosingText",
        "description": "达到阈值、可松手时的提示",
        "type": "string",
        "default": "'释放立即刷新'"
      },
      {
        "name": "loadingText",
        "description": "加载中提示",
        "type": "string",
        "default": "'加载中...'"
      },
      {
        "name": "successText",
        "description": "刷新成功提示",
        "type": "string",
        "default": "'刷新成功'"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(loading: boolean) => void"
      },
      {
        "name": "refresh",
        "description": "下拉距离达到阈值并松手",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容",
        "type": "{ distance }"
      }
    ],
    "exposes": []
  },
  "JeQrcode": {
    "attributes": [
      {
        "name": "value",
        "description": "要编码的文本，按 UTF-8 字节模式编码",
        "type": "string"
      },
      {
        "name": "size",
        "description": "渲染边长，数字按 px 处理",
        "type": "number | string",
        "default": "160"
      },
      {
        "name": "level",
        "description": "纠错级别，越高越耐污损、可容纳的内容越少",
        "type": "JeQrcodeLevel",
        "default": "'M'"
      },
      {
        "name": "margin",
        "description": "静区宽度，单位为模块数",
        "type": "number",
        "default": "2"
      },
      {
        "name": "color",
        "description": "深色模块颜色，默认跟随当前文字颜色",
        "type": "string",
        "default": "'currentColor'"
      },
      {
        "name": "background",
        "description": "背景色，默认透明",
        "type": "string",
        "default": "'transparent'"
      },
      {
        "name": "renderer",
        "description": "渲染方式，canvas 适合大尺寸渲染等场景",
        "type": "'svg' | 'canvas'",
        "default": "'svg'"
      },
      {
        "name": "shape",
        "description": "深色模块形状：square 方块，dot 圆点（定位 / 校正 / 定时等结构模块恒为方块，保证可识别）",
        "type": "'square' | 'dot'",
        "default": "'square'"
      },
      {
        "name": "gradient",
        "description": "前景渐变色标，至少两个颜色；给值时覆盖 color",
        "type": "string[]"
      },
      {
        "name": "gradientAngle",
        "description": "前景渐变角度（度）：0 向上、90 向右、顺时针增大，默认 45",
        "type": "number",
        "default": "45"
      },
      {
        "name": "icon",
        "description": "中心 logo 图片地址，也可改用默认插槽自定义中心内容",
        "type": "string"
      },
      {
        "name": "iconSize",
        "description": "中心 logo 尺寸，数字按 px 处理；缺省为边长的 22%",
        "type": "number | string"
      },
      {
        "name": "label",
        "description": "无障碍描述，缺省用 value",
        "type": "string"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": [
      {
        "name": "toDataURL",
        "description": "导出为图片 dataURL（默认 PNG 位图），连同中心 logo 一起绘制"
      },
      {
        "name": "download",
        "description": "导出位图并触发浏览器下载，filename 缺省为 qrcode.png"
      },
      {
        "name": "toSVGString",
        "description": "导出为自包含的 SVG 字符串（向量，中心 logo 内联为 data URL）"
      },
      {
        "name": "downloadSVG",
        "description": "导出 SVG 并触发浏览器下载，filename 缺省为 qrcode.svg"
      }
    ]
  },
  "JeRadioGroup": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "string | number | null",
        "default": "null"
      },
      {
        "name": "options",
        "description": "可选项列表",
        "type": "JeRadioOption[]"
      },
      {
        "name": "name",
        "description": "原生 radio 的 name，不传则自动生成",
        "type": "string"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: string | number) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeRate": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "number",
        "default": "0"
      },
      {
        "name": "max",
        "description": "允许的最大值",
        "type": "number",
        "default": "5"
      },
      {
        "name": "allowHalf",
        "description": "允许半星",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "clearable",
        "description": "再次点击当前分值可清零",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "size",
        "description": "星星尺寸，不传则用主题默认值（窄屏会自动放大）",
        "type": "number"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: number) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeResult": {
    "attributes": [
      {
        "name": "icon",
        "description": "结果图标：success / warning / info / error",
        "type": "JeResultIcon",
        "default": "'info'"
      },
      {
        "name": "title",
        "description": "主标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "subTitle",
        "description": "副标题（说明文案）",
        "type": "string",
        "default": "''"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "icon",
        "description": "图标区域"
      },
      {
        "name": "title",
        "description": "标题区域"
      },
      {
        "name": "subTitle",
        "description": "副标题区域"
      },
      {
        "name": "extra",
        "description": "附加内容"
      }
    ],
    "exposes": []
  },
  "JeRow": {
    "attributes": [
      {
        "name": "gutter",
        "description": "栅格间距（px）",
        "type": "JeGutter",
        "default": "0"
      },
      {
        "name": "justify",
        "description": "主轴对齐方式",
        "type": "JeRowJustify",
        "default": "'start'"
      },
      {
        "name": "align",
        "description": "交叉轴对齐方式",
        "type": "JeRowAlign",
        "default": "'top'"
      },
      {
        "name": "wrap",
        "description": "是否换行",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "tag",
        "description": "标签名",
        "type": "string",
        "default": "'div'"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeScrollbar": {
    "attributes": [
      {
        "name": "height",
        "description": "滚动区高度，不传则撑满父容器",
        "type": "string | number"
      },
      {
        "name": "maxHeight",
        "description": "滚动区最大高度，内容超出才出现滚动条",
        "type": "string | number"
      },
      {
        "name": "native",
        "description": "保留浏览器原生滚动条，只当作滚动容器用，不再自绘滑块",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "always",
        "description": "滑块常驻显示（默认悬停或滚动时才浮出）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "minSize",
        "description": "滑块最小长度（px）",
        "type": "number",
        "default": "DEFAULT_MIN_SIZE"
      },
      {
        "name": "tag",
        "description": "内容外层的元素标签名",
        "type": "string",
        "default": "'div'"
      },
      {
        "name": "wrapClass",
        "description": "包裹层（真正滚动的元素）的自定义类名",
        "type": "string",
        "default": "''"
      },
      {
        "name": "wrapStyle",
        "description": "包裹层的自定义样式",
        "type": "CSSProperties | string"
      },
      {
        "name": "viewClass",
        "description": "内容层的自定义类名",
        "type": "string",
        "default": "''"
      },
      {
        "name": "viewStyle",
        "description": "内容层的自定义样式",
        "type": "CSSProperties | string"
      },
      {
        "name": "noresize",
        "description": "不监听容器尺寸变化。尺寸固定时开启可以省掉 ResizeObserver 的开销",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "id",
        "description": "滚动视图的 id。真正滚动的是内部 wrap，外部组件（JeAffix 的 target、JeBacktop 的 target、\nJeAnchor 的 container）都是按选择器去读 `scrollTop` 的，所以 id 必须落在这个元素上。",
        "type": "string"
      }
    ],
    "events": [
      {
        "name": "scroll",
        "description": "滚动时触发，回传当前滚动距离",
        "type": "(payload: { scrollTop: number; scrollLeft: number }) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": [
      {
        "name": "wrapRef",
        "description": "包裹层元素，可直接读取 scrollTop / scrollHeight"
      },
      {
        "name": "update",
        "description": "手动重算滑块，内容尺寸变化又没开 ResizeObserver 时用"
      },
      {
        "name": "setScrollTop",
        "description": "设置纵向滚动距离"
      },
      {
        "name": "setScrollLeft",
        "description": "设置横向滚动距离"
      },
      {
        "name": "scrollTo",
        "description": "滚动到指定坐标（x 横向、y 纵向）"
      }
    ]
  },
  "JeSearch": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "搜索关键字",
        "type": "string",
        "default": "''"
      },
      {
        "name": "placeholder",
        "description": "输入框占位提示",
        "type": "string",
        "default": "'请输入关键字'"
      },
      {
        "name": "shape",
        "description": "外形：胶囊 / 圆角方形",
        "type": "'round' | 'square'",
        "default": "'round'"
      },
      {
        "name": "background",
        "description": "输入框背景，传任意 CSS 颜色；不传则用主题表面色",
        "type": "string",
        "default": "''"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "readonly",
        "description": "是否只读",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "maxlength",
        "description": "最大输入长度",
        "type": "number"
      },
      {
        "name": "showCancel",
        "description": "右侧显示「取消」按钮（移动端常见）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "cancelText",
        "description": "取消按钮文案",
        "type": "string",
        "default": "'取消'"
      },
      {
        "name": "clearable",
        "description": "有内容时显示清除按钮",
        "type": "boolean",
        "default": "true"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: string) => void"
      },
      {
        "name": "search",
        "description": "键盘回车或点击右侧搜索区时触发",
        "type": "(value: string) => void"
      },
      {
        "name": "cancel",
        "description": "点击取消按钮",
        "type": "() => void"
      },
      {
        "name": "clear",
        "description": "点击清除按钮",
        "type": "() => void"
      },
      {
        "name": "focus",
        "description": "获得焦点时触发",
        "type": "(event: FocusEvent) => void"
      },
      {
        "name": "blur",
        "description": "失去焦点时触发",
        "type": "(event: FocusEvent) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeSegmented": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "string | number | null",
        "default": "null"
      },
      {
        "name": "options",
        "description": "可选项列表",
        "type": "JeSegmentedOption[]"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "block",
        "description": "撑满父级宽度",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: string | number) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeSelect": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "string | number | null",
        "default": "null"
      },
      {
        "name": "options",
        "description": "可选项列表",
        "type": "JeSelectOption[]"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "'请选择'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: string | number) => void"
      }
    ],
    "slots": [
      {
        "name": "prefix",
        "description": "前缀内容"
      },
      {
        "name": "label",
        "description": "标签内容",
        "type": "{ index, label, value }"
      },
      {
        "name": "option",
        "description": "自定义选项内容",
        "type": "{ item, index }"
      }
    ],
    "exposes": []
  },
  "JeShareSheet": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "显示 / 隐藏",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "options",
        "description": "分享目标列表",
        "type": "JeShareOption[]",
        "default": "() => []"
      },
      {
        "name": "title",
        "description": "面板标题，缺省取语言包 shareSheet.title",
        "type": "string"
      },
      {
        "name": "description",
        "description": "标题下方的说明文字",
        "type": "string"
      },
      {
        "name": "cancelText",
        "description": "取消按钮文字，缺省取语言包；传空字符串则不显示取消按钮",
        "type": "string"
      },
      {
        "name": "closeOnClickOverlay",
        "description": "点击遮罩关闭",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "safeAreaInsetBottom",
        "description": "底部预留安全区",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "duration",
        "description": "展开 / 收起过渡时长，单位毫秒",
        "type": "number",
        "default": "300"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "select",
        "description": "选中某个分享目标",
        "type": "(option: JeShareOption, index: number) => void"
      },
      {
        "name": "cancel",
        "description": "点了取消或遮罩",
        "type": "() => void"
      },
      {
        "name": "open",
        "description": "面板开始展开",
        "type": "() => void"
      },
      {
        "name": "close",
        "description": "面板开始收起",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "header",
        "description": "顶部区域"
      }
    ],
    "exposes": []
  },
  "JeSidebar": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "当前选中项的 name",
        "type": "string | number"
      },
      {
        "name": "width",
        "description": "整列的宽度",
        "type": "number | string",
        "default": "88"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: string | number) => void"
      },
      {
        "name": "change",
        "description": "选中项变化",
        "type": "(value: string | number) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeSidebarItem": {
    "attributes": [
      {
        "name": "name",
        "description": "唯一标识，对应父级的 modelValue",
        "type": "string | number"
      },
      {
        "name": "title",
        "description": "标题文字，也可以用默认插槽",
        "type": "string",
        "default": "''"
      },
      {
        "name": "badge",
        "description": "角标内容",
        "type": "string | number"
      },
      {
        "name": "dot",
        "description": "只显示小圆点角标",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeSignature": {
    "attributes": [
      {
        "name": "penColor",
        "description": "画笔颜色",
        "type": "string",
        "default": "'#ffffff'"
      },
      {
        "name": "lineWidth",
        "description": "画笔粗细，单位 px",
        "type": "number",
        "default": "2"
      },
      {
        "name": "backgroundColor",
        "description": "画布背景色，空字符串表示透明底",
        "type": "string",
        "default": "''"
      },
      {
        "name": "height",
        "description": "画布高度，数字按 px 处理",
        "type": "number | string",
        "default": "200"
      },
      {
        "name": "disabled",
        "description": "禁用：不接收绘制",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "type",
        "description": "导出图片格式",
        "type": "'png' | 'jpeg'",
        "default": "'png'"
      },
      {
        "name": "tips",
        "description": "未书写时的提示文字，缺省取语言包 signature.tip",
        "type": "string"
      },
      {
        "name": "clearText",
        "description": "清空按钮文字，缺省取语言包 signature.clear",
        "type": "string"
      },
      {
        "name": "undoText",
        "description": "撤销按钮文字，缺省取语言包 signature.undo",
        "type": "string"
      },
      {
        "name": "showToolbar",
        "description": "是否显示底部工具栏",
        "type": "boolean",
        "default": "true"
      }
    ],
    "events": [
      {
        "name": "start",
        "description": "开始一笔",
        "type": "() => void"
      },
      {
        "name": "end",
        "description": "一笔结束",
        "type": "() => void"
      },
      {
        "name": "change",
        "description": "存储变化时派发，回传画布是否为空，可用于判断能否提交",
        "type": "(isEmpty: boolean) => void"
      },
      {
        "name": "clear",
        "description": "画布被清空",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "footer",
        "description": "底部区域"
      }
    ],
    "exposes": [
      {
        "name": "clear",
        "description": "清空画布与笔画历史"
      },
      {
        "name": "undo",
        "description": "撤销最后一笔"
      },
      {
        "name": "toDataURL",
        "description": "导出 dataURL"
      },
      {
        "name": "isEmpty",
        "description": "画布是否为空"
      },
      {
        "name": "getResult",
        "description": "导出结果 { isEmpty, dataUrl }"
      }
    ]
  },
  "JeSkeleton": {
    "attributes": [
      {
        "name": "loading",
        "description": "是否处于加载中：true 显示骨架，false 显示默认插槽",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "animated",
        "description": "微光动画",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "rows",
        "description": "文本行数",
        "type": "number",
        "default": "3"
      },
      {
        "name": "avatar",
        "description": "左侧头像占位",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "title",
        "description": "顶部标题占位",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "round",
        "description": "圆角化，用于圆角卡片内",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeSkeletonItem": {
    "attributes": [
      {
        "name": "variant",
        "description": "形态：text 文本行 / circle 圆形 / rect 矩形 / button 按钮",
        "type": "JeSkeletonVariant",
        "default": "'text'"
      },
      {
        "name": "width",
        "description": "宽度，数字按 px 处理",
        "type": "string | number"
      },
      {
        "name": "height",
        "description": "高度，数字按 px 处理",
        "type": "string | number"
      }
    ],
    "events": [],
    "slots": [],
    "exposes": []
  },
  "JeSlider": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "单值传 number，范围模式传 [起点, 终点]",
        "type": "number | number[]",
        "default": "0"
      },
      {
        "name": "min",
        "description": "允许的最小值",
        "type": "number",
        "default": "0"
      },
      {
        "name": "max",
        "description": "允许的最大值",
        "type": "number",
        "default": "100"
      },
      {
        "name": "step",
        "description": "步长",
        "type": "number",
        "default": "1"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "showTooltip",
        "description": "是否显示提示",
        "type": "boolean",
        "default": "true"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: number | number[]) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeSpace": {
    "attributes": [
      {
        "name": "direction",
        "description": "排列方向",
        "type": "'horizontal' | 'vertical'",
        "default": "'horizontal'"
      },
      {
        "name": "size",
        "description": "间距，数字按 px 处理；数组形式为 [主轴, 交叉轴]",
        "type": "number | string | (number | string)[]",
        "default": "12"
      },
      {
        "name": "align",
        "description": "交叉轴对齐",
        "type": "'start' | 'end' | 'center' | 'baseline'",
        "default": "'center'"
      },
      {
        "name": "justify",
        "description": "主轴对齐",
        "type": "'start' | 'end' | 'center' | 'space-between' | 'space-around'"
      },
      {
        "name": "wrap",
        "description": "是否允许换行（窄屏下建议开启，避免横向溢出）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "fill",
        "description": "撑满父级宽度",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeSplitter": {
    "attributes": [
      {
        "name": "layout",
        "description": "分页布局",
        "type": "JeSplitterLayout",
        "default": "'horizontal'"
      },
      {
        "name": "modelValue",
        "description": "各面板尺寸（百分比），配合 v-model 使用",
        "type": "number[]"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: number[]) => void"
      },
      {
        "name": "resize",
        "description": "尺寸变化时触发",
        "type": "(index: number, sizes: number[]) => void"
      },
      {
        "name": "resizeStart",
        "description": "开始拖拽分隔条时触发",
        "type": "() => void"
      },
      {
        "name": "resizeEnd",
        "description": "结束拖拽分隔条时触发",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeSplitterPanel": {
    "attributes": [
      {
        "name": "size",
        "description": "初始尺寸，按百分比处理（30 表示 30%）",
        "type": "number | string"
      },
      {
        "name": "min",
        "description": "最小尺寸（百分比）",
        "type": "number",
        "default": "0"
      },
      {
        "name": "max",
        "description": "最大尺寸（百分比）",
        "type": "number",
        "default": "100"
      },
      {
        "name": "collapsible",
        "description": "允许被拖到 0，从而折叠",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "resizable",
        "description": "是否允许拖动它右侧 / 下方的分割条",
        "type": "boolean",
        "default": "true"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeStatistic": {
    "attributes": [
      {
        "name": "value",
        "description": "数值 / 当前值",
        "type": "number"
      },
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "precision",
        "description": "小数位数",
        "type": "number",
        "default": "0"
      },
      {
        "name": "prefix",
        "description": "前缀文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "suffix",
        "description": "后缀文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "useGroupSeparator",
        "description": "是否使用千分位分隔",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "separator",
        "description": "千分位分隔符",
        "type": "string",
        "default": "','"
      },
      {
        "name": "animation",
        "description": "value 变化时是否滚动到新值",
        "type": "boolean",
        "default": "true"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "title",
        "description": "标题区域"
      },
      {
        "name": "prefix",
        "description": "前缀内容"
      },
      {
        "name": "suffix",
        "description": "后缀内容"
      }
    ],
    "exposes": []
  },
  "JeStepper": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "当前值",
        "type": "number",
        "default": "1"
      },
      {
        "name": "min",
        "description": "允许的最小值",
        "type": "number",
        "default": "1"
      },
      {
        "name": "max",
        "description": "允许的最大值",
        "type": "number",
        "default": "Infinity"
      },
      {
        "name": "step",
        "description": "每次加减的步长",
        "type": "number",
        "default": "1"
      },
      {
        "name": "integer",
        "description": "只允许整数",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "decimalLength",
        "description": "固定小数位数；不传则按 step 推导",
        "type": "number"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disableInput",
        "description": "禁用中间的输入框，只能点按钮",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "inputWidth",
        "description": "输入框宽度",
        "type": "number | string",
        "default": "48"
      },
      {
        "name": "buttonSize",
        "description": "加减按钮的尺寸",
        "type": "number",
        "default": "32"
      },
      {
        "name": "beforeChange",
        "description": "变更前的拦截钩子，返回 false（或 resolve false）则不更新。\n支持异步，便于先弹确认框再决定是否改动。",
        "type": "(next: number, current: number) => boolean | Promise<boolean>"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: number) => void"
      },
      {
        "name": "change",
        "description": "值真正变化后触发",
        "type": "(value: number) => void"
      },
      {
        "name": "overlimit",
        "description": "已到边界再继续加减、或手动输入超限时触发",
        "type": "(type: 'plus' | 'minus') => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeStep": {
    "attributes": [
      {
        "name": "title",
        "description": "标题",
        "type": "string",
        "default": "''"
      },
      {
        "name": "description",
        "description": "描述文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "icon",
        "description": "图标",
        "type": "JeIconName"
      },
      {
        "name": "status",
        "description": "状态",
        "type": "JeStepStatus"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "icon",
        "description": "图标区域"
      },
      {
        "name": "title",
        "description": "标题区域"
      },
      {
        "name": "description",
        "description": "描述内容"
      }
    ],
    "exposes": []
  },
  "JeSteps": {
    "attributes": [
      {
        "name": "active",
        "description": "是否处于激活态",
        "type": "number",
        "default": "0"
      },
      {
        "name": "direction",
        "description": "方向",
        "type": "JeStepsDirection",
        "default": "'horizontal'"
      },
      {
        "name": "alignCenter",
        "description": "内容是否居中",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "simple",
        "description": "是否使用简洁模式",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "space",
        "description": "间距",
        "type": "string | number"
      },
      {
        "name": "finishStatus",
        "description": "完成态的状态名",
        "type": "JeStepStatus",
        "default": "'finish'"
      },
      {
        "name": "processStatus",
        "description": "进行态的状态名",
        "type": "JeStepStatus",
        "default": "'process'"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeSubmitBar": {
    "attributes": [
      {
        "name": "price",
        "description": "合计金额",
        "type": "number"
      },
      {
        "name": "label",
        "description": "金额左侧文字，如「合计：」",
        "type": "string",
        "default": "''"
      },
      {
        "name": "currency",
        "description": "货币符号",
        "type": "string",
        "default": "'¥'"
      },
      {
        "name": "decimalLength",
        "description": "金额保留的小数位数",
        "type": "number",
        "default": "2"
      },
      {
        "name": "tip",
        "description": "上方提示文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "tipIcon",
        "description": "提示文案前的图标",
        "type": "JeIconName"
      },
      {
        "name": "buttonText",
        "description": "提交按钮文案",
        "type": "string",
        "default": "'提交订单'"
      },
      {
        "name": "buttonType",
        "description": "提交按钮的语义类型",
        "type": "JeButtonType",
        "default": "'primary'"
      },
      {
        "name": "loadingText",
        "description": "加载中文案",
        "type": "string",
        "default": "'提交中...'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "loading",
        "description": "是否处于加载中",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "fixed",
        "description": "固定在视口底部",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "placeholder",
        "description": "fixed 时用占位元素撑住原来的高度，避免遮住页面底部内容",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "safeAreaInsetBottom",
        "description": "底部预留安全区",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "border",
        "description": "顶部 1px 分隔线",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "zIndex",
        "description": "fixed 时的层级",
        "type": "number",
        "default": "100"
      }
    ],
    "events": [
      {
        "name": "submit",
        "description": "点击提交按钮（loading / disabled 时不触发）",
        "type": "() => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "tip",
        "description": "提示内容"
      }
    ],
    "exposes": []
  },
  "JeSwipeCell": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "当前展开的一侧，空字符串表示关闭",
        "type": "SwipePosition",
        "default": "''"
      },
      {
        "name": "disabled",
        "description": "禁用滑动",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "leftWidth",
        "description": "左侧操作区宽度，传数字按 px 处理；不传则按内容自适应",
        "type": "number | string"
      },
      {
        "name": "rightWidth",
        "description": "右侧操作区宽度，传数字按 px 处理；不传则按内容自适应",
        "type": "number | string"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: SwipePosition) => void"
      },
      {
        "name": "open",
        "description": "展开某一侧",
        "type": "(position: 'left' | 'right') => void"
      },
      {
        "name": "close",
        "description": "收起某一侧",
        "type": "(position: 'left' | 'right') => void"
      },
      {
        "name": "click",
        "description": "未展开时点击内容区",
        "type": "(event: MouseEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "left",
        "description": "左侧内容"
      },
      {
        "name": "right",
        "description": "右侧内容"
      }
    ],
    "exposes": [
      {
        "name": "open",
        "description": "以编程方式打开浮层"
      },
      {
        "name": "close",
        "description": "以编程方式关闭浮层"
      }
    ]
  },
  "JeSwitch": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "JeSwitchValue",
        "default": "false"
      },
      {
        "name": "activeValue",
        "description": "打开时的值",
        "type": "JeSwitchValue",
        "default": "true"
      },
      {
        "name": "inactiveValue",
        "description": "关闭时的值",
        "type": "JeSwitchValue",
        "default": "false"
      },
      {
        "name": "activeText",
        "description": "打开态文案，显示在右侧",
        "type": "string"
      },
      {
        "name": "inactiveText",
        "description": "关闭态文案，显示在左侧",
        "type": "string"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "loading",
        "description": "是否处于加载中",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: JeSwitchValue) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeTab": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "当前激活项的 name",
        "type": "JeTabName"
      },
      {
        "name": "swipeable",
        "description": "内容区可左右滑动切页",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "animated",
        "description": "切页有位移过渡",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "sticky",
        "description": "头部吸顶",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "offsetTop",
        "description": "吸顶时距容器顶部的距离",
        "type": "number | string",
        "default": "0"
      },
      {
        "name": "duration",
        "description": "切页过渡时长（毫秒）",
        "type": "number",
        "default": "300"
      },
      {
        "name": "swipeThreshold",
        "description": "触发切页的最小横向滑动距离（px）",
        "type": "number",
        "default": "60"
      },
      {
        "name": "lineWidth",
        "description": "激活下划线宽度，数字按 px，字符串支持百分比；缺省取激活项宽度",
        "type": "number | string"
      },
      {
        "name": "lineHeight",
        "description": "激活下划线高度",
        "type": "number | string",
        "default": "3"
      },
      {
        "name": "activeColor",
        "description": "激活态颜色",
        "type": "string",
        "default": "''"
      },
      {
        "name": "inactiveColor",
        "description": "未激活态颜色",
        "type": "string",
        "default": "''"
      },
      {
        "name": "background",
        "description": "头部背景色",
        "type": "string",
        "default": "''"
      },
      {
        "name": "ellipsis",
        "description": "标题放不下时省略并平分宽度",
        "type": "boolean",
        "default": "true"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(name: JeTabName) => void"
      },
      {
        "name": "change",
        "description": "激活项变化",
        "type": "(name: JeTabName, index: number) => void"
      },
      {
        "name": "click",
        "description": "点击标题（含点击已激活项）",
        "type": "(name: JeTabName, index: number) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": [
      {
        "name": "resize",
        "description": "重新计算尺寸"
      }
    ]
  },
  "JeTabItem": {
    "attributes": [
      {
        "name": "title",
        "description": "标题文字",
        "type": "string",
        "default": "''"
      },
      {
        "name": "name",
        "description": "唯一标识，缺省时按注册顺序自动生成",
        "type": "string | number"
      },
      {
        "name": "disabled",
        "description": "禁用后不可点选",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "badge",
        "description": "角标内容",
        "type": "string | number"
      },
      {
        "name": "dot",
        "description": "是否显示小红点",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeTabbar": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "当前选中的子项 name",
        "type": "string | number"
      },
      {
        "name": "fixed",
        "description": "固定到视口底部",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "placeholder",
        "description": "fixed 时是否用占位元素把导航栏的高度补回来",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "safeArea",
        "description": "底部安全区留白（全面屏手势条）",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "border",
        "description": "顶部分隔线",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "zIndex",
        "description": "fixed 时的层级，与 JeNavBar 保持同一量级",
        "type": "number",
        "default": "100"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(name: string | number) => void"
      },
      {
        "name": "change",
        "description": "切换选中项",
        "type": "(name: string | number) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeTabbarItem": {
    "attributes": [
      {
        "name": "name",
        "description": "选中时回传给父级的值，必填",
        "type": "string | number"
      },
      {
        "name": "icon",
        "description": "未选中时的图标",
        "type": "JeIconName"
      },
      {
        "name": "activeIcon",
        "description": "选中时的图标，不传则沿用 icon",
        "type": "JeIconName"
      },
      {
        "name": "text",
        "description": "图标下方的文字",
        "type": "string"
      },
      {
        "name": "badge",
        "description": "角标内容",
        "type": "string | number"
      },
      {
        "name": "dot",
        "description": "只显示小红点",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeTable": {
    "attributes": [
      {
        "name": "data",
        "description": "表格数据",
        "type": "JeTableRow[]"
      },
      {
        "name": "columns",
        "description": "列配置",
        "type": "JeTableColumn[]"
      },
      {
        "name": "border",
        "description": "是否显示纵向边框",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "stripe",
        "description": "是否显示斑马纹",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "size",
        "description": "表格尺寸",
        "type": "'small' | 'default' | 'large'",
        "default": "'default'"
      },
      {
        "name": "layout",
        "description": "显示形态：auto 由屏幕宽度决定（窄屏用卡片、宽屏用表格），table 恒为表格，card 恒为卡片，默认 auto。\n\n卡片模式下每条记录渲染为一个独立区块，区块内按列逐行显示「列名 + 值」，适合窄屏表单式浏览。\n该模式下不渲染表头，因此排序与筛选入口一并隐藏（程序化调用 clearSort / clearFilter 仍有效）；\n固定列、列宽拖拽、合并单元格（spanMethod）、单元格框选（cellSelection）与虚拟滚动（virtual）在该模式下自动关闭。\n勾选列、序号列与展开列不占「列名 + 值」的行，改为显示在区块头部；树形数据仍可用箭头展开 / 收起子行。\n分组（groupBy）与合计行（showSummary）在卡片模式下不生效。",
        "type": "'auto' | 'table' | 'card'",
        "default": "'auto'"
      },
      {
        "name": "cardLabelPosition",
        "description": "卡片模式下列名的位置：left 列名在左、值在右（默认），top 列名在上、值在下。仅在卡片形态下生效。",
        "type": "'left' | 'top'",
        "default": "'left'"
      },
      {
        "name": "height",
        "description": "固定高度：超出后表头固定、表体纵向滚动",
        "type": "string | number"
      },
      {
        "name": "maxHeight",
        "description": "最大高度：数据少时按内容撑开，超出后才出现纵向滚动",
        "type": "string | number"
      },
      {
        "name": "emptyText",
        "description": "数据为空时的提示文案",
        "type": "string",
        "default": "'暂无数据'"
      },
      {
        "name": "rowKey",
        "description": "行唯一键的字段名（支持 `user.info.id` 这种多级路径），或自定义取值函数",
        "type": "string | ((row: JeTableRow) => string | number)",
        "default": "'id'"
      },
      {
        "name": "showHeader",
        "description": "是否显示表头",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "highlightCurrentRow",
        "description": "点击行时高亮该行，并把选中行通过 current-change 抛出",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "currentRowKey",
        "description": "由外部指定当前高亮行的 key；传入后当前行状态完全受控",
        "type": "string | number"
      },
      {
        "name": "rowClassName",
        "description": "行类名，字符串表示所有行共用，函数按行返回",
        "type": "string | ((payload: { row: JeTableRow; rowIndex: number }) => string)",
        "default": "''"
      },
      {
        "name": "rowStyle",
        "description": "行内样式，字符串表示所有行共用，函数按行返回",
        "type": "JeTableRowStyle"
      },
      {
        "name": "cellClassName",
        "description": "单元格类名，字符串表示所有单元格共用，函数按行列返回",
        "type": "| string\n    | ((payload: {\n        row: JeTableRow\n        column: JeTableColumn\n        rowIndex: number\n        columnIndex: number\n      }) => string)",
        "default": "''"
      },
      {
        "name": "cellStyle",
        "description": "单元格行内样式；列上的 cellStyle 会覆盖此处返回的同名属性",
        "type": "JeTableCellStyle"
      },
      {
        "name": "spanMethod",
        "description": "合并单元格；返回 0 的单元格会被相邻单元格吸收。\n\n口径：rowIndex 是「当前渲染行」的下标（已应用列筛选、本地排序与树形展平），columnIndex 是「叶子列」下标（分组列不算）。\n列筛选 / 本地排序 / 树形展开生效时 rowIndex 与 data 下标不再一致，请用回调传入的 row / column 做判定，不要回查 data[rowIndex]。",
        "type": "JeTableSpanMethod"
      },
      {
        "name": "defaultExpandAll",
        "description": "默认展开所有展开行（表格内有 type: 'expand' 列时生效）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "expandRowKeys",
        "description": "受控的展开行 key 列表，需配合 rowKey 使用",
        "type": "Array<string | number>"
      },
      {
        "name": "showSummary",
        "description": "是否在表尾显示合计行",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "summaryMethod",
        "description": "合计行的取值函数：返回与 columns 等长的数组，逐列决定合计内容。\n\n入参 data 是「已应用排序与筛选后」的行（树形数据为展平后的可见行），所以合计值与屏幕上看到的行一致；\ncolumns 是「叶子列」（含 selection / index / expand，不含分组列），返回数组下标与之一一对应。",
        "type": "JeTableSummaryMethod"
      },
      {
        "name": "sumText",
        "description": "未提供 summaryMethod 时，合计行第一列的文案",
        "type": "string",
        "default": "'合计'"
      },
      {
        "name": "treeProps",
        "description": "树形数据配置：children 指明子行数组挂在行数据的哪个字段上，hasChildren 指明「是否还有子节点」的标记字段。\n默认 { children: 'children', hasChildren: 'hasChildren' }；树形数据必须配 rowKey。",
        "type": "{ children?: string; hasChildren?: string }",
        "default": "() => ({ children: 'children', hasChildren: 'hasChildren' })"
      },
      {
        "name": "lazy",
        "description": "懒加载树：子节点不在初始数据里，展开时调用 load 拉取，同一条只拉一次",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "load",
        "description": "懒加载回调：把子行数组交给 resolve 即可，组件会把它写回该行的 children 字段",
        "type": "(row: JeTableRow, resolve: (children: JeTableRow[]) => void) => void"
      },
      {
        "name": "cellSelection",
        "description": "开启单元格框选：在表体上按住拖拽画出矩形选区，按住行内的按钮 / 输入框不会触发",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "virtual",
        "description": "虚拟滚动：只渲染可视区域内的行，滚出视口的行用占位行撑高。\n需要同时给出 height / maxHeight（否则没有滚动容器，自动退回普通渲染），且每行必须等高。",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "itemHeight",
        "description": "虚拟滚动的行高（px），默认 48；行内容换行会破坏等高假设，建议配合 showOverflowTooltip 使用",
        "type": "number",
        "default": "48"
      },
      {
        "name": "overscan",
        "description": "虚拟滚动在可视区上下额外渲染的行数，默认 4，用于减轻快速滚动时的白屏",
        "type": "number",
        "default": "4"
      },
      {
        "name": "rowDraggable",
        "description": "是否允许按住行拖拽调整顺序。拖拽结束只抛 row-drag-end（回传重排后的行数组），data 由调用方写回（受控）。\n生效条件：非树形、无本地排序、无生效中的筛选、未分组、未开 cellSelection（框选会抢走 pointerdown）。虚拟滚动下同样可用。",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "groupBy",
        "description": "按字段（或函数返回的值）把行分组：同值的行聚到一起，组顺序按该值首次出现。\n分组作用于「已筛选 + 已本地排序」后的行，但行的渲染下标不变，所以 spanMethod / summaryMethod 的口径不受影响。\n与树形数据（treeProps / lazy）不共用：树形数据下自动忽略分组。启用后虚拟滚动自动关闭。",
        "type": "JeTableGroupBy"
      },
      {
        "name": "groupSummary",
        "description": "是否在每组末尾插入一行组小计（配合 groupBy 使用）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "groupSummaryMethod",
        "description": "组小计的取值函数：返回与叶子列等长的数组，逐列决定组小计内容。\n入参 rows 是该组内的行（已筛选 / 已排序），columns 是叶子列（含 selection / index / expand，不含分组列）。",
        "type": "JeTableGroupSummaryMethod"
      },
      {
        "name": "groupSummaryText",
        "description": "未提供 groupSummaryMethod 时，组小计行第一数据列的文案，默认「小计」",
        "type": "string",
        "default": "'小计'"
      },
      {
        "name": "groupExpandable",
        "description": "组头是否可点击折叠；折叠状态由组件内部维护，变化时抛 group-expand-change",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "defaultGroupExpanded",
        "description": "groupExpandable 生效时初始是否展开全部组，默认 true（只在初始化时铺一次）",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "row-click",
        "description": "行被点击时触发，回传行数据与行下标",
        "type": "(row: JeTableRow, index: number) => void"
      },
      {
        "name": "selection-change",
        "description": "勾选变化时触发，回传当前全部选中行；调用暴露的 toggleRowSelection 等 API 不会触发",
        "type": "(rows: JeTableRow[]) => void"
      },
      {
        "name": "sort-change",
        "description": "排序状态变化时触发，order 为 null 表示取消排序；sortable: 'custom' 时只发事件不本地排序",
        "type": "(payload: { prop: string; order: JeTableSortOrder }) => void"
      },
      {
        "name": "filter-change",
        "description": "列筛选确认或清除时触发（浮层点「重置 / 确认」、调用 clearFilter）；filters 为空数组表示该列已清除筛选",
        "type": "(payload: { prop: string; values: Array<string | number | boolean> }) => void"
      },
      {
        "name": "column-resize",
        "description": "拖拽列宽结束时触发，回传该列最新宽度（px）",
        "type": "(payload: { prop: string; width: number }) => void"
      },
      {
        "name": "current-change",
        "description": "当前高亮行变化时触发，仅在 highlightCurrentRow 生效；切换时会同时回传旧值",
        "type": "(currentRow: JeTableRow | null, oldCurrentRow: JeTableRow | null) => void"
      },
      {
        "name": "expand-change",
        "description": "展开行展开 / 收起时触发，expanded 为最新状态",
        "type": "(row: JeTableRow, expanded: boolean) => void"
      },
      {
        "name": "tree-expand-change",
        "description": "树形子行展开 / 收起时触发（与展开行的 expand-change 是两回事）",
        "type": "(row: JeTableRow, expanded: boolean) => void"
      },
      {
        "name": "cell-selection-change",
        "description": "单元格框选范围落定时触发（拖拽松手或单击），cells 按先行后列的顺序给出",
        "type": "(payload: { cells: JeTableCellRef[] }) => void"
      },
      {
        "name": "row-drag-end",
        "description": "行拖拽排序结束时触发（row-draggable 生效时）；rows 是按新顺序排好的完整行数组，data 由调用方写回",
        "type": "(payload: { from: number; to: number; rows: JeTableRow[]; row: JeTableRow }) => void"
      },
      {
        "name": "group-expand-change",
        "description": "分组展开 / 收起时触发（group-expandable 生效时），key 是分组的取值",
        "type": "(payload: { key: string | number; expanded: boolean }) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "表头插槽：无对应插槽时退回纯文本；列上写了 prop 时插槽名为 header-<prop>",
        "type": "{ row, index, expanded }"
      },
      {
        "name": "group-header",
        "description": "分组表头内容，作用域 { groupKey, rows, expanded }；不写则显示分组取值",
        "type": "{ rows, expanded }"
      },
      {
        "name": "group-summary",
        "description": "组小计内容，作用域 { column, columnIndex, groupKey, data }；不写则用 groupSummaryMethod 的纯文本",
        "type": "{ column, data }"
      },
      {
        "name": "summary",
        "description": "合计行单元格内容，作用域 { column, columnIndex, data }；不写则用 summaryMethod 算出的纯文本",
        "type": "{ column, data }"
      }
    ],
    "exposes": [
      {
        "name": "clearSelection",
        "description": "清空全部选中项（不动 data）"
      },
      {
        "name": "getSelectionRows",
        "description": "返回当前选中的行数据数组"
      },
      {
        "name": "toggleRowSelection",
        "description": "选中 / 取消选中某一行，第二个参数省略时取反"
      },
      {
        "name": "toggleAllSelection",
        "description": "全选 / 全不选，受列的 selectable 限制"
      },
      {
        "name": "toggleRowExpansion",
        "description": "展开 / 收起某个展开行，第二个参数省略时取反"
      },
      {
        "name": "setCurrentRow",
        "description": "高亮指定行，传空则清除高亮"
      },
      {
        "name": "clearSort",
        "description": "清空排序状态，并补发一次 sort-change"
      },
      {
        "name": "clearFilter",
        "description": "清空列筛选，不传列 key 表示清空所有列；每清一列补发一次 filter-change"
      },
      {
        "name": "getSelectedCellData",
        "description": "返回当前框选范围内的单元格数据（先行后列），没有选区时是空数组"
      },
      {
        "name": "clearCellSelection",
        "description": "清空单元格框选"
      }
    ]
  },
  "JeTabPane": {
    "attributes": [
      {
        "name": "name",
        "description": "名称",
        "type": "JeTabName"
      },
      {
        "name": "label",
        "description": "标签文案",
        "type": "string",
        "default": "''"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "closable",
        "description": "是否可关闭",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeTabs": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "JeTabName"
      },
      {
        "name": "type",
        "description": "类型",
        "type": "JeTabsType",
        "default": "'line'"
      },
      {
        "name": "tabPosition",
        "description": "标签页的位置",
        "type": "JeTabsPosition",
        "default": "'top'"
      },
      {
        "name": "stretch",
        "description": "tab 等分撑满",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "closable",
        "description": "所有 tab 均可关闭",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: JeTabName) => void"
      },
      {
        "name": "tab-click",
        "description": "点击标签页时触发",
        "type": "(name: JeTabName) => void"
      },
      {
        "name": "tab-change",
        "description": "标签页切换时触发",
        "type": "(name: JeTabName) => void"
      },
      {
        "name": "tab-remove",
        "description": "关闭标签页时触发",
        "type": "(name: JeTabName) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeTag": {
    "attributes": [
      {
        "name": "type",
        "description": "类型",
        "type": "JeTagType",
        "default": "'primary'"
      },
      {
        "name": "size",
        "description": "尺寸",
        "type": "JeTagSize",
        "default": "'default'"
      },
      {
        "name": "effect",
        "description": "主题风格（dark / light）",
        "type": "JeTagEffect",
        "default": "'light'"
      },
      {
        "name": "closable",
        "description": "是否可关闭",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "round",
        "description": "是否使用圆形样式",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [
      {
        "name": "close",
        "description": "关闭时触发",
        "type": "(event: MouseEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeText": {
    "attributes": [
      {
        "name": "type",
        "description": "类型",
        "type": "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'",
        "default": "'default'"
      },
      {
        "name": "size",
        "description": "尺寸",
        "type": "'small' | 'default' | 'large'",
        "default": "'default'"
      },
      {
        "name": "tag",
        "description": "渲染标签，默认 span",
        "type": "string",
        "default": "'span'"
      },
      {
        "name": "bold",
        "description": "是否加粗",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "truncated",
        "description": "单行省略",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeTimePicker": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "形如 \"HH:mm\"，未选全时为 null",
        "type": "string | null",
        "default": "null"
      },
      {
        "name": "hourStep",
        "description": "小时步长，默认 1（0-23）",
        "type": "number",
        "default": "1"
      },
      {
        "name": "minuteStep",
        "description": "分钟步长，默认 5（0-55）",
        "type": "number",
        "default": "5"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "'请选择时间'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: string) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeTimeSelect": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "JeTimeSelectValue",
        "default": "''"
      },
      {
        "name": "start",
        "description": "起始时间，形如 \"08:00\"",
        "type": "string",
        "default": "'08:00'"
      },
      {
        "name": "end",
        "description": "结束时间，形如 \"20:00\"",
        "type": "string",
        "default": "'20:00'"
      },
      {
        "name": "step",
        "description": "步长，形如 \"00:30\"",
        "type": "string",
        "default": "'00:30'"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "'请选择时间'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "clearable",
        "description": "是否可一键清空",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "minTime",
        "description": "可选下限（含）",
        "type": "string"
      },
      {
        "name": "maxTime",
        "description": "可选上限（含）",
        "type": "string"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: JeTimeSelectValue) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(value: JeTimeSelectValue) => void"
      },
      {
        "name": "clear",
        "description": "点击清空按钮时触发",
        "type": "() => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeTimeline": {
    "attributes": [
      {
        "name": "reverse",
        "description": "是否反向排列",
        "type": "boolean",
        "default": "false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeTimelineItem": {
    "attributes": [
      {
        "name": "timestamp",
        "description": "倒计时的目标时间戳",
        "type": "string",
        "default": "''"
      },
      {
        "name": "type",
        "description": "类型",
        "type": "JeTimelineType",
        "default": "'primary'"
      },
      {
        "name": "hollow",
        "description": "是否使用空心样式",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "icon",
        "description": "图标",
        "type": "JeIconName"
      },
      {
        "name": "size",
        "description": "尺寸",
        "type": "JeTimelineSize",
        "default": "'normal'"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "timestamp",
        "description": "时间戳内容"
      },
      {
        "name": "dot",
        "description": "圆点内容"
      }
    ],
    "exposes": []
  },
  "JeToast": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "是否显示，配 v-model 使用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "duration",
        "description": "自动消失的延迟（毫秒）",
        "type": "number",
        "default": "1800"
      },
      {
        "name": "message",
        "description": "不传插槽时的文本",
        "type": "string",
        "default": "''"
      },
      {
        "name": "variant",
        "description": "皮肤。default / success / warning / danger / info 与 JeButton 的语义色一一对应，\nprimary 是品牌渐变。",
        "type": "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'",
        "default": "'primary'"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  },
  "JeTooltip": {
    "attributes": [
      {
        "name": "content",
        "description": "文本内容，也可用 #content 插槽自定义",
        "type": "string",
        "default": "''"
      },
      {
        "name": "placement",
        "description": "浮层出现的位置",
        "type": "JeTooltipPlacement",
        "default": "'top'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "offset",
        "description": "与触发元素的间距",
        "type": "number",
        "default": "10"
      },
      {
        "name": "openDelay",
        "description": "移入后延迟展开（毫秒）",
        "type": "number",
        "default": "120"
      },
      {
        "name": "closeDelay",
        "description": "移出后延迟收起（毫秒）",
        "type": "number",
        "default": "80"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      },
      {
        "name": "content",
        "description": "内容区域"
      }
    ],
    "exposes": []
  },
  "JeTour": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "steps",
        "description": "图标总数",
        "type": "JeTourStep[]"
      },
      {
        "name": "current",
        "description": "当前步骤 / 当前项",
        "type": "number",
        "default": "0"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: boolean) => void"
      },
      {
        "name": "update:current",
        "description": "v-model 的 current 更新时触发",
        "type": "(value: number) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(current: number) => void"
      },
      {
        "name": "finish",
        "description": "倒计时结束时触发",
        "type": "() => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeTransfer": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "右侧列表的 key 集合",
        "type": "(string | number)[]",
        "default": "() => []"
      },
      {
        "name": "data",
        "description": "数据源",
        "type": "JeTransferItem[]"
      },
      {
        "name": "titles",
        "description": "左右两栏标题",
        "type": "[string, string]",
        "default": "() => ['列表 1', '列表 2'] as [string, string]"
      },
      {
        "name": "filterable",
        "description": "是否可搜索",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "'请输入搜索内容'"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: (string | number)[]) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(value: (string | number)[], direction: JeTransferDirection, movedKeys: (string | number)[]) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeTree": {
    "attributes": [
      {
        "name": "data",
        "description": "数据源",
        "type": "JeTreeNode[]"
      },
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "Array<string | number>",
        "default": "() => []"
      },
      {
        "name": "multiple",
        "description": "是否多选",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "checkable",
        "description": "是否显示复选框",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "checkStrictly",
        "description": "父子节点是否不联动",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "accordion",
        "description": "是否手风琴模式（同时只展开一个）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "defaultExpandAll",
        "description": "是否默认展开全部节点",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "defaultExpandedKeys",
        "description": "默认展开的节点",
        "type": "Array<string | number>"
      },
      {
        "name": "expandOnClickNode",
        "description": "点击节点是否展开",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "emptyText",
        "description": "数据为空时的文案",
        "type": "string",
        "default": "'暂无数据'"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: Array<string | number>) => void"
      },
      {
        "name": "node-click",
        "description": "点击节点时触发",
        "type": "(node: JeTreeNode) => void"
      },
      {
        "name": "check-change",
        "description": "勾选状态变化时触发",
        "type": "(node: JeTreeNode, checked: boolean) => void"
      },
      {
        "name": "node-expand",
        "description": "节点展开时触发",
        "type": "(keys: Array<string | number>) => void"
      },
      {
        "name": "node-collapse",
        "description": "节点收起时触发",
        "type": "(keys: Array<string | number>) => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeTreeSelect": {
    "attributes": [
      {
        "name": "modelValue",
        "description": "绑定值",
        "type": "JeTreeSelectValue",
        "default": "null"
      },
      {
        "name": "data",
        "description": "数据源",
        "type": "JeTreeNode[]"
      },
      {
        "name": "placeholder",
        "description": "占位提示",
        "type": "string",
        "default": "'请选择'"
      },
      {
        "name": "disabled",
        "description": "是否禁用",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "clearable",
        "description": "是否可一键清空",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "accordion",
        "description": "是否手风琴模式（同时只展开一个）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:modelValue",
        "description": "v-model 的 modelValue 更新时触发",
        "type": "(value: JeTreeSelectValue) => void"
      },
      {
        "name": "change",
        "description": "值变更时触发",
        "type": "(value: JeTreeSelectValue) => void"
      },
      {
        "name": "clear",
        "description": "点击清空按钮时触发",
        "type": "() => void"
      }
    ],
    "slots": [],
    "exposes": []
  },
  "JeUpload": {
    "attributes": [
      {
        "name": "fileList",
        "description": "文件列表，配合 v-model:file-list 使用；未绑定时组件内部自己维护",
        "type": "JeUploadFile[]",
        "default": "() => []"
      },
      {
        "name": "accept",
        "description": "原生 accept，例如 image 通配或 .pdf；留空表示不限类型",
        "type": "string",
        "default": "''"
      },
      {
        "name": "multiple",
        "description": "是否允许一次选择多个文件",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "drag",
        "description": "开启拖拽上传区域，窄屏仍可点击选择",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "limit",
        "description": "最多允许的文件数量",
        "type": "number"
      },
      {
        "name": "disabled",
        "description": "是否禁用选择与删除",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "listType",
        "description": "列表展现形式：text 文本 / picture 图文 / picture-card 照片墙",
        "type": "JeUploadListType",
        "default": "'text'"
      },
      {
        "name": "autoUpload",
        "description": "仅做前端状态模拟，不会发起真实请求",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "tip",
        "description": "列表下方的提示文案，等价于 tip 插槽的默认内容",
        "type": "string",
        "default": "''"
      },
      {
        "name": "action",
        "description": "上传地址；默认的 XMLHttpRequest 实现会 POST 到这里",
        "type": "string",
        "default": "'#'"
      },
      {
        "name": "method",
        "description": "请求方法",
        "type": "string",
        "default": "'post'"
      },
      {
        "name": "name",
        "description": "上传文件的字段名，对应 multipart 里的 name",
        "type": "string",
        "default": "'file'"
      },
      {
        "name": "headers",
        "description": "请求头，逐项用 setRequestHeader 写入",
        "type": "Record<string, string>"
      },
      {
        "name": "withCredentials",
        "description": "是否携带 Cookie（跨域下还要服务端配合 Access-Control-Allow-Credentials）",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "data",
        "description": "附加表单字段：静态对象、Promise，或按文件动态计算的函数",
        "type": "JeUploadFormData"
      },
      {
        "name": "httpRequest",
        "description": "接替默认 XHR 实现；传了它 action / method 等参数只作为入参透传，不再由组件发起请求",
        "type": "JeUploadRequestHandler"
      },
      {
        "name": "beforeUpload",
        "description": "选用文件前的钩子：返回 false 或 reject 会中止该文件，返回 File / Blob 则替换原文件",
        "type": "JeUploadBeforeUpload"
      },
      {
        "name": "beforeRemove",
        "description": "移除前的钩子：返回 false 或 reject 会阻止移除",
        "type": "JeUploadBeforeRemove"
      },
      {
        "name": "showFileList",
        "description": "是否展示文件列表",
        "type": "boolean",
        "default": "true"
      },
      {
        "name": "showPreview",
        "description": "点击文件时内置全屏预览；关闭后仍会抛出 preview 事件，交由使用方自行处理",
        "type": "boolean",
        "default": "false"
      },
      {
        "name": "listClass",
        "description": "追加到列表上的类名，便于外部微调样式",
        "type": "string",
        "default": "''"
      },
      {
        "name": "onChange",
        "description": "改变文件（新增 / 成功 / 失败）时调用，与 change 事件同源",
        "type": "JeUploadOnChange"
      },
      {
        "name": "onRemove",
        "description": "移除文件后调用，与 remove 事件同源",
        "type": "JeUploadOnRemove"
      },
      {
        "name": "onPreview",
        "description": "点击文件时调用，与 preview 事件同源",
        "type": "JeUploadOnPreview"
      },
      {
        "name": "onProgress",
        "description": "上传进度变化时调用，与 progress 事件同源",
        "type": "JeUploadOnProgress"
      },
      {
        "name": "onSuccess",
        "description": "上传成功时调用，与 success 事件同源",
        "type": "JeUploadOnSuccess"
      },
      {
        "name": "onError",
        "description": "上传失败时调用，与 error 事件同源",
        "type": "JeUploadOnError"
      },
      {
        "name": "onExceed",
        "description": "超出 limit 时调用，与 exceed 事件同源",
        "type": "JeUploadOnExceed"
      },
      {
        "name": "teleportTo",
        "description": "浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退",
        "type": "JeTeleportTarget | false"
      }
    ],
    "events": [
      {
        "name": "update:fileList",
        "description": "v-model:file-list 的更新，列表变化时触发",
        "type": "(files: JeUploadFile[]) => void"
      },
      {
        "name": "change",
        "description": "选中文件、上传成功、上传失败或移除后触发",
        "type": "(file: JeUploadFile, files: JeUploadFile[]) => void"
      },
      {
        "name": "remove",
        "description": "移除文件后触发",
        "type": "(file: JeUploadFile) => void"
      },
      {
        "name": "exceed",
        "description": "选择数量超过 limit 时触发，参数是本次被忽略的原始文件",
        "type": "(files: File[]) => void"
      },
      {
        "name": "preview",
        "description": "点击文件名或缩略图时触发",
        "type": "(file: JeUploadFile) => void"
      },
      {
        "name": "progress",
        "description": "上传进度变化（原生 XHR 与模拟上传都会触发）",
        "type": "(event: JeUploadProgressEvent, file: JeUploadFile) => void"
      },
      {
        "name": "success",
        "description": "上传成功，第二个参数是服务端响应",
        "type": "(response: unknown, file: JeUploadFile) => void"
      },
      {
        "name": "error",
        "description": "上传失败",
        "type": "(error: Error, file: JeUploadFile) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "默认插槽（与触发按钮互斥）：需要完全自定义上传入口时整个交出去"
      },
      {
        "name": "trigger",
        "description": "触发按钮内容，替换默认的图标 + 文案"
      },
      {
        "name": "tip",
        "description": "提示区域，替换默认的 tip 文案"
      },
      {
        "name": "file",
        "description": "自定义列表项内容，file 为当前文件、index 为序号",
        "type": "{ file, index }"
      }
    ],
    "exposes": [
      {
        "name": "abort",
        "description": "取消上传：不传文件则取消全部在途请求"
      },
      {
        "name": "submit",
        "description": "手动上传列表中待上传（ready）的文件"
      },
      {
        "name": "clearFiles",
        "description": "清空文件列表：传状态数组时只清掉对应状态"
      },
      {
        "name": "handleRemove",
        "description": "移除单个文件，会走一遍 beforeRemove"
      },
      {
        "name": "handleStart",
        "description": "以编程方式选中文件，等价于用户点选"
      },
      {
        "name": "files",
        "description": "内部文件列表（只读快照）"
      }
    ]
  },
  "JeWatermark": {
    "attributes": [
      {
        "name": "content",
        "description": "内容",
        "type": "JeWatermarkContent",
        "default": "() => ['Jelly UI']"
      },
      {
        "name": "image",
        "description": "图片地址",
        "type": "string",
        "default": "''"
      },
      {
        "name": "width",
        "description": "宽度",
        "type": "number",
        "default": "120"
      },
      {
        "name": "height",
        "description": "高度",
        "type": "number",
        "default": "64"
      },
      {
        "name": "rotate",
        "description": "旋转角度",
        "type": "number",
        "default": "-22"
      },
      {
        "name": "gapX",
        "description": "横向间距",
        "type": "number",
        "default": "100"
      },
      {
        "name": "gapY",
        "description": "纵向间距",
        "type": "number",
        "default": "100"
      },
      {
        "name": "fontSize",
        "description": "字号",
        "type": "number",
        "default": "14"
      },
      {
        "name": "color",
        "description": "水印颜色，留空则跟随当前正文色（明暗主题下都可见）",
        "type": "string",
        "default": "''"
      },
      {
        "name": "zIndex",
        "description": "层级",
        "type": "number",
        "default": "9"
      }
    ],
    "events": [],
    "slots": [
      {
        "name": "default",
        "description": "默认内容"
      }
    ],
    "exposes": []
  }
}

/** 路由 path → 该页要展示 API 的组件名（顺序即展示顺序） */
export const pageApi: Record<string, string[]> = {
  "/": [],
  "/install": [],
  "/space": [
    "JeSpace"
  ],
  "/divider": [
    "JeDivider"
  ],
  "/card": [
    "JeCard"
  ],
  "/layout": [
    "JeRow",
    "JeCol"
  ],
  "/container": [
    "JeContainer",
    "JeHeader",
    "JeAside",
    "JeMain",
    "JeFooter"
  ],
  "/splitter": [
    "JeSplitter",
    "JeSplitterPanel"
  ],
  "/scrollbar": [
    "JeScrollbar"
  ],
  "/icon": [
    "JeIcon"
  ],
  "/text": [
    "JeText"
  ],
  "/link": [
    "JeLink"
  ],
  "/button": [
    "JeButton",
    "JeButtonGroup"
  ],
  "/tag": [
    "JeTag"
  ],
  "/badge": [
    "JeBadge"
  ],
  "/avatar": [
    "JeAvatar"
  ],
  "/watermark": [
    "JeWatermark"
  ],
  "/input": [
    "JeInput"
  ],
  "/input-number": [
    "JeInputNumber"
  ],
  "/select": [
    "JeSelect"
  ],
  "/autocomplete": [
    "JeAutoComplete"
  ],
  "/radio": [
    "JeRadioGroup"
  ],
  "/checkbox": [
    "JeCheckboxGroup"
  ],
  "/switch": [
    "JeSwitch"
  ],
  "/slider": [
    "JeSlider"
  ],
  "/rate": [
    "JeRate"
  ],
  "/segmented": [
    "JeSegmented"
  ],
  "/color-picker": [
    "JeColorPicker"
  ],
  "/time-picker": [
    "JeTimePicker"
  ],
  "/time-select": [
    "JeTimeSelect"
  ],
  "/date-picker": [
    "JeDatePicker"
  ],
  "/cascader": [
    "JeCascader"
  ],
  "/tree-select": [
    "JeTreeSelect"
  ],
  "/transfer": [
    "JeTransfer"
  ],
  "/upload": [
    "JeUpload"
  ],
  "/form": [
    "JeForm",
    "JeFormItem"
  ],
  "/descriptions": [
    "JeDescriptions",
    "JeDescriptionsItem"
  ],
  "/statistic": [
    "JeStatistic"
  ],
  "/timeline": [
    "JeTimeline",
    "JeTimelineItem"
  ],
  "/collapse": [
    "JeCollapse",
    "JeCollapseItem"
  ],
  "/image": [
    "JeImage"
  ],
  "/carousel": [
    "JeCarousel",
    "JeCarouselItem"
  ],
  "/table": [
    "JeTable"
  ],
  "/tree": [
    "JeTree"
  ],
  "/calendar": [
    "JeCalendar"
  ],
  "/qrcode": [
    "JeQrcode"
  ],
  "/poster": [
    "JePoster"
  ],
  "/org-chart": [
    "JeOrgChart"
  ],
  "/tabs": [
    "JeTabs",
    "JeTabPane"
  ],
  "/breadcrumb": [
    "JeBreadcrumb",
    "JeBreadcrumbItem"
  ],
  "/steps": [
    "JeSteps",
    "JeStep"
  ],
  "/dropdown": [
    "JeDropdown",
    "JeDropdownItem"
  ],
  "/menu": [
    "JeMenu",
    "JeMenuItem",
    "JeSubMenu"
  ],
  "/pagination": [
    "JePagination"
  ],
  "/backtop": [
    "JeBacktop"
  ],
  "/anchor": [
    "JeAnchor",
    "JeAnchorLink"
  ],
  "/affix": [
    "JeAffix"
  ],
  "/toast": [
    "JeToast"
  ],
  "/alert": [
    "JeAlert"
  ],
  "/message": [
    "JeMessage"
  ],
  "/notification": [
    "JeNotification"
  ],
  "/loading": [
    "JeLoading"
  ],
  "/progress": [
    "JeProgress"
  ],
  "/skeleton": [
    "JeSkeleton",
    "JeSkeletonItem"
  ],
  "/empty": [
    "JeEmpty"
  ],
  "/result": [
    "JeResult"
  ],
  "/tooltip": [
    "JeTooltip"
  ],
  "/popover": [
    "JePopover"
  ],
  "/popconfirm": [
    "JePopconfirm"
  ],
  "/drawer": [
    "JeDrawer"
  ],
  "/dialog": [
    "JeDialog"
  ],
  "/tour": [
    "JeTour"
  ],
  "/cell": [
    "JeCell",
    "JeCellGroup"
  ],
  "/grid": [
    "JeGrid",
    "JeGridItem"
  ],
  "/count-down": [
    "JeCountDown"
  ],
  "/circle": [
    "JeCircle"
  ],
  "/lazyload": [
    "JeLazyload"
  ],
  "/highlight": [
    "JeHighlight"
  ],
  "/picker": [
    "JePicker"
  ],
  "/search": [
    "JeSearch"
  ],
  "/stepper": [
    "JeStepper"
  ],
  "/number-keyboard": [
    "JeNumberKeyboard"
  ],
  "/password-input": [
    "JePasswordInput"
  ],
  "/area": [
    "JeArea"
  ],
  "/signature": [
    "JeSignature"
  ],
  "/nav-bar": [
    "JeNavBar"
  ],
  "/tabbar": [
    "JeTabbar",
    "JeTabbarItem"
  ],
  "/tab": [
    "JeTab",
    "JeTabItem"
  ],
  "/index-bar": [
    "JeIndexBar",
    "JeIndexAnchor"
  ],
  "/sidebar": [
    "JeSidebar",
    "JeSidebarItem"
  ],
  "/dropdown-menu": [
    "JeDropdownMenu",
    "JeDropdownMenuItem"
  ],
  "/action-bar": [
    "JeActionBar",
    "JeActionBarButton",
    "JeActionBarIcon"
  ],
  "/popup": [
    "JePopup"
  ],
  "/action-sheet": [
    "JeActionSheet"
  ],
  "/share-sheet": [
    "JeShareSheet"
  ],
  "/floating-panel": [
    "JeFloatingPanel"
  ],
  "/image-preview": [
    "JeImagePreview"
  ],
  "/notice-bar": [
    "JeNoticeBar"
  ],
  "/pull-refresh": [
    "JePullRefresh"
  ],
  "/infinite-scroll": [
    "JeInfiniteScroll"
  ],
  "/swipe-cell": [
    "JeSwipeCell"
  ],
  "/floating-bubble": [
    "JeFloatingBubble"
  ],
  "/coupon": [
    "JeCoupon"
  ],
  "/submit-bar": [
    "JeSubmitBar"
  ],
  "/address-list": [
    "JeAddressList"
  ],
  "/config-provider": [
    "JeConfigProvider"
  ],
  "/theme": [],
  "/locale": [
    "JeLocale"
  ]
}

/** 路由 path → 页面源文件名，示例代码框据此读取源码 */
export const pageSource: Record<string, string> = {
  "/": "HomePage.vue",
  "/install": "InstallPage.vue",
  "/space": "SpacePage.vue",
  "/divider": "DividerPage.vue",
  "/card": "CardPage.vue",
  "/layout": "LayoutPage.vue",
  "/container": "ContainerPage.vue",
  "/splitter": "SplitterPage.vue",
  "/scrollbar": "ScrollbarPage.vue",
  "/icon": "IconPage.vue",
  "/text": "TextPage.vue",
  "/link": "LinkPage.vue",
  "/button": "ButtonPage.vue",
  "/tag": "TagPage.vue",
  "/badge": "BadgePage.vue",
  "/avatar": "AvatarPage.vue",
  "/watermark": "WatermarkPage.vue",
  "/input": "InputPage.vue",
  "/input-number": "InputNumberPage.vue",
  "/select": "SelectPage.vue",
  "/autocomplete": "AutoCompletePage.vue",
  "/radio": "RadioPage.vue",
  "/checkbox": "CheckboxPage.vue",
  "/switch": "SwitchPage.vue",
  "/slider": "SliderPage.vue",
  "/rate": "RatePage.vue",
  "/segmented": "SegmentedPage.vue",
  "/color-picker": "ColorPickerPage.vue",
  "/time-picker": "TimePickerPage.vue",
  "/time-select": "TimeSelectPage.vue",
  "/date-picker": "DatePickerPage.vue",
  "/cascader": "CascaderPage.vue",
  "/tree-select": "TreeSelectPage.vue",
  "/transfer": "TransferPage.vue",
  "/upload": "UploadPage.vue",
  "/form": "FormPage.vue",
  "/descriptions": "DescriptionsPage.vue",
  "/statistic": "StatisticPage.vue",
  "/timeline": "TimelinePage.vue",
  "/collapse": "CollapsePage.vue",
  "/image": "ImagePage.vue",
  "/carousel": "CarouselPage.vue",
  "/table": "TablePage.vue",
  "/tree": "TreePage.vue",
  "/calendar": "CalendarPage.vue",
  "/qrcode": "QrcodePage.vue",
  "/poster": "PosterPage.vue",
  "/org-chart": "OrgChartPage.vue",
  "/tabs": "TabsPage.vue",
  "/breadcrumb": "BreadcrumbPage.vue",
  "/steps": "StepsPage.vue",
  "/dropdown": "DropdownPage.vue",
  "/menu": "MenuPage.vue",
  "/pagination": "PaginationPage.vue",
  "/backtop": "BacktopPage.vue",
  "/anchor": "AnchorPage.vue",
  "/affix": "AffixPage.vue",
  "/toast": "ToastPage.vue",
  "/alert": "AlertPage.vue",
  "/message": "MessagePage.vue",
  "/notification": "NotificationPage.vue",
  "/loading": "LoadingPage.vue",
  "/progress": "ProgressPage.vue",
  "/skeleton": "SkeletonPage.vue",
  "/empty": "EmptyPage.vue",
  "/result": "ResultPage.vue",
  "/tooltip": "TooltipPage.vue",
  "/popover": "PopoverPage.vue",
  "/popconfirm": "PopconfirmPage.vue",
  "/drawer": "DrawerPage.vue",
  "/dialog": "DialogPage.vue",
  "/tour": "TourPage.vue",
  "/cell": "CellPage.vue",
  "/grid": "GridPage.vue",
  "/count-down": "CountDownPage.vue",
  "/circle": "CirclePage.vue",
  "/lazyload": "LazyloadPage.vue",
  "/highlight": "HighlightPage.vue",
  "/picker": "PickerPage.vue",
  "/search": "SearchPage.vue",
  "/stepper": "StepperPage.vue",
  "/number-keyboard": "NumberKeyboardPage.vue",
  "/password-input": "PasswordInputPage.vue",
  "/area": "AreaPage.vue",
  "/signature": "SignaturePage.vue",
  "/nav-bar": "NavBarPage.vue",
  "/tabbar": "TabbarPage.vue",
  "/tab": "TabPage.vue",
  "/index-bar": "IndexBarPage.vue",
  "/sidebar": "SidebarPage.vue",
  "/dropdown-menu": "DropdownMenuPage.vue",
  "/action-bar": "ActionBarPage.vue",
  "/popup": "PopupPage.vue",
  "/action-sheet": "ActionSheetPage.vue",
  "/share-sheet": "ShareSheetPage.vue",
  "/floating-panel": "FloatingPanelPage.vue",
  "/image-preview": "ImagePreviewPage.vue",
  "/notice-bar": "NoticeBarPage.vue",
  "/pull-refresh": "PullRefreshPage.vue",
  "/infinite-scroll": "InfiniteScrollPage.vue",
  "/swipe-cell": "SwipeCellPage.vue",
  "/floating-bubble": "FloatingBubblePage.vue",
  "/coupon": "CouponPage.vue",
  "/submit-bar": "SubmitBarPage.vue",
  "/address-list": "AddressListPage.vue",
  "/config-provider": "ConfigProviderPage.vue",
  "/theme": "ThemePage.vue",
  "/locale": "LocalePage.vue"
}
