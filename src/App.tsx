import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Settings, BarChart3, ArrowLeft, RotateCcw, AlertCircle, CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';

// 請在此填入你的 Supabase URL 與 Publishable Key
const supabase = createClient(
  'https://xsbxgxesewcyvycywnla.supabase.co',
  'sb_publishable_YfN-7gwaePghFLiPsfABKQ_lcK98zHJ'
);

const ELDER_ID_KEY = 'chuk_fuk_elder_id';

interface BehaviorRecord {
  elder_id: string;
  last_checkin_hk: string;
  checked_in_today: boolean;
  checkins_last_7d: number;
  avg_mood_7d: number;
  unhappy_count_3d: number;
  avg_checkin_hour: number;
  behavior_alert: string;
}

interface RawCheckIn {
  id: number;
  elder_id: string;
  mood: string;
  created_at: string;
}

function formatHKTime(isoString: string): string {
  if (!isoString) return '無紀錄';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('zh-HK', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function getHKDateLabel(dateObj: Date): string {
  return new Intl.DateTimeFormat('zh-HK', {
    timeZone: 'Asia/Hong_Kong',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

export default function App() {
  const [elderId, setElderId] = useState<string>('');
  const [inputId, setInputId] = useState<string>('');
  const [screen, setScreen] = useState<'loading' | 'setup' | 'checkin' | 'success' | 'admin'>('loading');
  const [submitting, setSubmitting] = useState(false);

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const [analytics, setAnalytics] = useState<BehaviorRecord[]>([]);
  const [rawRecords, setRawRecords] = useState<RawCheckIn[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem(ELDER_ID_KEY);
    if (savedId) {
      setElderId(savedId);
      setScreen('checkin');
    } else {
      setScreen('setup');
    }
  }, []);

  const handleSaveId = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputId.trim();
    if (!trimmed) return;
    localStorage.setItem(ELDER_ID_KEY, trimmed);
    setElderId(trimmed);
    setScreen('checkin');
  };

  const handleCheckIn = async (moodText: string) => {
    if (!elderId || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('check_ins').insert([{ elder_id: elderId, mood: moodText }]);
      setScreen('success');
      setTimeout(() => {
        setScreen('checkin');
        setSubmitting(false);
      }, 3000);
    } catch {
      alert('網絡連線異常，請稍後再試');
      setSubmitting(false);
    }
  };

  const handlePwdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdInput === '1234') {
      setShowPwdModal(false);
      setPwdInput('');
      setPwdError(false);
      setShowAdminMenu(true);
    } else {
      setPwdError(true);
    }
  };

  const handleResetId = () => {
    localStorage.removeItem(ELDER_ID_KEY);
    setElderId('');
    setInputId('');
    setShowAdminMenu(false);
    setScreen('setup');
  };

  const handleOpenAnalytics = async () => {
    setShowAdminMenu(false);
    setScreen('admin');
    setLoadingAnalytics(true);

    const [viewRes, rawRes] = await Promise.all([
      supabase.from('elder_behavior_analysis').select('*').order('behavior_alert', { ascending: true }),
      supabase.from('check_ins').select('*').order('created_at', { ascending: false }).limit(500),
    ]);

    if (viewRes.data) setAnalytics(viewRes.data);
    if (rawRes.data) setRawRecords(rawRes.data);
    setLoadingAnalytics(false);
  };

  const BambooIcon = () => (
    <div className="w-14 h-14 rounded-2xl bg-[#e3eed4] border-2 border-[#8ab85c] flex items-center justify-center shadow-sm shrink-0">
      <svg viewBox="0 0 64 64" className="w-10 h-10">
        <rect x="24" y="10" width="16" height="44" rx="4" fill="#68a336" stroke="#3c6619" strokeWidth="2.5" />
        <line x1="24" y1="24" x2="40" y2="24" stroke="#3c6619" strokeWidth="2.5" />
        <line x1="24" y1="40" x2="40" y2="40" stroke="#3c6619" strokeWidth="2.5" />
        <path d="M24 22 C14 18, 10 24, 18 27 C21 28, 24 25, 24 22 Z" fill="#82c447" stroke="#3c6619" strokeWidth="2" />
        <path d="M40 16 C50 12, 54 18, 46 21 C43 22, 40 19, 40 16 Z" fill="#82c447" stroke="#3c6619" strokeWidth="2" />
        <circle cx="29" cy="31" r="1.8" fill="#1f360c" />
        <circle cx="35" cy="31" r="1.8" fill="#1f360c" />
        <path d="M29 35 Q32 38 35 35" fill="none" stroke="#1f360c" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );

  const Header = () => (
    <header className="w-full max-w-2xl mx-auto px-5 pt-5 pb-2 flex items-center justify-between">
      <BambooIcon />
      <div className="text-right text-[#2d4a16] font-bold leading-snug">
        <div className="text-sm sm:text-base">竹園馬田法政牧師長者綜合服務中心</div>
        <div className="text-xs sm:text-sm text-[#4e7a27]">長者支援服務隊</div>
      </div>
    </header>
  );

  if (screen === 'loading') return null;

  if (screen === 'admin') {
    const highRisk = analytics.filter((a) => a.behavior_alert.includes('🔴'));
    const warnRisk = analytics.filter((a) => a.behavior_alert.includes('🟡'));
    const todayCheckedCount = analytics.filter((a) => a.checked_in_today).length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent7d = rawRecords.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo);
    const happyCnt = recent7d.filter((r) => r.mood.startsWith('1')).length;
    const normalCnt = recent7d.filter((r) => r.mood.startsWith('2')).length;
    const unhappyCnt = recent7d.filter((r) => r.mood.startsWith('3')).length;
    const totalMoodCnt = Math.max(happyCnt + normalCnt + unhappyCnt, 1);

    const last7DaysLabels: { label: string; happy: number; normal: number; unhappy: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = getHKDateLabel(d);
      const dayItems = rawRecords.filter((r) => getHKDateLabel(new Date(r.created_at)) === label);
      last7DaysLabels.push({
        label,
        happy: dayItems.filter((r) => r.mood.startsWith('1')).length,
        normal: dayItems.filter((r) => r.mood.startsWith('2')).length,
        unhappy: dayItems.filter((r) => r.mood.startsWith('3')).length,
      });
    }
    const maxDailyTotal = Math.max(...last7DaysLabels.map((d) => d.happy + d.normal + d.unhappy), 1);

    const autoInsights: string[] = [];
    if (highRisk.length > 0) {
      autoInsights.push(`發現 ${highRisk.length} 位長者出現高風險訊號（${highRisk.map((h) => h.elder_id).join('、')}），建議今日優先致電或上門關懷。`);
    } else {
      autoInsights.push('今日暫無超過 24 小時失聯或連續情緒低落之高風險個案。');
    }
    if (warnRisk.length > 0) {
      autoInsights.push(`另有 ${warnRisk.length} 位長者今日尚未打卡或打卡時段與平日相差超過 3 小時，可於下午時段留意。`);
    }
    if (unhappyCnt > 0) {
      autoInsights.push(`近 7 日共錄得 ${unhappyCnt} 次「3分 唔開心」紀錄，佔總打卡次數 ${Math.round((unhappyCnt / totalMoodCnt) * 100)}%。`);
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                竹福里長者行為分析儀表板
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                所有時間已同步為香港標準時間（HKT / UTC+8）
              </p>
            </div>
            <button
              onClick={() => setScreen('checkin')}
              className="flex items-center justify-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              返回打卡畫面
            </button>
          </div>

          {loadingAnalytics ? (
            <div className="text-center py-16 text-slate-500 text-lg">正在讀取 Supabase 數據並進行分析...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 已登記長者</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{analytics.length} <span className="text-sm font-normal">位</span></div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-emerald-600 font-medium">今日已打卡（香港時間）</div>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {todayCheckedCount} <span className="text-sm font-normal text-slate-400">/ {analytics.length}</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm">
                  <div className="text-xs text-red-600 font-medium">🔴 優先跟進個案</div>
                  <div className="text-2xl font-extrabold text-red-600 mt-1">{highRisk.length} <span className="text-sm font-normal">位</span></div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                  <div className="text-xs text-amber-600 font-medium">🟡 需留意 / 未打卡</div>
                  <div className="text-2xl font-extrabold text-amber-600 mt-1">{warnRisk.length} <span className="text-sm font-normal">位</span></div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
                <h2 className="font-bold text-emerald-900 flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                  系統自動分析摘要
                </h2>
                <ul className="space-y-1.5 text-sm text-emerald-900 list-disc pl-5">
                  {autoInsights.map((txt, idx) => (
                    <li key={idx}>{txt}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-1">近 7 日每日打卡趨勢（香港日期）</h3>
                  <p className="text-xs text-slate-400 mb-4">按日統計開心、一般與唔開心人次</p>
                  <div className="h-44 flex items-end justify-between gap-2 pt-4 px-1 border-b border-slate-100">
                    {last7DaysLabels.map((day) => {
                      const total = day.happy + day.normal + day.unhappy;
                      const heightPct = Math.round((total / maxDailyTotal) * 100);
                      return (
                        <div key={day.label} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-600">{total}</span>
                          <div className="w-full max-w-[32px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col-reverse" style={{ height: '110px' }}>
                            <div style={{ height: `${heightPct}%` }} className="w-full flex flex-col-reverse transition-all">
                              {day.happy > 0 && <div style={{ flex: day.happy }} className="bg-emerald-500 w-full" />}
                              {day.normal > 0 && <div style={{ flex: day.normal }} className="bg-amber-400 w-full" />}
                              {day.unhappy > 0 && <div style={{ flex: day.unhappy }} className="bg-rose-500 w-full" />}
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />開心</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />一般</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />唔開心</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">近 7 日整體情緒比例分佈</h3>
                    <p className="text-xs text-slate-400 mb-4">共分析 {recent7d.length} 筆打卡紀錄</p>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm font-medium mb-1">
                          <span>😄 1分 開心</span>
                          <span>{happyCnt} 次 ({Math.round((happyCnt / totalMoodCnt) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(happyCnt / totalMoodCnt) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm font-medium mb-1">
                          <span>😐 2分 一般</span>
                          <span>{normalCnt} 次 ({Math.round((normalCnt / totalMoodCnt) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(normalCnt / totalMoodCnt) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm font-medium mb-1">
                          <span>😡 3分 唔開心</span>
                          <span>{unhappyCnt} 次 ({Math.round((unhappyCnt / totalMoodCnt) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(unhappyCnt / totalMoodCnt) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                    提示：若長者連續 3 日內出現 2 次或以上「3分 唔開心」，系統將自動標記為 🔴 優先跟進。
                  </div>
                </div>
              </div>

              {highRisk.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                  <h2 className="text-red-800 font-bold text-lg flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5" />
                    今日優先跟進名單（{highRisk.length} 位）
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {highRisk.map((item) => (
                      <div key={item.elder_id} className="bg-white p-3.5 rounded-xl border border-red-200 shadow-sm">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>長者編號：{item.elder_id}</span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                            {item.behavior_alert}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 mt-2">
                          最後打卡（香港時間）：<b>{item.last_checkin_hk || '無紀錄'}</b>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          慣常打卡鐘數：約 {item.avg_checkin_hour ?? '-'} 時 ｜ 7日平均分：{item.avg_mood_7d ?? '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  全部長者行為分析明細（共 {analytics.length} 位）
                </div>
                <div className="divide-y divide-slate-100">
                  {analytics.map((item) => (
                    <div key={item.elder_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-lg text-slate-900">{item.elder_id}</span>
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100">
                            {item.behavior_alert}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          最後打卡（香港時間）：{item.last_checkin_hk || '無紀錄'}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 sm:text-right bg-slate-50 px-3 py-2 rounded-lg">
                        <div>近7日打卡：<b>{item.checkins_last_7d}</b> 次 ｜ 平均情緒分：<b>{item.avg_mood_7d ?? '-'}</b></div>
                        <div className="text-xs text-slate-500 mt-0.5">慣常打卡時間：香港時間約 {item.avg_checkin_hour ?? '-'} 時</div>
                      </div>
                    </div>
                  ))}
                  {analytics.length === 0 && (
                    <div className="p-8 text-center text-slate-400">暫時未有長者打卡紀錄</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  最新打卡時間軸（香港時間 HKT）
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {rawRecords.slice(0, 15).map((rec) => (
                    <div key={rec.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">{rec.elder_id}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{rec.mood}</span>
                      </div>
                      <span className="text-slate-500 font-mono text-xs">{formatHKTime(rec.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7ee] flex flex-col justify-between relative select-none">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-12 max-w-xl mx-auto w-full">
        {screen === 'setup' && (
          <form onSubmit={handleSaveId} className="w-full bg-white p-7 rounded-3xl shadow-md border-2 border-[#cde0b4] text-center">
            <h1 className="text-3xl font-extrabold text-[#233d0f] mb-2">早晨！各位老友記！</h1>
            <p className="text-lg text-[#4e7a27] mb-6">首次使用，請社工輸入長者編號</p>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="例如：73-001"
              className="w-full text-center text-3xl font-bold py-4 px-4 rounded-2xl border-2 border-[#8ab85c] focus:outline-none focus:ring-4 focus:ring-[#cde0b4] mb-5"
              required
            />
            <button
              type="submit"
              className="w-full bg-[#68a336] hover:bg-[#578c2b] text-white text-2xl font-bold py-4 rounded-2xl shadow-md transition"
            >
              確定並儲存
            </button>
          </form>
        )}

        {screen === 'checkin' && (
          <div className="w-full text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#233d0f] mb-8 tracking-wide">
              早晨！各位老友記！
            </h1>
            <div className="flex flex-col gap-5">
              <button
                disabled={submitting}
                onClick={() => handleCheckIn('1分 開心')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white text-3xl sm:text-4xl font-extrabold py-7 px-6 rounded-3xl shadow-lg flex items-center justify-center gap-4 transition"
              >
                <span className="text-4xl sm:text-5xl">😄</span>
                <span>1分 開心</span>
              </button>

              <button
                disabled={submitting}
                onClick={() => handleCheckIn('2分 一般')}
                className="w-full bg-amber-400 hover:bg-amber-500 active:scale-98 text-slate-900 text-3xl sm:text-4xl font-extrabold py-7 px-6 rounded-3xl shadow-lg flex items-center justify-center gap-4 transition"
              >
                <span className="text-4xl sm:text-5xl">😐</span>
                <span>2分 一般</span>
              </button>

              <button
                disabled={submitting}
                onClick={() => handleCheckIn('3分 唔開心')}
                className="w-full bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-3xl sm:text-4xl font-extrabold py-7 px-6 rounded-3xl shadow-lg flex items-center justify-center gap-4 transition"
              >
                <span className="text-4xl sm:text-5xl">😡</span>
                <span>3分 唔開心</span>
              </button>
            </div>
          </div>
        )}

        {screen === 'success' && (
          <div className="w-full bg-white p-10 rounded-3xl shadow-lg border-4 border-emerald-400 text-center animate-bounce">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 leading-relaxed">
              ✅ 打卡成功！
              <br />
              明天再見！
            </div>
          </div>
        )}
      </main>

      <button
        onClick={() => {
          setPwdInput('');
          setPwdError(false);
          setShowPwdModal(true);
        }}
        aria-label="社工設定"
        className="fixed bottom-4 right-4 p-3 text-[#9ab582] hover:text-[#4e7a27] opacity-60 hover:opacity-100 transition"
      >
        <Settings className="w-6 h-6" />
      </button>

      {showPwdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handlePwdSubmit} className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl">
            <h2 className="text-xl font-bold text-slate-800 mb-3">社工專區驗證</h2>
            <input
              type="password"
              inputMode="numeric"
              value={pwdInput}
              onChange={(e) => setPwdInput(e.target.value)}
              placeholder="請輸入密碼"
              className="w-full border-2 border-slate-300 rounded-xl px-4 py-2.5 text-center text-xl tracking-widest mb-2"
              autoFocus
            />
            {pwdError && <p className="text-red-500 text-sm text-center mb-2">密碼錯誤，請重試</p>}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowPwdModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
              >
                進入
              </button>
            </div>
          </form>
        </div>
      )}

      {showAdminMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-3">
            <h2 className="text-xl font-bold text-slate-800 mb-1">社工管理選單</h2>
            <p className="text-sm text-slate-500 mb-4">目前裝置綁定編號：{elderId || '未設定'}</p>
            <button
              onClick={handleOpenAnalytics}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow"
            >
              <BarChart3 className="w-5 h-5" />
              📊 查看長者行為分析與圖表
            </button>
            <button
              onClick={handleResetId}
              className="w-full flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold py-3.5 px-4 rounded-xl"
            >
              <RotateCcw className="w-5 h-5" />
              重設此裝置長者編號
            </button>
            <button
              onClick={() => setShowAdminMenu(false)}
              className="w-full py-2.5 text-slate-500 font-medium mt-2"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
