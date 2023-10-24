import { h } from "../../dist/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
export const App = {
  // .vue
  // <template></template>
  // render
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["ref", "hard"],
        onClick() {
          console.log("click");
        },
      },
      [h("div", {}, "hi," + this.msg), h(Foo, { count: 1 })]
      // "hi," + this.msg
      // [h('p',{class:"red"},"hi"),h('p',{class:"blue"},"mini-vue")]
    );
  },
  setup() {
    // composition api

    return {
      msg: "mini-vue",
    };
  },
};
