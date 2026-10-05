import React from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  Award,
  Bell,
  PlusCircle,
  BarChart3,
  List,
  ExternalLink,
  RefreshCw,
  LogOut,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { SheetMetadata } from '../services/sheetsService';

interface NavbarProps {
  user: User | null;
  sheetMeta: SheetMetadata | null;
  activeTab: 'table' | 'dashboard';
  setActiveTab: (tab: 'table' | 'dashboard') => void;
  onOpenAddModal: () => void;
  onOpenAlertsModal: () => void;
  unreadAlertsCount: number;
  onLogin: () => void;
  onLogout: () => void;
  onSync: () => void;
  isSyncing: boolean;
  totalRecordsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  sheetMeta,
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenAlertsModal,
  unreadAlertsCount,
  onLogin,
  onLogout,
  onSync,
  isSyncing,
  totalRecordsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border-b border-indigo-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Organization Brand & Logo */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20 border border-amber-300">
              <Building2 className="h-7 w-7 text-slate-900" />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-slate-900">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  อบต.โนนหนามแท่ง
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  อ.เมืองอำนาจเจริญ จ.อำนาจเจริญ
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ระบบบันทึกประวัติการฝึกอบรมบุคลากร
              </h1>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="h-4 w-4 text-amber-400" />
              แดชบอร์ดสรุปผลงาน
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <List className="h-4 w-4 text-cyan-400" />
              ทะเบียนประวัติ ({totalRecordsCount})
            </button>
          </nav>

          {/* Right Actions & Auth */}
          <div className="flex items-center gap-3">
            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-md shadow-emerald-900/30 transition-all cursor-pointer border border-emerald-400/30 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ บันทึกอบรม</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenAlertsModal}
              className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
              title="แจ้งเตือนการฝึกอบรมและโครงการใหม่"
            >
              <Bell className="h-5 w-5 text-amber-400" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* User Account / Google Sign-in */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Google Sheets ซิงค์แล้ว
                  </div>
                </div>

                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-9 w-9 rounded-full ring-2 ring-indigo-500 object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-indigo-400">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}

                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="gsi-material-button flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-md transition-all border border-slate-300 cursor-pointer active:scale-95"
                title="เชื่อมต่อ Google Sheets และ Google Drive"
              >
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-4 h-4 block"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="hidden sm:inline">เชื่อมต่อ Google Sheets</span>
                <span className="sm:hidden">เข้าสู่ระบบ</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-bar on Mobile for Navigation & Sync status */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300'
              }`}
            >
              แดชบอร์ด
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg ${
                activeTab === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-300'
              }`}
            >
              ทะเบียน ({totalRecordsCount})
            </button>
          </div>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            + บันทึก
          </button>
        </div>
      </div>

      {/* Sheets Connection Notification Banner */}
      {sheetMeta && (
        <div className="bg-emerald-950/70 border-t border-emerald-800/50 py-1.5 px-4 text-xs text-emerald-200">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                กำลังเชื่อมโยงกับ Google Sheets:{' '}
                <strong className="text-white font-medium">{sheetMeta.name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูล'}
              </button>
              <a
                href={sheetMeta.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 underline font-medium"
              >
                เปิดใน Google Sheets
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
