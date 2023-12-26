import { icons } from "lucide-react"
import { Button, ButtonProps } from "react-aria-components"
import Icon from "../Icon"

interface ActionButtonProps extends ButtonProps {
  icon: keyof typeof icons
}

export const ActionButton = ({ icon, ...props }: ActionButtonProps) => {
  return (
    <Button
      type="button"
      className="hover:wiz-bg-gray-86 wiz-cursor-pointer wiz-rounded wiz-p-1 wiz-transition-colors disabled:wiz-opacity-30"
      {...props}
    >
      <Icon name={icon} size={20} />
    </Button>
  )
}
