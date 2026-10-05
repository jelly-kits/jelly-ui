<script setup lang="ts">
import { reactive, ref } from 'vue'
import { JeIcon, JeNumberKeyboard } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 演示统一用 6 位上限，方便对比「输满之后哪些键还能按」 */
const MAX = 6

/**
 * 演示用的「输入值 + 键盘事件」小工厂。
 * 不能把 ref 从模板里当参数传进来：模板会先自动解包，拿到的是字符串而不是 ref，
 * 所以状态用普通对象装，模板传对象进来，由工厂闭包自己改。
 */
const useKeypad = (maxlength = MAX) => {
  const state = reactive({ text: '' })

  const onInput = (key: string) => {
    if (state.text.length >= maxlength) return
    state.text += key
  }

  const onDelete = () => {
    state.text = state.text.slice(0, -1)
  }

  return { state, onInput, onDelete }
}

const visible = ref(false)
const money = useKeypad()

const customVisible = ref(false)
const custom = useKeypad()

const randomVisible = ref(false)
const random = useKeypad()

const showVisible = ref(false)
const show = useKeypad()

const multiVisible = ref(false)
const multi = useKeypad()

const idVisible = ref(false)
const id = useKeypad()

const deleteVisible = ref(false)
const del = useKeypad()

const slotVisible = ref(false)
const slotPad = useKeypad()

const loadingVisible = ref(false)
const loadingOn = ref(false)

/** 演示加载态：真实场景里等接口返回后再把 closeButtonLoading 置回 false */
const openLoadingKeyboard = () => {
  loadingOn.value = true
  loadingVisible.value = true
  window.setTimeout(() => {
    loadingOn.value = false
  }, 2000)
}
</script>

<template>
  <DemoPage
    title="NumberKeyboard 数字键盘"
    description="移动端自绘数字键盘，带标题栏与删除键，常用于金额、验证码、密码等纯数字输入场景。"
  >
    <DemoBlock title="基础用法" description="键盘只负责派发按键事件，具体拼接逻辑由调用方处理。">
      <div class="display">{{ money.state.text || '点下方按钮唤起键盘' }}</div>
      <button type="button" class="trigger" @click="visible = true">唤起数字键盘</button>
      <je-number-keyboard
        v-model="visible"
        title="输入金额"
        :value="money.state.text"
        :maxlength="MAX"
        @input="money.onInput"
        @delete="money.onDelete"
      />
    </DemoBlock>

    <DemoBlock
      title="受控显示（show + blur）"
      description="show 作为可见性的唯一来源时，收起键盘靠 blur 事件（Vant 文档里的写法：@blur=&quot;showVisible = false&quot;），此时键盘不依赖 v-model 也能收起来。"
    >
      <div class="display">{{ show.state.text || '（空）' }}</div>
      <button type="button" class="trigger" @click="showVisible = true">show 受控唤起</button>
      <je-number-keyboard
        :show="showVisible"
        title="受控键盘"
        :value="show.state.text"
        :maxlength="MAX"
        @blur="showVisible = false"
        @input="show.onInput"
        @delete="show.onDelete"
      />
    </DemoBlock>

    <DemoBlock
      title="自定义主题"
      description="theme=custom 不带标题栏，也不再有独立的收起按钮（对齐 Vant，高度与 Vant 的 4 排键盘一致）；收起靠点击键盘外区域（hideOnClickOutside 默认开启）或调用方自己的 UI。左下角按键可替换为小数点或 00。"
    >
      <div class="display">{{ custom.state.text || '（空）' }}</div>
      <button type="button" class="trigger" @click="customVisible = true">带小数点的键盘</button>
      <je-number-keyboard
        v-model="customVisible"
        theme="custom"
        extra-key="."
        :value="custom.state.text"
        :maxlength="MAX"
        @input="custom.onInput"
        @delete="custom.onDelete"
      />
    </DemoBlock>

    <DemoBlock
      title="两个额外按键"
      description="extraKey 支持数组：custom 主题下 ['00', '.'] 会排成「00 / 0 / .」一排；删除键因为三列排不下而通栏独占一行。空字符串按没配置处理。custom 主题下左下角被额外键占掉后面板内没有收起入口，收起就靠点击键盘外区域（hideOnClickOutside 默认开启）。"
    >
      <div class="display">{{ multi.state.text || '（空）' }}</div>
      <button type="button" class="trigger" @click="multiVisible = true">金额键盘</button>
      <je-number-keyboard
        v-model="multiVisible"
        theme="custom"
        :extra-key="['00', '.']"
        :value="multi.state.text"
        :maxlength="MAX"
        @input="multi.onInput"
        @delete="multi.onDelete"
      />
    </DemoBlock>

    <DemoBlock
      title="身份证键盘与标题栏左侧"
      description="extra-key 传 X 就是身份证键盘；标题栏左侧可以放一个收起箭头（Vant 的箭头是靠 title-left 插槽拼出来的，组件本身不带箭头）。"
    >
      <div class="display">{{ id.state.text || '（空）' }}</div>
      <button type="button" class="trigger" @click="idVisible = true">身份证键盘</button>
      <je-number-keyboard
        v-model="idVisible"
        title="请输入身份证号"
        extra-key="X"
        close-button-text="完成"
        :value="id.state.text"
        :maxlength="18"
        @input="id.onInput"
        @delete="id.onDelete"
      >
        <template #title-left>
          <je-icon name="chevron-down" :size="18" />
        </template>
      </je-number-keyboard>
    </DemoBlock>

    <DemoBlock
      title="删除键自定义"
      description="deleteIcon 换图标、deleteButtonText 换成文字，或者用 delete 插槽完全接管；删除键不受 maxlength 限制，输满后连击删除仍然逐次生效。"
    >
      <div class="display">{{ del.state.text || '（空）' }}</div>
      <button type="button" class="trigger" @click="deleteVisible = true">文字删除键</button>
      <je-number-keyboard
        v-model="deleteVisible"
        title="输满 6 位再连击删除"
        extra-key="."
        delete-icon="close"
        delete-button-text="退格"
        :value="del.state.text"
        :maxlength="MAX"
        @input="del.onInput"
        @delete="del.onDelete"
      />
    </DemoBlock>

    <DemoBlock
      title="自定义按键（默认插槽）"
      description="默认插槽的内容会直接成为键盘里的一个网格单元：这里的 # 键由页面自己实现样式与事件（Vant 只提供 extra-key 插槽，这是额外能力）。default 主题且没配 extraKey 时它会填进左下角那个空位，键盘仍是整齐的 4 排。"
    >
      <div class="display">{{ slotPad.state.text || '（空）' }}</div>
      <button type="button" class="trigger" @click="slotVisible = true">带自定义 # 键的键盘</button>
      <je-number-keyboard
        v-model="slotVisible"
        title="自定义按键"
        :value="slotPad.state.text"
        :maxlength="MAX"
        @input="slotPad.onInput"
        @delete="slotPad.onDelete"
      >
        <template #default>
          <button type="button" class="slot-key" @click="slotPad.onInput('#')">#</button>
        </template>
      </je-number-keyboard>
    </DemoBlock>

    <DemoBlock
      title="加载态、无动画与安全区"
      description="closeButtonLoading 让标题栏的「完成」按钮转圈并禁止点击（2 秒后自动恢复）；transition=false 关掉过场动画；safe-area-inset-bottom=false 不再预留全面屏手势条的高度；z-index 可指定层级。"
    >
      <div class="display">标题栏「完成」会转 2 秒</div>
      <button type="button" class="trigger" @click="openLoadingKeyboard">唤起加载态键盘</button>
      <je-number-keyboard
        v-model="loadingVisible"
        title="加载态"
        :close-button-loading="loadingOn"
        :transition="false"
        :safe-area-inset-bottom="false"
        :z-index="2600"
      />
    </DemoBlock>

    <DemoBlock
      title="随机键序"
      description="开启 randomKeyOrder 后每次打开都会重新打乱数字键，适合密码场景防偷窥；关掉开关再打开会立刻复位成 1~9，不会残留上一次的乱序。"
    >
      <div class="display">{{ random.state.text || '（空）' }}</div>
      <button type="button" class="trigger" @click="randomVisible = true">唤起随机键序键盘</button>
      <je-number-keyboard
        v-model="randomVisible"
        title="安全键盘"
        random-key-order
        :value="random.state.text"
        :maxlength="MAX"
        @input="random.onInput"
        @delete="random.onDelete"
      />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.display {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  margin-bottom: 14px;
  border-radius: var(--je-radius);
  font-size: 20px;
  letter-spacing: 2px;
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.trigger {
  padding: 11px 18px;
  border: none;
  border-radius: var(--je-radius);
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
}

/* 默认插槽里的按键由页面自己画：外层是 display:contents，这个按钮直接就是网格单元 */
.slot-key {
  height: 48px;
  font-family: inherit;
  font-size: 18px;
  color: var(--je-text);
  cursor: pointer;
  background: color-mix(in srgb, var(--je-primary) 22%, transparent);
  border: none;
  border-radius: var(--je-radius-sm);
}

@media (max-width: 768px) {
  .slot-key {
    height: 50px;
  }
}
</style>
