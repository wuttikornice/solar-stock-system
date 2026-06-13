export const parseCSVNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  let num;
  if (typeof val === 'number') {
    num = val;
  } else {
    const cleaned = val.toString().replace(/[฿,]/g, '').replace(/[^\d.-]/g, '');
    num = parseFloat(cleaned);
  }
  return isNaN(num) ? 0 : num;
};

export const parseCSVDate = (val) => {
  if (!val || val === 'Invalid Date') return 'N/A';
  let d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('th-TH');

  const str = val.toString();
  const parts = str.split(/[\/\-\s:]/);
  if (parts.length >= 3) {
    let p0 = parseInt(parts[0]);
    let p1 = parseInt(parts[1]);
    let p2 = parseInt(parts[2]);
    if (p2 > 2000) {
      let year = p2;
      if (year > 2500) year -= 543;
      if (p0 <= 12 && p1 <= 31) d = new Date(year, p0 - 1, p1);
      else if (p1 <= 12 && p0 <= 31) d = new Date(year, p1 - 1, p0);
    }
    if (d && !isNaN(d.getTime())) return d.toLocaleDateString('th-TH');
  }
  return str.split(' ')[0] || 'N/A';
};

export const safeJSONParse = (val, fallback = []) => {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  try {
    const cleaned = val.toString().trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
    return JSON.parse(cleaned);
  } catch (e) {
    try { return JSON.parse(val); } catch (e2) { return fallback; }
  }
};

export const getValueResilient = (obj, searchKey) => {
  if (!obj || typeof obj !== 'object') return '';
  const keys = Object.keys(obj);
  let values = [];
  Object.entries(obj).forEach(([k, v]) => {
    if (k === '__parsed_extra' && Array.isArray(v)) {
      values.push(...v);
    } else {
      values.push(v);
    }
  });
  const sTarget = searchKey.toLowerCase().trim();

  const findByContent = (regex, checkArray = false) => {
    const found = values.find(v => {
      if (!v) return false;
      if (checkArray && Array.isArray(v)) return true;
      return regex.test(v.toString());
    });
    return found !== undefined ? found : null;
  };

  const findByKey = (targets) => {
    const k = keys.find(key => targets.some(t => key.toLowerCase().includes(t.toLowerCase())));
    return k ? obj[k] : null;
  };

  let result = null;

  if (sTarget === 'soid') result = findByContent(/^REQ-\d+/i) || findByKey(['SO ID', 'REQ ID', 'id']);
  if (sTarget === 'items') result = findByContent(/^\[\s*\{/i, true) || findByKey(['Items', 'Linked_DO_Ref', 'รายการ', 'Item List']);
  if (sTarget === 'customerid') result = findByContent(/^CUST-\d+/i) || findByKey(['Customer ID', 'รหัสลูกค้า', 'Date']);
  if (sTarget === 'customername') result = findByKey(['Customer Name', 'ชื่อลูกค้า', 'Delivery Status', 'ชื่อบริษัท']);
  if (sTarget === 'qtref') result = findByContent(/^CMI\d+/i) || findByKey(['QT Ref', 'อ้างอิง', 'อ้างอิง QT', 'QT IDRef']);
  if (sTarget === 'status') result = findByContent(/^(จอง|เบิก|ยกเลิก|Pending|Reserved|Completed)/i) || findByKey(['Status', 'สถานะ']);

  if (sTarget === 'subtotal') result = findByKey(['Subtotal', 'Sub Total', 'Gross Total', '_1']);
  if (sTarget === 'total' || sTarget === 'grandtotal') result = findByKey(['Grand Total', 'Total', 'ยอดรวมสุทธิ', '_1']);
  if (sTarget === 'totalquantity') result = findByKey(['จำนวนอุปกรณ์รวม (ชิ้น)', 'จำนวนรวม', 'Total Quantity', 'Quantity']);
  if (sTarget === 'date' && result === null) result = findByContent(/^\d{4}-\d{2}-\d{2}/) || findByContent(/^\d{1,2}\/\d{1,2}\/\d{4}/) || findByKey(['Date', 'วันที่', 'Document Date']);
  if (sTarget === 'projectname' && result === null) result = findByKey(['Project', 'โครงการ', ',']);

  if (result !== null && result !== undefined) return result;

  switch (sTarget) {
    case 'soid': return values[0] || '';
    case 'items': return findByContent(/^\[\s*\{/i, true) || values[5] || '[]';
    case 'date': return findByContent(/^\d{4}-\d{2}-\d{2}/) || findByContent(/^\d{1,2}\/\d{1,2}\/\d{4}/) || values[2] || values[1] || '';
    case 'customerid': return findByContent(/^CUST-\d+/i) || values[2] || '';
    case 'customername': return values[3] || '';
    case 'projectname': return values[4] || values[3] || '';
    case 'totalquantity': return values[6] || 0;
    case 'status': return values[7] || 'Pending';
    case 'qtref': return findByContent(/^CMI\d+/i) || values[8] || values[1] || '';
    default: return '';
  }
};

export const findSheetKey = (obj, targets) => {
  if (!obj || typeof obj !== 'object') return targets[0];
  const keys = Object.keys(obj);

  const enhancedTargets = [...targets];
  if (targets.some(t => /date|วันที่/i.test(t)) && !targets.includes('QT IDRef')) {
    enhancedTargets.push('QT IDRef');
  }
  if (targets.some(t => /customer name|ชื่อลูกค้า/i.test(t)) && !targets.includes('Delivery Status')) {
    enhancedTargets.push('Delivery Status');
  }
  if (targets.some(t => /items|รายการ/i.test(t)) && !targets.includes('Linked_DO_Ref')) {
    enhancedTargets.push('Linked_DO_Ref');
  }
  if (targets.some(t => /total|จำนวนรวม/i.test(t)) && !targets.includes('จำนวนอุปกรณ์รวม (ชิ้น)')) {
    enhancedTargets.push('จำนวนอุปกรณ์รวม (ชิ้น)');
  }
  if (targets.some(t => /date|วันที่/i.test(t)) && !targets.includes('QT IDRef')) {
    enhancedTargets.push('QT IDRef');
  }

  const foundKey = keys.find(k => enhancedTargets.some(t => {
    const lowK = k.toLowerCase().trim();
    const lowT = t.toLowerCase().trim();
    return lowK === lowT || lowK.includes(lowT);
  }));
  return foundKey || targets[0];
};

export const getSoFulfillment = (so, stockStatusOut, getValueResilientFn, safeJSONParseFn) => {
  if (!so) return { items: [], totalReserved: 0, totalWithdrawn: 0, calculatedStatus: 'จองสินค้า' };

  const soId = String(getValueResilientFn(so, 'soid') || '').trim();
  const soItems = safeJSONParseFn(getValueResilientFn(so, 'items'));

  const withdrawnMap = {};
  (stockStatusOut || []).forEach(out => {
    const ref = String(out['Ref No'] || out['Ref No.'] || out['Reference No'] || out['Ref'] || out['refNumber'] || '').trim();
    if (ref === soId && ref !== '') {
      const prodId = String(out['Product ID'] || out['ID'] || '').trim();
      const modelName = String(out['Model'] || out['ProductName'] || '').trim();
      const qty = Number(out['Quantity'] || out.qty || 1);

      const key = prodId || modelName;
      if (key) {
        withdrawnMap[key] = (withdrawnMap[key] || 0) + qty;
      }
    }
  });

  let totalReserved = 0;
  let totalWithdrawn = 0;

  const itemsWithFulfillment = soItems.map(it => {
    const reserved = Number(it.qty || it.Quantity || 0);
    const prodId = String(it.productId || it.ID || '').trim();
    const modelName = String(it.name || it.Model || it.ProductName || '').trim();

    const withdrawn = (prodId && withdrawnMap[prodId]) ? withdrawnMap[prodId] : (withdrawnMap[modelName] || 0);
    const remaining = Math.max(0, reserved - withdrawn);

    totalReserved += reserved;
    totalWithdrawn += withdrawn;

    return { ...it, reserved, withdrawn, remaining };
  });

  const currentStatus = getValueResilientFn(so, 'status');
  let calculatedStatus = currentStatus;

  if (currentStatus !== 'ยกเลิก') {
    if (totalWithdrawn <= 0) {
      calculatedStatus = 'จองสินค้า';
    } else if (totalWithdrawn >= totalReserved) {
      calculatedStatus = 'จ่ายสินค้าแล้ว';
    } else {
      calculatedStatus = 'จ่ายบางส่วน';
    }
  }

  return { items: itemsWithFulfillment, totalReserved, totalWithdrawn, calculatedStatus };
};
