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
    
    return jsonResponse(true, 'Transaction saved', 200, {
      entry_id: transaction.entry_id,
      timestamp: transaction.timestamp
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
function uploadImage(imageBlob, owner, monthKey, entryId) {
  try {
    // Get or create folder structure
    const driveFolders = getOrCreateDriveFolders();
    const ownerFolderId = driveFolders[owner];
    
    if (!ownerFolderId) {
      throw new Error('Owner folder not found');
    }
    
    // Get or create month folder
    const monthFolderId = getOrCreateMonthFolder(ownerFolderId, monthKey);
    
    // Create filename
    const filename = `${monthKey}_${owner}_${entryId}.jpg`;
    
    // Upload file
    const folder = DriveApp.getFolderById(monthFolderId);
    const file = folder.createFile(imageBlob);
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
