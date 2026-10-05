<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeShareSheet, type JeShareOption } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basicOpen = ref(false)
const descOpen = ref(false)
const disabledOpen = ref(false)
const feedbackOpen = ref(false)

const log = ref('暂无')
const selected = ref('暂无')

const options: JeShareOption[] = [
  { name: '微信', icon: 'message', color: '#22c55e' },
  { name: '朋友圈', icon: 'share', color: '#f59e0b' },
  { name: '微博', icon: 'link', color: '#e6162d' },
  { name: '复制链接', icon: 'copy' },
  { name: '邮件', icon: 'mail' },
  { name: '电话', icon: 'phone' },
]

const disabledOptions: JeShareOption[] = [
  { name: '微信', icon: 'message', color: '#22c55e' },
  { name: '朋友圈', icon: 'share', color: '#f59e0b' },
  { name: '保存图片', icon: 'download', disabled: true },
  { name: '复制链接', icon: 'copy' },
  { name: '邮件', icon: 'mail' },
  { name: '电话', icon: 'phone', disabled: true },
]

const onLogSelect = (option: JeShareOption, index: number) => {
  log.value = `select → name: ${option.name}，index: ${index}`
}

const onSelect = (option: JeShareOption, index: number) => {
  selected.value = `第 ${index + 1} 项：${option.name}`
}
</script>

<template>
  <DemoPage
    title="ShareSheet 分享面板"
    description="移动端底部弹出的分享面板，宫格陈列分享目标，支持自定义图标配色、禁用项与下拉关闭。"
  >
    <DemoBlock title="基础用法" description="点击分享目标派发 select，点击取消或遮罩派发 cancel。">
      <je-button block @click="basicOpen = true">打开分享面板</je-button>
      <p class="hint">{{ log }}</p>
      <je-share-sheet
        v-model="basicOpen"
        :options="options"
        @select="onLogSelect"
        @cancel="log = 'cancel'"
      />
    </DemoBlock>

    <DemoBlock
      title="标题与说明"
      description="title / description 展示面板头部，cancelText 传空字符串可隐藏取消按钮。"
    >
      <je-button block variant="ghost" @click="descOpen = true">带说明打开</je-button>
      <je-share-sheet
        v-model="descOpen"
        title="分享给别人"
        description="选择一种方式分享当前内容"
        cancel-text="先不分享"
        :options="options"
      />
    </DemoBlock>

    <DemoBlock
      title="禁用项"
      description="disabled 的目标变淡且不可点击，其余仍可正常派发 select。"
    >
      <je-button block variant="ghost" @click="disabledOpen = true">含禁用项打开</je-button>
      <je-share-sheet
        v-model="disabledOpen"
        title="分享到"
        :options="disabledOptions"
        @select="onLogSelect"
      />
    </DemoBlock>

    <DemoBlock
      title="select 事件反馈"
      description="select 回传 (option, index)，父级据此展示用户选中的目标。"
    >
      <je-button block variant="ghost" @click="feedbackOpen = true">选择并查看反馈</je-button>
      <p class="hint">{{ selected }}</p>
      <je-share-sheet v-model="feedbackOpen" title="分享到" :options="options" @select="onSelect" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>