import React from 'react';
import { Bell, Calendar, Sparkles, ChevronRight } from 'lucide-react';
import { TrainingRecord } from '../types/training';

interface NotificationBannerProps {
  upcomingRecords: TrainingRecord[];
  recommendedCount: number;
  onOpenAlerts: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  upcomingRecords,
  recommendedCount,
  onOpenAlerts,
}) => {
  if (upcomingRecords.length === 0 && recommendedCount === 0) return null;

  const nextUpcoming = upcomingRecords[0];

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 border-b border-amber-300/40 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-900 shadow-xs">
            <Bell className="h-4 w-4 animate-bounce" />
          </span>
          <div className="text-xs sm:text-sm text-slate-800">
            {nextUpcoming ? (
              <span>
                <strong className="font-bold text-amber-900">แจ้งเตือนการอบรมใกล้ถึง:</strong>{' '}
                <span className="font-semibold text-slate-900">{nextUpcoming.fullName}</span> ({nextUpcoming.position}) มีกำหนดการเข้ารับการอบรม{' '}
                <span className="text-indigo-900 font-medium underline decoration-amber-400">
                  {nextUpcoming.projectName}
                </span>{' '}
                ณ {nextUpcoming.location}
              </span>
            ) : (
              <span>
                <strong className="font-bold text-amber-900">โครงการอบรมใหม่:</strong> มี {recommendedCount} หลักสูตรน่าสนใจสำหรับบุคลากร อบต.โนนหนามแท่ง
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onOpenAlerts}
          className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>ดูการแจ้งเตือนทั้งหมด ({upcomingRecords.length + recommendedCount})</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
