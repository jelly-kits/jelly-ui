<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeNumberKeyboard, JePasswordInput } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const password = ref('')
const smsCode = ref('')
const errorCode = ref('12')
const errorInfo = ref('')
const focused = ref(false)

/** 自定义键盘示例用的状态：键盘显隐由 focused 驱动，值由键盘事件拼出来 */
const keypadValue = ref('')
const keypadFocused = ref(false)
/** 位数上限：与密码框的 length、键盘的 maxlength 保持一致 */
const KEYPAD_LENGTH = 6
/** 光标演示：受控聚焦 + 光标颜色 */
const cursorColor = ref('#22c55e')
const cursorFocused = ref(false)
/** 清空演示 */
const clearableCode = ref('1234')
/** 明文 + 字母数字 */
const textCode = ref('')
/** 满位自动提交 */
const autoCode = ref('')
const autoTip = ref('')

const verify = () => {
  errorInfo.value = errorCode.value.length === 6 ? '' : '验证码为 6 位数字'
}

const clear = () => {
  errorCode.value = ''
  errorInfo.value = ''
}

const onKeypadInput = (key: string) => {
  if (keypadValue.value.length >= KEYPAD_LENGTH) return
  keypadValue.value += key
  // 输满就自动收起键盘：显隐与 focused 双向绑定，把它置回 false 即可
  if (keypadValue.value.length >= KEYPAD_LENGTH) keypadFocused.value = false
}

const onKeypadDelete = () => {
  keypadValue.value = keypadValue.value.slice(0, -1)
}
</script>

<template>
  <DemoPage
    title="PasswordInput 密码输入框"
    description="分格展示的密码 / 验证码输入框，内置隐藏输入框、数字键盘唤起、非数字过滤、受控聚焦与错误抖动。"
  >
    <DemoBlock title="基础用法" description="默认 6 位并遮挡，点击格子即可唤起键盘。">
      <je-password-input v-model="password" />
      <p class="hint">已输入 {{ password.length }} / 6 位</p>
    </DemoBlock>

    <DemoBlock title="不遮挡与自定义位数" description="mask 关闭后直接显示数字，length 控制格数。">
      <je-password-input v-model="smsCode" :length="4" :mask="false" info="短信验证码 4 位" />
      <p class="hint">验证码：{{ smsCode || '（空）' }}</p>
    </DemoBlock>

    <DemoBlock title="错误提示" description="传入 errorInfo 即进入错误态：文案变红并抖动一次，且覆盖 info 的文案。">
      <je-password-input v-model="errorCode" :error-info="errorInfo" info="请输入 6 位验证码" />
      <div class="toolbar">
        <je-button size="small" @click="verify">校验</je-button>
        <je-button size="small" variant="ghost" @click="clear">清空</je-button>
      </div>
    </DemoBlock>

    <DemoBlock title="带间距与受控聚焦">
      <je-password-input v-model="password" :gutter="8" :focused="focused" />
      <div class="toolbar">
        <je-button size="small" variant="ghost" @click="focused = !focused">
          {{ focused ? '取消聚焦' : '聚焦输入框' }}
        </je-button>
      </div>
    </DemoBlock>

    <DemoBlock
      title="常驻光标 + 自定义键盘"
      description="always 让光标不依赖聚焦状态常驻；v-model:focused 与 NumberKeyboard 的显隐双向绑定，关掉键盘上的点击热区，就不会再叠出一层系统键盘。输满位数后键盘会自动收起。"
    >
      <je-password-input
        v-model="keypadValue"
        v-model:focused="keypadFocused"
        always
        :length="KEYPAD_LENGTH"
        info="点击格子打开下方键盘"
        :class="{ 'is-keypad-open': keypadFocused }"
      />
      <p class="hint">已输入 {{ keypadValue.length }} / {{ KEYPAD_LENGTH }} 位</p>
      <je-number-keyboard
        v-model="keypadFocused"
        :value="keypadValue"
        :maxlength="KEYPAD_LENGTH"
        title="请输入验证码"
        @input="onKeypadInput"
        @delete="onKeypadDelete"
      />
    </DemoBlock>

    <DemoBlock title="光标显示与颜色" description="showCursor 开关闪烁光标，cursorColor 单独定制它的颜色。">
      <je-password-input
        v-model="password"
        :show-cursor="true"
        :cursor-color="cursorColor"
        :focused="cursorFocused"
        info="点击格子后可见光标"
      />
      <div class="toolbar">
        <je-button size="small" variant="ghost" @click="cursorFocused = !cursorFocused">
          {{ cursorFocused ? '取消聚焦' : '聚焦输入框' }}
        </je-button>
        <je-button size="small" variant="ghost" @click="cursorColor = cursorColor === '#22c55e' ? '#f59e0b' : '#22c55e'">
          换光标色
        </je-button>
      </div>
    </DemoBlock>

    <DemoBlock
      title="可清空的验证码"
      description="clearable 在右上角挂一个关闭按钮，点击后组件自己清空内容并派发 close，省掉父组件一段样板逻辑。"
    >
      <je-password-input
        v-model="clearableCode"
        clearable
        :mask="false"
        :gutter="10"
        info="点右上角 × 清空"
      />
      <p class="hint">当前值：{{ clearableCode || '（空）' }}</p>
    </DemoBlock>

    <DemoBlock
      title="明文与字母数字混合"
      description="accept 默认 numeric 只收数字；改成 text 后不再过滤，可用于密码 + 图形验证码这类混合输入场景。"
    >
      <je-password-input
        v-model="textCode"
        accept="text"
        :mask="false"
        :length="6"
        info="可输入任意字符"
      />
      <p class="hint">当前值：{{ textCode || '（空）' }}</p>
    </DemoBlock>

    <DemoBlock
      title="输入完成自动提交"
      description="complete 在内容刚好达到 length 位时触发一次，适合验证码场景省掉「确认」按钮。"
    >
      <je-password-input v-model="autoCode" @complete="autoTip = `已自动提交 ${$event}`" />
      <p class="hint">{{ autoTip || '输满 6 位即自动提交（父组件只接 complete 即可）' }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.je-password + .je-password {
  margin-top: 20px;
}

/*
 * 自定义键盘已经占据底部时，屏蔽输入框的点击热区，
 * 避免「点格子 → 弹系统键盘」和自家键盘叠在一起。
 */
.is-keypad-open :deep(.je-password__cells) {
  pointer-events: none;
}
</style>
