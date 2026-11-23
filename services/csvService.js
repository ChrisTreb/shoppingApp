import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { dbService } from '../database/functions/DatabaseConnect';

/**
 * Escapes a single CSV value according to RFC 4180
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Parses a single CSV line taking quotes into account
 */
function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Automatically detects whether comma or semicolon is the predominant delimiter
 */
function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Trigger file share / save on mobile or web
 */
async function shareOrDownloadFile(fileName, content, mimeType = 'text/csv') {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }

  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: `Export ${fileName}`,
      UTI: 'public.comma-separated-values-text',
    });
    return true;
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

export const csvService = {
  /**
   * Export all products to CSV
   */
  async exportProducts() {
    const products = dbService.getProducts();
    if (!products || products.length === 0) {
      throw new Error('NO_PRODUCTS');
    }

    const headers = ['id', 'name', 'type', 'inCurrentList', 'lastOrder', 'numOrdered'];
    const rows = products.map((p) => [
      p.id,
      escapeCSV(p.name),
      escapeCSV(p.type),
      p.inCurrentList,
      escapeCSV(p.lastOrder),
      p.numOrdered,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    await shareOrDownloadFile(`shopping_catalog_${timestamp}.csv`, csvContent);
    return products.length;
  },

  /**
   * Export active shopping list to CSV
   */
  async exportCurrentList() {
    const list = dbService.getCurrentList();
    const items = dbService.getCurrentListProducts();

    if (!items || items.length === 0) {
      throw new Error('EMPTY_LIST');
    }

    const headers = ['name', 'category'];
    const rows = items.map((item) => [escapeCSV(item.name), escapeCSV(item.type)]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const listName = list?.listName ? list.listName.replace(/[^a-zA-Z0-9_-]/g, '_') : 'list';
    const timestamp = new Date().toISOString().slice(0, 10);
    await shareOrDownloadFile(`shopping_${listName}_${timestamp}.csv`, csvContent);
    return items.length;
  },

  /**
   * Import products from user-picked CSV file
   */
  async importProducts() {
    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (pickerResult.canceled) {
      return null;
    }

    const asset = pickerResult.assets?.[0];
    if (!asset || !asset.uri) {
      throw new Error('FILE_READ_FAILED');
    }

    const rawContent = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (!rawContent || !rawContent.trim()) {
      throw new Error('EMPTY_FILE');
    }

    const delimiter = detectDelimiter(rawContent);
    const lines = rawContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      throw new Error('EMPTY_FILE');
    }

    // Inspect first line for headers
    const firstLineCols = parseCSVLine(lines[0], delimiter).map((c) => c.toLowerCase());
    let nameIdx = -1;
    let typeIdx = -1;
    let startRow = 0;

    firstLineCols.forEach((col, idx) => {
      if (['name', 'nom', 'produit', 'product', 'item', 'article'].includes(col)) {
        nameIdx = idx;
      }
      if (['type', 'categorie', 'category', 'rayon', 'famille'].includes(col)) {
        typeIdx = idx;
      }
    });

    if (nameIdx !== -1) {
      // Header found, data starts on line 1
      startRow = 1;
      if (typeIdx === -1) {
        typeIdx = nameIdx === 0 ? 1 : 0;
      }
    } else {
      // No header identified, assume col 0 is name, col 1 is type
      nameIdx = 0;
      typeIdx = 1;
      startRow = 0;
    }

    const productsToImport = [];
    for (let i = startRow; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i], delimiter);
      const name = cols[nameIdx];
      const type = cols[typeIdx] || 'Autres';

      if (name && name.trim()) {
        productsToImport.push({
          name: name.trim(),
          type: type.trim() || 'Autres',
        });
      }
    }

    if (productsToImport.length === 0) {
      throw new Error('NO_VALID_DATA');
    }

    const result = dbService.importProducts(productsToImport);
    return {
      total: productsToImport.length,
      inserted: result.inserted,
      updated: result.updated,
    };
  },
};
