export default function Legal() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            ← Back to Reddit Post Optimizer
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">特定商取引法に基づく表記</h1>
          <p className="text-sm text-gray-400 mb-8">Specified Commercial Transactions Act</p>

          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr className="py-4">
                <td className="py-4 pr-6 font-medium text-gray-600 w-40 align-top">販売業者</td>
                <td className="py-4 text-gray-900">Tomoaki Hara</td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium text-gray-600 align-top">所在地</td>
                <td className="py-4 text-gray-900">Shizuoka, Japan</td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium text-gray-600 align-top">メールアドレス</td>
                <td className="py-4 text-gray-900">
                  <a href="mailto:tomoaki.hara94@gmail.com" className="text-orange-500 hover:text-orange-600">
                    tomoaki.hara94@gmail.com
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium text-gray-600 align-top">販売価格</td>
                <td className="py-4 text-gray-900">$9.00 / 月</td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium text-gray-600 align-top">支払方法</td>
                <td className="py-4 text-gray-900">クレジットカード（Stripe）</td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium text-gray-600 align-top">サービス内容</td>
                <td className="py-4 text-gray-900">AI-powered Reddit post optimization</td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium text-gray-600 align-top">支払時期</td>
                <td className="py-4 text-gray-900">お申し込み時にお支払いいただきます。以降は毎月自動更新となります。</td>
              </tr>
              <tr>
                <td className="py-4 pr-6 font-medium text-gray-600 align-top">キャンセルについて</td>
                <td className="py-4 text-gray-900">次回更新日の前日までにメールにてご連絡いただければ、解約いたします。</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
