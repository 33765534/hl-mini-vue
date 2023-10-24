import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Child = {
  name:"Child",
  setup(props) {
    return {};
  },
  render() {
    return h("div", {}, [h("div", {}, "child-props-msg:" + this.$props.msg)]);
  },
};
