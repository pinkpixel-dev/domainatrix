import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import type { Metadata } from 'next';
import CustomSearchDialog from '@/components/search-static';

export const metadata: Metadata = {
  title: {
    template: '%s | Domainatrix',
    default: 'Domainatrix - Self-Hostable Domain & Uptime Manager',
  },
  description: 'A self-hostable domain portfolio manager, diagnostic tracker, and uptime monitor.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider 
          theme={{ defaultTheme: 'dark', forcedTheme: 'dark' }}
          search={{ SearchDialog: CustomSearchDialog }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
