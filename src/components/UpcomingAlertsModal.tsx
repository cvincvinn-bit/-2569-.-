import React, { useState } from 'react';
import {
  X,
  Bell,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  User,
  Plus,
  ArrowRight,
  ExternalLink,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TrainingRecord, TrainingRecommendation } from '../types/training';

interface UpcomingAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  upcomingRecords: TrainingRecord[];
  recommendations: TrainingRecommendation[];
  onSelectRecommendation: (rec: TrainingRecommendation) => void;
  onSelectRecord: (record: TrainingRecord) => void;
}

export const UpcomingAlertsModal: React.FC<UpcomingAlertsModalProps> = ({
  isOpen,
  onClose,
  upcomingRecords,
  recommendations,
  onSelectRecommendation,
  onSelectRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recommended'>('upcoming');

  if (!isOpen) return null;

  // Calculate days remaining helper
  const getDaysRemainingText = (startDate: string) => {
    if (!startDate) return 'เร็วๆ นี้';
    const target = new Date(startDate);
    const now = new Date();
    // Reset hours
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'กำลังจัดอบรมหรือผ่านไปแล้ว';
    if (diffDays === 0) return '⚡ จัดอบรมวันนี้!';
    if (diffDays === 1) return '⚠️ จัดอบรมวันพรุ่งนี้';
    if (diffDays <= 7) return `🔔 อีก ${diffDays} วัน (สัปดาห์นี้)`;
    return `📅 อีก ${diffDays} วัน`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ศูนย์แจ้งเตือนการฝึกอบรมบุคลากร
              </h2>
              <p className="text-xs text-slate-300">
                อบต.โนนหนามแท่ง • ติดตามกำหนดการและโครงการอบรมพัฒนาตนเอง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-4 w-4 text-amber-500" />
            <span>กำหนดการอบรมที่ใกล้ถึง</span>
            <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-bold">
              {upcomingRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recommended')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'recommended'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>โครงการอบรมใหม่ที่น่าสนใจ</span>
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-bold">
              {recommendations.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'upcoming' ? (
            upcomingRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-base font-medium text-slate-600">ไม่มีกำหนดการอบรมเร็วๆ นี้</p>
                <p className="text-xs text-slate-400 mt-1">
                  ทุกโครงการที่มีบันทึกไว้ใน Google Sheets ได้รับการอบรมเสร็จสิ้นครบถ้วนแล้ว
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="text-xs text-slate-500 bg-blue-50/70 text-blue-800 p-3 rounded-xl border border-blue-200/60 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>
                    ระบบดึงข้อมูลจากทะเบียนใน Google Sheets เพื่อแจ้งเตือนบุคลากรล่วงหน้า ช่วยให้เตรียมตัวเดินทางและจัดสรรภาระงานได้อย่างมีประสิทธิภาพ
                  </span>
                </div>

                {upcomingRecords.map((item) => {
                  const daysText = getDaysRemainingText(item.startDate);
                  const isSoon = daysText.includes('วัน') && !daysText.includes('ผ่าน');

                  return (
                    <div
                      key={item.id}
                      className="group rounded-xl border border-slate-200 bg-white p-4.5 hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isSoon
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {daysText}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {item.department}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {item.format}
                        </span>
                      </div>

                      <h4 className="mt-2 text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {item.projectName}
                      </h4>

                      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            <strong className="text-slate-800">{item.fullName}</strong> ({item.position})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {item.startDate} {item.endDate && item.endDate !== item.startDate ? `ถึง ${item.endDate}` : ''} ({item.hours} ชม.)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:col-span-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          จัดโดย: <span className="font-medium text-slate-700">{item.organizer}</span>
                        </span>
                        <button
                          onClick={() => {
                            onSelectRecord(item);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                          ดูรายละเอียดประวัติ
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-3.5">
              <div className="text-xs text-slate-600 bg-amber-50/80 text-amber-900 p-3 rounded-xl border border-amber-200/80 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  หลักสูตรแนะนำที่ผ่านการคัดสรรสำหรับบุคลากรส่วนท้องถิ่น (อปท.) สามารถคลิกนำไปบันทึกประวัติล่วงหน้าเพื่อเตรียมการเข้าร่วมได้ทันที
                </span>
              </div>

              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/30 to-white p-4.5 hover:shadow-md transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {rec.category}
                      </span>
                      {rec.isUrgent && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          🔥 เปิดรับสมัครด่วน
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      เป้าหมาย: <strong className="text-slate-800">{rec.targetDepartment}</strong>
                    </span>
                  </div>

                  <h4 className="mt-2 text-base font-bold text-slate-900">
                    {rec.title}
                  </h4>

                  <p className="mt-1.5 text-xs text-amber-900/80 bg-amber-100/50 p-2 rounded-lg font-medium">
                    💡 ประโยชน์ต่อ อบต.โนนหนามแท่ง: {rec.highlight}
                  </p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>ช่วงวันจัดอบรม: {rec.dates}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>ประมาณ {rec.estimatedHours} ชั่วโมง</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>จัดโดย: {rec.organizer}</span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        onSelectRecommendation(rec);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      นำโครงการนี้ไปบันทึกประวัติการอบรม
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
