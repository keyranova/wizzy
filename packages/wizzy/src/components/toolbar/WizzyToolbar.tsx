import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $isDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode"
import { Dispatch, Fragment, useCallback, useEffect, useState } from "react"
import { Group, Toolbar } from "react-aria-components"
import {
  $isCodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  CODE_LANGUAGE_MAP,
} from "@lexical/code"
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list"
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { $isParentElementRTL, $patchStyleText } from "@lexical/selection"
import { $isTableNode, INSERT_TABLE_COMMAND } from "@lexical/table"
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister,
} from "@lexical/utils"
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  ElementFormatType,
  FORMAT_TEXT_COMMAND,
  KEY_MODIFIER_COMMAND,
  NodeKey,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical"
import { IS_APPLE } from "../../utils/environment"
import { getSelectedNode } from "../../utils/get-selected-node"
import { sanitizeUrl } from "../../utils/url"
import { Divider } from "./Divider"
import { ActionButton } from "./ActionButton"
import { ActionToggle } from "./ActionToggle"
import { BlockFormatDropdown } from "./BlockFormatDropdown"
import { AlignmentDropdown } from "./AlignmentDropdown"
import { DialogButton } from "./DialogButton"
import { NumberInput } from "../forms/NumberInput"

export const blockTypeToBlockName = {
  bullet: "Bulleted List",
  check: "Check List",
  code: "Code Block",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  number: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
}

export const rootTypeToRootName = {
  root: "Root",
  table: "Table",
}

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = []

  for (const [lang, friendlyName] of Object.entries(
    CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  )) {
    options.push([lang, friendlyName])
  }

  return options
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions()

interface WizzyToolbarProps {
  setIsLinkEditMode: Dispatch<boolean>
  toolbar: string[][]
}

export const WizzyToolbar = ({
  setIsLinkEditMode,
  toolbar,
}: WizzyToolbarProps) => {
  const [editor] = useLexicalComposerContext()

  const [activeEditor, setActiveEditor] = useState(editor)
  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>("paragraph")
  const [rootType, setRootType] =
    useState<keyof typeof rootTypeToRootName>("root")
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null,
  )
  const [elementFormat, setElementFormat] = useState<ElementFormatType>("left")

  const [isLink, setIsLink] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [isRTL, setIsRTL] = useState(false)
  const [codeLanguage, setCodeLanguage] = useState<string>("")
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())
  const [rows, setRows] = useState(5)
  const [columns, setColumns] = useState(5)

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection()

    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode()
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent()
              return parent !== null && $isRootOrShadowRoot(parent)
            })

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow()
      }

      const elementKey = element.getKey()
      const elementDOM = activeEditor.getElementByKey(elementKey)

      // Update text format
      setIsBold(selection.hasFormat("bold"))
      setIsItalic(selection.hasFormat("italic"))
      setIsUnderline(selection.hasFormat("underline"))
      setIsStrikethrough(selection.hasFormat("strikethrough"))
      setIsSubscript(selection.hasFormat("subscript"))
      setIsSuperscript(selection.hasFormat("superscript"))
      setIsCode(selection.hasFormat("code"))
      setIsRTL($isParentElementRTL(selection))

      // Update links
      const node = getSelectedNode(selection)
      const parent = node.getParent()
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }

      const tableNode = $findMatchingParent(node, $isTableNode)
      if ($isTableNode(tableNode)) {
        setRootType("table")
      } else {
        setRootType("root")
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey)

        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          )
          const type = parentList
            ? parentList.getListType()
            : element.getListType()
          setBlockType(type)
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType()
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName)
          }
          if ($isCodeNode(element)) {
            const language =
              element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP
            setCodeLanguage(
              language ? CODE_LANGUAGE_MAP[language] || language : "",
            )
            return
          }
        }
      }

      // Handle buttons
      let matchingParent
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        )
      }

      // If matchingParent is a valid node, pass it's format type
      setElementFormat(
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || "left",
      )
    }
  }, [activeEditor])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        $updateToolbar()
        setActiveEditor(newEditor)
        return false
      },
      COMMAND_PRIORITY_CRITICAL,
    )
  }, [editor, $updateToolbar])

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable)
      }),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar()
        })
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    )
  }, [$updateToolbar, activeEditor, editor])

  useEffect(() => {
    return activeEditor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (payload) => {
        const event: KeyboardEvent = payload
        const { code, ctrlKey, metaKey } = event

        if (code === "KeyK" && (ctrlKey || metaKey)) {
          event.preventDefault()
          let url: string | null
          if (!isLink) {
            setIsLinkEditMode(true)
            url = sanitizeUrl("https://")
          } else {
            setIsLinkEditMode(false)
            url = null
          }
          return activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
        }
        return false
      },
      COMMAND_PRIORITY_NORMAL,
    )
  }, [activeEditor, isLink, setIsLinkEditMode])

  const formatNumberedList = () => {
    if (blockType !== "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    }
  }

  const formatBulletList = () => {
    if (blockType !== "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    }
  }

  const formatCheckList = () => {
    if (blockType !== "check") {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    }
  }

  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const anchor = selection.anchor
        const focus = selection.focus
        const nodes = selection.getNodes()

        if (anchor.key === focus.key && anchor.offset === focus.offset) {
          return
        }

        nodes.forEach((node, idx) => {
          // We split the first and last node by the selection
          // So that we don't format unselected text inside those nodes
          if ($isTextNode(node)) {
            // Use a separate variable to ensure TS does not lose the refinement
            let textNode = node
            if (idx === 0 && anchor.offset !== 0) {
              textNode = textNode.splitText(anchor.offset)[1] || textNode
            }
            if (idx === nodes.length - 1) {
              textNode = textNode.splitText(focus.offset)[0] || textNode
            }

            if (textNode.__style !== "") {
              textNode.setStyle("")
            }
            if (textNode.__format !== 0) {
              textNode.setFormat(0)
              $getNearestBlockElementAncestorOrThrow(textNode).setFormat("")
            }
            node = textNode
          } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
            node.replace($createParagraphNode(), true)
          } else if ($isDecoratorBlockNode(node)) {
            node.setFormat("")
          }
        })
      }
    })
  }, [activeEditor])

  const renderElement = (name: string) => {
    switch (name) {
      case "undo":
        return (
          <ActionButton
            aria-label={IS_APPLE ? "Undo (⌘Z)" : "Undo (Ctrl+Z)"}
            icon="Undo2"
            isDisabled={!canUndo || !isEditable}
            onPress={() => {
              activeEditor.dispatchCommand(UNDO_COMMAND, undefined)
            }}
          />
        )
      case "redo":
        return (
          <ActionButton
            aria-label={IS_APPLE ? "Redo (⌘Y)" : "Redo (Ctrl+Y)"}
            icon="Redo2"
            isDisabled={!canRedo || !isEditable}
            onPress={() => {
              activeEditor.dispatchCommand(REDO_COMMAND, undefined)
            }}
          />
        )
      case "block_formats":
        return (
          <>
            {blockType in blockTypeToBlockName && activeEditor === editor && (
              <BlockFormatDropdown
                disabled={!isEditable}
                blockType={blockType}
                editor={editor}
              />
            )}
          </>
        )
      case "bold":
        return (
          <ActionToggle
            icon="Bold"
            aria-label={`Format text as bold. Shortcut: ${
              IS_APPLE ? "⌘B" : "Ctrl+B"
            }`}
            isSelected={isBold}
            onPress={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
            }}
          />
        )
      case "italic":
        return (
          <ActionToggle
            icon="Italic"
            aria-label={`Format text as italics. Shortcut: ${
              IS_APPLE ? "⌘I" : "Ctrl+I"
            }`}
            isSelected={isItalic}
            onPress={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
            }}
          />
        )
      case "underline":
        return (
          <ActionToggle
            icon="Underline"
            aria-label={`Format text to underlined. Shortcut: ${
              IS_APPLE ? "⌘U" : "Ctrl+U"
            }`}
            isSelected={isUnderline}
            onPress={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
            }}
          />
        )
      case "strikethrough":
        return (
          <ActionToggle
            icon="Strikethrough"
            aria-label="Format text with a strikethrough"
            isSelected={isStrikethrough}
            onPress={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
            }}
          />
        )
      case "subscript":
        return (
          <ActionToggle
            icon="Subscript"
            aria-label="Format text with a subscript"
            isSelected={isSubscript}
            onPress={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")
            }}
          />
        )
      case "superscript":
        return (
          <ActionToggle
            icon="Superscript"
            aria-label="Format text with a superscript"
            isSelected={isSuperscript}
            onPress={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")
            }}
          />
        )
      case "clear_format":
        return (
          <ActionButton
            icon="RemoveFormatting"
            aria-label="Clear text formatting"
            onPress={clearFormatting}
          />
        )
      case "alignment":
        return (
          <AlignmentDropdown
            editor={editor}
            value={elementFormat}
            isRTL={isRTL}
            disabled={!isEditable}
          />
        )
      case "number_list":
        return (
          <ActionToggle
            icon="ListOrdered"
            aria-label={blockTypeToBlockName["number"]}
            isSelected={blockType === "number"}
            onPress={formatNumberedList}
          />
        )
      case "bullet_list":
        return (
          <ActionToggle
            icon="List"
            aria-label={blockTypeToBlockName["bullet"]}
            isSelected={blockType === "bullet"}
            onPress={formatBulletList}
          />
        )
      case "check_list":
        return (
          <ActionToggle
            icon="CheckSquare"
            aria-label={blockTypeToBlockName["check"]}
            isSelected={blockType === "check"}
            onPress={formatCheckList}
          />
        )
      case "code":
        return (
          <ActionToggle
            icon="Code"
            aria-label="Add inline code"
            isSelected={isCode}
            onPress={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
            }}
          />
        )
        break
      case "table":
        return (
          <DialogButton
            icon="Table"
            heading="Insert Table"
            submitText="Confirm"
            onSubmit={() => {
              activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
                columns: columns.toString(),
                rows: rows.toString(),
              })

              setRows(5)
              setColumns(5)
            }}
            aria-label="Insert table"
          >
            <NumberInput
              autoFocus
              defaultValue={rows}
              minValue={1}
              label="Rows"
            />

            <NumberInput defaultValue={columns} minValue={1} label="Columns" />
          </DialogButton>
        )
      default:
        return name
    }
  }

  return (
    <Toolbar
      aria-label="Text formatting"
      className="wiz-text-black wiz-flex wiz-flex-wrap wiz-items-center wiz-gap-2 wiz-border-b wiz-border-b-gray-86 wiz-bg-white wiz-p-2"
    >
      {toolbar.map((group: string[], index: number) => (
        <Fragment key={index}>
          {group.map((elem, index) => (
            <Fragment key={index}>{renderElement(elem)}</Fragment>
          ))}
          {index !== toolbar.length - 1 && <Divider />}
        </Fragment>
      ))}
    </Toolbar>
  )
}
