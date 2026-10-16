/**
 * sortablejs 不带类型声明（package.json 既没有 types 字段、包里也没有 .d.ts），
 * 而 DefinitelyTyped 的 @types/sortablejs 只覆盖主入口 —— 本组件要的
 * multiDrag / selectedClass / multiDragClass / avoidImplicitDeselect 与 utils.select 这些
 * MultiDrag 插件的成员它都没有，装上去反而要到处断言。
 *
 * 这里做「整包 any」的兜底声明：组件里对 Sortable 的调用保持原样，也不额外造一套假类型。
 */
declare module 'sortablejs/modular/sortable.complete.esm.js'
