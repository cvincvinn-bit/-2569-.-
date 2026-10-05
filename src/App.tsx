/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  findOrCreateTrainingSpreadsheet,
  loadRecordsFromSheet,
  syncAllRecordsToSheet,
  uploadCertificateToDrive,
  SheetMetadata,
} from './services/sheetsService';
import {
  TrainingRecord,
  TrainingRecommendation,
} from './types/training';
import {
  INITIAL_TRAINING_RECORDS,
  RECOMMENDED_COURSES,
} from './data/initialData';

import { Navbar } from './components/Navbar';
import { NotificationBanner } from './components/NotificationBanner';
import { UpcomingAlertsModal } from './components/UpcomingAlertsModal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { TrainingTable } from './components/TrainingTable';
import { TrainingModal } from './components/TrainingModal';
import { CertificateViewerModal } from './components/CertificateViewerModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';

import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Plus,
  BarChart3,
  List,
} from 'lucide-react';

export default function App() {
  // Authentication & Google Sheets State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sheetMeta, setSheetMeta] = useState<SheetMetadata | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Main Data Records
  const [records, setRecords] = useState<TrainingRecord[]>(() => {
    const saved = localStorage.getItem('sao_nonnamthaeng_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse cached records', e);
      }
    }
    return INITIAL_TRAINING_RECORDS;
  });

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<'table' | 'dashboard'>('dashboard');
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);
  const [recommendationToFill, setRecommendationToFill] = useState<TrainingRecommendation | null>(null);
  const [viewingCertRecord, setViewingCertRecord] = useState<TrainingRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<TrainingRecord | null>(null);
  const [isSavingRecord, setIsSavingRecord] = useState<boolean>(false);

  // Cross-component Filters
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterPerson, setFilterPerson] = useState<string>('');

  // Persist records to localStorage as offline cache
  useEffect(() => {
    localStorage.setItem('sao_nonnamthaeng_records', JSON.stringify(records));
  }, [records]);

  // Status message auto-dismiss
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Connect Google Sheets flow
  const syncWithGoogle = useCallback(
    async (token: string, currentRecords: TrainingRecord[]) => {
      setIsSyncing(true);
      try {
        const meta = await findOrCreateTrainingSpreadsheet(token);
        setSheetMeta(meta);

        if (meta.createdNew) {
          // If sheet was newly created, populate with existing records
          await syncAllRecordsToSheet(token, meta.spreadsheetId, currentRecords);
          setStatusMessage({
            text: `สร้าง Google Sheet "${meta.name}" ใหม่และนำเข้า ${currentRecords.length} รายการเรียบร้อยแล้ว`,
            type: 'success',
          });
        } else {
          // If sheet exists, load data from it
          const sheetRecords = await loadRecordsFromSheet(token, meta.spreadsheetId);
          if (sheetRecords && sheetRecords.length > 0) {
            setRecords(sheetRecords);
            setStatusMessage({
              text: `ซิงค์ข้อมูลจาก Google Sheet สำเร็จ (${sheetRecords.length} รายการ)`,
              type: 'success',
            });
          } else {
            // Sheet was empty, push current records
            await syncAllRecordsToSheet(token, meta.spreadsheetId, currentRecords);
            setStatusMessage({
              text: `เชื่อมต่อกับ Google Sheet สำเร็จ และบันทึกข้อมูลตั้งต้นแล้ว`,
              type: 'success',
            });
          }
        }
      } catch (err: any) {
        console.error('Error syncing with Google Sheets:', err);
        setStatusMessage({
          text: `การเชื่อมต่อ Google Sheets ขัดข้อง: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`,
          type: 'error',
        });
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        syncWithGoogle(token, records);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, [syncWithGoogle]);

  // Manual Login Handler
  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        await syncWithGoogle(result.accessToken, records);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setStatusMessage({
        text: 'การเข้าสู่ระบบ Google ยกเลิกหรือไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        type: 'error',
      });
    }
  };

  // Manual Logout Handler
  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSheetMeta(null);
    setStatusMessage({
      text: 'ออกจากระบบ Google แล้ว ระบบจะทำงานในโหมดบันทึกข้อมูลในเครื่อง',
      type: 'info',
    });
  };

  // Manual Sync Button Handler
  const handleManualSync = async () => {
    const token = accessToken || (await getAccessToken());
    if (token) {
      await syncWithGoogle(token, records);
    } else {
      await handleGoogleLogin();
    }
  };

  // Upcoming records calculation
  const upcomingRecords = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return records.filter((r) => {
      if (r.status === 'มีกำหนดการเร็วๆ นี้' || r.status === 'กำลังอบรม') return true;
      if (r.startDate) {
        const start = new Date(r.startDate);
        return start >= now;
      }
      return false;
    });
  }, [records]);

  // Total unread alerts count
  const unreadAlertsCount = upcomingRecords.length + RECOMMENDED_COURSES.length;

  // Add / Edit Record Save Handler
  const handleSaveRecord = async (newOrUpdated: TrainingRecord, certificateFile?: File | null) => {
    setIsSavingRecord(true);
    let finalRecord = { ...newOrUpdated };

    try {
      const token = accessToken || (await getAccessToken());

      // If user uploaded a certificate file & we have a token, upload to Google Drive!
      if (certificateFile && token) {
        try {
          const driveFile = await uploadCertificateToDrive(token, certificateFile, {
            fullName: finalRecord.fullName,
            projectName: finalRecord.projectName,
          });
          finalRecord.certificateDriveId = driveFile.fileId;
          finalRecord.certificateUrl = driveFile.webViewLink;
          finalRecord.certificateFileName = driveFile.fileName;
        } catch (driveErr) {
          console.warn('Drive upload failed, keeping local file name', driveErr);
        }
      }

      let updatedList: TrainingRecord[];
      const existingIndex = records.findIndex((r) => r.id === finalRecord.id);

      if (existingIndex >= 0) {
        // Edit existing
        updatedList = [...records];
        updatedList[existingIndex] = finalRecord;
        setStatusMessage({
          text: `แก้ไขประวัติการอบรมของ "${finalRecord.fullName}" สำเร็จ`,
          type: 'success',
        });
      } else {
        // Add new
        updatedList = [finalRecord, ...records];
        setStatusMessage({
          text: `บันทึกประวัติการอบรมของ "${finalRecord.fullName}" เข้าสู่ระบบสำเร็จ`,
          type: 'success',
        });
      }

      setRecords(updatedList);

      // Sync changes to Google Sheet if connected
      if (token && sheetMeta) {
        await syncAllRecordsToSheet(token, sheetMeta.spreadsheetId, updatedList);
      }
    } catch (err: any) {
      console.error('Error saving record:', err);
      setStatusMessage({
        text: `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${err.message}`,
        type: 'error',
      });
      throw err;
    } finally {
      setIsSavingRecord(false);
      setIsAddEditModalOpen(false);
      setEditingRecord(null);
      setRecommendationToFill(null);
    }
  };

  // Delete Record Handler (Triggered after confirmation)
  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    const target = recordToDelete;
    setRecordToDelete(null);

    const updatedList = records.filter((r) => r.id !== target.id);
    setRecords(updatedList);

    setStatusMessage({
      text: `ลบรายการประวัติการฝึกอบรมของ "${target.fullName}" เรียบร้อยแล้ว`,
      type: 'info',
    });

    const token = accessToken || (await getAccessToken());
    if (token && sheetMeta) {
      try {
        await syncAllRecordsToSheet(token, sheetMeta.spreadsheetId, updatedList);
      } catch (err) {
        console.error('Error deleting from sheet', err);
      }
    }
  };

  // Navigation from Executive Dashboard to Table with filtered person or dept
  const handleSelectDeptFromDashboard = (dept: string) => {
    setFilterDepartment(dept);
    setActiveTab('table');
  };

  const handleSelectPersonFromDashboard = (name: string) => {
    setFilterPerson(name);
    setActiveTab('table');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Sarabun',sans-serif]">
      
      {/* Top Navigation */}
      <Navbar
        user={user}
        sheetMeta={sheetMeta}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingRecord(null);
          setRecommendationToFill(null);
          setIsAddEditModalOpen(true);
        }}
        onOpenAlertsModal={() => setIsAlertsOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        totalRecordsCount={records.length}
      />

      {/* Training Notification Banner (Always prominent at top) */}
      <NotificationBanner
        upcomingRecords={upcomingRecords}
        recommendedCount={RECOMMENDED_COURSES.length}
        onOpenAlerts={() => setIsAlertsOpen(true)}
      />

      {/* Floating Status Notification Toast */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-in shadow-2xl">
          <div
            className={`rounded-2xl p-4 text-xs sm:text-sm font-semibold flex items-center gap-3 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
                : statusMessage.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-700'
                : 'bg-indigo-950 text-indigo-100 border-indigo-700'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
            {statusMessage.type === 'info' && <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' ? (
          <ExecutiveDashboard
            records={records}
            onSelectDeptFilter={handleSelectDeptFromDashboard}
            onSelectPersonFilter={handleSelectPersonFromDashboard}
          />
        ) : (
          <TrainingTable
            records={records}
            onOpenAddModal={() => {
              setEditingRecord(null);
              setRecommendationToFill(null);
              setIsAddEditModalOpen(true);
            }}
            onEditRecord={(record) => {
              setEditingRecord(record);
              setIsAddEditModalOpen(true);
            }}
            onRequestDeleteRecord={(record) => {
              setRecordToDelete(record);
            }}
            onViewCertificate={(record) => {
              setViewingCertRecord(record);
            }}
            filterDepartment={filterDepartment}
            setFilterDepartment={setFilterDepartment}
            filterPerson={filterPerson}
            setFilterPerson={setFilterPerson}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 print:hidden mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-200">
              องค์การบริหารส่วนตำบลโนนหนามแท่ง อำเภอเมืองอำนาจเจริญ จังหวัดอำนาจเจริญ
            </p>
            <p className="text-slate-500 mt-1">
              ระบบสารสนเทศเพื่อการพัฒนาบุคลากรและบันทึกประวัติการฝึกอบรม เชื่อมโยง Google Sheets & Drive
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>มาตรฐานข้อมูลบุคคลากร อปท.</span>
            <span>•</span>
            <span>ระบบเก็บใบประกาศนียบัตรดิจิทัล</span>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      
      {/* 1. Add / Edit Training Record Modal */}
      <TrainingModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingRecord(null);
          setRecommendationToFill(null);
        }}
        onSave={handleSaveRecord}
        editRecord={editingRecord}
        initialFromRecommendation={recommendationToFill}
        isSaving={isSavingRecord}
      />

      {/* 2. Upcoming Training & Recommended Course Alerts Modal */}
      <UpcomingAlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        upcomingRecords={upcomingRecords}
        recommendations={RECOMMENDED_COURSES}
        onSelectRecommendation={(rec) => {
          setEditingRecord(null);
          setRecommendationToFill(rec);
          setIsAddEditModalOpen(true);
        }}
        onSelectRecord={(rec) => {
          setActiveTab('table');
          setFilterPerson(rec.fullName);
        }}
      />

      {/* 3. Certificate Viewer & Generator Modal */}
      <CertificateViewerModal
        isOpen={Boolean(viewingCertRecord)}
        onClose={() => setViewingCertRecord(null)}
        record={viewingCertRecord}
      />

      {/* 4. Explicit Confirmation Dialog for Delete (Mandated by Workspace Skill) */}
      <ConfirmationDialog
        isOpen={Boolean(recordToDelete)}
        title="ยืนยันการลบประวัติการฝึกอบรม"
        message="คุณต้องการลบข้อมูลประวัติการฝึกอบรมนี้ออกจากระบบและ Google Sheets หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        itemName={recordToDelete ? `${recordToDelete.fullName} - ${recordToDelete.projectName}` : undefined}
        confirmLabel="ลบรายการนี้"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRecordToDelete(null)}
      />

    </div>
  );
}
