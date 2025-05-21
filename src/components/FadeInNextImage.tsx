import { RenderImageContext, RenderImageProps } from "react-photo-album";
import Image from "next/image";
import FadeInImage from "@/components/FadeInImage";

export default function renderFadeInNextImage(
  { alt = "", title, sizes, index }: RenderImageProps & { index?: number },
  { photo, width, height }: RenderImageContext
) {
  return (
    <FadeInImage index={index ?? 0} stagger={0.05}>
      <div
        style={{
          width: "100%",
          position: "relative",
          aspectRatio: `${width} / ${height}`
        }}
      >
        {photo.srcSet && (
          <Image
            fill
            src={photo.src}
            className={"rounded-lg"}
            unoptimized
            alt={alt}
            title={title}
            sizes={sizes}
            placeholder="blur"
            blurDataURL={photo.srcSet[0].src}
          />
        )}
      </div>
    </FadeInImage>
  );
}