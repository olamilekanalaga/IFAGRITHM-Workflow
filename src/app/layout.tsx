import "./globals.css";
import "./themes.css";
import { AppearanceProvider } from "@/components/appearance";
import { appearanceBootstrap } from "@/lib/appearance";
export const metadata = {
  title: "IFAGRITHM | Company memory",
  description: "Internal operating system MVP",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="ifagrithm"
      data-mode="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootstrap }} />
      </head>
      <body>
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
