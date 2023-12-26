import { $isCodeNode } from "@lexical/code"
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $setSelection,
  LexicalEditor,
} from "lexical"
import { useState } from "react"

import { useDebounce } from "./utils"
import { Button } from "react-aria-components"
import Icon from "../../components/Icon"

interface Props {
  editor: LexicalEditor
  getCodeDOMNode: () => HTMLElement | null
}

export function CopyButton({ editor, getCodeDOMNode }: Props) {
  const [isCopyCompleted, setCopyCompleted] = useState<boolean>(false)

  const removeSuccessIcon = useDebounce(() => {
    setCopyCompleted(false)
  }, 1000)

  async function handleClick(): Promise<void> {
    const codeDOMNode = getCodeDOMNode()

    if (!codeDOMNode) {
      return
    }

    let content = ""

    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode)

      if ($isCodeNode(codeNode)) {
        content = codeNode.getTextContent()
      }

      const selection = $getSelection()
      $setSelection(selection)
    })

    try {
      await navigator.clipboard.writeText(content)
      setCopyCompleted(true)
      removeSuccessIcon()
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  return (
    <Button
      className="wiz-border wiz-border-transparent wiz-rounded wiz-bg-none wiz-cursor-pointer wiz-flex-shrink-0 wiz-flex wiz-items-center wiz-text-black/50 wiz-uppercase hover:wiz-opacity-90 active:wiz-bg-[rgb(232,232,250)] active:wiz-border-black/45 wiz-p-1 wiz-mr-1"
      onPress={handleClick}
      aria-label="copy"
    >
      {isCopyCompleted ? (
        <Icon
          name="CheckCircle"
          size={12}
          className="wiz-pointer-events-none"
        />
      ) : (
        <Icon name="Copy" size={12} className="wiz-pointer-events-none" />
      )}
    </Button>
  )
}
