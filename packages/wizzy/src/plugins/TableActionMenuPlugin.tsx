import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import useLexicalEditable from "@lexical/react/useLexicalEditable"
import { ReactPortal, useCallback, useEffect, useRef, useState } from "react"
import { Button, ButtonProps } from "react-aria-components"
import { createPortal } from "react-dom"
import {
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $getElementGridForTableNode,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn,
  $insertTableRow,
  $isTableCellNode,
  $isTableRowNode,
  $unmergeCell,
  getTableSelectionFromTableElement,
  HTMLTableElementWithWithTableSelectionState,
  TableCellHeaderStates,
  TableCellNode,
  TableRowNode,
} from "@lexical/table"
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $INTERNAL_isPointSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  DEPRECATED_$computeGridMap,
  DEPRECATED_$getNodeTriplet,
  DEPRECATED_$isGridCellNode,
  DEPRECATED_$isGridSelection,
  type DEPRECATED_GridCellNode,
  type ElementNode,
  type GridSelection,
  type LexicalEditor,
} from "lexical"
import Icon from "../components/Icon"
import invariant from "../utils/invariant"

function computeSelectionCount(selection: GridSelection): {
  columns: number
  rows: number
} {
  const selectionShape = selection.getShape()
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1,
  }
}

// This is important when merging cells as there is no good way to re-merge weird shapes (a result
// of selecting merged cells and non-merged)
function isGridSelectionRectangular(selection: GridSelection): boolean {
  const nodes = selection.getNodes()
  const currentRows: Array<number> = []
  let currentRow = null
  let expectedColumns = null
  let currentColumns = 0
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if ($isTableCellNode(node)) {
      const row = node.getParentOrThrow()
      invariant(
        $isTableRowNode(row),
        "Expected CellNode to have a RowNode parent",
      )
      if (currentRow !== row) {
        if (expectedColumns !== null && currentColumns !== expectedColumns) {
          return false
        }
        if (currentRow !== null) {
          expectedColumns = currentColumns
        }
        currentRow = row
        currentColumns = 0
      }
      const colSpan = node.__colSpan
      for (let j = 0; j < colSpan; j++) {
        if (currentRows[currentColumns + j] === undefined) {
          currentRows[currentColumns + j] = 0
        }
        currentRows[currentColumns + j] += node.__rowSpan
      }
      currentColumns += colSpan
    }
  }
  return (
    (expectedColumns === null || currentColumns === expectedColumns) &&
    currentRows.every((v) => v === currentRows[0])
  )
}

function $canUnmerge(): boolean {
  const selection = $getSelection()
  if (
    ($isRangeSelection(selection) && !selection.isCollapsed()) ||
    (DEPRECATED_$isGridSelection(selection) &&
      !selection.anchor.is(selection.focus)) ||
    (!$isRangeSelection(selection) && !DEPRECATED_$isGridSelection(selection))
  ) {
    return false
  }
  const [cell] = DEPRECATED_$getNodeTriplet(selection.anchor)
  return cell.__colSpan > 1 || cell.__rowSpan > 1
}

function $cellContainsEmptyParagraph(cell: DEPRECATED_GridCellNode): boolean {
  if (cell.getChildrenSize() !== 1) {
    return false
  }
  const firstChild = cell.getFirstChildOrThrow()
  if (!$isParagraphNode(firstChild) || !firstChild.isEmpty()) {
    return false
  }
  return true
}

function $selectLastDescendant(node: ElementNode): void {
  const lastDescendant = node.getLastDescendant()
  if ($isTextNode(lastDescendant)) {
    lastDescendant.select()
  } else if ($isElementNode(lastDescendant)) {
    lastDescendant.selectEnd()
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext()
  }
}

function currentCellBackgroundColor(editor: LexicalEditor): null | string {
  return editor.getEditorState().read(() => {
    const selection = $getSelection()
    if (
      $isRangeSelection(selection) ||
      DEPRECATED_$isGridSelection(selection)
    ) {
      const [cell] = DEPRECATED_$getNodeTriplet(selection.anchor)
      if ($isTableCellNode(cell)) {
        return cell.getBackgroundColor()
      }
    }
    return null
  })
}

function $moveSelectionToCell(cell: DEPRECATED_GridCellNode): void {
  const firstDescendant = cell.getFirstDescendant()
  if (firstDescendant == null) {
    cell.selectStart()
  } else {
    firstDescendant.getParentOrThrow().selectStart()
  }
}

const TableButton = ({ ...props }: ButtonProps) => (
  <Button
    className="wiz-mx-2 wiz-flex wiz-min-w-[6.25rem] wiz-max-w-xs wiz-flex-shrink-0 wiz-cursor-pointer wiz-flex-row wiz-content-center wiz-justify-between wiz-rounded-lg wiz-border-0 wiz-bg-white wiz-p-2 wiz-text-base wiz-leading-4"
    {...props}
  />
)

const TableButtonText = ({ children }: { children: React.ReactNode }) => (
  <span className="wiz-flex wiz-min-w-[9.375rem] wiz-flex-grow wiz-leading-5">
    {children}
  </span>
)

type TableCellActionMenuProps = Readonly<{
  contextRef: { current: null | HTMLElement }
  onClose: () => void
  setIsMenuOpen: (isOpen: boolean) => void
  showColorPickerModal: (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
  ) => void
  tableCellNode: TableCellNode
  cellMerge: boolean
}>

function TableActionMenu({
  onClose,
  tableCellNode: _tableCellNode,
  setIsMenuOpen,
  contextRef,
  cellMerge,
  showColorPickerModal,
}: TableCellActionMenuProps) {
  const [editor] = useLexicalComposerContext()
  const dropDownRef = useRef<HTMLDivElement | null>(null)
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode)
  const [selectionCounts, updateSelectionCounts] = useState({
    columns: 1,
    rows: 1,
  })
  const [canMergeCells, setCanMergeCells] = useState(false)
  const [canUnmergeCell, setCanUnmergeCell] = useState(false)
  // const [backgroundColor, setBackgroundColor] = useState(
  // 	() => currentCellBackgroundColor(editor) || "",
  // )

  useEffect(() => {
    return editor.registerMutationListener(TableCellNode, (nodeMutations) => {
      const nodeUpdated =
        nodeMutations.get(tableCellNode.getKey()) === "updated"

      if (nodeUpdated) {
        editor.getEditorState().read(() => {
          updateTableCellNode(tableCellNode.getLatest())
        })
        // setBackgroundColor(currentCellBackgroundColor(editor) || "")
      }
    })
  }, [editor, tableCellNode])

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      // Merge cells
      if (DEPRECATED_$isGridSelection(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection)
        updateSelectionCounts(computeSelectionCount(selection))
        setCanMergeCells(
          isGridSelectionRectangular(selection) &&
            (currentSelectionCounts.columns > 1 ||
              currentSelectionCounts.rows > 1),
        )
      }
      // Unmerge cell
      setCanUnmergeCell($canUnmerge())
    })
  }, [editor])

  useEffect(() => {
    const menuButtonElement = contextRef.current
    const dropDownElement = dropDownRef.current
    const rootElement = editor.getRootElement()

    if (
      menuButtonElement != null &&
      dropDownElement != null &&
      rootElement != null
    ) {
      const rootEleRect = rootElement.getBoundingClientRect()
      const menuButtonRect = menuButtonElement.getBoundingClientRect()
      dropDownElement.style.opacity = "1"
      const dropDownElementRect = dropDownElement.getBoundingClientRect()
      const margin = 5
      let leftPosition = menuButtonRect.right + margin
      if (
        leftPosition + dropDownElementRect.width > window.innerWidth ||
        leftPosition + dropDownElementRect.width > rootEleRect.right
      ) {
        const position =
          menuButtonRect.left - dropDownElementRect.width - margin
        leftPosition = (position < 0 ? margin : position) + window.scrollX
      }
      dropDownElement.style.left = `${leftPosition + window.scrollX}px`

      let topPosition = menuButtonRect.top
      if (topPosition + dropDownElementRect.height > window.innerHeight) {
        const position = menuButtonRect.bottom - dropDownElementRect.height
        topPosition = (position < 0 ? margin : position) + window.scrollY
      }
      dropDownElement.style.top = `${topPosition + +window.scrollY}px`
    }
  }, [contextRef, dropDownRef, editor])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropDownRef.current != null &&
        contextRef.current != null &&
        !dropDownRef.current.contains(event.target as Node) &&
        !contextRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("click", handleClickOutside)

    return () => window.removeEventListener("click", handleClickOutside)
  }, [setIsMenuOpen, contextRef])

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        const tableElement = editor.getElementByKey(
          tableNode.getKey(),
        ) as HTMLTableElementWithWithTableSelectionState

        if (!tableElement) {
          throw new Error("Expected to find tableElement in DOM")
        }

        const tableSelection = getTableSelectionFromTableElement(tableElement)
        if (tableSelection !== null) {
          tableSelection.clearHighlight()
        }

        tableNode.markDirty()
        updateTableCellNode(tableCellNode.getLatest())
      }

      const rootNode = $getRoot()
      rootNode.selectStart()
    })
  }, [editor, tableCellNode])

  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      const selection = $getSelection()
      if (DEPRECATED_$isGridSelection(selection)) {
        const { columns, rows } = computeSelectionCount(selection)
        const nodes = selection.getNodes()
        let firstCell: null | DEPRECATED_GridCellNode = null
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          if (DEPRECATED_$isGridCellNode(node)) {
            if (firstCell === null) {
              node.setColSpan(columns).setRowSpan(rows)
              firstCell = node
              const isEmpty = $cellContainsEmptyParagraph(node)
              let firstChild
              if (
                isEmpty &&
                $isParagraphNode((firstChild = node.getFirstChild()))
              ) {
                firstChild.remove()
              }
            } else if (DEPRECATED_$isGridCellNode(firstCell)) {
              const isEmpty = $cellContainsEmptyParagraph(node)
              if (!isEmpty) {
                firstCell.append(...node.getChildren())
              }
              node.remove()
            }
          }
        }
        if (firstCell !== null) {
          if (firstCell.getChildrenSize() === 0) {
            firstCell.append($createParagraphNode())
          }
          $selectLastDescendant(firstCell)
        }
        onClose()
      }
    })
  }

  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      $unmergeCell()
    })
  }

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean, count = 1) => {
      editor.update(() => {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        const tableGrid = $getElementGridForTableNode(editor, tableNode)

        const selection = $getSelection()
        invariant(
          $INTERNAL_isPointSelection(selection),
          "Expected a INTERNAL_PointSelection",
        )

        const anchor = selection.anchor.getNode()
        const focus = selection.focus.getNode()
        const [anchorCell] = DEPRECATED_$getNodeTriplet(anchor)
        const [focusCell, , grid] = DEPRECATED_$getNodeTriplet(focus)
        const [, focusCellMap, anchorCellMap] = DEPRECATED_$computeGridMap(
          grid,
          focusCell,
          anchorCell,
        )
        const startRow = shouldInsertAfter
          ? Math.max(focusCellMap.startRow, anchorCellMap.startRow)
          : Math.min(focusCellMap.startRow, anchorCellMap.startRow)

        $insertTableRow(
          tableNode,
          startRow,
          shouldInsertAfter,
          count,
          tableGrid,
        )

        onClose()
      })
    },
    [editor, onClose],
  )

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean, count = 1) => {
      editor.update(() => {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        const tableGrid = $getElementGridForTableNode(editor, tableNode)

        const selection = $getSelection()
        invariant(
          $INTERNAL_isPointSelection(selection),
          "Expected a PointSeleciton",
        )
        const anchor = selection.anchor.getNode()
        const focus = selection.focus.getNode()
        const [anchorCell] = DEPRECATED_$getNodeTriplet(anchor)
        const [focusCell, , grid] = DEPRECATED_$getNodeTriplet(focus)
        const [, focusCellMap, anchorCellMap] = DEPRECATED_$computeGridMap(
          grid,
          focusCell,
          anchorCell,
        )
        const startColumn = shouldInsertAfter
          ? Math.max(focusCellMap.startColumn, anchorCellMap.startColumn)
          : Math.min(focusCellMap.startColumn, anchorCellMap.startColumn)

        $insertTableColumn(
          tableNode,
          startColumn,
          shouldInsertAfter,
          count,
          tableGrid,
        )

        onClose()
      })
    },
    [editor, onClose, selectionCounts.columns],
  )

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL()
      onClose()
    })
  }, [editor, onClose])

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
      tableNode.remove()

      clearTableSelection()
      onClose()
    })
  }, [editor, tableCellNode, clearTableSelection, onClose])

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL()
      onClose()
    })
  }, [editor, onClose])

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode)

      const tableRows = tableNode.getChildren()

      if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
        throw new Error("Expected table cell to be inside of table row.")
      }

      const tableRow = tableRows[tableRowIndex]

      if (!$isTableRowNode(tableRow)) {
        throw new Error("Expected table row")
      }

      tableRow.getChildren().forEach((tableCell) => {
        if (!$isTableCellNode(tableCell)) {
          throw new Error("Expected table cell")
        }

        tableCell.toggleHeaderStyle(TableCellHeaderStates.ROW)
      })

      clearTableSelection()
      onClose()
    })
  }, [editor, tableCellNode, clearTableSelection, onClose])

  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

      const tableColumnIndex =
        $getTableColumnIndexFromTableCellNode(tableCellNode)

      const tableRows = tableNode.getChildren<TableRowNode>()
      const maxRowsLength = Math.max(
        ...tableRows.map((row) => row.getChildren().length),
      )

      if (tableColumnIndex >= maxRowsLength || tableColumnIndex < 0) {
        throw new Error("Expected table cell to be inside of table row.")
      }

      for (let r = 0; r < tableRows.length; r++) {
        const tableRow = tableRows[r]

        if (!$isTableRowNode(tableRow)) {
          throw new Error("Expected table row")
        }

        const tableCells = tableRow.getChildren()
        if (tableColumnIndex >= tableCells.length) {
          // if cell is outside of bounds for the current row (for example various merge cell cases) we shouldn't highlight it
          continue
        }

        const tableCell = tableCells[tableColumnIndex]

        if (!$isTableCellNode(tableCell)) {
          throw new Error("Expected table cell")
        }

        tableCell.toggleHeaderStyle(TableCellHeaderStates.COLUMN)
      }

      clearTableSelection()
      onClose()
    })
  }, [editor, tableCellNode, clearTableSelection, onClose])

  // const handleCellBackgroundColor = useCallback(
  // 	(value: string) => {
  // 		editor.update(() => {
  // 			const selection = $getSelection()
  // 			if (
  // 				$isRangeSelection(selection) ||
  // 				DEPRECATED_$isGridSelection(selection)
  // 			) {
  // 				const [cell] = DEPRECATED_$getNodeTriplet(selection.anchor)
  // 				if ($isTableCellNode(cell)) {
  // 					cell.setBackgroundColor(value)
  // 				}

  // 				if (DEPRECATED_$isGridSelection(selection)) {
  // 					const nodes = selection.getNodes()

  // 					for (let i = 0; i < nodes.length; i++) {
  // 						const node = nodes[i]
  // 						if ($isTableCellNode(node)) {
  // 							node.setBackgroundColor(value)
  // 						}
  // 					}
  // 				}
  // 			}
  // 		})
  // 	},
  // 	[editor],
  // )

  let mergeCellButton: null | JSX.Element = null
  if (cellMerge) {
    if (canMergeCells) {
      mergeCellButton = (
        <TableButton
          onPress={() => mergeTableCellsAtSelection()}
          data-test-id="table-merge-cells"
        >
          Merge cells
        </TableButton>
      )
    } else if (canUnmergeCell) {
      mergeCellButton = (
        <TableButton
          onPress={() => unmergeTableCellsAtSelection()}
          data-test-id="table-unmerge-cells"
        >
          Unmerge cells
        </TableButton>
      )
    }
  }

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="wiz-fixed wiz-z-50 wiz-block wiz-min-h-[2.5rem] wiz-rounded-lg wiz-bg-white wiz-shadow-2xl wiz-text-black"
      ref={dropDownRef}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      {mergeCellButton}
      {/* <Button
				className="mx-2 flex min-w-[6.25rem] max-w-xs flex-shrink-0 cursor-pointer flex-row content-center justify-between rounded-lg border-0 bg-white p-2 text-base leading-4"
				// onClick={() =>
				// 	showColorPickerModal("Cell background color", () => (
				// 		<ColorPicker
				// 			color={backgroundColor}
				// 			onChange={handleCellBackgroundColor}
				// 		/>
				// 	))
				// }
				data-test-id="table-background-color"
			>
				<span className="flex min-w-[9.375rem] flex-grow leading-5">
					Background color
				</span>
			</Button> */}
      {/* <hr className="wiz-border-gray-86" /> */}
      <TableButton
        onPress={() => insertTableRowAtSelection(false, selectionCounts.rows)}
        data-test-id="table-insert-row-above"
      >
        <TableButtonText>
          Insert{" "}
          {selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`}{" "}
          above
        </TableButtonText>
      </TableButton>
      <TableButton
        onPress={() => insertTableRowAtSelection(true, selectionCounts.rows)}
        data-test-id="table-insert-row-below"
      >
        <TableButtonText>
          Insert{" "}
          {selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`}{" "}
          below
        </TableButtonText>
      </TableButton>
      <hr className="wiz-border-gray-86" />
      <TableButton
        onPress={() =>
          insertTableColumnAtSelection(false, selectionCounts.columns)
        }
        data-test-id="table-insert-column-before"
      >
        <TableButtonText>
          Insert{" "}
          {selectionCounts.columns === 1
            ? "column"
            : `${selectionCounts.columns} columns`}{" "}
          left
        </TableButtonText>
      </TableButton>
      <TableButton
        onPress={() =>
          insertTableColumnAtSelection(true, selectionCounts.columns)
        }
        data-test-id="table-insert-column-after"
      >
        <TableButtonText>
          Insert{" "}
          {selectionCounts.columns === 1
            ? "column"
            : `${selectionCounts.columns} columns`}{" "}
          right
        </TableButtonText>
      </TableButton>
      <hr className="wiz-border-gray-86" />
      <TableButton
        onPress={() => deleteTableColumnAtSelection()}
        data-test-id="table-delete-columns"
      >
        <TableButtonText>Delete column</TableButtonText>
      </TableButton>
      <TableButton
        onPress={() => deleteTableRowAtSelection()}
        data-test-id="table-delete-rows"
      >
        <TableButtonText>Delete row</TableButtonText>
      </TableButton>
      <TableButton
        onPress={() => deleteTableAtSelection()}
        data-test-id="table-delete"
      >
        <TableButtonText>Delete table</TableButtonText>
      </TableButton>
      <hr className="wiz-border-gray-86" />
      <TableButton onPress={() => toggleTableRowIsHeader()}>
        <TableButtonText>
          {(tableCellNode.__headerState & TableCellHeaderStates.ROW) ===
          TableCellHeaderStates.ROW
            ? "Remove"
            : "Add"}{" "}
          row header
        </TableButtonText>
      </TableButton>
      <TableButton
        onPress={() => toggleTableColumnIsHeader()}
        data-test-id="table-column-header"
      >
        <TableButtonText>
          {(tableCellNode.__headerState & TableCellHeaderStates.COLUMN) ===
          TableCellHeaderStates.COLUMN
            ? "Remove"
            : "Add"}{" "}
          column header
        </TableButtonText>
      </TableButton>
    </div>,
    document.body,
  )
}

function TableCellActionMenuContainer({
  anchorElem,
  cellMerge,
}: {
  anchorElem: HTMLElement
  cellMerge: boolean
}): JSX.Element {
  const [editor] = useLexicalComposerContext()

  const menuButtonRef = useRef(null)
  const menuRootRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(
    null,
  )

  // const [colorPickerModal, showColorPickerModal] = useModal();

  const moveMenu = useCallback(() => {
    const menu = menuButtonRef.current
    const selection = $getSelection()
    const nativeSelection = window.getSelection()
    const activeElement = document.activeElement

    if (selection == null || menu == null) {
      setTableMenuCellNode(null)
      return
    }

    const rootElement = editor.getRootElement()

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode(),
      )

      if (tableCellNodeFromSelection == null) {
        setTableMenuCellNode(null)
        return
      }

      const tableCellParentNodeDOM = editor.getElementByKey(
        tableCellNodeFromSelection.getKey(),
      )

      if (tableCellParentNodeDOM == null) {
        setTableMenuCellNode(null)
        return
      }

      setTableMenuCellNode(tableCellNodeFromSelection)
    } else if (!activeElement) {
      setTableMenuCellNode(null)
    }
  }, [editor])

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        moveMenu()
      })
    })
  })

  useEffect(() => {
    const menuButtonDOM = menuButtonRef.current as HTMLButtonElement | null

    if (menuButtonDOM != null && tableCellNode != null) {
      const tableCellNodeDOM = editor.getElementByKey(tableCellNode.getKey())

      if (tableCellNodeDOM != null) {
        const tableCellRect = tableCellNodeDOM.getBoundingClientRect()
        const menuRect = menuButtonDOM.getBoundingClientRect()
        const anchorRect = anchorElem.getBoundingClientRect()

        const top = tableCellRect.top - anchorRect.top + 4
        const left = tableCellRect.right - menuRect.width - 10 - anchorRect.left

        menuButtonDOM.style.opacity = "1"
        menuButtonDOM.style.transform = `translate(${left}px, ${top}px)`
      } else {
        menuButtonDOM.style.opacity = "0"
        menuButtonDOM.style.transform = "translate(-10000px, -10000px)"
      }
    }
  }, [menuButtonRef, tableCellNode, editor, anchorElem])

  const prevTableCellDOM = useRef(tableCellNode)

  useEffect(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false)
    }

    prevTableCellDOM.current = tableCellNode
  }, [prevTableCellDOM, tableCellNode])

  return (
    <div
      className="wiz-absolute wiz-left-0 wiz-top-0 wiz-will-change-transform"
      ref={menuButtonRef}
    >
      {tableCellNode != null && (
        <>
          <Button
            className="wiz-relative -wiz-mr-1 wiz-flex wiz-cursor-pointer wiz-items-center wiz-justify-center wiz-rounded-2xl wiz-border-0"
            onPress={() => {
              setIsMenuOpen(!isMenuOpen)
            }}
            ref={menuRootRef}
            aria-label="Open table cell menu"
          >
            <Icon name="ChevronDown" size={16} />
          </Button>
          {/* {colorPickerModal} */}
          {isMenuOpen && (
            <TableActionMenu
              contextRef={menuRootRef}
              setIsMenuOpen={setIsMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              tableCellNode={tableCellNode}
              cellMerge={cellMerge}
              // showColorPickerModal={showColorPickerModal}
              showColorPickerModal={() => {}}
            />
          )}
        </>
      )}
    </div>
  )
}

export default function TableActionMenuPlugin({
  anchorElem = document.body,
  cellMerge = false,
}: {
  anchorElem?: HTMLElement
  cellMerge?: boolean
}): null | ReactPortal {
  const isEditable = useLexicalEditable()
  return createPortal(
    isEditable ? (
      <TableCellActionMenuContainer
        anchorElem={anchorElem}
        cellMerge={cellMerge}
      />
    ) : null,
    anchorElem,
  )
}
