interface PlaceholderProps {
  children: React.ReactNode
  className?: string
}

export const Placeholder = ({ children, className }: PlaceholderProps) => (
  <div
    className={
      className ||
      "wiz-pointer-events-none wiz-absolute wiz-left-7 wiz-right-7 wiz-top-4 wiz-inline-block wiz-select-none wiz-overflow-hidden wiz-text-ellipsis wiz-whitespace-nowrap wiz-text-base wiz-text-gray-60"
    }
  >
    {children}
  </div>
)
