<script setup lang="ts">
import { ref } from 'vue'
import { JeAlert, JeButton, JeIcon } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const tips = ref([
  { type: 'success' as const, text: '部署已成功，服务正在运行。' },
  { type: 'info' as const, text: '这是一条普通的信息提示。' },
  { type: 'warning' as const, text: '磁盘空间不足，请及时清理。' },
  { type: 'error' as const, text: '请求失败，请稍后重试。' },
])

const removable = ref(true)

const closeAll = () => {
  tips.value = []
}
</script>

<template>
  <DemoPage
    title="Alert 提示"
    description="用于页面内展示需要用户关注的反馈信息。左侧色条与浅底由原始语义 token 现算，支持关闭、隐藏图标与居中布局。"
  >
    <DemoBlock title="四种类型" description="type 取 success / info / warning / error，默认 info。">
      <je-alert
        v-for="tip in tips"
        :key="tip.type"
        :type="tip.type"
        :title="tip.text"
        description="这里的描述文字用来说明更详细的原因与处理建议。"
      />
      <p v-if="!tips.length" class="state">已全部关闭。</p>
      <je-button variant="ghost" @click="closeAll">全部关闭</je-button>
    </DemoBlock>

    <DemoBlock title="可关闭" description="设置 closable，点右侧关闭按钮触发 close 事件。">
      <je-alert v-if="removable" title="可关闭的提示" closable @close="removable = false" />
      <je-button v-else variant="ghost" @click="removable = true">恢复提示</je-button>
    </DemoBlock>

    <DemoBlock title="居中与自定义图标" description="center 让内容居中；show-icon=false 可隐藏左侧图标，也可用插槽自定义内容。">
      <je-alert type="info" title="内容居中显示" center show-icon />
      <je-alert type="warning" title="不显示图标" :show-icon="false" description="关闭图标后的紧凑形态。" />
      <je-alert type="success">
        <template #title>
          <span class="custom-title">
            <je-icon name="check" :size="14" />
            插槽标题
          </span>
        </template>
        <template #description>标题与描述都通过插槽自定义。</template>
      </je-alert>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.custom-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
