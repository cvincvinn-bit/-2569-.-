import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  Award,
  Calendar,
  User,
  Clock,
  Building,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { TrainingRecord } from '../types/training';

interface CertificateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TrainingRecord | null;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !record) return null;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download certificate as canvas / printable image
  const handleDownload = () => {
    if (record.certificateUrl && !record.certificateUrl.startsWith('data:')) {
      // If external image URL, open or trigger download
      const link = document.createElement('a');
      link.href = record.certificateUrl;
      link.target = '_blank';
      link.download = record.certificateFileName || `ใบประกาศ_${record.fullName}.jpg`;
      link.click();
    } else {
      // Print or use standard print dialog
      window.print();
    }
  };

  const hasRealImage = Boolean(record.certificateUrl && record.certificateUrl.length > 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:fixed-none">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[95vh] flex flex-col print:max-w-none print:shadow-none print:border-none print:max-h-none">
        
        {/* Header (Hidden in Print) */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ใบประกาศนียบัตร / วุฒิบัตรการฝึกอบรม
              </h3>
              <p className="text-xs text-slate-400">
                {record.fullName} • {record.projectName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {record.certificateDriveId && (
              <a
                href={record.certificateUrl || `https://drive.google.com/file/d/${record.certificateDriveId}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>เปิดใน Google Drive</span>
              </a>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>พิมพ์ใบประกาศ</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center print:bg-white print:p-0">
          
          {hasRealImage ? (
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-slate-300 p-2 sm:p-4 text-center">
              <img
                src={record.certificateUrl}
                alt={`ใบประกาศของ ${record.fullName}`}
                className="w-full h-auto rounded-lg max-h-[70vh] object-contain mx-auto"
              />
              <div className="mt-3 text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>เอกสารใบประกาศนียบัตรฉบับจริง จัดเก็บในระบบของ อบต.โนนหนามแท่ง</span>
              </div>
            </div>
          ) : (
            /* Official Non Nam Thaeng E-Certificate Layout */
            <div
              ref={certRef}
              className="relative w-full max-w-3xl bg-amber-50/40 border-[12px] border-double border-amber-700/80 p-8 sm:p-12 rounded-xl shadow-xl text-center font-['Sarabun'] print:border-amber-700 print:shadow-none"
              style={{
                backgroundImage: 'radial-gradient(ellipse at center, rgba(254, 243, 199, 0.4) 0%, rgba(255, 255, 255, 1) 75%)',
              }}
            >
              {/* Inner ornamental corner accents */}
              <div className="absolute top-2 left-2 text-amber-700/50 text-2xl font-serif">❖</div>
              <div className="absolute top-2 right-2 text-amber-700/50 text-2xl font-serif">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-700/50 text-2xl font-serif">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-700/50 text-2xl font-serif">❖</div>

              {/* SAO Emblem representation */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-md border-2 border-amber-300 mb-3">
                <Building className="h-10 w-10 text-slate-900" />
              </div>

              <div className="text-sm font-bold tracking-widest text-amber-900 uppercase">
                องค์การบริหารส่วนตำบลโนนหนามแท่ง
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                อำเภอเมืองอำนาจเจริญ จังหวัดอำนาจเจริญ
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-4 tracking-tight">
                วุฒิบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า
              </h2>

              <div className="my-5">
                <p className="text-2xl sm:text-3xl font-extrabold text-indigo-950 border-b-2 border-dotted border-amber-600/70 inline-block pb-1.5 px-6">
                  {record.fullName}
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-2">
                  ตำแหน่ง {record.position} ({record.department})
                </p>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed max-w-xl mx-auto">
                ได้ผ่านการฝึกอบรมและพัฒนาศักยภาพบุคลากร ในโครงการ
              </p>

              <div className="my-3 px-4 py-3 bg-white/80 rounded-xl border border-amber-200/80 inline-block max-w-2xl">
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  "{record.projectName}"
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  จัดโดย {record.organizer} ณ {record.location}
                </p>
              </div>

              <div className="mt-2 text-xs sm:text-sm text-slate-700">
                ระหว่างวันที่ {record.startDate} {record.endDate && record.endDate !== record.startDate ? `ถึง ${record.endDate}` : ''} รวมทั้งสิ้น <strong className="text-indigo-900 font-bold">{record.hours} ชั่วโมง</strong>
              </div>

              {/* Signatures */}
              <div className="mt-10 pt-6 border-t border-amber-300/60 flex items-center justify-around text-xs text-slate-800">
                <div className="text-center">
                  <div className="font-serif italic text-base text-slate-500 font-semibold mb-1">
                    ( ลายมือชื่ออิเล็กทรอนิกส์ )
                  </div>
                  <div className="font-bold text-slate-900">นายสมศักดิ์ สายบุญ</div>
                  <div className="text-slate-600 text-[11px]">ปลัดองค์การบริหารส่วนตำบลโนนหนามแท่ง</div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-500 text-amber-800 shadow-inner">
                    <Shield className="h-7 w-7 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-900 mt-1">ตราประทับดิจิทัล</span>
                  <span className="text-[9px] text-slate-400">ID: {record.id}</span>
                </div>

                <div className="text-center">
                  <div className="font-serif italic text-base text-slate-500 font-semibold mb-1">
                    ( ลายมือชื่ออิเล็กทรอนิกส์ )
                  </div>
                  <div className="font-bold text-slate-900">นายกองค์การบริหารส่วนตำบล</div>
                  <div className="text-slate-600 text-[11px]">องค์การบริหารส่วนตำบลโนนหนามแท่ง</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer controls (Hidden in Print) */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500">
            รหัสวุฒิบัตร: <strong className="text-slate-700">{record.id}</strong> • บันทึกอัตโนมัติใน Google Sheets
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>พิมพ์</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
