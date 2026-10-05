<script setup lang="ts">
import { ref } from 'vue'
import { JeAffix, JeScrollbar } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const topFixed = ref(false)
const bottomFixed = ref(false)
const containerFixed = ref(false)
</script>

<template>
  <DemoPage
    title="Affix 固钉"
    description="滚动到阈值后把内容切成 position: fixed，并用占位元素顶住原高度；监听 scroll / resize / ResizeObserver，卸载时全部清理。"
  >
    <DemoBlock
      title="基础吸顶"
      description="向下滚动右侧内容区，元素到容器顶部时固定；change 事件会给出当前是否固定。"
    >
      <div class="tall">
        <je-affix target="#doc-scroll" :offset="0" @change="topFixed = $event">
          <div class="bar">距顶部 0px{{ topFixed ? '（已固定）' : '' }}</div>
        </je-affix>
        <p class="hint">这一块用来撑开高度，继续向下滚动就能看到吸顶效果。</p>
      </div>
    </DemoBlock>

    <DemoBlock
      title="吸附在指定容器内"
      description="target 传容器选择器，内容只在该容器的可见范围内吸顶，超出容器即恢复原位。"
    >
      <je-scrollbar id="affix-demo-scroll" class="scroll-area" :height="200">
        <div class="scroll-area__inner">
          <je-affix target="#affix-demo-scroll" :offset="8" @change="containerFixed = $event">
            <div class="bar bar--alt">容器内吸顶{{ containerFixed ? '（已固定）' : '' }}</div>
          </je-affix>
          <p v-for="index in 14" :key="index" class="scroll-line">第 {{ index }} 行内容</p>
        </div>
      </je-scrollbar>
    </DemoBlock>

    <DemoBlock
      title="吸底与层级"
      description="position='bottom' 吸附在视口底部，offset 控制间距，z-index 控制叠放层级。"
    >
      <div class="tall tall--short">
        <je-affix target="#doc-scroll" position="bottom" :offset="24" :z-index="600" @change="bottomFixed = $event">
          <div class="bar">距底部 24px{{ bottomFixed ? '（已固定）' : '' }}</div>
        </je-affix>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.tall {
  display: flex;
  flex-direction: column;
  height: 300px;
}

.tall--short {
  height: 200px;
}

.bar {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--je-text);
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-radius: var(--je-radius-sm);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 40%, transparent);
}

.bar--alt {
  background: var(--je-popup);
  border: var(--je-border);
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.scroll-area {
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.scroll-area__inner {
  /* 上内边距要大于 affix 的 offset，否则静止时就会命中吸顶阈值 */
  padding: 12px 14px;
}

.scroll-line {
  margin: 0;
  padding: 10px 0;
  font-size: 13px;
  color: var(--je-text-muted);
  border-bottom: var(--je-border);
}
</style>
