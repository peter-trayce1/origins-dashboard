import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function OriginsMark({ size = 20, white = false, className }: { size?: number; white?: boolean; className?: string }) {
  const fill = white ? "white" : "#333333";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left column: tiny top, medium middle, large bottom */}
      <circle cx="4" cy="2.5" r="1" fill={fill} />
      <circle cx="4" cy="10" r="2" fill={fill} />
      <circle cx="4" cy="17.5" r="3" fill={fill} />
      {/* Right column: medium-large top, medium lower */}
      <circle cx="13" cy="6.5" r="2.4" fill={fill} />
      <circle cx="13" cy="14" r="1.6" fill={fill} />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  href?: string;
  size?: "sm" | "md";
  white?: boolean;
}

export function Logo({ className, href = "/dashboard", size = "md", white = false }: LogoProps) {
  if (white) {
    return (
      <Link
        href={href}
        className={cn("inline-flex items-center gap-2.5 group", className)}
      >
        <OriginsMark white className="shrink-0 transition-opacity group-hover:opacity-80" />
        <span className="text-[15px] font-semibold tracking-[-0.02em] leading-none text-white transition-opacity group-hover:opacity-80">
          Origins
        </span>
      </Link>
    );
  }

  const imgHeight = size === "sm" ? 18 : 22;
  const imgWidth = size === "sm" ? 80 : 100;

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center group transition-opacity hover:opacity-80", className)}
    >
      <Image
        src="/logo-dark.png"
        alt="Origins"
        width={imgWidth}
        height={imgHeight}
        className="object-contain"
        style={{ height: imgHeight, width: "auto" }}
        priority
      />
    </Link>
  );
}
