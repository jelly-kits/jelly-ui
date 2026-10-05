// 构建入口：只把全局 CSS token 拉进依赖图，让 Vite 产出 dist/style.css。
// 不从 src/index.ts 引入 —— 那里的导入会被 vue-tsc 原样写进 dist/index.d.ts，
// 变成一个指向不存在的 ./theme/variables.css 的悬空引用。
// 实测：该悬空引用对默认配置的消费端无害（TS 不解析纯副作用导入的解析），
// 但只要消费端开了 noUncheckedSideEffectImports（TS 5.6+），就会报 TS2307 编译失败 —— 因此拆开。
import './theme/variables.css'
