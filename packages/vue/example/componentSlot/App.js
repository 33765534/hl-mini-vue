import { h,createTextVNode } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  render() {
    const app = h("div", {}, "App");
    const foo = h(
      Foo,
      {},
      {
        header: () => [h("p", {}, "123"), createTextVNode("你好呀")],
        // 作用域插槽 header: ({ age }) => h("p", {}, "age:" + age),
        footer: () => h("p", {}, "456"),
      }
    );
    return h("div", {}, [app, foo]);
  },
  setup() {
    return {};
  },
};
