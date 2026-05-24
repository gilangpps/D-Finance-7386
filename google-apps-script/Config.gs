/**
 * CONFIGURATION UTILITIES
 * Helper functions for configuration and data management
 */

/**
 * Initialize headers in transaction sheets
 */
function initializeSheetHeaders() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    const headers = [
      'timestamp',
      'date',
      'month_key',
      'type',
      'category',
      'detail',
      'amount',
      'note',
      'image_url',
      'entry_id',
      'sync_status'
    ];
    
    // Set headers for Tama sheet
    const tamaSheet = ss.getSheetByName(SHEET_NAMES.TAMA);
    if (tamaSheet && tamaSheet.getLastRow() === 0) {
      tamaSheet.appendRow(headers);
      Logger.log('Headers initialized for Tama sheet');
    }
    
    // Set headers for Nana sheet
    const nanaSheet = ss.getSheetByName(SHEET_NAMES.NANA);
    if (nanaSheet && nanaSheet.getLastRow() === 0) {
      nanaSheet.appendRow(headers);
      Logger.log('Headers initialized for Nana sheet');
    }
    
  } catch (error) {
    Logger.log('Error initializing headers: ' + error);
  }
}

/**
 * Clear data from sheets (for testing - use with caution!)
 */
function clearAllData() {
  try {
    if (!confirm('⚠️ This will clear all data! Continue?')) {
      return;
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Clear Tama
    const tamaSheet = ss.getSheetByName(SHEET_NAMES.TAMA);
    if (tamaSheet) {
      tamaSheet.clear();
      tamaSheet.appendRow(['timestamp', 'date', 'month_key', 'type', 'category', 'detail', 'amount', 'note', 'image_url', 'entry_id', 'sync_status']);
    }
    
    // Clear Nana
    const nanaSheet = ss.getSheetByName(SHEET_NAMES.NANA);
    if (nanaSheet) {
      nanaSheet.clear();
      nanaSheet.appendRow(['timestamp', 'date', 'month_key', 'type', 'category', 'detail', 'amount', 'note', 'image_url', 'entry_id', 'sync_status']);
    }
    
    Logger.log('✓ All data cleared');
    
  } catch (error) {
    Logger.log('Error clearing data: ' + error);
  }
}

/**
 * Get summary statistics
 */
function getSummaryStats(owner, monthKey) {
  try {
    const sheet = (owner === 'Tama') 
      ? SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.TAMA)
      : SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.NANA);
    
    const data = sheet.getDataRange().getValues();
    
    // Skip header
    const transactions = data.slice(1);
    
    // Filter by month
    const monthTransactions = transactions.filter(row => row[2] === monthKey);
    
    // Calculate totals
    let income = 0, expense = 0, investment = 0;
    
    monthTransactions.forEach(row => {
      const type = row[3];
      const amount = parseFloat(row[6]) || 0;
      
      if (type === 'pemasukan') {
        income += amount;
      } else if (type === 'pengeluaran') {
        expense += amount;
      } else if (type === 'investasi') {
        investment += amount;
      }
    });
    
    return {
      month: monthKey,
      income: income,
      expense: expense,
      investment: investment,
      net: income - expense,
      total: income + expense + investment,
      count: monthTransactions.length
    };
    
  } catch (error) {
    Logger.log('Error calculating stats: ' + error);
    return null;
  }
}

/**
 * Export data to CSV
 */
function exportToCSV(owner, monthKey) {
  try {
    const sheet = (owner === 'Tama') 
      ? SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.TAMA)
      : SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.NANA);
    
    const data = sheet.getDataRange().getValues();
    
    // Filter by month
    const headers = data[0];
    const rows = monthKey 
      ? data.filter((row, idx) => idx === 0 || row[2] === monthKey)
      : data;
    
    // Convert to CSV
    const csv = rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    return csv;
    
  } catch (error) {
    Logger.log('Error exporting CSV: ' + error);
    return null;
  }
}

/**
 * Validate sheet structure
 */
function validateSheetStructure() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const issues = [];
    
    // Check for required sheets
    const requiredSheets = [SHEET_NAMES.TAMA, SHEET_NAMES.NANA, SHEET_NAMES.CONFIG];
    requiredSheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        issues.push(`Missing sheet: ${sheetName}`);
      }
    });
    
    // Check headers
    const expectedHeaders = ['timestamp', 'date', 'month_key', 'type', 'category', 'detail', 'amount', 'note', 'image_url', 'entry_id', 'sync_status'];
    
    [SHEET_NAMES.TAMA, SHEET_NAMES.NANA].forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet && sheet.getLastRow() > 0) {
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        expectedHeaders.forEach((header, idx) => {
          if (headers[idx] !== header) {
            issues.push(`${sheetName}: Header mismatch at column ${idx + 1} (expected: ${header}, got: ${headers[idx]})`);
          }
        });
      }
    });
    
    if (issues.length === 0) {
      Logger.log('✓ Sheet structure is valid');
      return true;
    } else {
      Logger.log('❌ Issues found:');
      issues.forEach(issue => Logger.log('  - ' + issue));
      return false;
    }
    
  } catch (error) {
    Logger.log('Error validating structure: ' + error);
    return false;
  }
}

/**
 * Get deployment info
 */
function getDeploymentInfo() {
  try {
    const script = ScriptApp.getScriptId();
    Logger.log('Script ID: ' + script);
    Logger.log('Spreadsheet ID: ' + SPREADSHEET_ID);
    Logger.log('Sheet names: ' + Object.values(SHEET_NAMES).join(', '));
    Logger.log('');
    Logger.log('📱 To deploy:');
    Logger.log('1. Click "Deploy" > "New deployment"');
    Logger.log('2. Type: Web app');
    Logger.log('3. Execute as: Your email');
    Logger.log('4. Who has access: Anyone');
    Logger.log('5. Deploy and copy the URL');
    Logger.log('6. Paste URL in frontend config');
    
  } catch (error) {
    Logger.log('Error: ' + error);
  }
}
