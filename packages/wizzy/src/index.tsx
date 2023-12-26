"use client"

import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { SharedHistoryContext } from "./context/SharedHistoryContext"
import WizzyNodes from "./nodes/WizzyNodes"
import WizzyTheme from "./themes/WizzyTheme"
import { WizzyEditor } from "./components/WizzyEditor"
import { TableContext } from "./plugins/TablePlugin"

interface WizzyProps {
  isRichText?: boolean
  draggableBlocks?: boolean
  toolbar?: string[][]
}

const Wizzy = ({
  isRichText = true,
  draggableBlocks = true,
  toolbar = [
    ["undo", "redo"],
    ["block_formats"],
    ["bold", "italic", "underline", "strikethrough"],
    ["subscript", "superscript", "clear_format"],
    ["alignment"],
    ["number_list", "bullet_list", "check_list", "code", "table"],
  ],
}: WizzyProps) => {
  const initialConfig = {
    editorState: undefined,
    namespace: "wizzy",
    nodes: [...WizzyNodes],
    onError: (error: Error) => {
      throw error
    },
    theme: WizzyTheme,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <div className="wiz-relative wiz-text-black wiz-rounded-lg wiz-overflow-hidden wiz-shadow-lg">
          <TableContext>
            <WizzyEditor
              isRichText={isRichText}
              draggableBlocks={draggableBlocks}
              toolbar={toolbar}
            />
          </TableContext>
        </div>
      </SharedHistoryContext>
    </LexicalComposer>
  )
}

export default Wizzy
