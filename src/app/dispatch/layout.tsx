import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: '差配システム',
  appleWebApp: { capable: true, title: '差配', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = { themeColor: '#07071a' };

export default function DispatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
