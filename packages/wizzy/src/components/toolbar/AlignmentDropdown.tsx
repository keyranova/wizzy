import { icons } from "lucide-react"
import { Key, Label, Select } from "react-aria-components"
import {
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  LexicalEditor,
} from "lexical"
import Dropdown, { DropdownButton, DropdownItem } from "./Dropdown"

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, "">]: {
    icon: keyof typeof icons
    iconRTL: keyof typeof icons
    name: string
  }
} = {
  left: {
    icon: "AlignLeft",
    iconRTL: "AlignLeft",
    name: "Left Align",
  },
  center: {
    icon: "AlignCenter",
    iconRTL: "AlignCenter",
    name: "Center Align",
  },
  right: {
    icon: "AlignRight",
    iconRTL: "AlignRight",
    name: "Right Align",
  },
  justify: {
    icon: "AlignJustify",
    iconRTL: "AlignJustify",
    name: "Justify Align",
  },
  start: {
    icon: "AlignLeft",
    iconRTL: "AlignRight",
    name: "Start Align",
  },
  end: {
    icon: "AlignRight",
    iconRTL: "AlignLeft",
    name: "End Align",
  },
}

interface AlignmentDropdownProps {
  editor: LexicalEditor
  value: ElementFormatType
  isRTL: boolean
  disabled: boolean
}

export const AlignmentDropdown = ({
  editor,
  value,
  isRTL,
  disabled = false,
}: AlignmentDropdownProps) => {
  const onSelect = (selection: Key) => {
    editor.dispatchCommand(
      FORMAT_ELEMENT_COMMAND,
      selection as ElementFormatType,
    )
  }

  return (
    <Select
      className="wiz-relative"
      selectedKey={value || "left"}
      onSelectionChange={onSelect}
      isDisabled={disabled}
    >
      <Label className="wiz-sr-only">
        Formatting options for text alignment
      </Label>
      <DropdownButton />

      <Dropdown>
        {Object.entries(ELEMENT_FORMAT_OPTIONS).map((option) => {
          const [format, data] = option

          return (
            <DropdownItem
              key={format}
              id={format}
              icon={isRTL ? data.iconRTL : data.icon}
              textValue={data.name}
            >
              {data.name}
            </DropdownItem>
          )
        })}
      </Dropdown>
    </Select>
  )
}
