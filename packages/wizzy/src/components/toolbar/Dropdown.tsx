import { icons } from "lucide-react"
import {
  Button,
  ListBox,
  ListBoxItem,
  ListBoxItemProps,
  Popover,
  SelectValue,
} from "react-aria-components"
import Icon from "../Icon"

interface DropdownProps {
  children: React.ReactNode
}

const Dropdown = ({ children }: DropdownProps) => (
  <Popover>
    <ListBox className="wiz-min-w-[10rem] wiz-rounded wiz-border wiz-border-gray-76 wiz-bg-white wiz-p-1">
      {children}
    </ListBox>
  </Popover>
)

export const DropdownButton = () => (
  <Button className="focus:wiz-border-blue hover:wiz-bg-gray-86 data-[pressed]:wiz-border-blue-49 wiz-flex wiz-min-w-[10rem] wiz-items-center wiz-gap-3 wiz-rounded wiz-px-3 wiz-py-2 wiz-transition-colors">
    <SelectValue className="wiz-flex wiz-items-center" />
    <Icon
      name="ChevronDown"
      size={16}
      aria-hidden="true"
      className="wiz-ml-auto"
    />
  </Button>
)

interface DropdownItemProps extends ListBoxItemProps {
  icon?: keyof typeof icons
  children: React.ReactNode
}

export const DropdownItem = ({
  icon,
  children,
  ...props
}: DropdownItemProps) => (
  <ListBoxItem
    className="data-[selected]:wiz-bg-gray-86 wiz-flex wiz-items-center wiz-rounded wiz-px-2 wiz-py-2 wiz-text-black"
    {...props}
  >
    {icon && <Icon name={icon} size={20} className="wiz-mr-2" />}
    {children}
  </ListBoxItem>
)

export default Dropdown
