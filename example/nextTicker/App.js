import {
  h,
  ref,
  nextTick,
  getCurrentInstance,
} from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();

    const onClick = () => {
      for (let i = 0; i < 100; i++) {
        count.value = i;
      }

      console.log(instance);
      debugger;
      nextTick(() => {
        console.log(instance);
      });
    };

    return { onClick, count };
  },
  render() {
    return h("div", {}, [
      h("button", { onClick: this.onClick }, "update"),
      h("p", {}, "count:" + this.count),
    ]);
  },
};
