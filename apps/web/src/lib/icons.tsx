import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  Bookmark01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  ClipboardPasteIcon,
  Home01Icon,
  InformationCircleIcon,
  Loading02Icon,
  MultiplicationSignCircleIcon,
  PencilEdit02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { ComponentProps } from "react";

export const PHONE_ICON_STROKE = 1.75;

export const phoneIconSize = {
  tab: 24,
  rail: 24,
  sheet: 20,
  feed: 20,
  empty: 32,
  toast: 16,
  sheetClose: 16,
} as const;

const registry = {
  home: Home01Icon,
  plus: Add01Icon,
  bookmark: Bookmark01Icon,
  close: Cancel01Icon,
  pen: PencilEdit02Icon,
  paste: ClipboardPasteIcon,
  search: Search01Icon,
  toastSuccess: CheckmarkCircle01Icon,
  toastInfo: InformationCircleIcon,
  toastWarning: Alert02Icon,
  toastError: MultiplicationSignCircleIcon,
  toastLoading: Loading02Icon,
} as const;

export type AppIconName = keyof typeof registry;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
} & Omit<ComponentProps<typeof HugeiconsIcon>, "icon" | "size" | "strokeWidth">;

export function AppIcon({
  name,
  size = phoneIconSize.tab,
  strokeWidth = PHONE_ICON_STROKE,
  className,
  ...rest
}: AppIconProps) {
  return (
    <HugeiconsIcon
      icon={registry[name]}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={rest["aria-label"] ? undefined : true}
      {...rest}
    />
  );
}

export { registry as appIcons };
