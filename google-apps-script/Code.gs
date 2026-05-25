/**
 * GOOGLE APPS SCRIPT - BEX 7386 BUDGETING APP
 * Main backend code for handling form submissions
 * 
 * DEPLOYMENT:
 * 1. Open Google Sheet (Spreadsheet ID below)
 * 2. Tools > Script Editor
 * 3. Paste this code
 * 4. Run setup() once
 * 5. Deploy as web app (Execute as: Me, Anyone access)
 * 6. Copy deployment URL to frontend config
 */

// ============================================
// SPREADSHEET CONFIGURATION
// ============================================

// Replace with your actual spreadsheet ID
const SPREADSHEET_ID = '1pE9kBBjooUlYmyWJm0nSDtXXB6PvSKB7_aXd6PvGAhU';

// Sheet names (must match your sheet names)
const SHEET_NAMES = {
  TAMA: 'Tama',
  NANA: 'Nana',
  CONFIG: 'Config',
  DASHBOARD: 'Dashboard'
};

// Drive folder IDs (populate after setup)
const DRIVE_FOLDERS = {
  ROOT: 'Budgeting_7386_Attachments',
  TAMA: 'Tama',
  NANA: 'Nana'
};

// ============================================
// WEB APP HANDLERS
// ============================================

/**
 * Handle POST requests from the web form
 */
function doPost(e) {
  try {
    Logger.log('Received POST request');
    
    // Parse request parameters
    const owner = e.parameter.owner || e.postData.getParameter('owner');
    const date = e.parameter.date || e.postData.getParameter('date');
    const type = e.parameter.type || e.postData.getParameter('type');
    const category = e.parameter.category || e.postData.getParameter('category');
    const detail = e.parameter.detail || e.postData.getParameter('detail');
    const amount = e.parameter.amount || e.postData.getParameter('amount');
    const note = e.parameter.note || e.postData.getParameter('note');
    
    // Validate required fields
    const validation = validateTransaction({
      owner, date, type, category, detail, amount
    });
    
    if (!validation.valid) {
      return jsonResponse(false, validation.error, 400);
    }
    
    // Create transaction record
    const transaction = {
      timestamp: new Date().toISOString(),
      date: date,
      month_key: getMonthKey(date),
      type: type,
      category: category,
      detail: detail,
      amount: parseFloat(amount),
      note: note || '',
      image_url: '',
      entry_id: generateEntryId(),
      sync_status: 'synced'
    };
    
    // Handle image upload if present
    if (e.parameter.image) {
      try {
        const imagePath = uploadImage(
          e.parameter.image,
          owner,
          transaction.month_key,
          transaction.entry_id
        );
        transaction.image_url = imagePath;
        Logger.log('Image uploaded: ' + imagePath);
      } catch (imageError) {
        Logger.log('Warning: Image upload failed - ' + imageError);
        // Continue without image
      }
    }
    
    // Write to appropriate sheet
    const sheet = getOwnerSheet(owner);
    if (!sheet) {
      return jsonResponse(false, 'Invalid owner: ' + owner, 400);
    }
    
    addTransactionToSheet(sheet, transaction);
    
    Logger.log('Transaction saved successfully: ' + transaction.entry_id);
    
    // Rebuild dashboard
    try {
      rebuildDashboard();
    } catch (dashError) {
      Logger.log('Error rebuilding dashboard: ' + dashError);
    }
    
    // Fetch updated stats
    const updatedStats = getCurrentMonthStats();
    
    return jsonResponse(true, 'Transaction saved', 200, {
      entry_id: transaction.entry_id,
      timestamp: transaction.timestamp,
      stats: updatedStats
    });
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return jsonResponse(false, error.toString(), 500);
  }
}

/**
 * Handle GET requests (for getting config)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getConfig';
    
    if (action === 'getConfig') {
      const config = getConfigData();
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          config: config
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'getStats') {
      const stats = getCurrentMonthStats();
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          stats: stats
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Unknown action'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('GET Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// TRANSACTION HANDLING
// ============================================

/**
 * Validate transaction data
 */
function validateTransaction(data) {
  // Check required fields
  if (!data.owner || !data.date || !data.type || !data.category || !data.detail || !data.amount) {
    return {
      valid: false,
      error: 'Missing required fields'
    };
  }
  
  // Validate owner
  if (data.owner !== 'Tama' && data.owner !== 'Nana') {
    return {
      valid: false,
      error: 'Invalid owner'
    };
  }
  
  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return {
      valid: false,
      error: 'Invalid date format'
    };
  }
  
  // Validate amount
  const amount = parseFloat(data.amount);
  if (isNaN(amount) || amount < 1000) {
    return {
      valid: false,
      error: 'Invalid or minimum amount'
    };
  }
  
  return { valid: true };
}

/**
 * Add transaction to sheet
 */
function addTransactionToSheet(sheet, transaction) {
  const row = [
    transaction.timestamp,
    transaction.date,
    transaction.month_key,
    transaction.type,
    transaction.category,
    transaction.detail,
    transaction.amount,
    transaction.note,
    transaction.image_url,
    transaction.entry_id,
    transaction.sync_status
  ];
  
  sheet.appendRow(row);
  Logger.log('Row added to sheet: ' + sheet.getName());
}

/**
 * Get sheet for owner
 */
function getOwnerSheet(owner) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  if (owner === 'Tama') {
    return ss.getSheetByName(SHEET_NAMES.TAMA);
  } else if (owner === 'Nana') {
    return ss.getSheetByName(SHEET_NAMES.NANA);
  }
  
  return null;
}

// ============================================
// IMAGE UPLOAD
// ============================================

/**
 * Upload image to Google Drive
 */
function uploadImage(imageBase64, owner, monthKey, entryId) {
  try {
    // Parse base64 string
    const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
    if (!match) {
      throw new Error('Invalid image format');
    }
    
    const mimeType = match[1];
    const base64Data = match[2];
    const extension = mimeType.split('/')[1] || 'jpg';
    
    // Get or create folder structure
    const driveFolders = getOrCreateDriveFolders();
    const ownerFolderId = driveFolders[owner];
    
    if (!ownerFolderId) {
      throw new Error('Owner folder not found');
    }
    
    // Get or create month folder
    const monthFolderId = getOrCreateMonthFolder(ownerFolderId, monthKey);
    
    // Create filename
    const filename = `${monthKey}_${owner}_${entryId}.${extension}`;
    
    // Upload file
    const folder = DriveApp.getFolderById(monthFolderId);
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    const file = folder.createFile(blob);
    file.setName(filename);
    
    // Get shareable link
    const imageUrl = file.getUrl();
    
    Logger.log('Image uploaded: ' + imageUrl);
    return imageUrl;
    
  } catch (error) {
    throw new Error('Image upload failed: ' + error.toString());
  }
}

/**
 * Get or create Drive folder structure
 */
function getOrCreateDriveFolders() {
  try {
    const rootFolder = getOrCreateFolder(null, DRIVE_FOLDERS.ROOT);
    const tamaFolder = getOrCreateFolder(rootFolder.getId(), DRIVE_FOLDERS.TAMA);
    const nanaFolder = getOrCreateFolder(rootFolder.getId(), DRIVE_FOLDERS.NANA);
    
    return {
      'Tama': tamaFolder.getId(),
      'Nana': nanaFolder.getId()
    };
  } catch (error) {
    Logger.log('Error creating folder structure: ' + error);
    return {};
  }
}

/**
 * Get or create a folder
 */
function getOrCreateFolder(parentFolderId, folderName) {
  try {
    let folder;
    
    if (parentFolderId === null) {
      // Root level
      const roots = DriveApp.getFoldersByName(folderName);
      if (roots.hasNext()) {
        folder = roots.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
    } else {
      // Inside parent folder
      const parent = DriveApp.getFolderById(parentFolderId);
      const subfolders = parent.getFoldersByName(folderName);
      
      if (subfolders.hasNext()) {
        folder = subfolders.next();
      } else {
        folder = parent.createFolder(folderName);
      }
    }
    
    return folder;
  } catch (error) {
    Logger.log('Error with folder: ' + error);
    throw error;
  }
}

/**
 * Get or create month folder
 */
function getOrCreateMonthFolder(parentFolderId, monthKey) {
  return getOrCreateFolder(parentFolderId, monthKey).getId();
}

// ============================================
// CONFIGURATION
// ============================================

/**
 * Get config data from Config sheet
 */
function getConfigData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
    
    if (!configSheet) {
      Logger.log('Config sheet not found, returning default');
      return getDefaultConfig();
    }
    
    const data = configSheet.getDataRange().getValues();
    // Skip header row
    return data.slice(1);
    
  } catch (error) {
    Logger.log('Error reading config: ' + error);
    return getDefaultConfig();
  }
}

/**
 * Get default config (fallback)
 */
function getDefaultConfig() {
  return [
    ['owner', 'Tama', 'graphite_black', 'Space Grotesk'],
    ['owner', 'Nana', 'vintage', 'Playfair + Handwriting'],
    ['type', 'pemasukan', 'Income', 'green'],
    ['type', 'pengeluaran', 'Expense', 'red'],
    ['type', 'investasi', 'Investment', 'gold'],
    ['pemasukan', 'uang_jajan', 'Uang Jajan', 'fixed'],
    ['pemasukan', 'gaji_honor', 'Gaji/Honor', 'fixed'],
    ['pemasukan', 'given', 'Given^°^', 'emotional'],
    ['pemasukan', 'hadiah', 'Hadiah', 'optional'],
    ['pemasukan', 'freelance', 'Freelance', 'optional'],
    ['pemasukan', 'lainnya', 'Lainnya', 'custom'],
    ['pengeluaran', 'tagihan', 'Tagihan', 'fixed'],
    ['pengeluaran', 'kebutuhan', 'Kebutuhan', 'fixed'],
    ['pengeluaran', 'hobi', 'Hobi', 'flexible'],
    ['pengeluaran', 'transport', 'Transport', 'operational'],
    ['pengeluaran', 'makan', 'Makan', 'daily'],
    ['pengeluaran', 'kesehatan', 'Kesehatan', 'important'],
    ['pengeluaran', 'gift', 'Gift', 'optional'],
    ['pengeluaran', 'lainnya', 'Lainnya', 'custom'],
    ['investasi', 'saham', 'Saham', 'long_term'],
    ['investasi', 'nabung', 'Nabung', 'safe'],
    ['investasi', 'emas', 'Beli Emas', 'hedge'],
    ['investasi', 'crypto', 'Crypto', 'volatile'],
    ['investasi', 'reksadana', 'Reksadana', 'medium'],
    ['investasi', 'lainnya', 'Lainnya', 'custom'],
  ];
}

// ============================================
// UTILITIES
// ============================================

/**
 * Generate unique entry ID
 */
function generateEntryId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Get month key from date (YYYY-MM)
 */
function getMonthKey(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Create JSON response
 */
function jsonResponse(success, message, code = 200, data = {}) {
  const output = {
    success: success,
    error: !success ? message : null,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// SETUP & TESTING
// ============================================

/**
 * Setup function (run once)
 */
function setup() {
  try {
    // Test spreadsheet connection
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('Connected to spreadsheet: ' + ss.getName());
    
    // Create Drive folders
    const folders = getOrCreateDriveFolders();
    Logger.log('Drive folders created/verified');
    
    Logger.log('✓ Setup completed successfully!');
    Logger.log('📋 Config read from sheet: ' + SHEET_NAMES.CONFIG);
    Logger.log('💾 Data sheets: ' + SHEET_NAMES.TAMA + ', ' + SHEET_NAMES.NANA);
    
  } catch (error) {
    Logger.log('❌ Setup error: ' + error);
  }
}

/**
 * Test function (for debugging)
 */
function testPost() {
  const testData = {
    owner: 'Tama',
    date: new Date().toISOString().split('T')[0],
    type: 'pengeluaran',
    category: 'makan',
    detail: 'Makan siang test',
    amount: '50000',
    note: 'Test entry'
  };
  
  const mockEvent = {
    parameter: testData,
    postData: {
      getParameter: (key) => testData[key]
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log('Test result: ' + result);
}

// ============================================
// FIX STATUS PENDING
// ============================================

/**
 * Batch-fix all rows where sync_status = 'pending' → 'synced'
 * Run this ONCE from the Apps Script editor to repair old data
 *
 * Steps:
 *   1. Open Apps Script editor
 *   2. Select function: fixPendingStatus
 *   3. Click Run
 *   4. Check Execution log for summary
 */
function fixPendingStatus() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = [
      ss.getSheetByName(SHEET_NAMES.TAMA),
      ss.getSheetByName(SHEET_NAMES.NANA)
    ];
    
    let totalFixed = 0;
    const now = new Date().toISOString();
    
    sheets.forEach(sheet => {
      if (!sheet) return;
      
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        Logger.log(sheet.getName() + ': No data rows, skipping.');
        return;
      }
      
      // Read all data (skip header row 1)
      // Column K (11) = sync_status
      const statusCol = 11;
      const statusRange = sheet.getRange(2, statusCol, lastRow - 1, 1);
      const statusValues = statusRange.getValues();
      
      let fixedInSheet = 0;
      
      statusValues.forEach((row, idx) => {
        const rowStatus = (row[0] || '').toString().toLowerCase().trim();
        if (rowStatus === 'pending' || rowStatus === '') {
          // Row index in sheet = idx + 2 (header is row 1)
          sheet.getRange(idx + 2, statusCol).setValue('synced');
          fixedInSheet++;
          totalFixed++;
        }
      });
      
      Logger.log('✓ ' + sheet.getName() + ': Fixed ' + fixedInSheet + ' row(s)');
    });
    
    Logger.log('✅ fixPendingStatus done. Total rows updated: ' + totalFixed);
    return totalFixed;
    
  } catch (error) {
    Logger.log('❌ fixPendingStatus error: ' + error);
    throw error;
  }
}

/**
 * Update a single row’s sync_status by entry_id
 * @param {string} owner  - 'Tama' or 'Nana'
 * @param {string} entryId - the entry_id to find
 * @param {string} newStatus - the new status value
 */
function updateRowStatus(owner, entryId, newStatus) {
  try {
    const sheet = getOwnerSheet(owner);
    if (!sheet) throw new Error('Sheet not found for owner: ' + owner);
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return false;
    
    // Column J (10) = entry_id, Column K (11) = sync_status
    const entryIdRange = sheet.getRange(2, 10, lastRow - 1, 1);
    const entryIds = entryIdRange.getValues();
    
    for (let i = 0; i < entryIds.length; i++) {
      if (entryIds[i][0] === entryId) {
        sheet.getRange(i + 2, 11).setValue(newStatus);
        Logger.log('Updated row ' + (i + 2) + ' status to: ' + newStatus);
        return true;
      }
    }
    
    Logger.log('Entry not found: ' + entryId);
    return false;
    
  } catch (error) {
    Logger.log('updateRowStatus error: ' + error);
    return false;
  }
}

// ============================================
// DASHBOARD & STATS GENERATION
// ============================================

/**
 * Calculate current month's stats for Tama and Nana
 */
function getCurrentMonthStats() {
  const currentMonthKey = getMonthKey(new Date().toISOString().split('T')[0]);
  const stats = {
    Tama: { income: 0, expense: 0, investment: 0 },
    Nana: { income: 0, expense: 0, investment: 0 }
  };
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ['Tama', 'Nana'].forEach(owner => {
    const sheet = ss.getSheetByName(SHEET_NAMES[owner.toUpperCase()]);
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
      data.forEach(row => {
        // month_key is col C (index 2), type is col D (index 3), amount is col G (index 6)
        if (row[2] === currentMonthKey) {
          const type = (row[3] || '').toString().toLowerCase();
          const amount = parseFloat(row[6]) || 0;
          if (type === 'pemasukan') stats[owner].income += amount;
          else if (type === 'pengeluaran') stats[owner].expense += amount;
          else if (type === 'investasi') stats[owner].investment += amount;
        }
      });
    }
  });
  
  return stats;
}

/**
 * Rebuild Dashboard sheet with fresh data
 */
function rebuildDashboard() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let dashSheet = ss.getSheetByName(SHEET_NAMES.DASHBOARD);
  
  if (!dashSheet) {
    dashSheet = ss.insertSheet(SHEET_NAMES.DASHBOARD);
  } else {
    dashSheet.clear(); // Clear all formatting and contents
  }
  
  const allData = [];
  ['Tama', 'Nana'].forEach(owner => {
    const sheet = ss.getSheetByName(SHEET_NAMES[owner.toUpperCase()]);
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
      data.forEach(row => {
        // [timestamp, date, month_key, type, category, detail, amount, note, image_url, entry_id, sync_status]
        allData.push({
          owner: owner,
          timestamp: row[0],
          date: row[1],
          monthKey: row[2],
          type: (row[3] || '').toString().toLowerCase(),
          category: row[4],
          detail: row[5],
          amount: parseFloat(row[6]) || 0,
          imageUrl: row[8]
        });
      });
    }
  });
  
  // Sort all data by timestamp descending
  allData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Aggregate data
  const ownerSummary = {
    Tama: { income: 0, expense: 0, investment: 0, count: 0 },
    Nana: { income: 0, expense: 0, investment: 0, count: 0 }
  };
  
  const categorySummary = {};
  const monthSummary = {};
  
  allData.forEach(tx => {
    // Owner Summary
    ownerSummary[tx.owner].count++;
    if (tx.type === 'pemasukan') ownerSummary[tx.owner].income += tx.amount;
    else if (tx.type === 'pengeluaran') ownerSummary[tx.owner].expense += tx.amount;
    else if (tx.type === 'investasi') ownerSummary[tx.owner].investment += tx.amount;
    
    // Category Summary
    const catKey = `${tx.owner}|${tx.type}|${tx.category}`;
    if (!categorySummary[catKey]) categorySummary[catKey] = { owner: tx.owner, type: tx.type, category: tx.category, amount: 0 };
    categorySummary[catKey].amount += tx.amount;
    
    // Month Summary
    const monthKey = `${tx.monthKey}|${tx.owner}|${tx.type}`;
    if (!monthSummary[monthKey]) monthSummary[monthKey] = { month: tx.monthKey, owner: tx.owner, type: tx.type, amount: 0 };
    monthSummary[monthKey].amount += tx.amount;
  });
  
  let currentRow = 1;
  
  // Title
  dashSheet.getRange(currentRow, 1).setValue("D'FINANCE 7386 - DASHBOARD").setFontWeight("bold").setFontSize(14);
  dashSheet.getRange(currentRow + 1, 1).setValue(`Last Updated: ${new Date().toLocaleString('id-ID')}`);
  currentRow += 3;
  
  // 1. OWNER SUMMARY
  dashSheet.getRange(currentRow, 1).setValue("OWNER SUMMARY").setFontWeight("bold");
  currentRow++;
  const ownerHeaders = ["Owner", "Total Income", "Total Expense", "Total Investment", "Transaction Count"];
  dashSheet.getRange(currentRow, 1, 1, ownerHeaders.length).setValues([ownerHeaders]).setFontWeight("bold").setBackground("#f3f3f3");
  currentRow++;
  
  const ownerRows = [
    ["Tama", ownerSummary.Tama.income, ownerSummary.Tama.expense, ownerSummary.Tama.investment, ownerSummary.Tama.count],
    ["Nana", ownerSummary.Nana.income, ownerSummary.Nana.expense, ownerSummary.Nana.investment, ownerSummary.Nana.count]
  ];
  dashSheet.getRange(currentRow, 1, ownerRows.length, ownerRows[0].length).setValues(ownerRows);
  dashSheet.getRange(currentRow, 2, ownerRows.length, 3).setNumberFormat('Rp #,##0');
  currentRow += ownerRows.length + 2;
  
  // 2. CATEGORY BREAKDOWN
  dashSheet.getRange(currentRow, 1).setValue("CATEGORY BREAKDOWN").setFontWeight("bold");
  currentRow++;
  const catHeaders = ["Owner", "Type", "Category", "Total Amount"];
  dashSheet.getRange(currentRow, 1, 1, catHeaders.length).setValues([catHeaders]).setFontWeight("bold").setBackground("#f3f3f3");
  currentRow++;
  
  const catRows = Object.values(categorySummary)
    .sort((a, b) => a.owner.localeCompare(b.owner) || a.type.localeCompare(b.type) || b.amount - a.amount)
    .map(c => [c.owner, c.type, c.category, c.amount]);
  
  if (catRows.length > 0) {
    dashSheet.getRange(currentRow, 1, catRows.length, catRows[0].length).setValues(catRows);
    dashSheet.getRange(currentRow, 4, catRows.length, 1).setNumberFormat('Rp #,##0');
    currentRow += catRows.length;
  }
  currentRow += 2;
  
  // 3. MONTHLY TRENDS
  dashSheet.getRange(currentRow, 1).setValue("MONTHLY TRENDS").setFontWeight("bold");
  currentRow++;
  const monthHeaders = ["Month", "Owner", "Type", "Total Amount"];
  dashSheet.getRange(currentRow, 1, 1, monthHeaders.length).setValues([monthHeaders]).setFontWeight("bold").setBackground("#f3f3f3");
  currentRow++;
  
  const monthRows = Object.values(monthSummary)
    .sort((a, b) => b.month.localeCompare(a.month) || a.owner.localeCompare(b.owner) || a.type.localeCompare(b.type))
    .map(m => [m.month, m.owner, m.type, m.amount]);
    
  if (monthRows.length > 0) {
    dashSheet.getRange(currentRow, 1, monthRows.length, monthRows[0].length).setValues(monthRows);
    dashSheet.getRange(currentRow, 4, monthRows.length, 1).setNumberFormat('Rp #,##0');
    currentRow += monthRows.length;
  }
  currentRow += 2;
  
  // 4. RECENT TRANSACTIONS (Top 20)
  dashSheet.getRange(currentRow, 1).setValue("RECENT TRANSACTIONS").setFontWeight("bold");
  currentRow++;
  const recentHeaders = ["Timestamp", "Owner", "Type", "Category", "Detail", "Amount", "Image URL"];
  dashSheet.getRange(currentRow, 1, 1, recentHeaders.length).setValues([recentHeaders]).setFontWeight("bold").setBackground("#f3f3f3");
  currentRow++;
  
  const recentRows = allData.slice(0, 20).map(tx => [
    tx.timestamp, tx.owner, tx.type, tx.category, tx.detail, tx.amount, tx.imageUrl
  ]);
  
  if (recentRows.length > 0) {
    dashSheet.getRange(currentRow, 1, recentRows.length, recentRows[0].length).setValues(recentRows);
    dashSheet.getRange(currentRow, 6, recentRows.length, 1).setNumberFormat('Rp #,##0');
  }
  
  // Auto-resize columns
  dashSheet.autoResizeColumns(1, 7);
  
  Logger.log("Dashboard rebuilt successfully.");
}
