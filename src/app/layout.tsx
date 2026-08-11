import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import { Providers } from '@/components/Providers';
import './globals.css';

const display = Fraunces({
  variable: '--font-closet-display',
  subsets: ['latin'],
});

const sans = Plus_Jakarta_Sans({
  variable: '--font-closet-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ClosetKeeper — Morning Ritual Wardrobe',
  description:
    'A calm digital wardrobe for morning outfit suggestions, closet inventory, and occasion-based matching.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
