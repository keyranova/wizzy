/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EditorThemeClasses } from "lexical"

import "./WizzyTheme.css"

const theme: EditorThemeClasses = {
  blockCursor: "WizzyTheme__blockCursor",
  characterLimit: "WizzyTheme__characterLimit",
  code: "WizzyTheme__code",
  codeHighlight: {
    atrule: "WizzyTheme__tokenAttr",
    attr: "WizzyTheme__tokenAttr",
    boolean: "WizzyTheme__tokenProperty",
    builtin: "WizzyTheme__tokenSelector",
    cdata: "WizzyTheme__tokenComment",
    char: "WizzyTheme__tokenSelector",
    class: "WizzyTheme__tokenFunction",
    "class-name": "WizzyTheme__tokenFunction",
    comment: "WizzyTheme__tokenComment",
    constant: "WizzyTheme__tokenProperty",
    deleted: "WizzyTheme__tokenProperty",
    doctype: "WizzyTheme__tokenComment",
    entity: "WizzyTheme__tokenOperator",
    function: "WizzyTheme__tokenFunction",
    important: "WizzyTheme__tokenVariable",
    inserted: "WizzyTheme__tokenSelector",
    keyword: "WizzyTheme__tokenAttr",
    namespace: "WizzyTheme__tokenVariable",
    number: "WizzyTheme__tokenProperty",
    operator: "WizzyTheme__tokenOperator",
    prolog: "WizzyTheme__tokenComment",
    property: "WizzyTheme__tokenProperty",
    punctuation: "WizzyTheme__tokenPunctuation",
    regex: "WizzyTheme__tokenVariable",
    selector: "WizzyTheme__tokenSelector",
    string: "WizzyTheme__tokenSelector",
    symbol: "WizzyTheme__tokenProperty",
    tag: "WizzyTheme__tokenProperty",
    url: "WizzyTheme__tokenOperator",
    variable: "WizzyTheme__tokenVariable",
  },
  embedBlock: {
    base: "WizzyTheme__embedBlock",
    focus: "WizzyTheme__embedBlockFocus",
  },
  hashtag: "WizzyTheme__hashtag",
  heading: {
    h1: "WizzyTheme__h1",
    h2: "WizzyTheme__h2",
    h3: "WizzyTheme__h3",
    h4: "WizzyTheme__h4",
    h5: "WizzyTheme__h5",
    h6: "WizzyTheme__h6",
  },
  image: "editor-image",
  indent: "WizzyTheme__indent",
  inlineImage: "inline-editor-image",
  layoutContainer: "WizzyTheme__layoutContainer",
  layoutItem: "WizzyTheme__layoutItem",
  link: "WizzyTheme__link",
  list: {
    listitem: "WizzyTheme__listItem",
    listitemChecked: "WizzyTheme__listItemChecked",
    listitemUnchecked: "WizzyTheme__listItemUnchecked",
    nested: {
      listitem: "WizzyTheme__nestedListItem",
    },
    olDepth: [
      "WizzyTheme__ol1",
      "WizzyTheme__ol2",
      "WizzyTheme__ol3",
      "WizzyTheme__ol4",
      "WizzyTheme__ol5",
    ],
    ul: "WizzyTheme__ul",
  },
  ltr: "WizzyTheme__ltr",
  mark: "WizzyTheme__mark",
  markOverlap: "WizzyTheme__markOverlap",
  paragraph: "WizzyTheme__paragraph",
  quote: "WizzyTheme__quote",
  rtl: "WizzyTheme__rtl",
  table: "WizzyTheme__table",
  tableAddColumns: "WizzyTheme__tableAddColumns",
  tableAddRows: "WizzyTheme__tableAddRows",
  tableCell: "WizzyTheme__tableCell",
  tableCellActionButton: "WizzyTheme__tableCellActionButton",
  tableCellActionButtonContainer: "WizzyTheme__tableCellActionButtonContainer",
  tableCellEditing: "WizzyTheme__tableCellEditing",
  tableCellHeader: "WizzyTheme__tableCellHeader",
  tableCellPrimarySelected: "WizzyTheme__tableCellPrimarySelected",
  tableCellResizer: "WizzyTheme__tableCellResizer",
  tableCellSelected: "WizzyTheme__tableCellSelected",
  tableCellSortedIndicator: "WizzyTheme__tableCellSortedIndicator",
  tableResizeRuler: "WizzyTheme__tableCellResizeRuler",
  tableSelected: "WizzyTheme__tableSelected",
  tableSelection: "WizzyTheme__tableSelection",
  text: {
    bold: "WizzyTheme__textBold",
    code: "WizzyTheme__textCode",
    italic: "WizzyTheme__textItalic",
    strikethrough: "WizzyTheme__textStrikethrough",
    subscript: "WizzyTheme__textSubscript",
    superscript: "WizzyTheme__textSuperscript",
    underline: "WizzyTheme__textUnderline",
    underlineStrikethrough: "WizzyTheme__textUnderlineStrikethrough",
  },
}

export default theme
