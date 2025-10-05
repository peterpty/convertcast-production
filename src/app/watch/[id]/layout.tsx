import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Stream | ConvertCast",
  description: "Watch live streaming event on ConvertCast",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5, // Allow zoom out to see full video
    minimumScale: 1,
    userScalable: true, // Allow user to zoom if needed
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
