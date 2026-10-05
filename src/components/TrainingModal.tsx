import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Upload,
  Award,
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  DollarSign,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  TrainingRecord,
  Department,
  TrainingFormat,
  TrainingStatus,
  TrainingRecommendation,
} from '../types/training';
import { DEPARTMENTS } from '../data/initialData';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: TrainingRecord, certificateFile?: File | null) => Promise<void>;
  editRecord?: TrainingRecord | null;
  initialFromRecommendation?: TrainingRecommendation | null;
  isSaving?: boolean;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editRecord,
  initialFromRecommendation,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState<Partial<TrainingRecord>>({
    fullName: '',
    position: '',
    department: 'สำนักปลัด',
    projectName: '',
    organizer: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    hours: 12,
    location: '',
    format: 'Onsite (ณ สถานที่จัด)',
    status: 'เสร็จสิ้นแล้ว',
    budget: 0,
    certificateUrl: '',
    certificateFileName: '',
    notes: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [autoECert, setAutoECert] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Populate data when editing or from recommendation
  useEffect(() => {
    if (editRecord) {
      setFormData(editRecord);
      setSelectedFile(null);
      setFilePreview(editRecord.certificateUrl || null);
      setAutoECert(!editRecord.certificateUrl);
    } else if (initialFromRecommendation) {
      setFormData({
        fullName: '',
        position: '',
        department: (initialFromRecommendation.targetDepartment.split('/')[0].trim() as Department) || 'สำนักปลัด',
        projectName: initialFromRecommendation.title,
        organizer: initialFromRecommendation.organizer,
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10),
        hours: initialFromRecommendation.estimatedHours || 12,
        location: initialFromRecommendation.location,
        format: initialFromRecommendation.location.includes('ออนไลน์') ? 'Online (อบรมออนไลน์)' : 'Onsite (ณ สถานที่จัด)',
        status: 'มีกำหนดการเร็วๆ นี้',
        budget: 0,
        certificateUrl: '',
        certificateFileName: '',
        notes: `แนะนำจากโครงการ: ${initialFromRecommendation.highlight}`,
      });
      setSelectedFile(null);
      setFilePreview(null);
      setAutoECert(false);
    } else {
      // Clean new record
      setFormData({
        fullName: '',
        position: '',
        department: 'สำนักปลัด',
        projectName: '',
        organizer: '',
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10),
        hours: 12,
        location: 'ห้องประชุม อบต.โนนหนามแท่ง',
        format: 'Onsite (ณ สถานที่จัด)',
        status: 'เสร็จสิ้นแล้ว',
        budget: 0,
        certificateUrl: '',
        certificateFileName: '',
        notes: '',
      });
      setSelectedFile(null);
      setFilePreview(null);
      setAutoECert(true);
    }
    setErrorMessage(null);
  }, [editRecord, initialFromRecommendation, isOpen]);

  if (!isOpen) return null;

  // Handle file drop/selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAutoECert(false);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.fullName?.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-สกุล บุคลากร');
      return;
    }
    if (!formData.projectName?.trim()) {
      setErrorMessage('กรุณาระบุชื่อโครงการที่ได้รับการฝึกอบรม');
      return;
    }

    const recordToSave: TrainingRecord = {
      id: editRecord?.id || `TR-${Date.now().toString().slice(-6)}`,
      fullName: formData.fullName.trim(),
      position: formData.position?.trim() || 'พนักงานส่วนตำบล',
      department: (formData.department as Department) || 'สำนักปลัด',
      projectName: formData.projectName.trim(),
      organizer: formData.organizer?.trim() || 'อบต.โนนหนามแท่ง',
      startDate: formData.startDate || new Date().toISOString().substring(0, 10),
      endDate: formData.endDate || formData.startDate || new Date().toISOString().substring(0, 10),
      hours: Number(formData.hours) || 0,
      location: formData.location?.trim() || 'อบต.โนนหนามแท่ง',
      format: (formData.format as TrainingFormat) || 'Onsite (ณ สถานที่จัด)',
      status: (formData.status as TrainingStatus) || 'เสร็จสิ้นแล้ว',
      budget: Number(formData.budget) || 0,
      certificateUrl: selectedFile ? (filePreview || '') : (autoECert ? '' : (formData.certificateUrl || '')),
      certificateFileName: selectedFile ? selectedFile.name : (formData.certificateFileName || ''),
      certificateDriveId: editRecord?.certificateDriveId || '',
      notes: formData.notes || '',
      createdAt: editRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSave(recordToSave, selectedFile);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {editRecord ? 'แก้ไขข้อมูลการฝึกอบรม' : 'บันทึกประวัติการฝึกอบรมบุคลากร'}
              </h3>
              <p className="text-xs text-slate-300">
                องค์การบริหารส่วนตำบลโนนหนามแท่ง • จัดเก็บลง Google Sheets อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Personal Info Group */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
              <User className="h-4 w-4 text-indigo-600" />
              <span>ข้อมูลบุคลากรผู้เข้ารับการอบรม</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมศักดิ์ สายบุญ"
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำแหน่ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เจ้าพนักงานธุรการ, ผอ.กองคลัง"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สังกัด / กอง <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department || 'สำนักปลัด'}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden cursor-pointer"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Training Project Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>รายละเอียดโครงการฝึกอบรม</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อโครงการที่ได้รับการฝึกอบรม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น การจัดทำแผนพัฒนาท้องถิ่น, พ.ร.บ.การจัดซื้อจัดจ้างฯ"
                value={formData.projectName || ''}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หน่วยงานผู้จัดอบรม
                </label>
                <input
                  type="text"
                  placeholder="เช่น กรมส่งเสริมการปกครองท้องถิ่น, สถาบันพัฒนาบุคลากรท้องถิ่น"
                  value={formData.organizer || ''}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สถานที่จัดอบรม
                </label>
                <input
                  type="text"
                  placeholder="เช่น โรงแรมเนวาด้า จ.อุบลราชธานี หรือ Zoom Meetings"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  จำนวนชั่วโมง (ชม.)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={formData.hours || 0}
                  onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  งบประมาณ (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.budget || 0}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รูปแบบการอบรม
                </label>
                <select
                  value={formData.format || 'Onsite (ณ สถานที่จัด)'}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value as TrainingFormat })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="Onsite (ณ สถานที่จัด)">Onsite (ณ สถานที่จัด)</option>
                  <option value="Online (อบรมออนไลน์)">Online (อบรมออนไลน์)</option>
                  <option value="Hybrid (ผสมผสาน)">Hybrid (ผสมผสาน)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สถานะการอบรม
                </label>
                <select
                  value={formData.status || 'เสร็จสิ้นแล้ว'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TrainingStatus })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="เสร็จสิ้นแล้ว">เสร็จสิ้นแล้ว</option>
                  <option value="กำลังอบรม">กำลังอบรม</option>
                  <option value="มีกำหนดการเร็วๆ นี้">มีกำหนดการเร็วๆ นี้</option>
                </select>
              </div>
            </div>
          </div>

          {/* Certificate Storage & Automation */}
          <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Award className="h-4 w-4 text-amber-600" />
                <span>ระบบจัดเก็บใบประกาศนียบัตรอัตโนมัติ</span>
              </div>
              <span className="text-[11px] text-slate-500">รองรับ JPG, PNG, PDF</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* File upload zone */}
              <div className="w-full flex-1">
                <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-amber-300 rounded-xl bg-white hover:bg-amber-50/50 transition-colors cursor-pointer group">
                  <Upload className="h-6 w-6 text-amber-600 group-hover:scale-110 transition-transform mb-1.5" />
                  <span className="text-xs font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : (formData.certificateFileName || 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่')}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    ไฟล์จะถูกอัปโหลดเข้า Google Drive และบันทึกลิงก์ลง Google Sheets
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preview or E-Cert option */}
              <div className="shrink-0 flex flex-col items-center justify-center text-center">
                {filePreview ? (
                  <div className="relative group">
                    <img
                      src={filePreview}
                      alt="พรีวิวใบประกาศ"
                      className="h-16 w-24 object-cover rounded-lg border border-slate-300 shadow-xs"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                      แนบไฟล์แล้ว
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-center max-w-[180px]">
                    <Sparkles className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-amber-900 block leading-tight">
                      มีระบบสร้างวุฒิบัตรอิเล็กทรอนิกส์ในตัว
                    </span>
                    <span className="text-[9px] text-slate-500">
                      หากยังไม่มีไฟล์ ระบบจะออกใบรับรอง อบต.โนนหนามแท่ง ให้ทันที
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุ / การนำความรู้ไปประยุกต์ใช้ใน อบต.
            </label>
            <textarea
              rows={2}
              placeholder="เช่น นำมาปรับปรุงระเบียบจัดซื้อจัดจ้าง หรือจัดทำคู่มือการปฏิบัติงานสำหรับประชาชน"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
            />
          </div>
        </form>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'กำลังบันทึกลง Google Sheets...' : 'บันทึกข้อมูล'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
