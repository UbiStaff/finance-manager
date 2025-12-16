import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import fs from 'fs';
import iconv from 'iconv-lite';
import prisma from '../db.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { category: true, account: true },
      orderBy: { time: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  const { amount, type, time, note, categoryId, accountId, userId } = req.body;
  try {
    const transaction = await prisma.transaction.create({
      data: {
        amount: Number(amount),
        type,
        time: new Date(time),
        note,
        categoryId: Number(categoryId),
        accountId: Number(accountId),
        userId: Number(userId || 1) // Default to 1 for demo
      }
    });
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.transaction.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Helper to get or create category
async function getOrCreateCategory(name: string, type: string, userId: number) {
    let cat = await prisma.category.findFirst({
        where: { name, userId }
    });
    if (!cat) {
        // Try to guess type if not provided correctly, default to expense if unknown
        const finalType = type === 'income' ? 'income' : 'expense';
        cat = await prisma.category.create({
            data: { name, type: finalType, userId }
        });
    }
    return cat;
}

// Helper to get or create account
async function getOrCreateAccount(name: string, userId: number) {
    let acc = await prisma.account.findFirst({
        where: { name, userId }
    });
    if (!acc) {
        acc = await prisma.account.create({
            data: { name, userId }
        });
    }
    return acc;
}

// Mask bank/card identifiers to avoid leaking real tails
function sanitizeAccountName(name?: string): string {
  const raw = (name || '').trim();
  if (!raw) return '现金';
  // keep well-known wallets unmasked
  if (/支付宝|Alipay/i.test(raw)) return '支付宝';
  if (/微信钱包/.test(raw)) return '微信钱包';
  if (/微信|WeChat/i.test(raw)) return '微信';

  // extract last 4 digits inside parentheses or at end
  const m1 = raw.match(/\((\d{4})\)/); // e.g. 工商银行储蓄卡(7934)
  const m2 = raw.match(/(\d{4})$/); // e.g. 银行卡 1234
  const last4 = m1?.[1] || m2?.[1];

  // bank brand if present
  const brandMatch = raw.match(/(工商银行|建设银行|招商银行|农业银行|中国银行|交通银行|民生银行|中信银行|广发银行|邮储银行)/);
  const brand = brandMatch ? brandMatch[1] : undefined;

  if (last4) {
    if (brand) return `${brand} ****${last4}`;
    return `银行卡 ****${last4}`;
  }

  // generic card types
  if (/储蓄卡|借记卡|信用卡/.test(raw)) return '银行卡 ****';

  // fallback to original trimmed descriptor without sensitive data
  return raw.replace(/\d{4,}/g, '****');
}

// Import Excel/CSV
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  try {
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    
    let rows: any[] = [];
    let source = 'Unknown';
    let contentStr = '';
    let isCsv = false;

    // 1. Try decoding as Text (CSV/Text)
    // Try GBK first (Common for Alipay)
    let decodedGBK = iconv.decode(fileBuffer, 'gbk');
    let decodedUTF8 = fileBuffer.toString('utf8');
    
    // Check keywords to identify content and encoding
    if (decodedGBK.includes('交易时间') && decodedGBK.includes('金额')) {
        contentStr = decodedGBK;
        isCsv = true;
        source = 'Text/CSV (GBK)';
    } else if (decodedUTF8.includes('交易时间') && decodedUTF8.includes('金额')) {
        contentStr = decodedUTF8;
        isCsv = true;
        source = 'Text/CSV (UTF-8)';
    }

    console.log(`[Import] Detected source type: ${source}`);

    if (isCsv) {
        // --- Process Text/CSV ---
        const lines = contentStr.split(/\r?\n/);
        console.log(`[Import] Total lines: ${lines.length}`);

        // Find header line
        // Alipay Header: 交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,...
        // WeChat CSV Header: 交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,...
        
        let headerIndex = -1;
        let type = 'Unknown';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('交易时间') && line.includes('金额')) {
                headerIndex = i;
                if (line.includes('交易分类') && line.includes('交易状态')) {
                    type = 'Alipay';
                } else if (line.includes('交易类型') && line.includes('支付方式')) {
                    type = 'WeChat'; // WeChat can also be CSV
                }
                break;
            }
        }

        console.log(`[Import] CSV Header found at line ${headerIndex}, Type: ${type}`);

        if (headerIndex !== -1) {
            // Parse CSV Lines
            for (let i = headerIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Handle simple CSV split (limitations apply if fields contain commas)
                const cols = line.split(',').map(c => c.trim());
                
                if (type === 'Alipay') {
                    // Alipay: Time(0), Category(1), Counterparty(2), AccountNo(3), Note(4), Type(5), Amount(6), Account(7), Status(8)
                    // Note: Alipay columns might shift if they update format. 
                    // Based on user provided header: 交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,...
                    if (cols.length < 8) continue;
                    
                    const timeStr = cols[0];
                    const catName = cols[1];
                    const note = cols[4] || cols[2];
                    const typeStr = cols[5]; // 支出 / 收入
                    const amountStr = cols[6];
                    const accName = sanitizeAccountName(cols[7]);
                    const status = cols[8];

                    if (status !== '交易成功' && status !== '支付成功' && status !== '已支出' && status !== '已收入') {
                        // Sometimes status is empty for success or differs
                        if (status && !status.includes('成功')) continue; 
                    }

                    if (!amountStr) continue;

                    let transType = '';
                    if (typeStr === '支出') transType = 'expense';
                    else if (typeStr === '收入') transType = 'income';
                    else continue;

                    rows.push({
                        time: new Date(timeStr),
                        category: catName,
                        account: accName || '支付宝',
                        type: transType,
                        amount: parseFloat(amountStr),
                        note
                    });

                } else if (type === 'WeChat') {
                    // WeChat CSV logic if they export CSV
                    // Time, Type, Counterparty, Item, In/Out, Amount, Method, Status...
                    const timeStr = cols[0];
                    const typeStr = cols[4];
                    const amountStr = cols[5].replace('¥', '');
                    const rawAccCsv = cols[6];
                    const accName = rawAccCsv === '/' ? '微信钱包' : sanitizeAccountName(rawAccCsv);
                    const note = cols[3];

                    let transType = '';
                    if (typeStr === '支出') transType = 'expense';
                    else if (typeStr === '收入') transType = 'income';
                    else continue;

                    rows.push({
                        time: new Date(timeStr),
                        category: cols[1], // Type as category
                        account: accName,
                        type: transType,
                        amount: parseFloat(amountStr),
                        note
                    });
                }
            }
        }

    } else {
        // --- Process Excel (XLSX) ---
        // WeChat is usually XLSX
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            console.log(`[Import] Excel loaded, rows: ${rawData.length}`);
            
            // Find header
            let headerRowIndex = -1;
            for (let i = 0; i < rawData.length; i++) {
                const row = rawData[i];
                if (row && row.some((cell: any) => typeof cell === 'string' && cell.includes('交易时间') && cell.includes('金额'))) {
                    headerRowIndex = i;
                    break;
                }
            }

            console.log(`[Import] Excel Header found at row ${headerRowIndex}`);

            if (headerRowIndex !== -1) {
                const header = rawData[headerRowIndex].map((h: any) => String(h).trim());
                
                const idxTime = header.findIndex(h => h.includes('交易时间'));
                const idxType = header.findIndex(h => h.includes('收/支') || h.includes('收支'));
                const idxAmount = header.findIndex(h => h.includes('金额'));
                const idxCat = header.findIndex(h => h.includes('交易类型'));
                const idxAcc = header.findIndex(h => h.includes('支付方式'));
                const idxNote = header.findIndex(h => h.includes('商品'));
                
                for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                    const row = rawData[i];
                    if (!row || row.length < 5) continue;

                    const timeVal = row[idxTime];
                    const typeStr = row[idxType]; // 支出/收入
                    const amountVal = row[idxAmount];
                    const catName = row[idxCat];
                    const rawAcc = row[idxAcc];
                    const accName = rawAcc === '/' ? '微信钱包' : sanitizeAccountName(String(rawAcc || '微信'));
                    const note = row[idxNote];

                    // Parse Time
                    let time: Date;
                    if (typeof timeVal === 'number') {
                        // Excel serial date
                        time = new Date((timeVal - 25569) * 86400 * 1000);
                    } else {
                        time = new Date(String(timeVal));
                    }
                    if (isNaN(time.getTime())) continue;

                    // Parse Type
                    let transType = '';
                    if (typeStr === '支出') transType = 'expense';
                    else if (typeStr === '收入') transType = 'income';
                    else continue;

                    // Parse Amount
                    let amount = 0;
                    if (typeof amountVal === 'number') amount = amountVal;
                    else if (typeof amountVal === 'string') {
                        amount = parseFloat(amountVal.replace('¥', '').replace(/,/g, ''));
                    }

                    rows.push({
                        time,
                        category: catName,
                        account: accName,
                        type: transType,
                        amount,
                        note: String(note || '')
                    });
                }
            } else {
                // Fallback: Generic Excel Import
                // Expect specific headers: Amount, Type, Time...
                const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
                for (const row of jsonData) {
                    // Try English or Chinese keys
                    const amount = row['Amount'] || row['金额'];
                    const type = row['Type'] || row['类型'];
                    if (amount && type) {
                        rows.push({
                            time: new Date(row['Time'] || row['时间'] || new Date()),
                            amount: Number(amount),
                            type: (type === '收入' || type === 'income') ? 'income' : 'expense',
                            category: row['Category'] || row['分类'] || '未分类',
                            account: sanitizeAccountName(row['Account'] || row['账户']) || '现金',
                            note: row['Note'] || row['备注'] || ''
                        });
                    }
                }
            }
        } catch (e) {
            console.error('[Import] Excel parse error:', e);
        }
    }

    console.log(`[Import] Parsed ${rows.length} valid transaction rows`);

    let importedCount = 0;
    const userId = 1;

    for (const row of rows) {
        if (!row.amount || isNaN(row.amount)) continue;

        const category = await getOrCreateCategory(row.category, row.type, userId);
        const account = await getOrCreateAccount(row.account, userId);

        // Duplicate Check
        const exists = await prisma.transaction.findFirst({
            where: {
                userId,
                amount: row.amount,
                time: row.time,
                accountId: account.id,
                note: row.note
            }
        });

        if (!exists) {
            await prisma.transaction.create({
                data: {
                    amount: row.amount,
                    type: row.type,
                    time: row.time,
                    note: row.note,
                    categoryId: category.id,
                    accountId: account.id,
                    userId
                }
            });
            importedCount++;
        }
    }
    
    fs.unlinkSync(filePath);
    res.json({ 
        message: 'Import processed', 
        count: importedCount, 
        totalFound: rows.length,
        source: isCsv ? 'CSV' : 'Excel' 
    });

  } catch (error) {
    console.error('[Import] Critical Error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Import failed: ' + (error as any).message });
  }
});

export default router;
