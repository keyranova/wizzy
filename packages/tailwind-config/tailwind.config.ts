import type { Config } from "tailwindcss"

// We want each package to be responsible for its own content.
const config: Omit<Config, "content"> = {
  theme: {
    colors: {
      black: "#000000",
      white: "#ffffff",
      gray: {
        86: "#dadada",
        76: "#c2c2c2",
        60: "#999",
        41: "#65686c",
      },
      pink: "#ffbbbb",
      blue: {
        60: "#3d87f5",
        49: "#216fdb",
      },
      code: {
        attribute: "#07a",
        function: "#dd4a68",
        variable: "#e90",
        operator: "#9a6e3a",
        selector: "#690",
        property: "#905",
        punctuation: "#999",
        comment: "slategray",
      },
    },
    extend: {},
  },
  plugins: [],
}
export default config
