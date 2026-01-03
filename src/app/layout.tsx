import type { Metadata } from "next";
import { css } from "@/styled-system/css"
import { Inter, Oswald } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald"
});

export const metadata: Metadata = {
  title: "Street Rankings",
  description: "Jordan Disch - Street Rankings - Photographer, Musician, and Software Engineer",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
    shortcut: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body className={inter.className}>
        <main>
          <div className={css({
            xl: {
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 1000,
            }
          })}>
            <Link href="/">
              <img src="/assets/images/street-rankings-logo.png" alt="Street Rankings" className={css({
                width: 50,
                height: 50,
                margin: 4,
                xl: {
                  width: 100,
                  height: 100,
                }
              })} />
            </Link>
          </div>
          <div className={css({
            maxWidth: "960px",
            my: 10,
            mx: 4,
            md: {
              mx: "auto"
            }
          })}>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
