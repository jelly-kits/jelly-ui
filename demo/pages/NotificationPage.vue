<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeNotification, JeSpace, jeNotify } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const visible = ref(false)

const corners = () => {
  jeNotify({ title: '右上角', message: '默认位置', position: 'top-right' })
  jeNotify.info({ title: '左上角', message: 'position 为 top-left', position: 'top-left' })
  jeNotify.warning({ title: '右下角', message: 'position 为 bottom-right', position: 'bottom-right' })
  jeNotify.error({ title: '左下角', message: 'position 为 bottom-left', position: 'bottom-left' })
}

const closeable = () => {
  jeNotify.success({
    title: '提交成功',
    message: '这条通知不会自动关闭，请点击关闭按钮。',
    duration: 0,
  })
}
</script>

<template>
  <DemoPage
    title="Notification 通知"
    description="右上角（可切换四角）的卡片式通知，包含标题、正文与关闭按钮。既支持组件式 v-model，也提供命令式 API。窄屏下统一改为顶部通栏。"
  >
    <DemoBlock title="基础用法" description="组件式：默认出现在右上角，默认 4.5 秒后自动关闭。">
      <je-button @click="visible = true">显示通知</je-button>
      <je-notification
        v-model="visible"
        title="新消息"
        message="你有一条未读消息，请及时查看。"
      />
    </DemoBlock>

    <DemoBlock title="语义类型" description="jeNotify 与快捷方法按类型着色，图标与语义色对应。">
      <je-space>
        <je-button @click="jeNotify.success({ title: '成功', message: '操作已完成' })">
          成功
        </je-button>
        <je-button @click="jeNotify.info({ title: '提示', message: '这是一条普通通知' })">
          普通
        </je-button>
        <je-button @click="jeNotify.warning({ title: '警告', message: '请检查配置' })">
          警告
        </je-button>
        <je-button @click="jeNotify.error({ title: '错误', message: '请求失败' })">
          错误
        </je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock title="四角位置" description="position 支持 top-right / top-left / bottom-right / bottom-left，同角内自动堆叠。">
      <je-button @click="corners">同时弹出四条</je-button>
      <je-button @click="closeable">不自动关闭</je-button>
    </DemoBlock>

    <DemoBlock title="移动端说明" description="宽度缩到 768px 以下时，改为顶部通栏（宽度 calc(100vw - 24px)），并预留顶部安全区。">
      <p class="hint">请缩小视口宽度查看移动端形态。</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
