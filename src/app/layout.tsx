import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { TopNav } from "@/components/nav/TopNav";
import { Footer } from "@/components/layout/Footer";
import { getActiveTheme, themeStyleVars, googleFontHref } from "@/lib/theme";
import { getSetting } from "@/lib/settings";
import "./globals.css";

// Theme is read on every request — must not be cached at build time.
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MerchShop",
  description: "Bechtle Merchandise Shop",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getActiveTheme();
  const themeCss = `:root{${themeStyleVars(theme.tokens)}}`;
  const fontHref = theme.font ? googleFontHref(theme.font) : null;
  const logoUrl = await getSetting("branding.logo");
  const replaceWordmark = (await getSetting("branding.replace_wordmark")) === "true";
  // When an active font is set, override Tailwind's --font-sans so every
  // element styled with font-sans picks up the new family.
  const fontCss = theme.font
    ? `:root{--font-sans:'${theme.font}',ui-sans-serif,system-ui,sans-serif;}`
    : "";

  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {fontHref && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link rel="stylesheet" href={fontHref} />
          </>
        )}
        {/* Theme tokens inline so the first paint is already themed —
            avoids a flash of default-shadcn colors. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss + fontCss }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <TopNav logoUrl={logoUrl} replaceWordmark={replaceWordmark} />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
