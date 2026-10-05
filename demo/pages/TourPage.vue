<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeTour } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

interface DemoTourStep {
  target: string
  title: string
  description: string
  placement?: 'top' | 'bottom'
}

const steps: DemoTourStep[] = [
  { target: '#tour-save', title: '保存文件', description: '把当前改动写回本地文件。' },
  {
    target: '#tour-share',
    title: '分享给同事',
    description: '生成链接后可邀请协作。',
    placement: 'top',
  },
  { target: '#tour-more', title: '更多操作', description: '导出、归档等操作都在这里。' },
]

const visible = ref(false)
const current = ref(0)
const log = ref('尚未开始')

const start = () => {
  current.value = 0
  visible.value = true
  log.value = '引导已开始'
}

const onChange = (value: number) => {
  log.value = `切换到第 ${value + 1} 步`
}
</script>

<template>
  <DemoPage
    title="Tour 漫游式引导"
    description="通过挖洞遮罩高亮目标元素，气泡用 useFloating 跟随锚点。高亮框监听 scroll / resize 实时更新，窄屏下气泡贴底居中显示。"
  >
    <DemoBlock title="基础用法" description="三步引导，最后一步按钮会变成「完成」；也可按 Esc 关闭。">
      <div class="toolbar">
        <button id="tour-save" type="button" class="target">保存</button>
        <button id="tour-share" type="button" class="target">分享</button>
        <button id="tour-more" type="button" class="target">更多</button>
      </div>
      <je-button @click="start">开始引导</je-button>
    </DemoBlock>

    <DemoBlock title="受控与事件" description="v-model 控制显隐，v-model:current 控制当前步骤，change / finish 抛出事件。">
      <p class="state">visible：{{ visible ? '展示中' : '已关闭' }}</p>
      <p class="state">当前第 {{ current + 1 }} 步 · {{ log }}</p>
    </DemoBlock>

    <DemoBlock title="方位与兜底" description="每个步骤可单独指定 placement；目标元素找不到时气泡会在视口居中显示。">
      <p class="state">把视口缩到 768px 以下，气泡不再跟随锚点，改为贴底居中。</p>
    </DemoBlock>

    <!-- 只有 Teleport，放哪里都不影响布局 -->
    <je-tour
      v-model="visible"
      v-model:current="current"
      :steps="steps"
      @change="onChange"
      @finish="log = '引导已完成'"
    />
  </DemoPage>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.target {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  font-family: inherit;
  font-size: 14px;
  color: var(--je-text-muted);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.state {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
