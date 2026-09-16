import Image from "next/image";
import { art, type ArtName } from "@/lib/art";

/** 일러스트 자산을 next/image 로 그린다. width 는 표시 폭(px) 또는 CSS 로 제어. */
export function Art({ name, alt = "", width, className = "", priority = false, sizes }: { name: ArtName | string; alt?: string; width?: number; className?: string; priority?: boolean; sizes?: string }) {
  const a = art(name);
  return (
    <Image
      src={a.src}
      alt={alt}
      width={a.width}
      height={a.height}
      className={className}
      priority={priority}
      sizes={sizes ?? (width ? `${width}px` : undefined)}
      style={width ? { width, height: "auto" } : undefined}
      draggable={false}
    />
  );
}
