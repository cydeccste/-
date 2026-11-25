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

// 強制將任何時間字串轉為香港時間顯示 (YYYY-MM-DD HH:mm)
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

// 取得香港日期字串 (MM/DD)
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

  // 社工行為分析儀表板（含圖表與自動摘要）
  if (screen === 'admin') {
    const highRisk = analytics.filter((a) => a.behavior_alert.includes('🔴'));
    const warnRisk = analytics.filter((a) => a.behavior_alert.includes('🟡'));
    const todayCheckedCount = analytics.filter((a) => a.checked_in_today).length;

    // 1. 計算情緒分佈圖數據（近 7 日原始紀錄）
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent7d = rawRecords.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo);
    const happyCnt = recent7d.filter((r) => r.mood.startsWith('1')).length;
    const normalCnt = recent7d.filter((r) => r.mood.startsWith('2')).length;
    const unhappyCnt = recent7d.filter((r) => r.mood.startsWith('3')).length;
    const totalMoodCnt = Math.max(happyCnt + normalCnt + unhappyCnt, 1);

    // 2. 計算近 7 日每日打卡趨勢（強制按香港日期分組）
    const last7DaysLabels: { label: string;
