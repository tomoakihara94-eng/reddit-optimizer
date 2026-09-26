import type { NextRequest } from 'next/server';

// 管理者の暗証番号（Vercel の環境変数 DISPATCH_ADMIN_PIN）をヘッダー X-Admin-Pin で照合
export function isAdmin(req: NextRequest | Request) {
  const pin = process.env.DISPATCH_ADMIN_PIN;
  return !!pin && req.headers.get('x-admin-pin') === pin;
}
