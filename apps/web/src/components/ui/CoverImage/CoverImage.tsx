import type { CoverImage as CoverImageData } from "@/lib/content";

type CoverImageProps = {
  image: CoverImageData;
  /** What share of the screen the picture takes (helps the browser pick the right file). */
  sizes?: string;
  className?: string;
  /** true for the picture at the very top of a page (loads at once, not lazily) */
  priority?: boolean;
};

// A picture from the media library. The browser chooses the 480, 960 or 1600 px
// WebP file that fits the screen (srcSet + sizes), so phones never download the big one.
// width and height are given so the page does not jump while the picture loads.
export default function CoverImage({ image, sizes = "(min-width: 1024px) 50vw, 100vw", className, priority = false }: CoverImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export has no image optimizer; we ship pre-sized WebP files
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
