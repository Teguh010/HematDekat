import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { CurrentUserProvider } from "@/components/current-user-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      template: `%s | ${t("appName")}`,
      default: t("appName"),
    },
    description: t("tagline"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("header");

  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden bg-ink-50 text-ink-900">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-brand"
        >
          {t("skipToContent")}
        </a>

        <NextIntlClientProvider>
          <CurrentUserProvider>
            <AppHeader />
            <main id="content" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {children}
            </main>
            <AppFooter />
          </CurrentUserProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
