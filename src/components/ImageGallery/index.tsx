import Image from "next/image";
import { postProcessImages } from "@/app/actions/instagram-session";

const ImageGallery = ({ images }: { images: { imageUrl: string, imageWidth: number, imageHeight: number }[] }) => {
  console.log(images)
  return (
    <div>
      {images.map((image) => (
        <Image key={image.imageUrl} src={image.imageUrl} width={image.imageWidth} height={image.imageHeight} alt="Image" unoptimized={true} />
      ))}
      <button onClick={() => postProcessImages({image: images[0].imageUrl})}>Upload to Instagram</button>
    </div>
  )
}

export default ImageGallery