import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: '在庫音声検索',
  description: '車種・グレードを話しかけて在庫確認',
  appleWebApp: {
    capable: true,
    title: '在庫検索',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#07071a',
};

export default function VoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
