import {RenderImageContext, RenderImageProps} from "react-photo-album";
import Image from "next/image";

export default function renderNextImage(
    {alt = "", title, sizes}: RenderImageProps,
    {photo, width, height}: RenderImageContext,
) {
  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        aspectRatio: `${width} / ${height}`,
      }}
    >
      {photo.srcSet && (
        <Image
          fill
          src={photo}
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
  );
}
