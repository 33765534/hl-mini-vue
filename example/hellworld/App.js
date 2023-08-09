import { h } from "../../lib/guide-mini-vue.esm.js";

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
      "hi," + this.msg
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
