import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Stream | ConvertCast",
  description: "Watch live streaming event on ConvertCast",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1, // Prevent zoom to keep UI stable
    minimumScale: 0.5, // Allow zoom out if needed
    userScalable: false, // Lock scale for consistent experience
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ConvertCast Live',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    // Hints for browsers that support orientation preference
    'screen-orientation': 'landscape',
    'x5-orientation': 'landscape', // QQ Browser
    'x5-fullscreen': 'true', // QQ Browser
  },
};

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
