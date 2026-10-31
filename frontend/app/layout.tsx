import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { CurrentUserProvider } from "@/components/current-user-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");

  return {
    title: {
      template: `%s | ${t("appName")}`,
      default: t("appName"),
    },
    description: t("tagline"),
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-950 text-slate-100">
        <NextIntlClientProvider>
          <CurrentUserProvider>
            <AppHeader />
            <main id="content" className="flex flex-1 flex-col">
              {children}
            </main>
            <AppFooter />
          </CurrentUserProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
