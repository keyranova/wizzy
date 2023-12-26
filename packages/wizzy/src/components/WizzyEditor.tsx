import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import useLexicalEditable from "@lexical/react/useLexicalEditable"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import { useEffect, useState } from "react"
import { useSharedHistoryContext } from "../context/SharedHistoryContext"
import DraggableBlockPlugin from "../plugins/DraggableBlockPlugin"
import { CAN_USE_DOM } from "../utils/can-use-dom"
import { WizzyToolbar } from "./toolbar/WizzyToolbar"
import ContentEditable from "./ContentEditable"
import { Placeholder } from "./Placeholder"
import TableCellResizer from "../plugins/TableCellResizer"
import TableActionMenuPlugin from "../plugins/TableActionMenuPlugin"

interface WizzyEditorProps {
  isRichText?: boolean
  draggableBlocks?: boolean
  toolbar?: string[][]
}

export const WizzyEditor = ({
  isRichText,
  draggableBlocks,
  toolbar,
}: WizzyEditorProps) => {
  const { historyState } = useSharedHistoryContext()
  const isEditable = useLexicalEditable()

  const text = isRichText
    ? "Enter some rich text..."
    : "Enter some plain text..."
  const placeholder = <Placeholder>{text}</Placeholder>

  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false)
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport)
      }
    }
    updateViewPortWidth()
    window.addEventListener("resize", updateViewPortWidth)

    return () => {
      window.removeEventListener("resize", updateViewPortWidth)
    }
  }, [isSmallWidthViewport])

  return (
    <>
      {isRichText && (
        <WizzyToolbar
          setIsLinkEditMode={setIsLinkEditMode}
          toolbar={toolbar!}
        />
      )}
      <div className="wiz-relative">
        {isRichText ? (
          <>
            <HistoryPlugin externalHistoryState={historyState} />
            <RichTextPlugin
              contentEditable={
                <div className="wiz-relative wiz-bg-white">
                  <div ref={onRef}>
                    <ContentEditable />
                  </div>
                </div>
              }
              placeholder={placeholder}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <ListPlugin />
            <CheckListPlugin />
            <TablePlugin hasCellMerge hasCellBackgroundColor />
            <TableCellResizer />
            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                {draggableBlocks && (
                  <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                )}

                <TableActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge
                />
              </>
            )}
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable />}
              placeholder={placeholder}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
      </div>
    </>
  )
}
