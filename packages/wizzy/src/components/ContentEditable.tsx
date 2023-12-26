import { ContentEditable } from "@lexical/react/LexicalContentEditable"

export default function LexicalContentEditable({
  className,
}: {
  className?: string
}): JSX.Element {
  return (
    <ContentEditable
      className={
        className ||
        "wiz-relative wiz-block wiz-min-h-[9.375rem] wiz-px-7 wiz-pb-10 wiz-pt-4 wiz-text-base wiz-outline-0"
      }
    />
  )
}
