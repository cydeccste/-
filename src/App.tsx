import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Settings, BarChart3, ArrowLeft, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

// 請在此填入你的 Supabase URL 與 Anon/Publishable Key
const supabase = createClient(
  'https://xsbxgxesewcyvycywnla.supabase.co',
  'sb_publishable_YfN-7gwaePghFLiPsfABKQ_lcK98zHJ'
);

const ELDER_ID_KEY = 'chuk_fuk_elder_id';

interface BehaviorRecord {
  elder_id: string;
  last_checkin_hk: string;
  checkins_last_7d: number;
  avg_mood_7d: number;
  unhappy_count_3d: number;
  avg_checkin_hour: number;
  behavior_alert: string;
}

export default function App() {
  const [elderId, setElderId] = useState<string>('');
  const [inputId, setInputId] = useState<string>('');
  const [screen, setScreen] = useState<'loading' | 'setup' | 'checkin' | 'success' | 'admin'>('loading');
  const [submitting, setSubmitting] = useState(false);

  // 密碼與管理員彈窗狀態
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // 行為分析數據
  const [analytics, setAnalytics] = useState<BehaviorRecord[]>([]);
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
    const { data } = await supabase
      .from('elder_behavior_analysis')
      .select('*')
      .order('behavior_alert', { ascending: true });
    if (data) setAnalytics(data);
    setLoadingAnalytics(false);
  };

  // 可愛卡通竹子 SVG 圖示
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

  // 頁首組件
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

  // 社工行為分析後台
  if (screen === 'admin') {
    const highRisk = analytics.filter((a) => a.behavior_alert.includes('🔴'));
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                竹福里長者行為分析後台
              </h1>
              <p className="text-xs text-slate-500 mt-1">自動偵測作息異常、漏打卡及連續情緒低落個案</p>
            </div>
            <button
              onClick={() => setScreen('checkin')}
              className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              返回打卡
            </button>
          </div>

          {loadingAnalytics ? (
            <div className="text-center py-12 text-slate-500 text-lg">正在載入最新分析數據...</div>
          ) : (
            <>
              {highRisk.length > 0 && (
                <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                  <h2 className="text-red-800 font-bold text-lg flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5" />
                    今日優先跟進名單（{highRisk.length} 位）
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {highRisk.map((item) => (
                      <div key={item.elder_id} className="bg-white p-3.5 rounded-xl border border-red-200 shadow-sm">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>長者編號：{item.elder_id}</span>
                          <span className="text-sm px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                            {item.behavior_alert}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 mt-2">
                          最後打卡：{item.last_checkin_hk ? new Date(item.last_checkin_hk).toLocaleString('zh-HK') : '無紀錄'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          慣常時段：約 {item.avg_checkin_hour ?? '-'} 時 ｜ 7日平均分：{item.avg_mood_7d ?? '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  全部已登記長者狀態總覽（共 {analytics.length} 位）
                </div>
                <div className="divide-y divide-slate-100">
                  {analytics.map((item) => (
                    <div key={item.elder_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-lg text-slate-900">{item.elder_id}</span>
                          <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-slate-100">
                            {item.behavior_alert}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          最後打卡：{item.last_checkin_hk ? new Date(item.last_checkin_hk).toLocaleString('zh-HK') : '無紀錄'}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 sm:text-right bg-slate-50 px-3 py-2 rounded-lg">
                        <div>近7日打卡：<b>{item.checkins_last_7d}</b> 次 ｜ 平均分：<b>{item.avg_mood_7d ?? '-'}</b></div>
                        <div className="text-xs text-slate-500 mt-0.5">慣常打卡鐘數：約 {item.avg_checkin_hour ?? '-'} 時</div>
                      </div>
                    </div>
                  ))}
                  {analytics.length === 0 && (
                    <div className="p-8 text-center text-slate-400">暫時未有長者打卡紀錄</div>
                  )}
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

      {/* 右下角隱蔽齒輪 */}
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

      {/* 密碼輸入視窗 */}
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

      {/* 社工功能選單 */}
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
              📊 查看長者行為分析
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
