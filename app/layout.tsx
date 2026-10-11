import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "./globals.css";
export const metadata: Metadata={title:"Zeytin | Kahve & Pastane",description:"Zeytin Kafe’nin sıcak atmosferine adım atın."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="tr" dir="ltr"><body>{children}</body></html>}
