import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Users,
  Clock,
  BookOpen,
  DollarSign,
  Award,
  ChevronDown,
  Building,
  Printer,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { TrainingRecord, Department } from '../types/training';
import { DEPARTMENTS } from '../data/initialData';

interface ExecutiveDashboardProps {
  records: TrainingRecord[];
  onSelectPersonFilter?: (name: string) => void;
  onSelectDeptFilter?: (dept: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  records,
  onSelectPersonFilter,
  onSelectDeptFilter,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [barChartMode, setBarChartMode] = useState<'dept' | 'person'>('dept');
  const [donutChartMode, setDonutChartMode] = useState<'dept' | 'format'>('dept');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null);

  // Extract available years from records (converting Gregorian YYYY to Thai Buddhist Era BE if desired)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    records.forEach((r) => {
      if (r.startDate) {
        const year = r.startDate.substring(0, 4);
        yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [records]);

  // Filter records by selected year
  const filteredRecords = useMemo(() => {
    if (selectedYear === 'all') return records;
    return records.filter((r) => r.startDate && r.startDate.startsWith(selectedYear));
  }, [records, selectedYear]);

  // Overall KPIs
  const totalHours = useMemo(() => {
    return filteredRecords.reduce((acc, cur) => acc + (cur.hours || 0), 0);
  }, [filteredRecords]);

  const totalBudget = useMemo(() => {
    return filteredRecords.reduce((acc, cur) => acc + (cur.budget || 0), 0);
  }, [filteredRecords]);

  const uniquePeople = useMemo(() => {
    const people = new Set<string>();
    filteredRecords.forEach((r) => {
      if (r.fullName) people.add(r.fullName.trim());
    });
    return Array.from(people);
  }, [filteredRecords]);

  const avgHoursPerPerson = uniquePeople.length > 0 ? Math.round((totalHours / uniquePeople.length) * 10) / 10 : 0;

  // Department statistics
  const deptStats = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const deptRecords = filteredRecords.filter((r) => r.department === dept);
      const hours = deptRecords.reduce((sum, r) => sum + (r.hours || 0), 0);
      const budget = deptRecords.reduce((sum, r) => sum + (r.budget || 0), 0);
      const people = Array.from(new Set(deptRecords.map((r) => r.fullName.trim())));
      const coursesCount = deptRecords.length;
      const avgHours = people.length > 0 ? Math.round((hours / people.length) * 10) / 10 : 0;

      return {
        department: dept,
        recordsCount: coursesCount,
        peopleCount: people.length,
        totalHours: hours,
        totalBudget: budget,
        avgHours,
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredRecords]);

  // Individual personnel statistics
  const personStats = useMemo(() => {
    const map = new Map<
      string,
      {
        fullName: string;
        position: string;
        department: Department;
        totalHours: number;
        coursesCount: number;
        budget: number;
        certificatesCount: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const name = r.fullName.trim();
      const existing = map.get(name) || {
        fullName: name,
        position: r.position,
        department: r.department,
        totalHours: 0,
        coursesCount: 0,
        budget: 0,
        certificatesCount: 0,
      };

      existing.totalHours += r.hours || 0;
      existing.coursesCount += 1;
      existing.budget += r.budget || 0;
      if (r.certificateUrl || r.certificateDriveId) {
        existing.certificatesCount += 1;
      }
      map.set(name, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredRecords]);

  // Format statistics (Onsite vs Online vs Hybrid)
  const formatStats = useMemo(() => {
    const counts: Record<string, { label: string; count: number; hours: number; color: string }> = {
      'Onsite (ณ สถานที่จัด)': { label: 'Onsite (สถานที่จัด)', count: 0, hours: 0, color: '#4f46e5' },
      'Online (อบรมออนไลน์)': { label: 'Online (ออนไลน์)', count: 0, hours: 0, color: '#06b6d4' },
      'Hybrid (ผสมผสาน)': { label: 'Hybrid (ผสมผสาน)', count: 0, hours: 0, color: '#f59e0b' },
    };

    filteredRecords.forEach((r) => {
      if (counts[r.format]) {
        counts[r.format].count += 1;
        counts[r.format].hours += r.hours || 0;
      } else {
        counts['Onsite (ณ สถานที่จัด)'].count += 1;
        counts['Onsite (ณ สถานที่จัด)'].hours += r.hours || 0;
      }
    });

    return Object.values(counts);
  }, [filteredRecords]);

  // Print Executive Summary Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  // Pre-defined color palette for departments
  const deptColors = ['#2563eb', '#0891b2', '#059669', '#d97706', '#7c3aed', '#dc2626'];

  // Bar chart data preparation
  const barData = barChartMode === 'dept'
    ? deptStats.map((d, i) => ({
        label: d.department.replace('กองการศึกษา ศาสนาและวัฒนธรรม', 'กองการศึกษาฯ').replace('กองสาธารณสุขและสิ่งแวดล้อม', 'กองสาธารณสุขฯ'),
        fullLabel: d.department,
        value: d.totalHours,
        secondaryValue: `${d.recordsCount} โครงการ`,
        people: d.peopleCount,
        color: deptColors[i % deptColors.length],
      }))
    : personStats.slice(0, 8).map((p, i) => ({
        label: p.fullName.replace('นาย', '').replace('นางสาว', '').replace('น.ส.', '').replace('นาง', '').trim(),
        fullLabel: `${p.fullName} (${p.position})`,
        value: p.totalHours,
        secondaryValue: `${p.coursesCount} โครงการ`,
        people: 1,
        color: deptColors[i % deptColors.length],
      }));

  const maxBarValue = Math.max(...barData.map((d) => d.value), 10);

  // Donut chart calculations
  const donutData = donutChartMode === 'dept'
    ? deptStats.filter((d) => d.totalHours > 0).map((d, i) => ({
        label: d.department,
        value: d.totalHours,
        color: deptColors[i % deptColors.length],
      }))
    : formatStats.filter((f) => f.hours > 0).map((f) => ({
        label: f.label,
        value: f.hours,
        color: f.color,
      }));

  const totalDonutValue = donutData.reduce((sum, d) => sum + d.value, 0) || 1;

  // Generate SVG arcs for Donut
  let cumulativeAngle = 0;
  const donutArcs = donutData.map((slice) => {
    const fraction = slice.value / totalDonutValue;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    // Convert polar to cartesian (radius: outer 80, inner 50, center: 100, 100)
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);

    const x3 = 100 + 50 * Math.cos(endRad);
    const y3 = 100 + 50 * Math.sin(endRad);
    const x4 = 100 + 50 * Math.cos(startRad);
    const y4 = 100 + 50 * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;
    const pathData = `M ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A 50 50 0 ${largeArc} 0 ${x4} ${y4} Z`;

    return {
      ...slice,
      percentage: Math.round(fraction * 100),
      pathData,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in print:p-0">
      
      {/* Executive Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Executive HRD Analytics
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            แดชบอร์ดสรุปผลงานการพัฒนาบุคลากร
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            องค์การบริหารส่วนตำบลโนนหนามแท่ง • สถิติชั่วโมงการฝึกอบรมรายบุคคลและรายแผนก
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              ปีงบประมาณ:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">ทุกปีงบประมาณ ({records.length} รายการ)</option>
              {availableYears.map((yr) => {
                const thaiYear = parseInt(yr, 10) + 543;
                return (
                  <option key={yr} value={yr}>
                    ปี พ.ศ. {thaiYear} (ค.ศ. {yr})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-300 active:scale-95"
            title="พิมพ์รายงานสรุปผู้บริหาร"
          >
            <Printer className="h-4 w-4 text-slate-700" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hours */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-indigo-800/60 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-indigo-800/30">
            <Clock className="h-28 w-28" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                ชั่วโมงการอบรมรวมทั้งหมด
              </span>
              <span className="p-2 rounded-xl bg-indigo-800/80 text-amber-300">
                <Clock className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">{totalHours}</span>
              <span className="text-sm font-semibold text-indigo-300">ชั่วโมง</span>
            </div>
            <div className="mt-2 text-xs text-indigo-200/90 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>เฉลี่ย <strong>{avgHoursPerPerson}</strong> ชม. ต่อคน</span>
            </div>
          </div>
        </div>

        {/* Total Courses */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              โครงการ/หลักสูตรที่อบรม
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">
              {filteredRecords.length}
            </span>
            <span className="text-sm font-semibold text-slate-500">โครงการ</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            ผ่านการรับรองและเก็บสถิติในระบบ
          </div>
        </div>

        {/* Personnel Trained */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              บุคลากรที่ได้รับการพัฒนา
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">
              {uniquePeople.length}
            </span>
            <span className="text-sm font-semibold text-slate-500">คน</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>ครอบคลุมทุกกองใน อบต.</span>
          </div>
        </div>

        {/* Budget Utilized */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              งบประมาณพัฒนาบุคลากรรวม
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalBudget.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-slate-500">บาท</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            เฉลี่ย ฿{filteredRecords.length > 0 ? Math.round(totalBudget / filteredRecords.length).toLocaleString() : 0} ต่อหลักสูตร
          </div>
        </div>
      </div>

      {/* Charts Row: Bar Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* BAR CHART: 7 Columns */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {barChartMode === 'dept' ? 'สถิติชั่วโมงการฝึกอบรมแยกตามรายแผนก/กอง' : 'สถิติจำนวนชั่วโมงอบรมสูงสุดรายบุคคล'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    แสดงผลด้วยกราฟแท่งเปรียบเทียบชั่วโมงพัฒนาบุคลากร
                  </p>
                </div>
              </div>

              {/* Bar Chart Mode Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto border border-slate-200">
                <button
                  onClick={() => setBarChartMode('dept')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    barChartMode === 'dept'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  แยกตามแผนก/กอง
                </button>
                <button
                  onClick={() => setBarChartMode('person')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    barChartMode === 'person'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  แยกตามรายบุคคล
                </button>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="mt-6 pt-2">
              <div className="space-y-4">
                {barData.map((item, index) => {
                  const percentage = maxBarValue > 0 ? (item.value / maxBarValue) * 100 : 0;
                  const isHovered = hoveredBarIndex === index;

                  return (
                    <div
                      key={item.fullLabel}
                      onMouseEnter={() => setHoveredBarIndex(index)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className="group cursor-pointer"
                      onClick={() => {
                        if (barChartMode === 'dept' && onSelectDeptFilter) {
                          onSelectDeptFilter(item.fullLabel);
                        } else if (barChartMode === 'person' && onSelectPersonFilter) {
                          onSelectPersonFilter(item.fullLabel.split(' (')[0]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 truncate max-w-[240px] group-hover:text-indigo-600 transition-colors">
                          {item.fullLabel}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">{item.secondaryValue}</span>
                          <span className="font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {item.value} ชม.
                          </span>
                        </div>
                      </div>

                      {/* Bar Container */}
                      <div className="h-6 w-full rounded-xl bg-slate-100 overflow-hidden p-0.5 border border-slate-200/80">
                        <div
                          className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2 text-[10px] font-bold text-white shadow-xs"
                          style={{
                            width: `${Math.max(percentage, 5)}%`,
                            backgroundColor: item.color,
                            opacity: hoveredBarIndex === null || isHovered ? 1 : 0.6,
                          }}
                        >
                          {percentage > 25 && <span>{item.value} ชม.</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
              คลิกที่แท่งกราฟเพื่อกรองข้อมูลในทะเบียน
            </span>
            <span className="font-medium text-slate-700">เกณฑ์มาตรฐาน อปท.: 20 ชม./คน/ปี</span>
          </div>
        </div>

        {/* DONUT / PIE CHART: 5 Columns */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {donutChartMode === 'dept' ? 'สัดส่วนชั่วโมงอบรมตามสังกัด/กอง' : 'สัดส่วนตามรูปแบบการอบรม'}
                  </h3>
                  <p className="text-xs text-slate-500">กราฟวงกลมแสดงสัดส่วนร้อยละ</p>
                </div>
              </div>

              {/* Donut Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  onClick={() => setDonutChartMode('dept')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    donutChartMode === 'dept'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ตามกอง
                </button>
                <button
                  onClick={() => setDonutChartMode('format')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    donutChartMode === 'format'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  รูปแบบ
                </button>
              </div>
            </div>

            {/* SVG Donut Visual */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="relative w-44 h-44 shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {donutArcs.map((arc, idx) => (
                    <path
                      key={arc.label}
                      d={arc.pathData}
                      fill={arc.color}
                      className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                      style={{
                        transform: hoveredSliceIndex === idx ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: '100px 100px',
                      }}
                      onMouseEnter={() => setHoveredSliceIndex(idx)}
                      onMouseLeave={() => setHoveredSliceIndex(null)}
                    />
                  ))}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-2xl font-black text-slate-900">{totalHours}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">ชม. รวม</span>
                </div>
              </div>

              {/* Legends */}
              <div className="flex-1 space-y-2 w-full">
                {donutArcs.map((item, idx) => (
                  <div
                    key={item.label}
                    onMouseEnter={() => setHoveredSliceIndex(idx)}
                    onMouseLeave={() => setHoveredSliceIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      hoveredSliceIndex === idx ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="font-semibold text-slate-800 truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-medium text-slate-500">{item.value} ชม.</span>
                      <span className="font-bold text-slate-900 w-9 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            ระบบอัปเดตสถิติสอดคล้องกับฐานข้อมูล Google Sheets ทันที
          </div>
        </div>
      </div>

      {/* DEPARTMENT SUMMARY TABLE */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Building className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              ตารางสรุปสถิติการฝึกอบรมแยกตามรายแผนก/กอง (อบต.โนนหนามแท่ง)
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
            รวม {DEPARTMENTS.length} สำนัก/กอง
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">สำนัก / กอง</th>
                <th className="py-3.5 px-4 text-center">จำนวนบุคลากร</th>
                <th className="py-3.5 px-4 text-center">จำนวนโครงการ</th>
                <th className="py-3.5 px-4 text-center">ชั่วโมงอบรมรวม</th>
                <th className="py-3.5 px-4 text-center">เฉลี่ย (ชม./คน)</th>
                <th className="py-3.5 px-4 text-right">งบประมาณรวม (บาท)</th>
                <th className="py-3.5 px-4 text-center">สถานะตามเกณฑ์ อปท.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptStats.map((dept, idx) => {
                const passedBenchmark = dept.avgHours >= 15;
                return (
                  <tr key={dept.department} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: deptColors[idx % deptColors.length] }}
                      ></span>
                      {dept.department}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-medium">
                      {dept.peopleCount} คน
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-medium">
                      {dept.recordsCount} โครงการ
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {dept.totalHours} ชม.
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {dept.avgHours}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      ฿{dept.totalBudget.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {passedBenchmark ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="h-3 w-3" />
                          ผ่านเกณฑ์ดีเยี่ยม
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          ตามเป้าหมายต่อเนื่อง
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDIVIDUAL PERSONNEL SUMMARY TABLE */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              สรุปสถิติชั่วโมงการฝึกอบรมแยกตามรายบุคคล (Individual Training Performance)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            แสดง {personStats.length} บุคลากรที่มีประวัติการอบรม
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4">ตำแหน่ง</th>
                <th className="py-3.5 px-4">สังกัด/กอง</th>
                <th className="py-3.5 px-4 text-center">โครงการที่ผ่าน</th>
                <th className="py-3.5 px-4 text-center">ใบประกาศ</th>
                <th className="py-3.5 px-4 text-center">ชั่วโมงอบรมสะสม</th>
                <th className="py-3.5 px-4">ความคืบหน้าเป้าหมายรายปี (20 ชม.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {personStats.map((person) => {
                const targetGoal = 20; // 20 hours benchmark standard
                const progressPct = Math.min(Math.round((person.totalHours / targetGoal) * 100), 100);
                const isGoalMet = person.totalHours >= targetGoal;

                return (
                  <tr key={person.fullName} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {person.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {person.position}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        {person.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-bold">
                      {person.coursesCount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {person.certificatesCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Award className="h-3.5 w-3.5" />
                          {person.certificatesCount} ใบ
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-black text-indigo-900 text-sm">
                        {person.totalHours}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">ชม.</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-full max-w-[200px]">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                          <span className={isGoalMet ? 'text-emerald-700' : 'text-slate-600'}>
                            {isGoalMet ? 'บรรลุเกณฑ์ (100%)' : `${progressPct}%`}
                          </span>
                          <span className="text-slate-400">{person.totalHours}/20 ชม.</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isGoalMet ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
