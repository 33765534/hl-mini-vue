import { h } from "../../lib/guide-mini-vue.esm.js";

import ArrayToText from "./ArrayToText.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";
import ArrayToArray from "./ArrayToArray.js";

export const App = {
  render() {
    return h(
      "div",
      {
        tId: 1,
      },
      [
        h("p", {}, "主页"),
        // 老的是 array 新的是text
        // h(ArrayToText),
        // 老的是 text 新的是text
        // h(TextToText),
        // 老的是 text 新的是Array
        // h(TextToArray),
        // 老的是 Array 新的是Array
        h(ArrayToArray),
      ]
    );
  },
  setup() {},
};
