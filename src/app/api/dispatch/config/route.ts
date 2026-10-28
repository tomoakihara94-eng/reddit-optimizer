import { NextResponse } from 'next/server';
import { getStaff } from '@/lib/dispatch-redis';
import {
  RESPONSES, MUTE_CUSTOM_MAX_MIN, INQUIRY_SOURCES, INQUIRY_LINES, STAFF_CONDITIONS, CUSTOMER_TYPES, MUTE_OPTIONS_MIN, QUIET_START, QUIET_END, WINDOW_MS,
} from '@/lib/dispatch-config';

// アプリが起動時に読む共通の設定。スタッフ一覧などをサーバーだけで管理するため（アプリ側は予備の初期値のみ）
// マニュアルで公開している情報だけを返す（暗証番号は不要）
export async function GET() {
  const staff = await getStaff();
  const label = (r: string) => (r === '対応中' ? '対応中（行けない）' : r);
  const body = {
    version: 1,
    staff: staff.map(({ id, name }) => ({ id, name })),
    responses: Object.entries(RESPONSES).map(([value, points]) => ({ value, label: label(value), points })),
    staffConditions: Object.entries(STAFF_CONDITIONS).map(([value, points]) => ({ value, points })),
    customerTypes: [...CUSTOMER_TYPES],
    inquirySources: [...INQUIRY_SOURCES],
    inquiryLines: [...INQUIRY_LINES],
    muteOptionsMin: MUTE_OPTIONS_MIN,
    muteCustomMaxMin: MUTE_CUSTOM_MAX_MIN,
    quiet: { start: QUIET_START, end: QUIET_END },
    windowSec: WINDOW_MS / 1000,
  };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
