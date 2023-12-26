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
  $isRangeSelection,
  LexicalEditor,
} from "lexical"
import { blockTypeToBlockName } from "./WizzyToolbar"
import Dropdown, { DropdownButton, DropdownItem } from "./Dropdown"
import { $createCodeNode } from "@lexical/code"

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

  const formatCode = () => {
    if (blockType !== "code") {
      editor.update(() => {
        let selection = $getSelection()

        if ($INTERNAL_isPointSelection(selection)) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode())
          } else {
            const textContent = selection.getTextContent()
            const codeNode = $createCodeNode()
            selection.insertNodes([codeNode])
            selection = $getSelection()
            if ($isRangeSelection(selection))
              selection.insertRawText(textContent)
          }
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
      case "code":
        formatCode()
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
        <DropdownItem
          id="paragraph"
          icon="Text"
          textValue={blockTypeToBlockName["paragraph"]}
        >
          {blockTypeToBlockName["paragraph"]}
        </DropdownItem>

        <DropdownItem
          id="h1"
          icon="Heading1"
          textValue={blockTypeToBlockName["h1"]}
        >
          {blockTypeToBlockName["h1"]}
        </DropdownItem>

        <DropdownItem
          id="h2"
          icon="Heading2"
          textValue={blockTypeToBlockName["h2"]}
        >
          {blockTypeToBlockName["h2"]}
        </DropdownItem>

        <DropdownItem
          id="h3"
          icon="Heading3"
          textValue={blockTypeToBlockName["h3"]}
        >
          {blockTypeToBlockName["h3"]}
        </DropdownItem>

        <DropdownItem
          id="h4"
          icon="Heading4"
          textValue={blockTypeToBlockName["h4"]}
        >
          {blockTypeToBlockName["h4"]}
        </DropdownItem>

        <DropdownItem
          id="h5"
          icon="Heading5"
          textValue={blockTypeToBlockName["h5"]}
        >
          {blockTypeToBlockName["h5"]}
        </DropdownItem>

        <DropdownItem
          id="h6"
          icon="Heading6"
          textValue={blockTypeToBlockName["h6"]}
        >
          {blockTypeToBlockName["h6"]}
        </DropdownItem>

        <DropdownItem
          id="quote"
          icon="Quote"
          textValue={blockTypeToBlockName["quote"]}
        >
          {blockTypeToBlockName["quote"]}
        </DropdownItem>

        <DropdownItem
          id="code"
          icon="Code"
          textValue={blockTypeToBlockName["code"]}
        >
          {blockTypeToBlockName["code"]}
        </DropdownItem>
      </Dropdown>
    </Select>
  )
}
