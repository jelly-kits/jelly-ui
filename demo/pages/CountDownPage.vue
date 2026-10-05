<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeCountDown } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const countdown = ref<InstanceType<typeof JeCountDown> | null>(null)
const finished = ref('')

const onFinish = () => {
  finished.value = '倒计时结束'
}
</script>

<template>
  <DemoPage
    title="CountDown 倒计时"
    description="毫秒级倒计时组件，format 支持 DD/HH/mm/ss/S/SS/SSS 占位符，可手动开始 / 暂停 / 重置。"
  >
    <DemoBlock title="基础用法" description="time 为总时长（毫秒），默认自动开始。">
      <je-count-down :time="30 * 60 * 1000" />
      <div class="gap" />
      <je-count-down :time="100 * 60 * 60 * 1000" format="DD 天 HH 时 mm 分 ss 秒" />
    </DemoBlock>

    <DemoBlock title="毫秒级渲染" description="开启 millisecond 并配合 S/SS/SSS 占位符展示毫秒。">
      <je-count-down :time="10 * 1000" format="ss.SS" millisecond />
    </DemoBlock>

    <DemoBlock title="手动控制" description="通过模板 ref 调用 start / pause / reset。">
      <je-count-down
        ref="countdown"
        :time="60 * 1000"
        format="mm:ss"
        :auto-start="false"
        @finish="onFinish"
      />
      <div class="toolbar">
        <je-button size="small" @click="countdown?.start()">开始</je-button>
        <je-button size="small" variant="ghost" @click="countdown?.pause()">暂停</je-button>
        <je-button size="small" variant="ghost" @click="countdown?.reset()">重置</je-button>
      </div>
      <p class="hint">{{ finished || '点击开始后运行' }}</p>
    </DemoBlock>

    <DemoBlock title="自定义样式" description="默认是等宽数字，可直接用外部样式覆盖颜色与字号。">
      <je-count-down :time="5 * 60 * 1000" class="big" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.gap {
  height: 12px;
}

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

.big {
  font-size: 30px;
  color: var(--je-primary);
}
</style>
