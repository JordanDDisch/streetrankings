import Listing from "@/components/Listing";
import { Heading } from "@/components/ui/heading";
import { css } from "@/styled-system/css"
import Image from "next/image";
import ImageGallery from "@/components/ImageGallery";
import { getUserInfo, getUserAssets } from './actions/sessions';
import './globals.css';

export default async function Page() {
  const userInfo = await getUserInfo()
  const userAssets = await getUserAssets()

  return (
    <div className={css({
      display: "flex",
      flexDirection: "column",
      gap: 4,
      mb: 4
    })}>
      {userInfo && <div>Welcome {userInfo.full_name}</div>}
      {userAssets && <ImageGallery images={[userAssets]} />}
      <Heading as="h1" size="4xl">
        Street Rankings
      </Heading>
      <div>
        A ranking of the best street photography locations in the world
      </div>
      <Listing />
    </div>
  );
}
