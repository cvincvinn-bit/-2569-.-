import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Award,
  Edit2,
  Trash2,
  ExternalLink,
  MapPin,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Building,
  User,
  Plus,
} from 'lucide-react';
import { TrainingRecord, Department, TrainingStatus } from '../types/training';
import { DEPARTMENTS } from '../data/initialData';

interface TrainingTableProps {
  records: TrainingRecord[];
  onOpenAddModal: () => void;
  onEditRecord: (record: TrainingRecord) => void;
  onRequestDeleteRecord: (record: TrainingRecord) => void;
  onViewCertificate: (record: TrainingRecord) => void;
  filterDepartment?: string;
  setFilterDepartment?: (dept: string) => void;
  filterPerson?: string;
  setFilterPerson?: (name: string) => void;
}

export const TrainingTable: React.FC<TrainingTableProps> = ({
  records,
  onOpenAddModal,
  onEditRecord,
  onRequestDeleteRecord,
  onViewCertificate,
  filterDepartment,
  setFilterDepartment,
  filterPerson,
  setFilterPerson,
}) => {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>(filterDepartment || 'all');
  const [startDateFrom, setStartDateFrom] = useState<string>('');
  const [startDateTo, setStartDateTo] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'hours' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sync external filters if triggered from Dashboard
  React.useEffect(() => {
    if (filterDepartment) {
      setSelectedDept(filterDepartment);
    }
  }, [filterDepartment]);

  React.useEffect(() => {
    if (filterPerson) {
      setSearchQuery(filterPerson);
    }
  }, [filterPerson]);

  // Filter Logic: Search by Full Name, Position, Project Name, Date range, Dept, Status
  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        // 1. Text search across Name, Position, and Project Name
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = record.fullName?.toLowerCase().includes(q);
          const matchPosition = record.position?.toLowerCase().includes(q);
          const matchProject = record.projectName?.toLowerCase().includes(q);
          const matchOrganizer = record.organizer?.toLowerCase().includes(q);
          const matchLocation = record.location?.toLowerCase().includes(q);
          if (!matchName && !matchPosition && !matchProject && !matchOrganizer && !matchLocation) {
            return false;
          }
        }

        // 2. Department filter
        if (selectedDept !== 'all' && record.department !== selectedDept) {
          return false;
        }

        // 3. Date Range Filter
        if (startDateFrom && record.startDate < startDateFrom) {
          return false;
        }
        if (startDateTo && record.startDate > startDateTo) {
          return false;
        }

        // 4. Status filter
        if (selectedStatus !== 'all' && record.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const dateA = a.startDate || '';
          const dateB = b.startDate || '';
          return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
        }
        if (sortBy === 'hours') {
          return sortOrder === 'desc' ? b.hours - a.hours : a.hours - b.hours;
        }
        if (sortBy === 'name') {
          return sortOrder === 'desc'
            ? b.fullName.localeCompare(a.fullName)
            : a.fullName.localeCompare(b.fullName);
        }
        return 0;
      });
  }, [records, searchQuery, selectedDept, startDateFrom, startDateTo, selectedStatus, sortBy, sortOrder]);

  // Statistics for current filtered view
  const filteredHoursTotal = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.hours || 0), 0);
  }, [filteredRecords]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('all');
    setStartDateFrom('');
    setStartDateTo('');
    setSelectedStatus('all');
    if (setFilterDepartment) setFilterDepartment('all');
    if (setFilterPerson) setFilterPerson('');
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedDept !== 'all' ||
    Boolean(startDateFrom) ||
    Boolean(startDateTo) ||
    selectedStatus !== 'all';

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'รหัส',
      'ชื่อ-สกุล',
      'ตำแหน่ง',
      'สังกัด/กอง',
      'โครงการที่ได้รับการฝึกอบรม',
      'หน่วยงานผู้จัด',
      'วันที่เริ่ม',
      'วันที่สิ้นสุด',
      'จำนวนชั่วโมง',
      'สถานที่',
      'รูปแบบ',
      'สถานะ',
      'งบประมาณ',
      'หมายเหตุ',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.id}"`,
      `"${r.fullName}"`,
      `"${r.position}"`,
      `"${r.department}"`,
      `"${r.projectName.replace(/"/g, '""')}"`,
      `"${r.organizer}"`,
      `"${r.startDate}"`,
      `"${r.endDate}"`,
      r.hours,
      `"${r.location}"`,
      `"${r.format}"`,
      `"${r.status}"`,
      r.budget,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ประวัติการฝึกอบรม_อบต_โนนหนามแท่ง_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* SEARCH & FILTER CONTROLS CARD */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              ระบบค้นหาและกรองข้อมูลการฝึกอบรมบุคลากร
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>ล้างตัวกรอง</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title="ส่งออกเป็นไฟล์ CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ส่งออก CSV</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ เพิ่มประวัติการอบรม</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          
          {/* Search Box (ชื่อ-สกุล, ตำแหน่ง, ชื่อโครงการ) - 5 columns */}
          <div className="lg:col-span-5 relative">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              ค้นหาจาก ชื่อ-สกุล, ตำแหน่ง, หรือชื่อโครงการ
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="พิมพ์ชื่อ, ตำแหน่ง, หรือหัวข้อโครงการ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Department Filter - 3 columns */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              สังกัด / กอง
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">ทุกสำนัก/กอง (ทั้งหมด)</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Date From - 2 columns */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              วันที่เริ่ม (ตั้งแต่)
            </label>
            <input
              type="date"
              value={startDateFrom}
              onChange={(e) => setStartDateFrom(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
            />
          </div>

          {/* Date To - 2 columns */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              วันที่เริ่ม (ถึงวันที่)
            </label>
            <input
              type="date"
              value={startDateTo}
              onChange={(e) => setStartDateTo(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-600">สถานะ:</span>
            {['all', 'เสร็จสิ้นแล้ว', 'กำลังอบรม', 'มีกำหนดการเร็วๆ นี้'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'ทุกสถานะ' : status}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">เรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 bg-white cursor-pointer"
            >
              <option value="date">วันที่อบรม</option>
              <option value="hours">จำนวนชั่วโมง</option>
              <option value="name">ชื่อบุคลากร</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold"
              title={sortOrder === 'desc' ? 'เรียงจากมากไปน้อย' : 'เรียงจากน้อยไปมาก'}
            >
              {sortOrder === 'desc' ? '↓ ล่าสุด' : '↑ เก่าสุด'}
            </button>
          </div>
        </div>

        {/* Filter Badges Summary */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
          <div className="text-slate-600 flex items-center gap-2">
            <span>
              พบข้อมูลที่ตรงตามเงื่อนไข{' '}
              <strong className="text-indigo-900 font-extrabold">{filteredRecords.length}</strong> จากทั้งหมด{' '}
              {records.length} รายการ
            </span>
            <span className="text-slate-300">•</span>
            <span>
              ชั่วโมงอบรมรวม:{' '}
              <strong className="text-emerald-700 font-extrabold">{filteredHoursTotal} ชั่วโมง</strong>
            </span>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              {searchQuery && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
                  คำค้น: "{searchQuery}"
                </span>
              )}
              {selectedDept !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-200">
                  กอง: {selectedDept}
                </span>
              )}
              {(startDateFrom || startDateTo) && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-medium border border-blue-200">
                  ช่วง: {startDateFrom || 'ก่อนหน้า'} ถึง {startDateTo || 'ปัจจุบัน'}
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                  {selectedStatus}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TRAINING DATA TABLE CARD */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Search className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-bold text-slate-700">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
            <p className="text-xs text-slate-400 mt-1">
              ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ล้างตัวกรอง" เพื่อแสดงข้อมูลทั้งหมด
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">รหัส / วันที่</th>
                  <th className="py-3.5 px-4">บุคลากรผู้รับการอบรม</th>
                  <th className="py-3.5 px-4">สังกัด/กอง</th>
                  <th className="py-3.5 px-4 min-w-[220px]">โครงการที่ได้รับการฝึกอบรม</th>
                  <th className="py-3.5 px-4">สถานที่จัดอบรม</th>
                  <th className="py-3.5 px-4 text-center">ชั่วโมง</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-center">ใบประกาศ</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => {
                  const hasCert = Boolean(item.certificateUrl || item.certificateDriveId);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-indigo-50/20 transition-colors group"
                    >
                      {/* ID and Date */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="font-bold text-slate-800">{item.id}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{item.startDate}</span>
                        </div>
                      </td>

                      {/* Attendee */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>{item.fullName}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium pl-5">
                          {item.position}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                          {item.department}
                        </span>
                      </td>

                      {/* Course / Project & Organizer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors">
                          {item.projectName}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-slate-600 font-medium">โดย {item.organizer}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium">
                            {item.format}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-start gap-1 max-w-[180px]">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.location}</span>
                        </div>
                      </td>

                      {/* Hours */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs">
                          <Clock className="h-3 w-3 text-indigo-600" />
                          {item.hours} ชม.
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.status === 'เสร็จสิ้นแล้ว' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            เสร็จสิ้น
                          </span>
                        )}
                        {item.status === 'กำลังอบรม' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 animate-pulse">
                            กำลังอบรม
                          </span>
                        )}
                        {item.status === 'มีกำหนดการเร็วๆ นี้' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                            มีกำหนดการ
                          </span>
                        )}
                      </td>

                      {/* Certificate */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onViewCertificate(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            hasCert
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-indigo-200'
                          }`}
                          title="ดูหรือพิมพ์ใบประกาศนียบัตร"
                        >
                          <Award className="h-3.5 w-3.5 text-amber-600" />
                          <span>{hasCert ? 'ดูใบประกาศ' : 'ออกวุฒิบัตร'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditRecord(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onRequestDeleteRecord(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="ลบรายการ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
