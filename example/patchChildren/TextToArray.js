// 老的是 array 新的是text
import { h,ref } from "../../lib/guide-mini-vue.esm.js";

const nextChildren = [h("div", {}, "A"), h("div", {}, "B")];
const prevChildren = "oldChildren";

export default {
  name: "ArrayToText",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;

    return {
      isChange,
    };
  },
  render() {
    const self = this;

    return self.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
