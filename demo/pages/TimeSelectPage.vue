<script setup lang="ts">
import { ref } from 'vue'
import { JeField, JeTimeSelect } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const time = ref('')
const limited = ref('')
const fixed = ref('09:30')
const changed = ref('')

const onChange = (value: string) => {
  changed.value = value
}
</script>

<template>
  <DemoPage
    title="TimeSelect 时间选择"
    description="按 step 从 start 生成到 end 的时间列表，可用 minTime / maxTime 过滤。支持键盘上下键移动、回车选择、Esc 关闭。窄屏下自动切换为底部弹出层。"
  >
    <DemoBlock title="基础用法" description="默认 08:00 到 20:00，每 30 分钟一档。">
      <je-field label="开始时间">
        <je-time-select v-model="time" @change="onChange" />
      </je-field>
      <p class="state">当前值：{{ time || 'null' }} · change 事件：{{ changed || '未触发' }}</p>
    </DemoBlock>

    <DemoBlock title="自定义范围与步长" description="step 设为 00:15，并用 minTime / maxTime 限制可选区间。">
      <je-field label="预约时间">
        <je-time-select v-model="limited" start="09:00" end="18:00" step="00:15" min-time="10:00" max-time="16:00" />
      </je-field>
      <p class="state">当前值：{{ limited || 'null' }}</p>
    </DemoBlock>

    <DemoBlock title="禁用与已有值">
      <je-field label="已选时间">
        <je-time-select v-model="fixed" />
      </je-field>
      <je-field label="禁用">
        <je-time-select disabled placeholder="不可选择" />
      </je-field>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
