'use client'
import Image from "next/image";

const ImageGallery = ({ images }: { images: { imageUrl: string, imageWidth: number, imageHeight: number }[] }) => {
  return (
    <div>
      {images.map((image) => (
        <Image key={image.imageUrl} src={image.imageUrl} width={image.imageWidth} height={image.imageHeight} alt="Image" />
      ))}
    </div>
  )
}

export default ImageGallery