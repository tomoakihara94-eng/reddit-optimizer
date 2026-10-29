import Link from 'next/link';

// 社内ツールの入口。ログイン後（/login）や各ページの「戻る」はここに来る。
// 以前はここに投稿文作成ツール（/api/optimize）があったが 2026-10-29 に削除した。
const TOOLS = [
  { href: '/dispatch', name: '差配システム', note: '来店・問い合わせの担当振り分け' },
  { href: '/carsensor', name: 'カーセンサー 在庫CSV変換', note: '在庫CSVをカーセンサー用に変換' },
  { href: '/voice', name: '在庫音声検索', note: '声で在庫を探す' },
  { href: '/article', name: '車種別 記事生成', note: '車種ごとの記事を自動生成' },
  { href: '/diagnosis', name: '中古車タイプ診断', note: '8問で合う車のタイプを診断' },
  { href: '/personality', name: '運転性格診断', note: '運転の性格タイプ一覧' },
  { href: '/legal', name: '特定商取引法に基づく表記', note: '' },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">松下モータース 社内ツール</h1>
      <ul className="mt-6 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-gray-50">
              <span>
                <span className="block font-medium text-gray-900">{t.name}</span>
                {t.note && <span className="block text-sm text-gray-500">{t.note}</span>}
              </span>
              <span className="text-gray-400">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
