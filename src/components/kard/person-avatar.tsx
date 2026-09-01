import { cn } from "@/lib/utils";

interface PersonAvatarProps {
  name: string;
  size?: "sm" | "md";
  className?: string;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PersonAvatar({ name, size = "md", className }: PersonAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-muted font-medium text-muted-foreground",
        size === "sm" ? "size-8 text-[11px]" : "size-10 text-xs",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
