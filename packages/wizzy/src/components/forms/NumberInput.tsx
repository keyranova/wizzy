import {
  Button,
  Group,
  Input,
  Label,
  NumberField,
  NumberFieldProps,
} from "react-aria-components"
import Icon from "../Icon"

interface NumberInputProps extends NumberFieldProps {
  label: string
}

export const NumberInput = ({ label, ...props }: NumberInputProps) => (
  <NumberField className="wiz-relative wiz-mb-2" {...props}>
    <Label className="wiz-text-xs wiz-font-bold wiz-uppercase wiz-text-gray-41">
      {label}
    </Label>
    <Group>
      <Button
        slot="decrement"
        className="wiz-absolute wiz-bottom-0 wiz-right-0 wiz-flex wiz-h-5 wiz-w-6 wiz-items-center wiz-justify-center wiz-border-l wiz-border-t wiz-border-gray-86 wiz-font-bold wiz-leading-none wiz-text-gray-60"
      >
        <Icon name="Minus" size={14} />
      </Button>
      <Input className="wiz-h-10 wiz-rounded wiz-border wiz-border-gray-86 wiz-px-3 wiz-py-1" />
      <Button
        slot="increment"
        className="wiz-absolute wiz-bottom-5 wiz-right-0 wiz-flex wiz-h-5 wiz-w-6 wiz-items-center wiz-justify-center wiz-border-l wiz-border-gray-86 wiz-font-bold wiz-leading-none wiz-text-gray-60"
      >
        <Icon name="Plus" size={14} />
      </Button>
    </Group>
  </NumberField>
)
