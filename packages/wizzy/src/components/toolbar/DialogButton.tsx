import { icons } from "lucide-react"
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Popover,
} from "react-aria-components"
import Icon from "../Icon"

interface DialogButtonProps {
  icon: keyof typeof icons
  heading?: string
  submitText: string
  onSubmit: () => void
  children: React.ReactNode
  ["aria-label"]: string
}

export const DialogButton = ({
  icon,
  heading,
  submitText,
  onSubmit,
  children,
  ...props
}: DialogButtonProps) => {
  return (
    <DialogTrigger>
      <Button
        aria-label={props["aria-label"]}
        type="button"
        className="wiz-cursor-pointer wiz-rounded wiz-p-1 wiz-transition-colors hover:wiz-bg-gray-86"
      >
        <Icon name={icon} size={20} />
      </Button>
      <Popover>
        <Dialog className="wiz-relative wiz-rounded-md wiz-border wiz-border-gray-86 wiz-bg-white wiz-text-black">
          {({ close }) => (
            <form>
              <div className="wiz-absolute -wiz-top-2 wiz-left-1/2 -wiz-ml-2 wiz-h-4 wiz-w-4 -wiz-rotate-45 wiz-border-r wiz-border-t wiz-border-gray-86 wiz-bg-white" />
              {heading && (
                <Heading
                  slot="title"
                  className="wiz-border-b wiz-border-b-gray-86 wiz-px-4 wiz-py-2 wiz-text-lg wiz-font-bold"
                >
                  {heading}
                </Heading>
              )}
              <div className="wiz-p-4">
                {children}

                <Button
                  className="wiz-mt-2 wiz-rounded-lg wiz-bg-blue-49 wiz-px-4 wiz-py-2 wiz-text-white"
                  onPress={() => {
                    close()
                    onSubmit()
                  }}
                >
                  {submitText}
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
