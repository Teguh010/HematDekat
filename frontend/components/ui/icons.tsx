import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function LocateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </Icon>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </Icon>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </Icon>
  );
}

export function SatelliteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m13 7 4 4-7.5 7.5a2.1 2.1 0 0 1-3-3L14 7Z" />
      <path d="m17 3 4 4-2 2-4-4Z" />
      <path d="m2 14 2.5 2.5M5 11l2.5 2.5" />
    </Icon>
  );
}

/** Small rice-sack mark. Face cutouts use the light brand tint so they read on the sack. */
export function BrandMark(props: IconProps) {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M11.2 12.2c0-1.5 1-2.6 2.2-3.3C12.4 7.4 13.6 6 16 6s3.6 1.4 2.6 2.9c1.2.7 2.2 1.8 2.2 3.3 2 .6 3.7 2.3 3.7 4.8 0 4.6-3.2 8.2-8.5 8.2s-8.5-3.6-8.5-8.2c0-2.5 1.7-4.2 3.7-4.8Z"
      />
      <circle cx="13.4" cy="17.6" r="1.15" fill="var(--color-brand-50)" />
      <circle cx="18.6" cy="17.6" r="1.15" fill="var(--color-brand-50)" />
      <path
        d="M13 20.4c.9 1.1 1.8 1.6 3 1.6s2.1-.5 3-1.6"
        stroke="var(--color-brand-50)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
