import { ref } from "../../dist/guide-mini-vue.esm.js";

window.self = null;
export const App = {
  name: "App",
  template: `<div>hi,{{count}}</div>`,
  setup() {
    return {
      count: (window.count = ref(1)),
    };
  },
};
