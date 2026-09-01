import { cn } from "@/lib/utils";

interface MerchantAvatarProps {
  name: string;
  logoText: string;
  brandColor: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-9 text-[11px] rounded-lg",
  md: "size-11 text-xs rounded-xl",
  lg: "size-14 text-sm rounded-2xl",
} as const;

/** Monogram tile standing in for a merchant logo until real assets exist. */
export function MerchantAvatar({
  name,
  logoText,
  brandColor,
  size = "md",
  className,
}: MerchantAvatarProps) {
  return (
    <span
      role="img"
      aria-label={`${name} logo`}
      style={{ backgroundColor: brandColor }}
      className={cn(
        "grid shrink-0 place-items-center font-semibold tracking-wide text-white",
        sizeClasses[size],
        className,
      )}
    >
      {logoText}
    </span>
  );
}
