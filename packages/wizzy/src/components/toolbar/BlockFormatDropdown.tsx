import { Key, Label, Select } from "react-aria-components"
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import {
  $createParagraphNode,
  $getSelection,
  $INTERNAL_isPointSelection,
  LexicalEditor,
} from "lexical"
import { blockTypeToBlockName } from "./WizzyToolbar"
import Dropdown, { DropdownButton, DropdownItem } from "./Dropdown"

interface BlockFormatDropdownProps {
  editor: LexicalEditor
  blockType: keyof typeof blockTypeToBlockName
  disabled?: boolean
}

export const BlockFormatDropdown = ({
  editor,
  blockType,
  disabled = false,
}: BlockFormatDropdownProps) => {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($INTERNAL_isPointSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode())
      }
    })
  }

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection()
        if ($INTERNAL_isPointSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize))
        }
      })
    }
  }

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection()
        if ($INTERNAL_isPointSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      })
    }
  }

  const onSelect = (selection: Key) => {
    switch (selection) {
      case "paragraph":
        formatParagraph()
        break
      case "quote":
        formatQuote()
        break
      default:
        formatHeading(selection as HeadingTagType)
        break
    }
  }

  return (
    <Select
      className="wiz-relative"
      selectedKey={blockType}
      onSelectionChange={onSelect}
      isDisabled={disabled}
    >
      <Label className="wiz-sr-only">Formatting options for text style</Label>
      <DropdownButton />
      <Dropdown>
        <DropdownItem id="paragraph" icon="Text" textValue="Normal">
          {blockTypeToBlockName["paragraph"]}
        </DropdownItem>

        <DropdownItem id="h1" icon="Heading1" textValue="Heading 1">
          {blockTypeToBlockName["h1"]}
        </DropdownItem>

        <DropdownItem id="h2" icon="Heading2" textValue="Heading 2">
          {blockTypeToBlockName["h2"]}
        </DropdownItem>

        <DropdownItem id="h3" icon="Heading3" textValue="Heading 3">
          {blockTypeToBlockName["h3"]}
        </DropdownItem>

        <DropdownItem id="h4" icon="Heading4" textValue="Heading 4">
          {blockTypeToBlockName["h4"]}
        </DropdownItem>

        <DropdownItem id="h5" icon="Heading5" textValue="Heading 5">
          {blockTypeToBlockName["h5"]}
        </DropdownItem>

        <DropdownItem id="h6" icon="Heading6" textValue="Heading 6">
          {blockTypeToBlockName["h6"]}
        </DropdownItem>

        <DropdownItem id="quote" icon="Quote" textValue="Quote">
          {blockTypeToBlockName["quote"]}
        </DropdownItem>
      </Dropdown>
    </Select>
  )
}
