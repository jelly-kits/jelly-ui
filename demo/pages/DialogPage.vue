<script setup lang="ts">
import { computed, ref } from 'vue'
import { JeButton, JeDialog, JeInput, JeTag, showDialog } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basic = ref(false)
const custom = ref(false)
const wide = ref(false)

/* 顶部对齐 / 拖拽 */
const drag = ref(false)
const dragRef = ref<InstanceType<typeof JeDialog> | null>(null)

/* 全屏 */
const full = ref(false)

/* 事件顺序 */
const eventOpen = ref(false)
const log = ref('')

const track = (name: string) => {
  log.value = `${log.value ? `${log.value} → ` : ''}${name}`
}

const resetLog = () => {
  if (!log.value) log.value = 'open'
}

/* 居中 */
const center = ref(false)
const alignCenter = ref(false)

/* 页头插槽 / 关闭图标 */
const headerOpen = ref(false)

/* 关闭方式开关 */
const strictOpen = ref(false)

/* before-close / destroy-on-close */
const guard = ref(false)
/** 走 before-close 的那条关闭路径会顺带记一笔事件，方便和「强制关闭」对比 */
const close = computed({
  get: () => guard.value,
  set: (value) => {
    guard.value = value
    if (!value) track('close(拦截后)')
  },
})
const guardCountdown = ref(2)
const guardForm = ref({ name: '' })
let guardTimer = 0

const onBeforeClose = (done: (cancel?: boolean) => void) => {
  if (!guardForm.value.name.trim()) {
    // 校验没过就拦下来，等用户填完再点关闭按钮；这里退化成 2 秒倒计时自动放行
    guardCountdown.value = 2
    window.clearInterval(guardTimer)
    guardTimer = window.setInterval(() => {
      guardCountdown.value -= 1
      if (guardCountdown.value > 0) return
      window.clearInterval(guardTimer)
      done()
    }, 600)
    return
  }
  done()
}

/* 暴露的方法 */
const scrollBody = ref(false)
const scrollRef = ref<InstanceType<typeof JeDialog> | null>(null)
const longRef = ref<HTMLElement | null>(null)
const reachedBottom = ref(false)

/**
 * 滚动到近似底部才放行；event 为空时（打开瞬间的兜底检查）直接量容器。
 * 容器高度是按内容自适应的，内容不够长就永远不会触发 scroll，所以打开后要主动查一次。
 */
const readToEnd = (event?: Event) => {
  const el = (event?.target as HTMLElement | null) ?? longRef.value
  if (!el) return
  reachedBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
}

/* 内置页脚 */
const footerStacked = ref(false)
const footerAuto = ref(false)

/* 内置确认按钮 + before-close */
const guardConfirmOpen = ref(false)
const guardConfirmCount = ref(0)
let guardConfirmTimer = 0

const onConfirmBeforeClose = (done: (cancel?: boolean) => void) => {
  // 不调用 done 面板就保持打开；倒计时结束后调 done() 才真正放行
  guardConfirmCount.value = 2
  window.clearInterval(guardConfirmTimer)
  guardConfirmTimer = window.setInterval(() => {
    guardConfirmCount.value -= 1
    if (guardConfirmCount.value > 0) return
    window.clearInterval(guardConfirmTimer)
    done()
  }, 700)
}

const onGuardConfirmClosed = () => {
  window.clearInterval(guardConfirmTimer)
}

/* 命令式 API */
const confirmResult = ref('还没调用过')
const alertResult = ref('还没调用过')

const openImperativeConfirm = async () => {
  const action = await showDialog.confirm({
    title: '命令式确认',
    message: '这一段正文由 showDialog.confirm() 的 message 选项提供。',
    showCancelButton: true,
    width: 400,
  })
  confirmResult.value = action
}

const openImperativeAlert = async () => {
  const action = await showDialog.alert({
    title: '命令式提示',
    message: 'alert 只渲染确认按钮；点遮罩或按 Esc 关闭会返回 close。',
    width: 400,
  })
  alertResult.value = action
}
</script>

<template>
  <DemoPage
    title="Dialog 对话框"
    description="模态浮层，打开时锁定页面滚动、把焦点圈在面板内，关闭后焦点还给触发元素。窄屏保持一张垂直居中的卡片并预留安全区，需要贴底形态时用 bottom-sheet。下面这些能力（顶部对齐、拖拽、全屏、before-close、内置页脚、命令式 API、生命周期事件等）与 Element Plus 的 Dialog 逐个对齐。"
  >
    <DemoBlock title="基础用法" description="modelValue 控制显隐，点击遮罩或右上角关闭按钮收起。">
      <je-button @click="basic = true">打开对话框</je-button>
      <JeDialog v-model="basic" title="确认操作" @close="basic = false">
        <p class="text">这里是对话框的内容区域，可以放任意说明文字或表单。</p>
      </JeDialog>
    </DemoBlock>

    <DemoBlock title="自定义页脚" description="通过 #footer 插槽放操作按钮，实现确认 / 取消流程。">
      <je-button variant="ghost" @click="custom = true">带操作的对话框</je-button>
      <JeDialog v-model="custom" title="删除确认" :width="440">
        <p class="text">删除后不可恢复，确定要继续吗？</p>
        <template #footer>
          <je-button variant="ghost" @click="custom = false">取消</je-button>
          <je-button @click="custom = false">确定删除</je-button>
        </template>
      </JeDialog>
    </DemoBlock>

    <DemoBlock title="自定义宽度" description="width 支持数字（按 px）或字符串，窄屏会忽略并占满宽度。">
      <je-button variant="ghost" @click="wide = true">宽对话框</je-button>
      <JeDialog v-model="wide" title="宽面板" :width="720">
        <p class="text">超宽面板在窄屏会自动收窄为整屏宽度的贴底面板。</p>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="顶部对齐与拖拽"
      description="默认 align-center 让面板水平垂直居中；显式写 :align-center=&quot;false&quot; 再配 top（这里 12vh）就改成从顶部往下排。draggable 打开后按住标题栏即可拖动，关闭再打开会自动回到原位。"
    >
      <je-button variant="ghost" @click="drag = true">可拖拽的对话框</je-button>
      <JeDialog
        ref="dragRef"
        v-model="drag"
        title="按住标题栏拖动我"
        :align-center="false"
        top="12vh"
        draggable
        :width="480"
      >
        <p class="text">
          拖到别处后关闭再打开，面板会回到初始位置——位移由组件内部复位，不需要外部干预。
        </p>
        <template #footer>
          <je-button variant="ghost" @click="dragRef?.resetPosition()">复位位置</je-button>
          <je-button @click="drag = false">关闭</je-button>
        </template>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="全屏"
      description="fullscreen 让面板铺满整个视口（此时 width / top / draggable 都不参与），并额外预留上下安全区。"
    >
      <je-button variant="ghost" @click="full = true">全屏对话框</je-button>
      <JeDialog
        v-model="full"
        title="全屏面板"
        fullscreen
        :width="720"
        :align-center="false"
        top="12vh"
      >
        <p class="text">
          全屏时面板不再有圆角与描边，内容区自己撑满剩余高度并独立滚动；底部按钮依然贴在页脚。
        </p>
        <template #footer>
          <je-button variant="ghost" @click="full = false">退出全屏</je-button>
        </template>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="页头页脚居中"
      description="center 只把页头的标题与页脚的按钮推到中间，面板位置不变；面板本身的位置由 align-center 控制（默认居中）。"
    >
      <je-button variant="ghost" @click="center = true">居中内容</je-button>
      <je-button variant="ghost" @click="alignCenter = true">居中面板</je-button>
      <JeDialog v-model="center" title="内容居中" center :width="400">
        <p class="text">需要填写的内容请放在表单里，这里的正文居中容易读得累，所以 center 不管正文。</p>
        <template #footer>
          <je-button variant="ghost" @click="center = false">取消</je-button>
          <je-button @click="center = false">确定</je-button>
        </template>
      </JeDialog>
      <JeDialog
        v-model="alignCenter"
        title="面板居中"
        :align-center="false"
        top="8vh"
        :width="400"
      >
        <p class="text">
          这个面板用 top=&quot;8vh&quot; 贴在靠上的位置。top 只有在 align-center 为 false 时才生效；
          align-center 默认是 true（面板居中），也就是当前这份面板再往上抬一档的对照。
        </p>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="before-close"
      description="点关闭按钮、点遮罩、按 Esc 之前都会先问 before-close：不调用 done 面板就保持打开。这里故意让校验失败，2 秒后才放行，可以观察「按了关闭却不关」的效果。"
    >
      <je-button variant="ghost" @click="guard = true">带关闭拦截的对话框</je-button>
      <JeDialog
        v-model="close"
        title="提交前校验"
        :before-close="onBeforeClose"
        :width="440"
      >
        <je-input v-model="guardForm.name" placeholder="随便输入几个字即可立即关闭" />
        <p class="text hint">留空时点关闭会被拦住，{{ guardCountdown }} 秒后自动放行。</p>
        <template #footer>
          <je-button variant="ghost" @click="guard = false">强制关闭</je-button>
          <je-button @click="guard = false">确定</je-button>
        </template>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="生命周期事件与惰性内容"
      description="依次触发 open → opened → close → closed，opened / closed 对应动画结束（约 420ms），首次摸 DOM 请放在 opened 里。destroy-on-close 让默认插槽在首次展开前与关闭后都不渲染，适合内容很重的对话框。"
    >
      <je-button variant="ghost" @click="resetLog(); eventOpen = true">打开并记录事件</je-button>
      <JeDialog
        v-model="eventOpen"
        title="事件顺序"
        destroy-on-close
        @opened="track('opened')"
        @closed="track('closed')"
      >
        <p class="text">面板常驻 DOM，所以外面量得到尺寸；内容可以按需销毁。</p>
        <template #footer>
          <je-button @click="eventOpen = false">关闭</je-button>
        </template>
      </JeDialog>
      <p class="text log">{{ log || '还没打开过' }}</p>
    </DemoBlock>

    <DemoBlock
      title="自定义页头与关闭图标"
      description="#header 插槽整块替换标题区（关闭按钮仍在），close-icon 传图标名即可换掉默认的关闭图标。"
    >
      <je-button variant="ghost" @click="headerOpen = true">自定义页头</je-button>
      <JeDialog v-model="headerOpen" title="自定义页头" close-icon="minus" :width="420">
        <template #header>
          <span class="head">
            <je-tag>重要</je-tag>
            <span>版本发布说明</span>
          </span>
        </template>
        <p class="text">页头里可以放标签、状态点等任意内容，标题区高度由内容自行决定。</p>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="关闭方式开关"
      description="close-on-click-modal、close-on-press-escape、show-close 三个开关互相独立，适合「必须点确定才能关」的强引导场景。"
    >
      <je-button variant="ghost" @click="strictOpen = true">只能点确定关闭</je-button>
      <JeDialog
        v-model="strictOpen"
        title="请确认"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
        :width="420"
      >
        <p class="text">遮罩、Esc、右上角关闭按钮都被关掉了，只能走页脚按钮。</p>
        <template #footer>
          <je-button variant="ghost" @click="strictOpen = false">取消</je-button>
          <je-button @click="strictOpen = false">确定</je-button>
        </template>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="暴露方法"
      description="组件暴露 handle-close（走完整关闭流程，含 before-close）与 reset-position（把拖拽位移清零）。下面的确定按钮直接调 handleClose，行为与点右上角关闭按钮完全一致。"
    >
      <je-button variant="ghost" @click="scrollBody = true; reachedBottom = false">
        读到最后才能确认
      </je-button>
      <JeDialog
        ref="scrollRef"
        v-model="scrollBody"
        title="服务条款"
        :align-center="false"
        top="10vh"
        :width="480"
        @opened="readToEnd()"
      >
        <div ref="longRef" class="long" @scroll="readToEnd">
          <p v-for="line in 24" :key="line" class="text">
            第 {{ line }} 条：这里是占位条款正文，一直滚到底部为止。
          </p>
        </div>
        <template #footer>
          <je-button variant="ghost" @click="scrollBody = false">取消</je-button>
          <je-button :disabled="!reachedBottom" @click="scrollRef?.handleClose()">确定</je-button>
        </template>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="内置页脚"
      description="传 confirm-button-text 就会渲染内置页脚（不传则页脚仍完全由 #footer 插槽负责，老页面不受影响）。footer-layout 控制布局：inline 横排右对齐、stacked 竖排铺满并在上方带一条分隔线、auto（默认）窄屏竖排、宽屏横排。想固定看某一种形态就把 footer-layout 写死，下面的对话框正是这么做的。"
    >
      <je-button @click="footerAuto = true">auto（跟随视口宽度）</je-button>
      <je-button variant="ghost" @click="footerStacked = true">stacked（固定竖排）</je-button>
      <JeDialog
        v-model="footerAuto"
        title="内置页脚 · auto"
        confirm-button-text="保存"
        cancel-button-text="取消"
      >
        <p class="text">
          footer-layout 默认是 auto：当前视口 ≤768px 时按钮竖排、确认在上取消在下（主操作靠近拇指），
          更宽时横排、取消在左确认在右。拖一下窗口宽度再打开可以对照。
        </p>
      </JeDialog>
      <JeDialog
        v-model="footerStacked"
        title="内置页脚 · stacked"
        footer-layout="stacked"
        confirm-button-text="立即提交"
        show-cancel-button
      >
        <p class="text">
          这里把 footer-layout 写死成 stacked，宽屏下也是竖排：确认按钮在上、取消按钮在下，
          两个按钮都铺满整行，分隔线是组件内用 color-mix() 现算的。
        </p>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="内置确认按钮与 before-close"
      description="点内置的确认按钮会先把按钮切成 loading 并禁用，再调 before-close；done() 放行关闭，done(true) 表示这次不关，一直不调 done 则面板保持打开并清掉 loading。这里故意延迟放行，可以观察按钮转圈期间面板不会消失，也不会重复触发。"
    >
      <je-button variant="ghost" @click="guardConfirmOpen = true">延迟关闭的确认</je-button>
      <JeDialog
        v-model="guardConfirmOpen"
        title="提交前校验"
        confirm-button-text="确认提交"
        cancel-button-text="再想想"
        :before-close="onConfirmBeforeClose"
        :width="440"
        @closed="onGuardConfirmClosed"
      >
        <p class="text">
          确认按钮走 before-close：按下后按钮转圈且不可重复点击，约 2 秒后才真正关闭。
          before-close 一直不调用 done，面板就一直是打开的——这正是「等接口返回再关」的形态。
        </p>
      </JeDialog>
    </DemoBlock>

    <DemoBlock
      title="命令式 showDialog"
      description="showDialog.confirm() / showDialog.alert() 直接挂在 body 上，返回的 Promise 永远 resolve 成 'confirm' | 'cancel' | 'close'（与 Vant 取消时 reject 的做法不同，见组件源码注释），从不 reject。alert 只渲染确认按钮，点遮罩或按 Esc 关掉会得到 'close'。"
    >
      <je-button @click="openImperativeConfirm">showDialog.confirm()</je-button>
      <je-button variant="ghost" @click="openImperativeAlert">showDialog.alert()</je-button>
      <p class="text log">confirm → {{ confirmResult }}　|　alert → {{ alertResult }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.text {
  margin: 0;
}

.hint {
  margin-top: 12px;
  font-size: 13px;
  color: var(--je-text-faint);
}

.log {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  color: color-mix(in srgb, var(--je-primary) 55%, var(--je-text));
}

.head {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
}

.long {
  max-height: 240px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.long .text + .text {
  margin-top: 10px;
}
</style>
