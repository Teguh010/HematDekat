import { Icon } from "@iconify/react";
import type { ComponentProps } from "react";

type IconProps = Omit<ComponentProps<typeof Icon>, "icon">;

export function SearchIcon(props: IconProps) {
  return <Icon icon="mdi:magnify" {...props} />;
}

export function LocateIcon(props: IconProps) {
  return <Icon icon="mdi:crosshairs" {...props} />;
}

export function FilterIcon(props: IconProps) {
  return <Icon icon="mdi:filter" {...props} />;
}

export function CloseIcon(props: IconProps) {
  return <Icon icon="mdi:close" {...props} />;
}

export function ChevronDownIcon(props: IconProps) {
  return <Icon icon="mdi:chevron-down" {...props} />;
}

export function MapIcon(props: IconProps) {
  return <Icon icon="mdi:map" {...props} />;
}

export function ListIcon(props: IconProps) {
  return <Icon icon="mdi:format-list-bulleted" {...props} />;
}

export function SatelliteIcon(props: IconProps) {
  return <Icon icon="mdi:satellite-variant" {...props} />;
}

export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return <Icon icon={filled ? "mdi:heart" : "mdi:heart-outline"} {...props} />;
}

export function BrandMark(props: IconProps) {
  return <Icon icon="mdi:rice" {...props} />;
}
