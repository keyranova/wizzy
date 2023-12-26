import type { Config } from "tailwindcss"
import sharedConfig from "@keyranova/tailwind-config"

const config: Pick<Config, "prefix" | "presets" | "content"> = {
  content: ["./src/**/*.tsx"],
  prefix: "wiz-",
  presets: [sharedConfig],
}

export default config
