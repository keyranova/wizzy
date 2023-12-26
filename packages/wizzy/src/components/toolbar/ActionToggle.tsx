import { icons } from "lucide-react"
import { ToggleButton, ToggleButtonProps } from "react-aria-components"
import Icon from "../Icon"

interface ActionToggleProps extends ToggleButtonProps {
  icon: keyof typeof icons
}

export const ActionToggle = ({ icon, ...props }: ActionToggleProps) => {
  return (
    <ToggleButton
      className="wiz-rounded wiz-p-1 wiz-transition-colors hover:wiz-bg-gray-86 data-[selected]:wiz-bg-blue-49 data-[selected]:wiz-text-white disabled:wiz-opacity-30"
      {...props}
    >
      <Icon name={icon} size={20} />
    </ToggleButton>
  )
}
