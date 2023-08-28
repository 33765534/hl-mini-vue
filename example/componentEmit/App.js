import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  render() {
    window.self = this;
    return h("div", {}, [
      h("div", {}, "App"),
      h(Foo, {
        onAdd() {
          console.log("onAdd");
        },
        onAddFoo() {
          console.log("onAddFoo");
        },
      }),
    ]);
  },
  setup() {
    return {};
  },
};
