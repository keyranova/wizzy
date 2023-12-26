import { CAN_USE_DOM } from "./can-use-dom"

export const IS_APPLE: boolean =
	CAN_USE_DOM && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
