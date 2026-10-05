import { TrainingRecord, Department, TrainingFormat, TrainingStatus } from '../types/training';

export const DEFAULT_SHEET_TITLE = 'อบต.โนนหนามแท่ง - ทะเบียนประวัติการฝึกอบรมบุคลากร';
export const SHEET_TAB_NAME = 'ประวัติการอบรม';
export const DRIVE_FOLDER_NAME = 'ใบประกาศนียบัตร - อบต.โนนหนามแท่ง';

export const SHEET_COLUMNS = [
  'รหัสบันทึก (ID)',
  'ชื่อ-สกุล',
  'ตำแหน่ง',
  'สังกัด/กอง',
  'โครงการที่ได้รับการฝึกอบรม',
  'หน่วยงานผู้จัด',
  'วันที่เริ่มต้น',
  'วันที่สิ้นสุด',
  'จำนวนชั่วโมง',
  'สถานที่จัดอบรม',
  'รูปแบบการอบรม',
  'สถานะ',
  'งบประมาณ (บาท)',
  'ลิงก์ใบประกาศนียบัตร',
  'ชื่อไฟล์ใบประกาศ',
  'Drive File ID',
  'หมายเหตุ',
  'วันที่บันทึก',
];

export interface SheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  name: string;
  createdNew: boolean;
}

/**
 * Searches for an existing training spreadsheet in Google Drive or creates a new one
 */
export async function findOrCreateTrainingSpreadsheet(token: string): Promise<SheetMetadata> {
  try {
    // 1. Check if file already exists in Drive
    const query = encodeURIComponent(
      `name = '${DEFAULT_SHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const found = searchData.files[0];
        return {
          spreadsheetId: found.id,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${found.id}/edit`,
          name: found.name,
          createdNew: false,
        };
      }
    }

    // 2. If not found, create a new spreadsheet with styled headers
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: DEFAULT_SHEET_TITLE,
          locale: 'th_TH',
          timeZone: 'Asia/Bangkok',
        },
        sheets: [
          {
            properties: {
              title: SHEET_TAB_NAME,
              gridProperties: {
                frozenRowCount: 1,
                columnCount: 20,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`สร้าง Google Sheets ไม่สำเร็จ: ${errText}`);
    }

    const createdData = await createRes.json();
    const spreadsheetId = createdData.spreadsheetId;

    // 3. Format header row: Blue navy background, white text, bold, centered
    const sheetId = createdData.sheets?.[0]?.properties?.sheetId || 0;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: SHEET_COLUMNS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.16, blue: 0.26 }, // Navy #0f2942
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 11,
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheetId,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      }),
    });

    // 4. Insert header labels
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        SHEET_TAB_NAME
      )}!A1:R1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [SHEET_COLUMNS],
        }),
      }
    );

    return {
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      name: DEFAULT_SHEET_TITLE,
      createdNew: true,
    };
  } catch (error) {
    console.error('Error finding or creating spreadsheet:', error);
    throw error;
  }
}

/**
 * Converts a TrainingRecord into an array of cell values
 */
export function recordToSheetRow(record: TrainingRecord): any[] {
  return [
    record.id || '',
    record.fullName || '',
    record.position || '',
    record.department || '',
    record.projectName || '',
    record.organizer || '',
    record.startDate || '',
    record.endDate || '',
    record.hours || 0,
    record.location || '',
    record.format || '',
    record.status || '',
    record.budget || 0,
    record.certificateUrl || '',
    record.certificateFileName || '',
    record.certificateDriveId || '',
    record.notes || '',
    record.createdAt || new Date().toISOString(),
  ];
}

/**
 * Converts a sheet row array back to a TrainingRecord
 */
export function sheetRowToRecord(row: any[]): TrainingRecord {
  return {
    id: row[0] ? String(row[0]) : `TR-${Date.now()}`,
    fullName: row[1] ? String(row[1]) : '',
    position: row[2] ? String(row[2]) : '',
    department: (row[3] as Department) || 'สำนักปลัด',
    projectName: row[4] ? String(row[4]) : '',
    organizer: row[5] ? String(row[5]) : '',
    startDate: row[6] ? String(row[6]) : '',
    endDate: row[7] ? String(row[7]) : '',
    hours: row[8] ? Number(row[8]) || 0 : 0,
    location: row[9] ? String(row[9]) : '',
    format: (row[10] as TrainingFormat) || 'Onsite (ณ สถานที่จัด)',
    status: (row[11] as TrainingStatus) || 'เสร็จสิ้นแล้ว',
    budget: row[12] ? Number(row[12]) || 0 : 0,
    certificateUrl: row[13] ? String(row[13]) : '',
    certificateFileName: row[14] ? String(row[14]) : '',
    certificateDriveId: row[15] ? String(row[15]) : '',
    notes: row[16] ? String(row[16]) : '',
    createdAt: row[17] ? String(row[17]) : new Date().toISOString(),
  };
}

/**
 * Loads all training records from Google Sheets
 */
export async function loadRecordsFromSheet(token: string, spreadsheetId: string): Promise<TrainingRecord[]> {
  try {
    const range = encodeURIComponent(`${SHEET_TAB_NAME}!A2:R`);
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ไม่สามารถอ่านข้อมูลจากชีต: ${err}`);
    }

    const data = await res.json();
    const rows = data.values || [];
    return rows.map(sheetRowToRecord).filter((r: TrainingRecord) => r.fullName && r.projectName);
  } catch (error) {
    console.error('Error loading records from sheet:', error);
    throw error;
  }
}

/**
 * Overwrites entire sheet values from A2 downwards with the full records list
 */
export async function syncAllRecordsToSheet(
  token: string,
  spreadsheetId: string,
  records: TrainingRecord[]
): Promise<void> {
  try {
    // Clear existing records from A2:R
    const clearRange = encodeURIComponent(`${SHEET_TAB_NAME}!A2:R5000`);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (records.length === 0) return;

    // Write all records
    const rows = records.map(recordToSheetRow);
    const updateRange = encodeURIComponent(`${SHEET_TAB_NAME}!A2`);
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      }
    );

    if (!writeRes.ok) {
      const err = await writeRes.text();
      throw new Error(`บันทึกลง Google Sheets ไม่สำเร็จ: ${err}`);
    }
  } catch (error) {
    console.error('Error syncing records to sheet:', error);
    throw error;
  }
}

/**
 * Finds or creates a dedicated Google Drive folder for certificates
 */
export async function findOrCreateDriveFolder(token: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(
      `name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create new folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const folderData = await createRes.json();
      return folderData.id;
    }
    return null;
  } catch (error) {
    console.warn('Could not find or create Drive folder, will upload to root', error);
    return null;
  }
}

/**
 * Uploads a certificate file to Google Drive and returns viewable link
 */
export async function uploadCertificateToDrive(
  token: string,
  file: File,
  meta: { fullName: string; projectName: string }
): Promise<{ fileId: string; webViewLink: string; fileName: string }> {
  try {
    const folderId = await findOrCreateDriveFolder(token);
    const cleanFileName = `ใบประกาศ_${meta.fullName.replace(/\s+/g, '_')}_${file.name}`;

    const metadata = {
      name: cleanFileName,
      description: `ใบประกาศนียบัตรการฝึกอบรม: ${meta.projectName} ของ ${meta.fullName} - อบต.โนนหนามแท่ง`,
      parents: folderId ? [folderId] : undefined,
    };

    const formData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
    );
    formData.append('file', file);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`อัปโหลดไฟล์ไป Google Drive ไม่สำเร็จ: ${err}`);
    }

    const fileData = await uploadRes.json();
    return {
      fileId: fileData.id,
      webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
      fileName: cleanFileName,
    };
  } catch (error) {
    console.error('Error uploading certificate to Drive:', error);
    throw error;
  }
}
