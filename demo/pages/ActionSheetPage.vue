<script setup lang="ts">
import { ref } from 'vue'
import { JeActionSheet, JeButton, type JeActionSheetAction } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basic = ref(false)
const withTitle = ref(false)
const last = ref('暂无')

const actions: JeActionSheetAction[] = [
  { name: 'edit', text: '编辑资料', icon: 'edit' },
  { name: 'share', text: '分享给好友', icon: 'share' },
  { name: 'download', text: '下载到本地', icon: 'download', subText: '约 2.4 MB' },
  { name: 'delete', text: '删除', icon: 'trash', color: 'var(--je-danger)' },
]

const onSelect = (action: JeActionSheetAction) => {
  last.value = action.text ?? String(action.name)
}

const disabled = ref(false)

const stateActions: JeActionSheetAction[] = [
  { name: 'copy', text: '复制链接', icon: 'copy' },
  { name: 'refresh', text: '重新生成', icon: 'refresh', loading: true },
  { name: 'hold', text: '不可用操作', disabled: true },
]

const keepOpen = ref(false)
const chosen = ref<string[]>([])

const onMultiSelect = (action: JeActionSheetAction) => {
  const label = action.text ?? String(action.name)
  chosen.value = chosen.value.includes(label)
    ? chosen.value.filter((item) => item !== label)
    : [...chosen.value, label]
}
</script>

<template>
  <DemoPage
    title="ActionSheet 动作面板"
    description="从底部弹出的操作菜单，用于在一组互斥动作里选一个；面板常驻 DOM，靠 visibility 过渡控制显隐。"
  >
    <DemoBlock title="基础用法" description="actions 描述每一项，点击后触发 select 并自动关闭。">
      <je-button block @click="basic = true">选择一个操作</je-button>
      <p class="hint">最近选择：{{ last }}</p>
    </DemoBlock>

    <DemoBlock title="带标题与说明" description="标题区用于说明这一组操作的上下文。">
      <je-button block variant="ghost" @click="withTitle = true">分享到</je-button>
    </DemoBlock>

    <DemoBlock title="禁用与加载中" description="disabled 与 loading 的选项都不可点击。">
      <je-button block variant="ghost" @click="disabled = true">打开状态演示</je-button>
    </DemoBlock>

    <DemoBlock
      title="多选与不自动关闭"
      description="closeOnClickAction 设为 false 后点击选项不收起面板，可以由调用方自己组织多选逻辑。"
    >
      <je-button block variant="ghost" @click="keepOpen = true">多选操作（已选 {{ chosen.length }}）</je-button>
    </DemoBlock>

    <je-action-sheet
      v-model="basic"
      :actions="actions"
      @select="onSelect"
    />

    <je-action-sheet
      v-model="withTitle"
      title="分享到"
      description="选择分享的目标应用，操作不可撤销"
      :actions="actions"
      @select="onSelect"
    />

    <je-action-sheet v-model="disabled" :actions="stateActions" />

    <je-action-sheet
      v-model="keepOpen"
      description="当前为多选模式，选择完成后点取消关闭"
      :actions="actions"
      :close-on-click-action="false"
      cancel-text="完成"
      @select="onMultiSelect"
    />
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
