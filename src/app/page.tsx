import Listing from "@/components/Listing";
import { Heading } from "@/components/ui/heading";
import { css } from "@/styled-system/css"
import './globals.css';

export default function Home() {
  return (
    <main>
      <div className={css({
        maxWidth: "1080px",
        margin: 10,
      })}>
        <div className={css({
          display: "flex",
          flexDirection: "column",
          gap: 4,
          mb: 4
        })}>
          <Heading as="h1" size="4xl">
            Street Rankings
          </Heading>
          <div>
            A ranking of the best street photography locations in the world
          </div>
        </div>
        <Listing />
      </div>
    </main>
  );
}
