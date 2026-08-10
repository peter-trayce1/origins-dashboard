import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  size?: "sm" | "md";
  white?: boolean;
}

export function Logo({ className, href = "/dashboard", size = "md", white = false }: LogoProps) {
  const imgHeight = size === "sm" ? 18 : 22;
  const imgWidth  = size === "sm" ? 80 : 100;

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center group transition-opacity hover:opacity-80", className)}
    >
      <Image
        src="/logo-dark.png"
        alt="Known Objects"
        width={imgWidth}
        height={imgHeight}
        className={cn("object-contain", white && "invert")}
        style={{ height: imgHeight, width: "auto" }}
        priority
      />
    </Link>
  );
}
