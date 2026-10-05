<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeInput } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basic = ref('')
const disabledText = ref('不可编辑')
const readonlyText = ref('只读内容，可以选中复制')
const clearText = ref('点右侧图标清空')
const clearTextarea = ref('文本域也支持一键清空')
const password = ref('jelly-2026')
const searchText = ref('')
const siteText = ref('')
const amountText = ref('')
const bio = ref('')
const autosizeText = ref('')
const webUrl = ref('jelly-ui.dev')
const moneyText = ref('1000')
const sizeLarge = ref('')
const sizeDefault = ref('')
const sizeSmall = ref('')
const limited = ref('')
const outsideLimited = ref('')
const noSpace = ref('')
const eventText = ref('')
const methodText = ref('')
const logs = ref<string[]>([])

const inputRef = ref<InstanceType<typeof JeInput> | null>(null)

/** 自定义计数口径：空格不计入 */
const countNoSpace = (value: string) => value.replace(/\s/g, '').length

/** 千分位显示，parser 再把格式还原成纯数字 */
const formatMoney = (value: string | number) =>
  `$ ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
const parseMoney = (value: string) => value.replace(/[^\d]/g, '')

const log = (name: string, value?: string) => {
  logs.value = [`${name}${value === undefined ? '' : `：${value}`}`, ...logs.value].slice(0, 6)
}
</script>

<template>
  <DemoPage
    title="Input 输入框"
    description="原生 input / textarea 的封装：尺寸、清空、密码可见性、前后置图标与插槽、字数统计、格式化、复合型输入框都在一个组件里，聚焦光晕仍由主色实时计算。"
  >
    <DemoBlock title="基础用法">
      <je-input v-model="basic" placeholder="请输入内容" />
      <p class="state">当前值：{{ basic || '空' }}</p>
    </DemoBlock>

    <DemoBlock title="禁用与只读" description="disabled 变淡且不可交互，readonly 仍可聚焦选中但不可修改。">
      <je-input v-model="disabledText" disabled />
      <je-input v-model="readonlyText" readonly />
    </DemoBlock>

    <DemoBlock title="一键清空" description="clearable 在输入框与文本域上都可用，清空后自动聚焦。">
      <je-input v-model="clearText" clearable placeholder="输入点内容试试" />
      <je-input v-model="clearTextarea" type="textarea" clearable :rows="2" />
    </DemoBlock>

    <DemoBlock title="密码框" description="show-password 提供可切换的明文预览，切换后自动回焦。">
      <je-input v-model="password" type="password" show-password placeholder="请输入密码" />
      <p class="state">当前值：{{ password || '空' }}</p>
    </DemoBlock>

    <DemoBlock
      title="带图标的输入框"
      description="prefix-icon / suffix-icon 直接吃内置图标名，也可以换成任意组件；需要放文字时用 prefix / suffix 插槽。"
    >
      <je-input v-model="searchText" prefix-icon="search" clearable placeholder="搜索组件" />
      <je-input v-model="siteText" suffix-icon="lock" placeholder="带后置图标" />
      <je-input v-model="amountText" placeholder="带插槽后缀">
        <template #suffix>元</template>
      </je-input>
    </DemoBlock>

    <DemoBlock title="文本域" description="type 为 textarea 时渲染原生 textarea，rows 控制初始行数。">
      <je-input v-model="bio" type="textarea" :rows="3" placeholder="介绍一下自己" />
    </DemoBlock>

    <DemoBlock
      title="自适应高度的文本域"
      description="autosize 让高度跟随内容；传对象可以限制最少 / 最多行数，超出后出现内部滚动。"
    >
      <je-input
        v-model="autosizeText"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 5 }"
        placeholder="多敲几行，高度会在 2 ~ 5 行之间变化"
      />
    </DemoBlock>

    <DemoBlock
      title="复合型输入框"
      description="prepend / append 插槽把标签或按钮拼在输入框两侧，描边与圆角自动接合。"
    >
      <je-input v-model="webUrl" placeholder="域名">
        <template #prepend>https://</template>
        <template #append>.dev</template>
      </je-input>
    </DemoBlock>

    <DemoBlock title="尺寸" description="large / default / small 三档，default 不产生额外的类名。">
      <je-input v-model="sizeLarge" size="large" placeholder="large" />
      <je-input v-model="sizeDefault" placeholder="default" />
      <je-input v-model="sizeSmall" size="small" placeholder="small" />
    </DemoBlock>

    <DemoBlock
      title="输入长度限制"
      description="maxlength 限制长度，show-word-limit 显示计数器；word-limit-position 可以把它挪到框外。"
    >
      <je-input v-model="limited" :maxlength="20" show-word-limit placeholder="最多 20 个字" />
      <je-input
        v-model="outsideLimited"
        type="textarea"
        :rows="2"
        :maxlength="60"
        show-word-limit
        word-limit-position="outside"
        placeholder="计数器在框外右下角"
      />
    </DemoBlock>

    <DemoBlock
      title="自定义计数口径"
      description="默认按字形簇计数（一个 emoji 算一个字）；count-graphemes 可以换成自己的算法，例如不统计空格。"
    >
      <je-input
        v-model="noSpace"
        :maxlength="10"
        show-word-limit
        :count-graphemes="countNoSpace"
        placeholder="空格不计入，最多 10 个非空格字符"
      />
    </DemoBlock>

    <DemoBlock
      title="格式化"
      description="formatter 决定看到什么，parser 决定 v-model 里存什么——显示是 $ 1,000，值是 1000。"
    >
      <je-input v-model="moneyText" :formatter="formatMoney" :parser="parseMoney" placeholder="输入数字" />
      <p class="state">v-model 的值：{{ moneyText || '空' }}</p>
    </DemoBlock>

    <DemoBlock title="事件" description="聚焦、失焦、输入、值变更（失焦或回车）、清空都会抛出来。">
      <je-input
        v-model="eventText"
        clearable
        placeholder="点一下、敲两个字、再清空"
        @focus="log('focus')"
        @blur="log('blur')"
        @input="log('input', $event)"
        @change="log('change', $event)"
        @clear="log('clear')"
      />
      <ul v-if="logs.length" class="logs">
        <li v-for="(item, index) in logs" :key="index">{{ item }}</li>
      </ul>
      <p v-else class="state">还没有事件。</p>
    </DemoBlock>

    <DemoBlock title="实例方法" description="通过 ref 调用 focus / blur / select / clear。">
      <je-input ref="inputRef" v-model="methodText" placeholder="用下面的按钮操作我" />
      <div class="row">
        <je-button size="small" @click="inputRef?.focus()">聚焦</je-button>
        <je-button size="small" variant="ghost" @click="inputRef?.blur()">失焦</je-button>
        <je-button size="small" variant="ghost" @click="inputRef?.select()">全选</je-button>
        <je-button size="small" variant="ghost" @click="inputRef?.clear()">清空</je-button>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.logs {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.9;
  color: var(--je-text-muted);
}
</style>
