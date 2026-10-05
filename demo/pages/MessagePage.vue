<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeMessage, JeSpace, showMessage } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const visible = ref(false)

const showAll = () => {
  showMessage.success('保存成功')
  showMessage.info('已同步到云端', 2000)
  showMessage.warning('磁盘空间不足')
  showMessage.error('网络异常，请稍后重试', 0)
}

const closeable = () => {
  showMessage({ type: 'info', message: '这条消息不会自动关闭', duration: 0, showClose: true })
}
</script>

<template>
  <DemoPage
    title="Message 消息"
    description="顶部居中的轻量消息条，多条消息纵向堆叠。既支持组件式 v-model，也提供命令式 API。窄屏下自动变为通栏并预留顶部安全区。"
  >
    <DemoBlock
      title="基础用法"
      description="组件式：用 v-model 控制显隐，默认 3 秒后自动关闭。命令式 API 名为 showMessage，与标签名 Message / je-message 不重名，因此模板里写 kebab 或 PascalCase 都可以。"
    >
      <je-button @click="visible = true">显示消息</je-button>
      <je-message v-model="visible" message="这是一条普通消息" />
    </DemoBlock>

    <DemoBlock title="命令式 API" description="showMessage 与快捷方法会返回 { close } 句柄；duration 为 0 表示不自动关闭。">
      <je-space>
        <je-button @click="showMessage.success('操作成功')">成功</je-button>
        <je-button @click="showMessage.info('普通提示')">普通</je-button>
        <je-button @click="showMessage.warning('注意风险')">警告</je-button>
        <je-button @click="showMessage.error('出错了')">错误</je-button>
      </je-space>
      <je-space>
        <je-button @click="showAll">同时弹出四条</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock title="可关闭与自定义时长" description="showClose 打开关闭按钮；duration 为 0 时需手动关闭。">
      <je-button @click="closeable">不自动关闭的消息</je-button>
    </DemoBlock>

    <DemoBlock title="移动端说明" description="宽度缩到 768px 以下时，消息条宽度为 calc(100vw - 32px)，顶部叠加安全区，字号保持 14px。">
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
