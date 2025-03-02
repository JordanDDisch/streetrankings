import { postProcessImages } from "@/app/actions/instagram-session";

const UploadToInstagram = ({image}: {image: string}) => {
  return <button onClick={() => postProcessImages({image})}>Upload to Instagram</button>
}

export default UploadToInstagram