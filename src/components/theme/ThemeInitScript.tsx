import Script from "next/script";
import { themeInitScript } from "@/lib/theme";

export default function ThemeInitScript() {
  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
