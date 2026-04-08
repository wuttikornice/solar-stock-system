import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

const BASE_URL = 'https://docs.google.com/spreadsheets/d/1k11Jp6OXGdzn8Q8Rzt-cA7WjCwGSaIAoCuwuZe8Xfac/export?format=csv';
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbz7ICpezvo7a38B73XEOK-lWcewU7ziQ0qZMLkj0NOg-fNebDAs8Gu8nRGTxdI2GA/exec';

const GIDS_INITIAL = {
  PRODUCTS: '0',
  STOCK_IN: '314735558',
  STOCK_OUT: '1204118810',
  USERS: '1357094185',
  CUSTOMERS: '1512153465',
  QUOTATIONS: '1035909294',
  SALES_ORDERS: '2077938745',
  SERVICE_TICKETS: '1320710225',
  SALES_PACKAGES: '1825278972',
  CLAIMS: '1425364758' // Placeholder CID
};

const THEME = {
  primary: '#1e3a8a',
  secondary: '#ff8c00',
  success: '#10b981',
  danger: '#ef4444',
  chartColors: ['#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
};

const App = () => {
  const [products, setProducts] = useState([]);
  const [stockStatus, setStockStatus] = useState({ in: [], out: [] });
  const [users, setUsers] = useState([]);

  // New Sales & CRM State
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [serviceTickets, setServiceTickets] = useState([]);
  const [salesPackages, setSalesPackages] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [claims, setClaims] = useState([]);
  const [dynamicGIDs, setDynamicGIDs] = useState(() => JSON.parse(localStorage.getItem('dynamicGIDs')) || {});

  // Quotation specific state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null); // New state for history modal
  const [qtItems, setQtItems] = useState([]);
  const [qtDiscount, setQtDiscount] = useState(0);
  const [qtProjectName, setQtProjectName] = useState('');
  const [qtSubView, setQtSubView] = useState('create'); // 'create' or 'history'
  const [previewQt, setPreviewQt] = useState(null);
  const [editingQt, setEditingQt] = useState(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState(null);
  const [soSubView, setSoSubView] = useState('history'); // 'history' or 'create'
  // soQtRef, soQtLink, soItems moved to consolidated state block below or kept here if unique

  const activeGIDs = { ...GIDS_INITIAL, ...dynamicGIDs };

  const [soQtRef, setSoQtRef] = useState('');
  const [soQtLink, setSoQtLink] = useState('');
  const [soItems, setSoItems] = useState([]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('currentUser')) || null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const handleExportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addActivityLog('Export CSV', `ดาวน์โหลดไฟล์: ${filename}`);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedTransaction, setExpandedTransaction] = useState(null);

  const [serialViewMode, setSerialViewMode] = useState('all'); // 'all', 'in', 'out'
  const [serialSearch, setSerialSearch] = useState('');
  const [serialHistory, setSerialHistory] = useState(null);

  const handleSerialSearch = () => {
    if (!serialSearch.trim()) return;
    const history = [];
    stockStatus.in.forEach(item => {
      if (item['Serial Number'] === serialSearch.trim()) {
        history.push({ ...item, type: 'IN' });
      }
    });
    stockStatus.out.forEach(item => {
      if (item['Serial Number'] === serialSearch.trim()) {
        history.push({ ...item, type: 'OUT' });
      }
    });
    setSerialHistory(history.sort((a, b) => {
      const da = (a.Date || a.date || '').split('/').reverse().join('-');
      const db = (b.Date || b.date || '').split('/').reverse().join('-');
      return new Date(da) - new Date(db);
    }));
  };

  // New State for Manage Stock Form
  const [manageMode, setManageMode] = useState('out'); // 'in' or 'out'
  const [bulkMode, setBulkMode] = useState(false);
  const [noSerial, setNoSerial] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    serial: '',
    bulkSerials: '',
    entity: '',
    projectType: '',
    refNumber: '',
    date: new Date().toISOString().split('T')[0],
    project: '',
    person: '',
    remark: '',
    qty: 1
  });
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'Model', direction: 'asc' });
  const [formLoading, setFormLoading] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // New State for Product Management
  const [productFormData, setProductFormData] = useState({
    id: '',
    category: '',
    brand: '',
    model: '',
    specification: '',
    unit: '',
    minStock: 0,
    company: 'Ultimo Control',
    image: ''
  });

  const [soFilterCategory, setSoFilterCategory] = useState('All');
  const [soFilterBrand, setSoFilterBrand] = useState('All');
  const [selectedSoForView, setSelectedSoForView] = useState(null);
  const [selectedSoCustomer, setSelectedSoCustomer] = useState(null);
  const [soProjectName, setSoProjectName] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [filterCompany, setFilterCompany] = useState('All');
  const [showLowStockAlerts, setShowLowStockAlerts] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Material Requisition Transfer State
  const [requisitionTransfer, setRequisitionTransfer] = useState(null);

  // Service & Claims State
  const [serviceSubView, setServiceSubView] = useState('jobs'); // 'jobs' or 'claims'
  const [claimFormData, setClaimFormData] = useState({
    claimId: '',
    jobId: '',
    productId: '',
    model: '',
    serialNumber: '',
    customer: '',
    description: '',
    status: 'Received',
    vendorCaseId: '',
    actionTaken: '',
    claimDate: new Date().toISOString().split('T')[0]
  });

  const [serviceFormData, setServiceFormData] = useState({
    customer: '',
    type: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    technician: '',
    location: '',
    description: '',
    serialNumber: '',
    resolution: ''
  });

  // 🟢 Helper for fuzzy key matching - upgraded to be more aggressive
  // 🟢 Helper for strict key matching - prioritize exact then specific Thai/Eng mapping
  // 🟢 High-Resiliency Data Retriever (Direct Fix for Offset/Thai Headers)
  // 🟢 High-Resiliency Data Retriever (Strict Fix for JSON Leaks)
  // 🟢 Ultra-Resilient Data Retriever (Value-Aware to handle CSV shifts)
  // 🟢 Precision Data Retriever (Fixed based on Diagnostic Info)
  // 🕵️ Ultra-Resilient Data Retriever (Detects data by content to survive column shifts)
  const getValueResilient = (obj, searchKey) => {
    if (!obj || typeof obj !== 'object') return '';
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    const sTarget = searchKey.toLowerCase().trim();

    // Content-Based Detection (Highest Priority)
    const findByContent = (regex, checkArray = false) => {
      const entry = Object.entries(obj).find(([k, v]) => {
        if (!v) return false;
        if (checkArray && Array.isArray(v)) return true;
        return regex.test(v.toString());
      });
      return entry ? entry[1] : null;
    };

    // Fuzzy Key-Based Detection (Second Priority)
    const findByKey = (targets) => {
      const k = keys.find(key => targets.some(t => key.toLowerCase().includes(t.toLowerCase())));
      return k ? obj[k] : null;
    };

    let result = null;

    if (sTarget === 'soid') result = findByContent(/^REQ-\d+/i) || findByKey(['SO ID', 'REQ ID', 'id', 'เลขที่']);
    if (sTarget === 'items') result = findByContent(/^\[\s*\{/i, true) || findByKey(['Items', 'Payment Status', 'รายการ', 'Item List']);
    if (sTarget === 'customerid') result = findByContent(/^CUST-/i) || findByKey(['Customer ID', 'Customer', 'รหัสลูกค้า']);
    if (sTarget === 'qtref') result = findByContent(/^QT-\d+/i) || findByKey(['QT Ref', 'อ้างอิง QT']);
    if (sTarget === 'status') result = findByContent(/^(จอง|เบิก|ยกเลิก|Pending|Reserved|Completed)/i) || findByKey(['Status', 'สถานะ']);

    // Financial & Detailed Aliases
    if (sTarget === 'subtotal') result = findByKey(['Subtotal', 'Sub Total', 'ยอดรวมเบื้องต้น', 'ยอดก่อนภาษี', 'Gross Total', 'Price before VAT']);
    if (sTarget === 'discount') result = findByKey(['Discount', 'ส่วนลด']);
    if (sTarget === 'vat') result = findByKey(['VAT', 'ภาษี', 'VAT 7%', 'ภาษีมูลค่าเพิ่ม']);
    if (sTarget === 'total' || sTarget === 'grandtotal') result = findByKey(['Grand Total', 'Total', 'ยอดสุทธิ', 'ยอดรวมสุทธิ', 'รวมเงินทั้งสิ้น', 'Amount']);
    if (sTarget === 'date' && result === null) result = findByContent(/^\d{1,2}\/\d{1,2}\/\d{4}/) || findByKey(['QT IDRef', 'Date', 'วันที่', 'Document Date']);
    if (sTarget === 'salesphone') result = findByKey(['Sales Phone', 'เบอร์โทรผู้ขาย', 'Sales Tel']);
    if (sTarget === 'projectname' && result === null) result = findByKey(['Project', 'โครงการ', 'Project Name']);
    if (sTarget === 'address' && !result) result = findByKey(['Address', 'ที่อยู่', 'ที่อยู่ส่งของ']);
    if (sTarget === 'resolution') result = findByKey(['Resolution/Problems', 'Resolution', 'Problems', 'ผลการแก้ไข', 'รายละเอียดการซ่อม']);

    if (result) return result;

    // Last Resort: Fixed Index Fallback
    switch (sTarget) {
      case 'soid': return values[0] || '';
      case 'date': return values[1] || '';
      case 'customerid': return values[2] || '';
      case 'projectname': return values[3] || '';
      case 'items': return values[4] || '[]';
      case 'grandtotal': return values[5] || 0;
      case 'qtref': return values[7] || '';
      case 'status': return values[8] || 'Pending';
      case 'address': return values[9] || '';
      case 'resolution': return values[11] || '';
      default: return '';
    }
  };

  const parseCSVNumber = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    let num;
    if (typeof val === 'number') {
      num = val;
    } else {
      const cleaned = val.toString().replace(/[\u0e3f,]/g, '').replace(/[^\d.-]/g, '');
      num = parseFloat(cleaned);
    }
    return isNaN(num) ? 0 : num;
  };

  const parseCSVDate = (val) => {
    if (!val || val === 'Invalid Date') return 'N/A';
    let d = new Date(val);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('th-TH');

    // Manual parse for common spreadsheet formats
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

  const safeJSONParse = (val, fallback = []) => {
    if (!val) return fallback;
    if (Array.isArray(val)) return val;
    try {
      // Handle escaped double quotes from some CSV exports
      const cleaned = val.toString().trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
      return JSON.parse(cleaned);
    } catch (e) {
      try { return JSON.parse(val); } catch (e2) { return fallback; }
    }
  };

  const thaiBahtText = (number) => {
    if (!number && number !== 0) return '-';
    const numberStr = number.toFixed(2).split('.');
    const integerPart = numberStr[0];
    const decimalPart = numberStr[1];

    const digitText = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
    const positionText = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

    const convertGroup = (group) => {
      let text = "";
      for (let i = 0; i < group.length; i++) {
        let digit = parseInt(group[group.length - 1 - i]);
        if (digit !== 0) {
          if (i === 0 && digit === 1 && group.length > 1) {
            text = "เอ็ด" + text;
          } else if (i === 1 && digit === 2) {
            text = "ยี่" + positionText[i] + text;
          } else if (i === 1 && digit === 1) {
            text = positionText[i] + text;
          } else {
            text = digitText[digit] + positionText[i] + text;
          }
        }
      }
      return text;
    };

    let result = "";
    if (parseInt(integerPart) === 0) {
      result = "ศูนย์บาท";
    } else {
      let groups = [];
      let temp = integerPart;
      while (temp.length > 0) {
        groups.push(temp.substring(Math.max(0, temp.length - 6)));
        temp = temp.substring(0, Math.max(0, temp.length - 6));
      }

      for (let i = 0; i < groups.length; i++) {
        let groupText = convertGroup(groups[i]);
        if (groupText !== "") {
          result = groupText + (i > 0 ? "ล้าน" : "") + result;
        }
      }
      result += "บาท";
    }

    if (parseInt(decimalPart) === 0) {
      result += "ถ้วน";
    } else {
      result += convertGroup(decimalPart) + "สตางค์";
    }
    return result;
  };

  const fetchAllSheets = async () => {
    try {
      const fetchSheet = async (gid) => {
        const response = await fetch(`${BASE_URL}&gid=${gid}`);
        const csvText = await response.text();
        return new Promise((resolve) => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => resolve(results.data)
          });
        });
      };

      const [prodData, inData, outData, userData, customerData, serviceData, claimData] = await Promise.all([
        fetchSheet(activeGIDs.PRODUCTS),
        fetchSheet(activeGIDs.STOCK_IN),
        fetchSheet(activeGIDs.STOCK_OUT),
        fetchSheet(activeGIDs.USERS).catch(() => []),
        activeGIDs.CUSTOMERS ? fetchSheet(activeGIDs.CUSTOMERS).catch(() => []) : Promise.resolve([]),
        activeGIDs.SERVICE_TICKETS ? fetchSheet(activeGIDs.SERVICE_TICKETS).catch(() => []) : Promise.resolve([]),
        activeGIDs.CLAIMS ? fetchSheet(activeGIDs.CLAIMS).catch(() => []) : Promise.resolve([])
      ]);

      // Optional: Fetch other data without blocking
      if (activeGIDs.QUOTATIONS) fetchSheet(activeGIDs.QUOTATIONS).then(setQuotations).catch(() => { });
      if (activeGIDs.SALES_PACKAGES) fetchSheet(activeGIDs.SALES_PACKAGES).then(setSalesPackages).catch(() => { });
      if (activeGIDs.SALES_ORDERS) fetchSheet(activeGIDs.SALES_ORDERS).then(data => {
        if (data && data.length > 0) console.log("REQ Data Sample:", data[0]);
        setSalesOrders(Array.isArray(data) ? data : []);
      }).catch(() => { });

      setProducts(prodData);
      setStockStatus({ in: inData, out: outData });
      setUsers(userData);
      setCustomers(customerData);
      setServiceTickets(serviceData);
      setClaims(claimData);
      setStockStatus({ in: inData, out: outData });
      setUsers(userData);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSheets();
    if (isLoggedIn && currentUser) {
      addActivityLog('App Opened', `เข้าใช้งานระบบ (Auto-login)`, currentUser);
    }
  }, []);

  const addActivityLog = async (action, details = '', userOverride = null) => {
    const logUser = userOverride || currentUser;
    try {
      await fetch(GAS_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          type: 'log',
          timestamp: new Date().toISOString(),
          username: logUser?.Username || logUser?.Name || 'guest',
          action: action,
          details: details
        })
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    // Find user in the list (fetched from Google Sheets)
    const foundUser = users.find(u =>
      u.Username?.trim() === loginData.username.trim() &&
      u.Password?.trim() === loginData.password.trim()
    );

    if (foundUser || (users.length === 0 && loginData.username === 'admin' && loginData.password === 'admin123')) {
      const user = foundUser || { Name: 'Administrator', Username: 'admin', Role: 'Admin' };
      setIsLoggedIn(true);
      setCurrentUser(user);
      setLastActivity(Date.now());
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));
      setFormData(prev => ({ ...prev, person: user.Name }));
      addActivityLog('Login', `เข้าสู่ระบบสำเร็จ (${user.Role})`, user);
    } else {
      setAuthError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      addActivityLog('Login Failed', `พยายามเข้าใช้งานด้วยชื่อ: ${loginData.username}`);
    }
  };

  const handleLogout = () => {
    addActivityLog('Logout', 'ออกจากระบบ');
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
  };

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setFormData(prev => ({ ...prev, person: currentUser.Name || currentUser.Username }));
    }
  }, [isLoggedIn, currentUser]);

  // 🛡️ Auto-Logout System (30 Minutes Inactivity)
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleActivity = () => setLastActivity(Date.now());

    // Listen for user interactions
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Checker interval (Every 30 seconds)
    const interval = setInterval(() => {
      const now = Date.now();
      const inactivityDuration = now - lastActivity;
      const thirtyMinutes = 30 * 60 * 1000;

      if (inactivityDuration > thirtyMinutes) {
        handleLogout();
        alert('เซสชันหมดอายุเนื่องจากไม่มีความเคลื่อนไหวเกิน 30 นาที กรุณาเข้าสู่ระบบใหม่');
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(interval);
    };
  }, [isLoggedIn, lastActivity]);

  const initSalesDatabase = async () => {
    if (!window.confirm('ระบบจะตรวจสอบและสร้างแผ่นงานที่จำเป็น (Customers, Quotations, SO, etc.) ใน Google Sheet ของคุณ ต้องการดำเนินการใช่หรือไม่?')) return;
    setLoading(true);
    try {
      const response = await fetch(GAS_API_URL, {
        method: 'POST',

        body: JSON.stringify({ type: 'init_sales_sheets' })
      });
      // Note: GAS CORS might lead to opaque response, so we might need the user to tell us it's done or use a better way.
      // But we can try to get the GIDs if possible.
      alert('เริ่มการตั้งค่าฐานข้อมูล... กรุณารอ 10-20 วินาทีเพื่อให้ Google Sheets อัปเดต หากไม่พบความเปลี่ยนแปลง กรุณารีเฟรชหน้าเว็บ');
      addActivityLog('Database Init', 'เริ่มการสร้างแผ่นงาน Sales & CRM');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const addPackageToQt = (pkg) => {
    const timestamp = Date.now();
    const brand = pkg['Package Name']?.toLowerCase().includes('hoymiles') ? 'Hoymiles' :
      pkg['Package Name']?.toLowerCase().includes('kehua') ? 'Kehua' : '-';

    const itemsToAdd = [];

    // 1. Header Row (The Package itself)
    itemsToAdd.push({
      id: `${timestamp}-pkg`,
      name: pkg['Package Name'],
      description: `Solar Rooftop System - ${pkg['Inverter Model']} (${pkg['Capacity']} kWp)`,
      qty: 1,
      brand: brand,
      unit: 'ชุด',
      price: Number(String(pkg['Standard Price']).replace(/,/g, '')) || 0,
    });

    // 2. Inverter Row
    if (pkg['Inverter Model'] && pkg['Inverter Model'] !== '-') {
      itemsToAdd.push({
        id: `${timestamp}-inv`,
        name: `- Inverter: ${pkg['Inverter Model']}`,
        description: '',
        qty: Number(pkg['Inverter Qty']) || 1,
        brand: brand,
        unit: 'ตัว',
        price: 0
      });
    }

    // 3. Panels Row
    if (pkg['Panel Type'] && pkg['Panel Type'] !== '-') {
      itemsToAdd.push({
        id: `${timestamp}-pnl`,
        name: `- Solar Panel: ${pkg['Panel Brand'] || brand} ${pkg['Panel Type']}`,
        description: '',
        qty: Number(pkg['Panel Qty']) || 1,
        brand: pkg['Panel Brand'] || brand,
        unit: 'แผง',
        price: 0
      });
    }

    // 4. Battery Row (for Hybrid)
    if (pkg['Battery Model'] && pkg['Battery Model'] !== '-' && pkg['Battery Model'] !== 'N/A') {
      itemsToAdd.push({
        id: `${timestamp}-bat`,
        name: `- Battery: ${pkg['Battery Model']}`,
        description: '',
        qty: Number(pkg['Battery Qty']) || 1,
        brand: brand,
        unit: 'เซท',
        price: 0
      });
    }

    // 5. Smart Meter
    if (pkg['Smart Meter'] && pkg['Smart Meter'] !== '-') {
      itemsToAdd.push({
        id: `${timestamp}-meter`,
        name: `- Smart Meter: ${pkg['Smart Meter']}`,
        description: '',
        qty: 1,
        brand: brand,
        unit: 'เซท',
        price: 0
      });
    }

    // 6. Monitoring Device
    if (pkg['Monitoring Device'] && pkg['Monitoring Device'] !== '-') {
      itemsToAdd.push({
        id: `${timestamp}-mon`,
        name: `- Monitoring: ${pkg['Monitoring Device']}`,
        description: '',
        qty: 1,
        brand: brand,
        unit: 'เซท',
        price: 0
      });
    }

    setQtItems(itemsToAdd); // Replace existing items when selecting a package
  };

  const updateQtItem = (id, field, value) => {
    setQtItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeQtItem = (id) => {
    setQtItems(prev => prev.filter(item => item.id !== id));
  };

  const qtSubtotal = useMemo(() => {
    return qtItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [qtItems]);

  const addProductToSo = (prod) => {
    const newItem = {
      id: Date.now(),
      productId: prod['Product ID'] || prod.id,
      name: prod.Model || prod.model,
      brand: prod.Brand || prod.brand,
      qty: 1,
      price: 0,
    };
    setSoItems(prev => [...prev, newItem]);
  };

  const updateSoItem = (id, field, value) => {
    setSoItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeSoItem = (id) => {
    setSoItems(prev => prev.filter(item => item.id !== id));
  };

  const soSubtotal = useMemo(() => {
    return soItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 1)), 0);
  }, [soItems]);

  const reconciledStock = useMemo(() => {
    const productAggregates = {};

    stockStatus.in.forEach(item => {
      const pid = item['Product ID'];
      const qty = parseFloat(item['Quantity'] || 1);
      const sn = item['Serial Number'];

      if (!productAggregates[pid]) productAggregates[pid] = { in: 0, out: 0, serials: {} };
      productAggregates[pid].in += qty;

      if (sn && sn !== 'NON-SERIAL') {
        productAggregates[pid].serials[sn] = {
          serial: sn,
          productId: pid,
          model: item.Model,
          status: 'In Stock',
          projectName: null,
          entity: item['Entity'] || '-',
          refNo: item['Ref No'] || item['Reference No'] || '-',
          person: item['Receiver'] || item['Person'] || '-',
          inDate: item.Date || item.date || '-',
          outDate: null
        };
      }
    });

    stockStatus.out.forEach(item => {
      const pid = item['Product ID'];
      const qty = parseFloat(item['Quantity'] || 1);
      const sn = item['Serial Number'];

      if (!productAggregates[pid]) productAggregates[pid] = { in: 0, out: 0, serials: {} };
      productAggregates[pid].out += qty;

      if (sn && sn !== 'NON-SERIAL' && productAggregates[pid].serials[sn]) {
        const s = productAggregates[pid].serials[sn];
        s.status = 'Deployed';
        s.projectName = item['Project Name'] || item['Project'] || 'Unknown Project';
        s.outRefNo = item['Ref No'] || item['Reference No'] || '-';
        s.outDate = item.Date || item.date || '-';
        s.withdrawer = item['Withdrawer'] || item['Person'] || '-';
      }
    });

    return productAggregates;
  }, [stockStatus]);

  const reservedStock = useMemo(() => {
    const reserves = {};
    salesOrders.forEach(so => {
      // Treat 'จองสินค้า', 'Reserved', 'Pending' as reserved
      const status = String(so.Status || '').toLowerCase();
      if (status === 'จองสินค้า' || status === 'reserved' || status === 'pending' || status === 'confirmed') {
        try {
          const items = JSON.parse(so.Items || '[]');
          items.forEach(item => {
            const pid = item.productId || item.id;
            if (pid) {
              reserves[pid] = (reserves[pid] || 0) + Number(item.qty || 0);
            }
          });
        } catch (e) {
          console.error("Failed to parse SO items", e);
        }
      }
    });
    return reserves;
  }, [salesOrders]);

  const stockData = useMemo(() => {
    return products.map(product => {
      const pid = product['Product ID'] || product['ID'];
      const agg = reconciledStock[pid] || { in: 0, out: 0, serials: {} };
      const balance = agg.in - agg.out;
      const reserved = reservedStock[pid] || 0;

      return {
        ...product,
        CalculatedBalance: balance,
        ReservedQuantity: reserved,
        AvailableBalance: balance - reserved,
        totalIn: agg.in,
        totalOut: agg.out,
        serials: Object.values(agg.serials)
      };
    });
  }, [products, reconciledStock, reservedStock]);

  // ✅ ข้อ 4: คำนวณสินค้าที่สต๊อกต่ำพร้อมรายละเอียด
  const lowStockItems = useMemo(() => {
    return stockData
      .filter(p => {
        const minStock = parseFloat(p['Min Stock'] || 0);
        return minStock > 0 && p.CalculatedBalance < minStock;
      })
      .map(p => ({
        ...p,
        shortage: parseFloat(p['Min Stock'] || 0) - p.CalculatedBalance,
        minStock: parseFloat(p['Min Stock'] || 0)
      }))
      .sort((a, b) => b.shortage - a.shortage);
  }, [stockData]);

  const reportData = useMemo(() => {
    const totalUnits = stockData.reduce((sum, p) => sum + p.CalculatedBalance, 0);
    const lowStockCount = lowStockItems.length;

    // 1. Category Distribution
    const catMap = {};
    stockData.forEach(p => {
      const cat = p.Category || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + p.CalculatedBalance;
    });
    const categories = Object.keys(catMap).map(name => ({ name, value: catMap[name] }))
      .sort((a, b) => b.value - a.value);

    // 2. Daily & Monthly Trend
    const dailyMap = {};
    const monthlyMap = {};
    const projectMap = {};
    const productDeployment = {};

    [...stockStatus.in.map(i => ({ ...i, t: 'IN' })), ...stockStatus.out.map(o => ({ ...o, t: 'OUT' }))].forEach(log => {
      const date = log.Date || log.date;
      if (!date) return;

      // Daily for chart
      if (!dailyMap[date]) dailyMap[date] = { date, in: 0, out: 0 };
      if (log.t === 'IN') dailyMap[date].in += parseFloat(log.Quantity || 1);
      else dailyMap[date].out += parseFloat(log.Quantity || 1);

      // Monthly for long term trend
      const parts = date.split('/');
      if (parts.length === 3) {
        const monthKey = `${parts[2]}-${parts[1]}`; // YYYY-MM
        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, in: 0, out: 0 };
        if (log.t === 'IN') monthlyMap[monthKey].in += parseFloat(log.Quantity || 1);
        else monthlyMap[monthKey].out += parseFloat(log.Quantity || 1);
      }

      // Project Distribution (Stock Out Only)
      if (log.t === 'OUT') {
        const pType = log['Project Type'] || log.projectType || 'Other';
        projectMap[pType] = (projectMap[pType] || 0) + parseFloat(log.Quantity || 1);

        // Top Deployed Items
        const m = log.Model || log.productId || 'Unknown';
        productDeployment[m] = (productDeployment[m] || 0) + parseFloat(log.Quantity || 1);
      }
    });

    const dailyTrend = Object.values(dailyMap).sort((a, b) => {
      const da = a.date.split('/').reverse().join('-');
      const db = b.date.split('/').reverse().join('-');
      return new Date(da) - new Date(db);
    }).slice(-15);

    const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

    const projectDistribution = Object.keys(projectMap).map(name => ({ name, value: projectMap[name] }))
      .sort((a, b) => b.value - a.value);

    const topDeployedItems = Object.keys(productDeployment).map(name => ({ name, value: productDeployment[name] }))
      .sort((a, b) => b.value - a.value).slice(0, 5);

    // 3. Non-Serial Insights
    const nonSerialStats = stockData.filter(p => !p.serials || p.serials.length === 0).map(p => {
      // Find history for this product
      const outList = stockStatus.out.filter(o => o['Product ID'] === (p['Product ID'] || p.id));
      const totalOut = outList.reduce((sum, o) => sum + parseFloat(o.Quantity || 1), 0);
      return {
        model: p.Model,
        balance: p.CalculatedBalance,
        totalOut,
        burnRate: (totalOut / 30).toFixed(2), // Simple monthly average
        status: p.CalculatedBalance < (totalOut / 4) ? 'Critical' : 'Healthy' // Less than 1 week supply
      };
    }).sort((a, b) => b.totalOut - a.totalOut).slice(0, 5);

    return {
      totalUnits,
      lowStockItems: lowStockCount,
      categories,
      dailyTrend,
      monthlyTrend,
      projectDistribution,
      topDeployedItems,
      nonSerialStats,
      allMovement: stockStatus.in.length + stockStatus.out.length
    };
  }, [stockData, stockStatus]);

  const getDirectImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    if (cleanUrl.includes('drive.google.com')) {
      const idMatch = cleanUrl.match(/\/d\/(.*?)\/|id=(.*?)(&|$)|open\?id=(.*?)(&|$)/);
      if (idMatch) {
        const id = idMatch[1] || idMatch[2] || idMatch[4];
        return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
      }
    }
    return cleanUrl;
  };

  const categoriesList = useMemo(() => ['All', ...new Set(products.map(p => p.Category).filter(Boolean))], [products]);
  const brandsList = useMemo(() => ['All', ...new Set(products.map(p => p.Brand).filter(Boolean))], [products]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(c =>
      Object.values(c).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [customers, searchTerm]);

  const filteredItems = useMemo(() => {
    if (currentView === 'dashboard') {
      let result = stockData.filter(item => {
        const matchesSearch = Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = filterCategory === 'All' || item.Category === filterCategory;
        const matchesBrand = filterBrand === 'All' || item.Brand === filterBrand;
        const matchesCompany = filterCompany === 'All' || item.Company === filterCompany;
        return matchesSearch && matchesCategory && matchesBrand && matchesCompany;
      });

      if (sortConfig.key) {
        result.sort((a, b) => {
          let aVal = a[sortConfig.key];
          let bVal = b[sortConfig.key];
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
      return result;
    } else if (currentView === 'product_management') {
      return products.filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else if (currentView === 'serial_tracking') {
      return Object.values(reconciledStock).flatMap(agg => Object.values(agg.serials)).filter(s =>
        s.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.projectName && s.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.productId && s.productId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.model && s.model.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return [];
  }, [searchTerm, stockData, reconciledStock, currentView, filterCategory, filterBrand, sortConfig]);

  const groupedTransactions = useMemo(() => {
    const groups = {};

    // Process ALL In Stock entries
    stockStatus.in.forEach(item => {
      const ref = item['Ref No.'] || item['Ref No'] || item['Ref No'] || item['Reference No'] || '-';
      const date = item.Date || item.date || '-';
      const key = `IN-${ref}-${date}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          ref: ref,
          date: date,
          type: 'IN',
          entity: item['Entity'] || '-',
          person: item['Person'] || item['Receiver'] || '-',
          items: []
        };
      }
      if (item['Serial Number']) {
        const product = products.find(p => p['Product ID'] === item['Product ID']);
        groups[key].items.push({
          serial: item['Serial Number'],
          model: item.Model,
          productId: item['Product ID'],
          category: product ? product.Category : 'Unknown',
          qty: parseInt(item['Quantity'] || item['quantity'] || 1),
          status: item.Status // Linkage Status
        });
      }
    });

    // Process ALL Stock Out entries
    stockStatus.out.forEach(item => {
      const ref = item['Ref No.'] || item['Ref No'] || item['Reference No'] || '-';
      const date = item.Date || item.date || '-';
      const key = `OUT-${ref}-${date}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          ref: ref,
          date: date,
          type: 'OUT',
          entity: item['Project Name '] || item['Project Name'] || item['Project'] || '-',
          person: item['Person'] || item['Withdrawer'] || '-',
          items: []
        };
      }
      if (item['Serial Number']) {
        const product = products.find(p => p['Product ID'] === item['Product ID']);
        groups[key].items.push({
          serial: item['Serial Number'],
          model: item.Model,
          productId: item['Product ID'],
          category: product ? product.Category : 'Unknown',
          qty: parseInt(item['Quantity'] || item['quantity'] || 1)
        });
      }
    });

    let result = Object.values(groups);

    // Filtering by serialViewMode
    if (serialViewMode === 'in') result = result.filter(g => g.type === 'IN');
    if (serialViewMode === 'out') result = result.filter(g => g.type === 'OUT');

    // Filtering by searchTerm
    result = result.filter(g => {
      const s = searchTerm.toLowerCase().trim();
      if (!s) return true;
      const matchesSearch = (g.ref || '').toLowerCase().includes(s) ||
        (g.entity || '').toLowerCase().includes(s) ||
        (g.person || '').toLowerCase().includes(s) ||
        g.items.some(i => (i.serial || '').toLowerCase().includes(s) || (i.model || '').toLowerCase().includes(s) || (i.productId || '').toLowerCase().includes(s));
      return matchesSearch;
    });

    return result.sort((a, b) => {
      // Handle the case where date might be empty
      if (!a.date || a.date === '-') return 1;
      if (!b.date || b.date === '-') return -1;
      const da = a.date.split('/').reverse().join('-');
      const db = b.date.split('/').reverse().join('-');
      return new Date(db) - new Date(da);
    });
  }, [stockStatus, serialViewMode, searchTerm]);

  const displayedSerials = useMemo(() => {
    if (currentView !== 'serial_tracking') return [];
    return filteredItems.filter(s => {
      if (serialViewMode === 'in') return s.status === 'In Stock';
      if (serialViewMode === 'out') return s.status === 'Deployed';
      return true;
    });
  }, [filteredItems, serialViewMode, currentView]);

  const getStockStatus = (current, min) => {
    const cur = parseFloat(current || 0);
    const m = parseFloat(min || 0);
    if (cur === 0) return { label: 'สินค้าหมด', class: 'stock-empty' };
    if (cur <= m) return { label: 'สต๊อกต่ำ', class: 'stock-low' };
    return { label: 'ปกติ', class: 'stock-healthy' };
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f4f7f6' }}>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'white',
          padding: '2.5rem',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>☀️</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: THEME.primary, margin: 0 }}>Solar Stock System</h1>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>กรุณาเข้าสู่ระบบเพื่อดำเนินการ</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>ชื่อผู้ใช้งาน</label>
              <input
                type="text"
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                  outline: 'none', transition: 'border-color 0.2s'
                }}
                placeholder="Username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>รหัสผ่าน</label>
              <input
                type="password"
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                  outline: 'none', transition: 'border-color 0.2s'
                }}
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
            </div>

            {authError && (
              <div style={{
                padding: '0.75rem', borderRadius: '8px', background: '#fef2f2', color: '#991b1b',
                fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid #fee2e2'
              }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%', padding: '0.75rem', background: THEME.primary, color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.target.style.opacity = '0.9'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              เข้าสู่ระบบ
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
            Exclusive Solution Designed by Wuttikorn.k
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2><span style={{ color: THEME.secondary }}>☀️</span> CMI Solar</h2>
        <nav style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentView('dashboard'); setExpandedProduct(null); }}>🏠 ภาพรวมสต๊อก</div>

          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>งานคลังสินค้า (Inventory)</div>
          <div className={`nav-item ${currentView === 'manage_stock' ? 'active' : ''}`} onClick={() => setCurrentView('manage_stock')}>⚙️ บันทึก รับ-จ่าย</div>
          <div className={`nav-item ${currentView === 'serial_tracking' ? 'active' : ''}`} onClick={() => setCurrentView('serial_tracking')}>🔍 ติดตามซีเรียล</div>
          <div className={`nav-item ${currentView === 'product_management' ? 'active' : ''}`} onClick={() => setCurrentView('product_management')}>📦 ฐานข้อมูลสินค้า</div>

          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>งานขาย & บริการ (Sales & CRM)</div>
          <div className={`nav-item ${currentView === 'crm' ? 'active' : ''}`} onClick={() => setCurrentView('crm')}>👥 ข้อมูลลูกค้า (CRM)</div>
          {/* <div className={`nav-item ${currentView === 'quotation' ? 'active' : ''}`} onClick={() => setCurrentView('quotation')}>📄 ใบเสนอราคา (QT)</div> */}
          <div className={`nav-item ${currentView === 'sales_order' ? 'active' : ''}`} onClick={() => setCurrentView('sales_order')}>📦 ใบเบิก/จองสินค้าติดตั้ง</div>
          <div className={`nav-item ${currentView === 'service' ? 'active' : ''}`} onClick={() => { setCurrentView('service'); setServiceSubView('jobs'); }}>🛠️ งานเซอร์วิส & นัดหมาย</div>

          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>รายงาน & แอดมิน</div>
          <div className={`nav-item ${currentView === 'reports' ? 'active' : ''}`} onClick={() => setCurrentView('reports')}>📊 รายงานสรุป</div>
        </nav>
        <div style={{
          marginTop: 'auto',
          padding: '1rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: THEME.secondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem'
            }}>
              {(currentUser?.Name || 'U')[0]}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.Name}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                {currentUser?.Role || 'Staff'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '0.4rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px', color: 'white', fontSize: '0.7rem', cursor: 'pointer'
            }}
          >
            ออกจากระบบ
          </button>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          สถานะ: เชื่อมต่อแล้ว • v1.3.1<br />
          Exclusive Solution Designed by Wuttikorn.k
        </div>
      </aside>

      <main className="main-content">
        <header className="header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: THEME.primary }}>
              {currentView === 'dashboard' && 'ศูนย์ควบคุมสต๊อกสินค้า'}
              {currentView === 'product_management' && 'ฐานข้อมูลสินค้า'}
              {currentView === 'serial_tracking' && 'ประวัติตรวจสอบหมายเลขซีเรียล'}
              {currentView === 'reports' && 'รายงานวิเคราะห์เชิงกลยุทธ์'}
              {currentView === 'manage_stock' && 'บันทึกรายการรับ-จ่ายสินค้า'}
              {currentView === 'crm' && 'ระบบบริหารจัดการลูกค้า (CRM)'}
              {currentView === 'quotation' && 'ระบบออกใบเสนอราคา (QT)'}
              {currentView === 'sales_order' && 'ระบบใบเบิกและจองสินค้าติดตั้ง (Installation Requisition)'}
              {currentView === 'service' && 'ระบบนัดหมายและงานเซอร์วิส'}
            </h1>
            <p style={{ color: '#666' }}>
              {currentView === 'dashboard' && 'คลิกชื่อสินค้าเพื่อดูรายละเอียดหมายเลขซีเรียล'}
              {currentView === 'serial_tracking' && 'ติดตามสินค้าตั้งแต่เริ่มเข้าคลังจนถึงการติดตั้งที่หน้างาน'}
              {currentView === 'reports' && 'สรุปการเคลื่อนย้ายคลังสินค้าและสัดส่วนตามประเภทโครงการ'}
              {currentView === 'manage_stock' && 'บันทึกการเข้า/ออกของสินค้าทั้งที่มีและไม่มีซีเรียล'}
              {currentView === 'crm' && 'ฐานข้อมูลลูกค้าและประวัติการซื้อขาย/เซอร์วิส'}
              {currentView === 'quotation' && 'สร้างใบเสนอราคาพรีเมียมพร้อมระบบคำนวณอัตโนมัติ'}
              {currentView === 'sales_order' && 'จัดการรายการจองสต๊อกและคำสั่งซื้อคอนเฟิร์ม'}
              {currentView === 'service' && 'ติดตามคิวงานติดตั้งและงานซ่อมบำรุง'}
            </p>
          </div>
          <input type="text" placeholder="Search..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </header>

        {currentView === 'dashboard' && (
          <>
            <div className="summary-inline">
              <div className="summary-item">
                <span>จำนวนสินค้าทั้งหมด</span>
                <span>{reportData.totalUnits.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span>หมวดหมู่ทั้งหมด</span>
                <span>{categoriesList.length - 1}</span>
              </div>
              <div className="summary-item">
                <span>สินค้าสต๊อกต่ำ</span>
                <span style={{ color: reportData.lowStockItems > 0 ? THEME.danger : THEME.secondary }}>
                  {reportData.lowStockItems}
                </span>
              </div>
            </div>

            {/* ⚡ Quick Actions Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <button
                onClick={() => { setCurrentView('manage_stock'); setManageMode('in'); }}
                className="card-action"
                style={{ padding: '1rem', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', color: '#047857', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '1.5rem' }}>📥</span> รับของเข้า
              </button>
              <button
                onClick={() => { setCurrentView('manage_stock'); setManageMode('out'); }}
                className="card-action"
                style={{ padding: '1rem', background: '#fff7ed', border: '1px solid #f97316', borderRadius: '12px', color: '#c2410c', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '1.5rem' }}>📤</span> เบิกของออก
              </button>
              <button
                onClick={() => { setCurrentView('service'); setServiceSubView('service'); }}
                className="card-action"
                style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '12px', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '1.5rem' }}>🛠️</span> เปิดงานซ่อม
              </button>
              <button
                onClick={() => { setCurrentView('crm'); }}
                className="card-action"
                style={{ padding: '1rem', background: '#f5f3ff', border: '1px solid #8b5cf6', borderRadius: '12px', color: '#6d28d9', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '1.5rem' }}>👥</span> ดูข้อมูลลูกค้า
              </button>
            </div>

            {/* ✅ ข้อ 4: ระบบแจ้งเตือนสต๊อกต่ำแบบ Real-time */}
            {lowStockItems.length > 0 && (
              <div className="alert-banner" style={{
                animation: 'pulse 2s ease-in-out infinite',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%)',
                border: '2px solid #f87171',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
              }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setShowLowStockAlerts(!showLowStockAlerts)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <div>
                      <h3 style={{ margin: 0, color: '#991b1b' }}>
                        🚨 สินค้าที่ต้องสั่งซื้อเพิ่มด่วน ({lowStockItems.length} รายการ)
                      </h3>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#b91c1c' }}>
                        สินค้าต่ำกว่าสต๊อกขั้นต่ำ กรุณาตรวจสอบและสั่งซื้อโดยเร็ว
                      </p>
                    </div>
                  </div>
                  <button className="badge" style={{
                    border: 'none',
                    background: '#dc2626',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    fontWeight: 600
                  }}>
                    {showLowStockAlerts ? '🔼 ซ่อน' : '🔽 ดูรายการ'}
                  </button>
                </div>
                {showLowStockAlerts && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: '1rem'
                    }}>
                      {lowStockItems.slice(0, 12).map((p, i) => (
                        <div key={i} style={{
                          background: 'white',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #fca5a5',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: THEME.primary }}>
                                {p['Product ID']}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                {p.Model}
                              </div>
                            </div>
                            <span style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700
                            }}>
                              {p.Category}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            marginTop: '0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #fee2e2'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 600 }}>
                                คงเหลือ
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>
                                {p.CalculatedBalance} {p.Unit}
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600 }}>
                                ขั้นต่ำ
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#64748b' }}>
                                {p.minStock} {p.Unit}
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>
                                ต้องสั่ง
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>
                                +{p.shortage} {p.Unit}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {lowStockItems.length > 12 && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'white',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: '#991b1b',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        และอีก {lowStockItems.length - 12} รายการ (ดูรายละเอียดเพิ่มเติมในตารางด้านล่าง)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="filters-bar">
              <div className="filter-group">
                <label>หมวดหมู่สินค้า</label>
                <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  {categoriesList.map(c => <option key={c} value={c}>{c === 'All' ? 'ทั้งหมด' : c}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>แบรนด์/ยี่ห้อ</label>
                <select className="filter-select" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                  {brandsList.map(b => <option key={b} value={b}>{b === 'All' ? 'ทั้งหมด' : b}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>เจ้าของสินค้า (Company)</label>
                <select className="filter-select" value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
                  <option value="All">ทั้งหมด</option>
                  <option value="Simat">Simat</option>
                  <option value="Ultimo">Ultimo</option>
                </select>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <button
                  className="btn-export"
                  onClick={() => handleExportCSV(stockData.map(p => ({
                    'Product ID': p['Product ID'],
                    'Category': p.Category,
                    'Brand': p.Brand,
                    'Model': p.Model,
                    'Balance': p.CalculatedBalance,
                    'Min Stock': p['Min Stock'],
                    'Unit': p.Unit
                  })), 'inventory_report')}
                >
                  📥 Export Inventory
                </button>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>รูปสินค้า</th>
                    <th onClick={() => setSortConfig({ key: 'Product ID', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      <div className="sort-header">
                        รหัส {sortConfig.key === 'Product ID' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th onClick={() => setSortConfig({ key: 'Category', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      <div className="sort-header">
                        หมวดหมู่ {sortConfig.key === 'Category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th onClick={() => setSortConfig({ key: 'Model', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      <div className="sort-header">
                        รุ่นสินค้า {sortConfig.key === 'Model' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th onClick={() => setSortConfig({ key: 'CalculatedBalance', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      <div className="sort-header">
                        คงคลัง {sortConfig.key === 'CalculatedBalance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th>ยอดจอง</th>
                    <th>พร้อมขาย</th>
                    <th>เจ้าของ</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => {
                    const status = getStockStatus(item.CalculatedBalance, item['Min Stock']);
                    const isExpanded = expandedProduct === item['Product ID'];
                    const displayImage = getDirectImageUrl(item.Image);
                    return (
                      <React.Fragment key={idx}>
                        <tr className="tr" onClick={() => setExpandedProduct(isExpanded ? null : item['Product ID'])}>
                          <td style={{ position: 'relative' }}>
                            {displayImage ? (
                              <div style={{ position: 'relative' }}>
                                <img
                                  src={displayImage}
                                  alt={item.Model}
                                  className="product-thumb"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    const parent = e.target.parentNode;
                                    if (!parent.querySelector('.product-thumb-placeholder')) {
                                      const placeholder = document.createElement('div');
                                      placeholder.className = 'product-thumb-placeholder';
                                      placeholder.innerText = '📦';
                                      parent.appendChild(placeholder);
                                    }
                                  }}
                                />
                                <a
                                  href={item.Image || item.image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    position: 'absolute', bottom: -5, right: -5,
                                    fontSize: '0.6rem', background: 'rgba(0,0,0,0.5)',
                                    color: 'white', padding: '2px 4px', borderRadius: '4px',
                                    textDecoration: 'none', zIndex: 5
                                  }}
                                  title="Open original link"
                                  onClick={(e) => e.stopPropagation()}
                                >🔗</a>
                              </div>
                            ) : (
                              <div className="product-thumb-placeholder">📦</div>
                            )}
                          </td>
                          <td><span className="badge badge-blue">{item['Product ID']}</span></td>
                          <td>{item.Category}</td>
                          <td><strong>{item.Model}</strong></td>
                          <td style={{ fontWeight: 600, color: '#64748b' }}>{item.CalculatedBalance}</td>
                          <td style={{ fontWeight: 600, color: THEME.secondary }}>{item.ReservedQuantity || 0}</td>
                          <td style={{ fontWeight: 800, color: THEME.primary, background: 'rgba(30, 58, 138, 0.05)' }}>{item.AvailableBalance}</td>
                          <td>
                            <span className={`badge ${item.Company === 'Ultimo' ? 'badge-orange' : 'badge-blue'}`} style={{ fontSize: '0.7rem' }}>
                              {item.Company || 'Simat'}
                            </span>
                          </td>
                          <td>
                            <div className={`stock-badge ${status.class}`}>
                              <div className="pulsate"></div>
                              {status.label}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="expanded-row">
                            <td colSpan="6">
                              <div className="serial-list">
                                {item.serials.length > 0 ? (
                                  <>
                                    <h4 style={{ marginBottom: '0.875rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '1.2rem' }}>🆔</span> Serial Numbers ({item.serials.length})
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.5rem' }}>
                                      {item.serials.map((s, sIdx) => (
                                        <div key={sIdx} className="serial-item" style={{ background: 'white', border: '1px solid #eee' }}>
                                          <span className="serial-tag">{s.serial}</span>
                                          <span className={`status-tag ${s.status === 'In Stock' ? 'status-in-stock' : 'status-deployed'}`}>
                                            {s.status === 'In Stock' ? 'In Stock' : 'Deployed'}
                                          </span>
                                          <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                            {s.status === 'Deployed' ? `Project: ${s.projectName}` : `Received: ${s.inDate}`}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <h4 style={{ marginBottom: '0.875rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '1.2rem' }}>📜</span> Transaction History (Non-Serial)
                                    </h4>
                                    <div className="history-table-small">
                                      <table style={{ background: 'white' }}>
                                        <thead>
                                          <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Qty</th>
                                            <th>Person</th>
                                            <th>Ref/Project</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {[
                                            ...stockStatus.in.filter(x => x['Product ID'] === item['Product ID']).map(x => ({ ...x, tType: 'IN' })),
                                            ...stockStatus.out.filter(x => x['Product ID'] === item['Product ID']).map(x => ({ ...x, tType: 'OUT' }))
                                          ].sort((a, b) => {
                                            const da = (a.Date || a.date || '').split('/').reverse().join('-');
                                            const db = (b.Date || b.date || '').split('/').reverse().join('-');
                                            return new Date(db) - new Date(da);
                                          }).map((hist, hIdx) => (
                                            <tr key={hIdx}>
                                              <td style={{ fontSize: '0.75rem' }}>{hist.Date || hist.date}</td>
                                              <td>
                                                <span className={`badge ${hist.tType === 'IN' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                  {hist.tType}
                                                </span>
                                              </td>
                                              <td style={{ fontWeight: 600 }}>{hist.Quantity || 1}</td>
                                              <td style={{ fontSize: '0.75rem' }}>{hist.Person || hist.Receiver || hist.Withdrawer || '-'}</td>
                                              <td style={{ fontSize: '0.75rem' }}>{hist['Project Name'] || hist.Reference || hist['Reference No'] || '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {currentView === 'product_management' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className={`badge ${!isAddingProduct ? 'badge-blue' : ''}`}
                  style={{ cursor: 'pointer', border: 'none', padding: '0.6rem 1.2rem' }}
                  onClick={() => setIsAddingProduct(false)}
                >📦 รายการสินค้าทั้งหมด</button>
                <button
                  className={`badge ${isAddingProduct ? 'badge-orange' : ''}`}
                  style={{ cursor: 'pointer', border: 'none', padding: '0.6rem 1.2rem' }}
                  onClick={() => {
                    setIsAddingProduct(true);
                    setFormStatus({ type: '', message: '' });
                  }}
                >➕ เพิ่มสินค้าใหม่</button>
              </div>
            </div>

            {isAddingProduct ? (
              <div className="table-container" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: THEME.primary }}>ลงทะเบียนอุปกรณ์ใหม่</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>รหัสสินค้า (Unique SKU)</label>
                    <input
                      type="text"
                      placeholder="เช่น INV-001"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                      value={productFormData.id}
                      onChange={(e) => setProductFormData({ ...productFormData, id: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>หมวดหมู่</label>
                    <input
                      list="categories"
                      placeholder="เช่น Inverter"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    />
                    <datalist id="categories">
                      {categoriesList.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ยี่ห้อ</label>
                    <input
                      list="brands"
                      placeholder="เช่น Hoymiles"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                      value={productFormData.brand}
                      onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                    />
                    <datalist id="brands">
                      {brandsList.filter(b => b !== 'All').map(b => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>รุ่นสินค้า (Model Name)</label>
                    <input
                      type="text"
                      placeholder="เช่น HMS-2000-4T"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                      value={productFormData.model}
                      onChange={(e) => setProductFormData({ ...productFormData, model: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>รายละเอียดทางเทคนิค (Specification)</label>
                    <textarea
                      placeholder="กรอกรายละเอียด..."
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }}
                      value={productFormData.specification}
                      onChange={(e) => setProductFormData({ ...productFormData, specification: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>หน่วยนับ</label>
                    <input
                      type="text"
                      placeholder="ชิ้น, เครื่อง, ม้วน"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                      value={productFormData.unit}
                      onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>จุดสั่งซื้อขั้นต่ำ (Min Stock)</label>
                    <input
                      type="number"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                      value={productFormData.minStock}
                      onChange={(e) => setProductFormData({ ...productFormData, minStock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>บริษัทเจ้าของ (Owner)</label>
                    <select
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                      value={productFormData.company}
                      onChange={(e) => setProductFormData({ ...productFormData, company: e.target.value })}
                    >
                      <option value="Simat">Simat</option>
                      <option value="Ultimo">Ultimo</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ลิงก์รูปภาพ (Google Drive/Public)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                      value={productFormData.image}
                      onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button
                    disabled={formLoading}
                    style={{
                      flex: 1, padding: '1rem', background: THEME.primary, color: 'white',
                      border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer',
                      opacity: formLoading ? 0.7 : 1
                    }}
                    onClick={async () => {
                      if (!productFormData.id || !productFormData.model) {
                        setFormStatus({ type: 'error', message: 'Product ID and Model are required!' });
                        return;
                      }
                      if (products.some(p => p['Product ID'] === productFormData.id)) {
                        setFormStatus({ type: 'error', message: 'Product ID already exists!' });
                        return;
                      }
                      setFormLoading(true);
                      try {
                        const payload = {
                          type: 'add_product',
                          values: [
                            productFormData.id,
                            productFormData.model,
                            productFormData.brand,
                            productFormData.category,
                            productFormData.unit,
                            productFormData.minStock,
                            productFormData.imageUrl,
                            productFormData.description
                          ]
                        };
                        await fetch(GAS_API_URL, {
                          method: 'POST',
                          mode: 'no-cors',
                          body: JSON.stringify(payload)
                        });
                        setFormStatus({ type: 'success', message: 'Product added successfully!' });
                        fetchAllSheets();
                      } catch (err) {
                        setFormStatus({ type: 'error', message: 'Failed to add product: ' + err.toString() });
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                  >
                    {formLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสินค้าหลัก'}
                  </button>
                  <button onClick={() => setIsAddingProduct(false)} style={{ padding: '1rem 2rem', background: '#eee', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>ยกเลิก</button>
                </div>
                {formStatus.message && (
                  <div style={{
                    marginTop: '1.5rem', padding: '1rem', borderRadius: '8px',
                    background: formStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: formStatus.type === 'success' ? '#065f46' : '#991b1b',
                    textAlign: 'center'
                  }}>
                    {formStatus.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>รูปภาพ</th><th>รหัสสินค้า</th><th>หมวดหมู่</th><th>ยี่ห้อ</th><th>รุ่นสินค้า</th><th>สต๊อกต่ำ</th><th>หน่วย</th></tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
                      <tr key={idx} className="tr">
                        <td style={{ position: 'relative' }}>
                          {item.Image || item.image ? (
                            <div style={{ position: 'relative', width: 'fit-content' }}>
                              <img
                                src={getDirectImageUrl(item.Image || item.image)}
                                className="product-thumb"
                                alt=""
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  const parent = e.target.parentNode;
                                  if (!parent.querySelector('.product-thumb-placeholder')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'product-thumb-placeholder';
                                    placeholder.innerText = '📦';
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                              <a
                                href={item.Image || item.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  position: 'absolute', bottom: -5, right: -5,
                                  fontSize: '0.6rem', background: 'rgba(0,0,0,0.5)',
                                  color: 'white', padding: '2px 4px', borderRadius: '4px',
                                  textDecoration: 'none', zIndex: 5
                                }}
                                title="Open original link"
                              >🔗</a>
                            </div>
                          ) : (
                            <div className="product-thumb-placeholder">📦</div>
                          )}
                        </td>
                        <td><span className="badge badge-blue">{item['Product ID'] || item.id}</span></td>
                        <td>{item.Category || item.category}</td>
                        <td>{item.Brand || item.brand}</td>
                        <td><strong>{item.Model || item.model}</strong></td>
                        <td>{item['Min Stock'] || item.minStock}</td>
                        <td>{item.Unit || item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {currentView === 'serial_tracking' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`badge ${serialViewMode === 'all' ? 'badge-blue' : ''}`}
                  onClick={() => setSerialViewMode('all')}
                >ประวัติทั้งหมด</button>
                <button
                  className={`badge ${serialViewMode === 'in' ? 'badge-green' : ''}`}
                  onClick={() => setSerialViewMode('in')}
                >รายการรับเข้า (DO)</button>
                <button
                  className={`badge ${serialViewMode === 'out' ? 'badge-orange' : ''}`}
                  onClick={() => setSerialViewMode('out')}
                >รายการเบิกออก (Project)</button>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Found {groupedTransactions.length} transactions
              </div>
            </div>

            <div className="chart-card" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🔍 ค้นหาประวัติรายซีเรียล (Full Lifecycle)</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="ป้อนหมายเลขซีเรียล..."
                  className="search-input"
                  style={{ flex: 1, margin: 0 }}
                  value={serialSearch}
                  onChange={(e) => setSerialSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSerialSearch()}
                />
                <button className="badge badge-blue" style={{ border: 'none', cursor: 'pointer', padding: '0 1.5rem' }} onClick={handleSerialSearch}>
                  ตรวจสอบประวัติ
                </button>
              </div>

              {serialHistory && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>ผลการค้นหา: <span style={{ color: THEME.primary }}>{serialSearch}</span></h4>
                    <button className="badge" style={{ background: '#eee', color: '#666', border: 'none' }} onClick={() => setSerialHistory(null)}>ล้างผลลัพธ์</button>
                  </div>
                  {serialHistory.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>ไม่พบข้อมูลประวัติของซีเรียลนี้</p>
                  ) : (
                    <div className="serial-search-results">
                      {serialHistory.map((h, i) => (
                        <div key={i} className="serial-step" style={{ borderLeft: `4px solid ${h.type === 'IN' ? THEME.success : THEME.secondary}` }}>
                          <div style={{ fontWeight: 700 }}>{h.type === 'IN' ? '📥 รับเข้าคลัง' : '📤 เบิกออกนอกคลัง'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{h.Date || h.date}</div>
                          <div style={{ marginTop: '0.25rem' }}>
                            {h.type === 'IN' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span>รับจาก: <strong>{h.Entity || '-'}</strong> (DO: {h['Ref No.'] || h['Reference No'] || '-'})</span>
                                {h.Status && h.Status !== 'ยังอยู่ในคลัง' && (
                                  <span style={{ fontSize: '0.8rem', color: THEME.primary, background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: 600 }}>
                                    📍 ปลายทาง: {h.Status}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span>ไปยังโครงการ: <strong>{h['Project Name '] || h.Project || '-'}</strong> (Ref: {h['Ref No.'] || h['Reference No'] || '-'})</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>เจ้าหน้าที่: {h.Person || h.Receiver || h.Withdrawer || '-'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>เลขที่อ้างอิง / DO</th>
                    <th>ประเภท</th>
                    <th>ชื่อโครงการ / ลูกค้า</th>
                    <th>จำนวนรายการ</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
                        No transactions found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    groupedTransactions.map(group => (
                      <React.Fragment key={group.id}>
                        <tr
                          onClick={() => setExpandedTransaction(expandedTransaction === group.id ? null : group.id)}
                          style={{ cursor: 'pointer', background: expandedTransaction === group.id ? '#f8fafc' : 'transparent' }}
                        >
                          <td>{group.date}</td>
                          <td style={{ fontWeight: 600 }}>{group.ref}</td>
                          <td>
                            <span className={`status-tag ${group.type === 'IN' ? 'status-in-stock' : 'status-deployed'}`}>
                              {group.type === 'IN' ? '📥 IN' : '📤 OUT'}
                            </span>
                          </td>
                          <td>{group.entity}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 700 }}>
                                {group.items.reduce((sum, i) => sum + i.qty, 0)}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>units</span>
                            </div>
                          </td>
                          <td>
                            <button className="badge badge-blue" style={{ border: 'none', cursor: 'pointer' }}>
                              {expandedTransaction === group.id ? 'Close' : 'View Serials'}
                            </button>
                          </td>
                        </tr>
                        {expandedTransaction === group.id && (
                          <tr>
                            <td colSpan="6" style={{ background: '#f8fafc', padding: '1.5rem' }}>
                              {(() => {
                                const grouped = {};
                                group.items.forEach(it => {
                                  const cat = it.category || 'Other';
                                  if (!grouped[cat]) grouped[cat] = [];
                                  grouped[cat].push(it);
                                });
                                return Object.entries(grouped).map(([category, items], gIdx) => (
                                  <div key={category} style={{ marginBottom: gIdx === Object.keys(grouped).length - 1 ? 0 : '2rem' }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.6rem',
                                      marginBottom: '1rem',
                                      padding: '0.4rem 1rem',
                                      background: '#f1f5f9',
                                      borderLeft: `4px solid ${THEME.primary}`,
                                      borderRadius: '4px',
                                      width: 'fit-content'
                                    }}>
                                      <span style={{ fontWeight: 800, color: THEME.primary, fontSize: '0.9rem' }}>{category}</span>
                                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                        ({items.reduce((sum, i) => sum + i.qty, 0)} {items.reduce((sum, i) => sum + i.qty, 0) > 1 ? 'items' : 'item'})
                                      </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.8rem' }}>
                                      {items.map((item, idx) => (
                                        <div key={idx} className="stat-card" style={{ padding: '0.6rem 0.8rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div>
                                              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{item.productId}</div>
                                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', margin: '0.2rem 0' }}>
                                                {item.serial === 'NON-SERIAL' ? <span style={{ color: THEME.secondary }}>[Bulk/Non-Serial]</span> : item.serial}
                                              </div>
                                              <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                                {item.model} {item.serial === 'NON-SERIAL' && `(Qty: ${item.qty})`}
                                              </div>
                                              {item.status && item.status !== 'ยังอยู่ในคลัง' && (
                                                <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: THEME.primary, fontWeight: 700, background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                                  📍 {item.status}
                                                </div>
                                              )}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>#{idx + 1}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {
          currentView === 'reports' && (
            <div style={{ paddingBottom: '3rem' }}>
              {/* Row 1: Strategic Forecasts (Simple Text Cards) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color: 'white' }}>
                  <h3 style={{ color: '#94a3b8' }}>เบิกจ่ายสูงสุดตามประเภท</h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {reportData.projectDistribution[0]?.name || 'ไม่มีข้อมูล'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
                    สัดส่วน {((reportData.projectDistribution[0]?.value / reportData.projectDistribution.reduce((a, b) => a + b.value, 0)) * 100 || 0).toFixed(1)}% ของรายการเบิกจ่ายทั้งหมด
                  </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #047857 0%, #059669 100%)', color: 'white' }}>
                  <h3 style={{ color: '#a7f3d0' }}>สินค้าเคลื่อนไหวดีที่สุด</h3>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {reportData.topDeployedItems[0]?.name || 'ไม่มีข้อมูล'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#ecfdf5', marginTop: '0.5rem' }}>
                    เบิกจ่ายไปแล้ว {reportData.topDeployedItems[0]?.value || 0} หน่วย
                  </div>
                </div>
              </div>

              {/* Row 2: Project & Consumption Charts */}
              <div className="report-grid">
                <div className="chart-card">
                  <h3 style={{ marginBottom: '1.5rem' }}>สัดส่วนสินค้าแยกตามประเภทโครงการ</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.projectDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {reportData.projectDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={[THEME.primary, THEME.secondary, THEME.success, '#f59e0b', '#6366f1'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card">
                  <h3 style={{ marginBottom: '1.5rem' }}>สินค้าเบิกจ่ายสูงสุด 5 อันดับแรก</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.topDeployedItems} layout="vertical" margin={{ left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '0.7rem' }} />
                        <Tooltip />
                        <Bar dataKey="value" name="จำนวน (หน่วย)" fill={THEME.secondary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 3: Operational Trends */}
              <div className="chart-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>แนวโน้มการดำเนินงาน (รายเดือน)</h3>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>ย้อนหลัง 6 เดือน</div>
                </div>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="in" name="รับเข้า" stroke={THEME.success} fill={THEME.success} fillOpacity={0.1} />
                      <Area type="monotone" dataKey="out" name="เบิกออก" stroke={THEME.danger} fill={THEME.danger} fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 4: Consumable Insights */}
              {reportData.nonSerialStats.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: THEME.primary }}>⚡ เจาะลึกสินค้าสิ้นเปลือง (ไม่มีซีเรียล)</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>รุ่นสินค้า</th>
                          <th>สต๊อกคงเหลือ</th>
                          <th>เบิกจ่ายสะสม</th>
                          <th>อัตราการใช้รายเดือน</th>
                          <th>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.nonSerialStats.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{item.model}</td>
                            <td>{item.balance}</td>
                            <td>{item.totalOut}</td>
                            <td>{item.burnRate} / เดือน</td>
                            <td>
                              <span className={`badge ${item.status === 'Critical' ? 'badge-orange' : 'badge-green'}`}>
                                {item.status === 'Critical' ? 'วิกฤต' : 'ปกติ'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        }

        {/* 🛠️ ระบบงานเซอร์วิส & นัดหมาย */}
        {
          currentView === 'service' && (
            <div className="service-container">
              {!activeGIDs.SERVICE_TICKETS && (
                <div className="setup-alert" style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0, color: '#9a3412' }}>ระบบเซอร์วิสยังไม่เปิดใช้งาน</h3>
                  <p style={{ color: '#c2410c', fontSize: '0.9rem', margin: '0.5rem 0 1rem 0' }}>กรุณากดปุ่มด้านล่างเพื่อสร้างแผ่นงานที่จำเป็นใน Google Sheets</p>
                  <button
                    onClick={initSalesDatabase}
                    style={{ background: THEME.secondary, color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    🚀 ตั้งค่าระบบงานเซอร์วิส
                  </button>
                </div>
              )}

              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <button
                  onClick={() => setServiceSubView('jobs')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    background: serviceSubView === 'jobs' ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' : 'white',
                    color: serviceSubView === 'jobs' ? 'white' : '#64748b',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: serviceSubView === 'jobs' ? '0 2px 8px rgba(30, 58, 138, 0.3)' : 'none',
                    borderBottom: serviceSubView === 'jobs' ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  📋 รายการงานเซอร์วิส
                </button>
                <button
                  onClick={() => setServiceSubView('claims')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    background: serviceSubView === 'claims' ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' : 'white',
                    color: serviceSubView === 'claims' ? 'white' : '#64748b',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: serviceSubView === 'claims' ? '0 2px 8px rgba(30, 58, 138, 0.3)' : 'none',
                    borderBottom: serviceSubView === 'claims' ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  🛡️ ระบบส่งเคลมอุปกรณ์
                </button>
                <button
                  onClick={() => setServiceSubView('calendar')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    background: serviceSubView === 'calendar' ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' : 'white',
                    color: serviceSubView === 'calendar' ? 'white' : '#64748b',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: serviceSubView === 'calendar' ? '0 2px 8px rgba(30, 58, 138, 0.3)' : 'none',
                    borderBottom: serviceSubView === 'calendar' ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  📅 ปฏิทินนัดหมาย
                </button>
              </div>

              {serviceSubView === 'jobs' ? (
                <>
                  {/* Dashboard Summary for Jobs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ color: '#92400e', fontSize: '0.85rem' }}>รอดำเนินการ</h3>
                          <div className="value" style={{ color: '#b45309', fontSize: '2rem' }}>
                            {(serviceTickets || []).filter(t => t.Status === 'รอดำเนินการ' || t.Status === 'Pending' || t.Status === 'รอดำเนินการ').length}
                          </div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>⏳</div>
                      </div>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ color: '#1e3a8a', fontSize: '0.85rem' }}>กำลังดำเนินการ</h3>
                          <div className="value" style={{ color: '#1e40af', fontSize: '2rem' }}>
                            {serviceTickets.filter(t => t.Status === 'กำลังดำเนินการ' || t.Status === 'In Progress').length}
                          </div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>🔧</div>
                      </div>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ color: '#065f46', fontSize: '0.85rem' }}>เสร็จสิ้น</h3>
                          <div className="value" style={{ color: '#047857', fontSize: '2rem' }}>
                            {serviceTickets.filter(t => t.Status === 'เสร็จสิ้น' || t.Status === 'Completed').length}
                          </div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>✅</div>
                      </div>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ color: '#374151', fontSize: '0.85rem' }}>งานทั้งหมด</h3>
                          <div className="value" style={{ color: '#111827', fontSize: '2rem' }}>
                            {serviceTickets.length}
                          </div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>📋</div>
                      </div>
                    </div>
                  </div>

                  {/* Claims Quick Summary */}
                  <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: '#f8fafc' }}>
                    <h4 style={{ fontSize: '0.9rem', color: THEME.primary, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      🛡️ ความคืบหน้างานเคลมอุปกรณ์ (Claims Progress)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                      <div className="stat-card" style={{ background: '#fff', border: '1px solid #fee2e2', padding: '1rem' }}>
                        <div style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 600 }}>รอส่งซ่อม</div>
                        <div style={{ color: '#b91c1c', fontSize: '1.5rem', fontWeight: 700 }}>{claims.filter(c => c.Status === 'Received').length}</div>
                      </div>
                      <div className="stat-card" style={{ background: '#fff', border: '1px solid #fef3c7', padding: '1rem' }}>
                        <div style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 600 }}>กำลังตรวจสอบ</div>
                        <div style={{ color: '#b45309', fontSize: '1.5rem', fontWeight: 700 }}>{claims.filter(c => c.Status === 'Checking').length}</div>
                      </div>
                      <div className="stat-card" style={{ background: '#fff', border: '1px solid #dbeafe', padding: '1rem' }}>
                        <div style={{ color: '#1e3a8a', fontSize: '0.75rem', fontWeight: 600 }}>ส่งโรงงานแล้ว</div>
                        <div style={{ color: '#1e40af', fontSize: '1.5rem', fontWeight: 700 }}>{claims.filter(c => c.Status === 'Sent to Vendor').length}</div>
                      </div>
                      <div className="stat-card" style={{ background: '#fff', border: '1px solid #d1fae5', padding: '1rem' }}>
                        <div style={{ color: '#065f46', fontSize: '0.75rem', fontWeight: 600 }}>คืนลูกค้าแล้ว</div>
                        <div style={{ color: '#047857', fontSize: '1.5rem', fontWeight: 700 }}>{claims.filter(c => c.Status === 'Returned' || c.Status === 'Returning').length}</div>
                      </div>
                    </div>
                  </div>

                  {/* สร้างงานเซอร์วิสใหม่ */}
                  <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h2 style={{ margin: 0, color: THEME.primary }}>🆕 สร้างงานเซอร์วิสใหม่</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                      {/* ลูกค้า */}
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                          ลูกค้า <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          className="filter-select"
                          style={{ width: '100%', padding: '0.75rem' }}
                          value={serviceFormData.customer}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const selectedCust = customers.find(c => String(c['Customer ID']) === String(selectedId));
                            const address = selectedCust ? getValueResilient(selectedCust, 'address') : '';

                            setServiceFormData({
                              ...serviceFormData,
                              customer: selectedId,
                              location: address || serviceFormData.location // Only overwrite if address exists
                            });
                          }}
                        >
                          <option value="">-- เลือกลูกค้า --</option>
                          {customers.map(c => (
                            <option key={c['Customer ID']} value={c['Customer ID']}>
                              {c['Customer Name']}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* ประเภทงาน */}
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                          ประเภทงาน <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          className="filter-select"
                          style={{ width: '100%', padding: '0.75rem' }}
                          value={serviceFormData.type}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, type: e.target.value })}
                        >
                          <option value="">-- เลือกประเภท --</option>
                          <option value="Installation">🔧 งานติดตั้ง (Installation)</option>
                          <option value="Maintenance">🛠️ งานซ่อมบำรุง (Maintenance)</option>
                          <option value="Inspection">🔍 งานตรวจสอบ (Inspection)</option>
                          <option value="Warranty">⚠️ งาน Claim/รับประกัน (Warranty)</option>
                        </select>
                      </div>

                      {/* วันที่นัดหมาย */}
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                          วันที่นัดหมาย <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="date"
                          className="search-input"
                          style={{ width: '100%', padding: '0.75rem' }}
                          value={serviceFormData.appointmentDate}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, appointmentDate: e.target.value })}
                        />
                      </div>

                      {/* ช่างผู้รับผิดชอบ */}
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                          ช่างผู้รับผิดชอบ <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="ระบุชื่อช่าง..."
                          className="search-input"
                          style={{ width: '100%', padding: '0.75rem' }}
                          value={serviceFormData.technician}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, technician: e.target.value })}
                        />
                      </div>

                      {/* สถานที่ */}
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                          สถานที่ติดตั้ง/ซ่อม
                        </label>
                        <input
                          type="text"
                          placeholder="ระบุที่อยู่หรือสถานที่..."
                          className="search-input"
                          style={{ width: '100%', padding: '0.75rem' }}
                          value={serviceFormData.location}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, location: e.target.value })}
                        />
                      </div>

                      {/* รายละเอียดงาน */}
                      <div style={{ gridColumn: 'span 3' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                          รายละเอียดงาน / ปัญหา
                        </label>
                        <textarea
                          placeholder="อธิบายรายละเอียดงานหรือปัญหาที่พบ..."
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            minHeight: '100px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                          value={serviceFormData.description}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                        />
                      </div>

                      {/* Serial Number อุปกรณ์ที่เกี่ยวข้อง */}
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                          Serial Number อุปกรณ์ที่เกี่ยวข้อง
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="ระบุ Serial Number (ถ้ามี)..."
                            className="search-input"
                            style={{ flex: 1, padding: '0.75rem' }}
                            value={serviceFormData.serialNumber}
                            onChange={(e) => setServiceFormData({ ...serviceFormData, serialNumber: e.target.value })}
                          />
                          <button
                            className="badge"
                            style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', padding: '0 1rem' }}
                            onClick={() => {
                              const sn = window.prompt('ป้อน Serial Number เพื่อตรวจสอบประวัติ:');
                              if (sn) setServiceFormData({ ...serviceFormData, serialNumber: sn });
                            }}
                          >
                            🔍 Lookup
                          </button>
                        </div>
                      </div>

                      {/* ผลการแก้ไข/รายละเอียดการซ่อม */}
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                          ผลการแก้ไข / รายละเอียดการซ่อม (Resolution)
                        </label>
                        <input
                          type="text"
                          placeholder="รายละเอียดการแก้ไขปัญหา..."
                          className="search-input"
                          style={{ width: '100%', padding: '0.75rem' }}
                          value={serviceFormData.resolution}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, resolution: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={async () => {
                          if (!serviceFormData.customer || !serviceFormData.type || !serviceFormData.technician) {
                            return alert('กรุณาระบุลูกค้า, ประเภทงาน และช่างผู้รับผิดชอบ');
                          }

                          // 🛡️ ตรวจสอบ Serial Number ในระบบสต๊อก
                          if (serviceFormData.serialNumber && serviceFormData.serialNumber.trim() !== '') {
                            const snExists = [...stockStatus.in, ...stockStatus.out].some(item =>
                              String(item['Serial Number'] || '').trim() === serviceFormData.serialNumber.trim()
                            );

                            if (!snExists) {
                              const proceed = window.confirm(`⚠️ ไม่พบข้อมูล Serial Number "${serviceFormData.serialNumber}" ในระบบสต๊อก\nคุณแน่ใจหรือไม่ว่าต้องการใช้หมายเลขนี้สำหรับงานเซอร์วิส?`);
                              if (!proceed) return;
                            }
                          }

                          setFormLoading(true);
                          try {
                            const ticketId = 'TK-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

                            // Lookup Customer Name from ID
                            const selectedCust = customers.find(c => String(c['Customer ID']) === String(serviceFormData.customer));
                            const customerName = selectedCust ? selectedCust['Customer Name'] : serviceFormData.customer;

                            console.log('GAS_API_URL:', GAS_API_URL);
                            const payload = {
                              type: 'add_service',
                              values: [
                                ticketId,
                                serviceFormData.appointmentDate,
                                new Date().toLocaleDateString('th-TH'),
                                serviceFormData.customer,
                                customerName,
                                serviceFormData.type,
                                serviceFormData.technician,
                                'Pending',
                                serviceFormData.description,
                                serviceFormData.location,
                                serviceFormData.serialNumber,
                                serviceFormData.resolution
                              ]
                            };
                            await fetch(GAS_API_URL, {
                              method: 'POST',
                              mode: 'no-cors',
                              body: JSON.stringify(payload)
                            });
                            console.log('Fetch dispatched to GAS');
                            alert('บันทึกงานเซอร์วิสสำเร็จ!');
                            setServiceFormData({
                              customer: '', type: '', appointmentDate: new Date().toISOString().split('T')[0],
                              technician: '', location: '', description: '', serialNumber: '', resolution: ''
                            });
                            fetchAllSheets();
                          } catch (e) { alert('เกิดข้อผิดพลาด'); } finally { setFormLoading(false); }
                        }}
                        style={{
                          flex: 1,
                          padding: '1rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '1rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        ✅ บันทึกงานเซอร์วิส
                      </button>
                      <button
                        style={{
                          padding: '1rem 2rem',
                          background: 'white',
                          color: '#64748b',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>

                  {/* ตารางแสดงงานเซอร์วิสทั้งหมด */}
                  <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h2 style={{ margin: 0, color: THEME.primary }}>📋 รายการงานเซอร์วิสทั้งหมด</h2>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <select
                          className="filter-select"
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          <option value="All">ทุกสถานะ</option>
                          <option value="Pending">⏳ รอดำเนินการ</option>
                          <option value="In Progress">🔧 กำลังดำเนินการ</option>
                          <option value="Completed">✅ เสร็จสิ้น</option>
                          <option value="Cancelled">❌ ยกเลิก</option>
                        </select>
                        <button
                          onClick={() => handleExportCSV(serviceTickets, 'service_tickets')}
                          className="btn-export"
                        >
                          📥 Export CSV
                        </button>
                      </div>
                    </div>

                    {serviceTickets.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '2px dashed #e2e8f0'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛠️</div>
                        <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>ยังไม่มีงานเซอร์วิสในระบบ</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                          เริ่มต้นโดยการสร้างงานเซอร์วิสใหม่จากฟอร์มด้านบน
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {serviceTickets.map((ticket, idx) => {
                          const status = ticket.Status || 'Pending';
                          const statusConfig = {
                            'Completed': { bg: '#d1fae5', text: '#065f46', label: '✅ เสร็จสิ้น', border: '#10b981' },
                            'เสร็จสิ้น': { bg: '#d1fae5', text: '#065f46', label: '✅ เสร็จสิ้น', border: '#10b981' },
                            'In Progress': { bg: '#dbeafe', text: '#1e40af', label: '🔧 กำลังดำเนินการ', border: '#3b82f6' },
                            'กำลังดำเนินการ': { bg: '#dbeafe', text: '#1e40af', label: '🔧 กำลังดำเนินการ', border: '#3b82f6' },
                            'Cancelled': { bg: '#fee2e2', text: '#991b1b', label: '❌ ยกเลิก', border: '#ef4444' },
                            'ยกเลิก': { bg: '#fee2e2', text: '#991b1b', label: '❌ ยกเลิก', border: '#ef4444' },
                            'Pending': { bg: '#fef3c7', text: '#92400e', label: '⏳ รอดำเนินการ', border: '#f59e0b' },
                            'รอดำเนินการ': { bg: '#fef3c7', text: '#92400e', label: '⏳ รอดำเนินการ', border: '#f59e0b' }
                          };
                          const config = statusConfig[status] || statusConfig['Pending'];

                          return (
                            <div key={idx} className="card-hover" style={{
                              background: 'white',
                              borderRadius: '16px',
                              border: '1px solid #e2e8f0',
                              padding: '1.5rem',
                              position: 'relative',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1rem',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.primary, marginBottom: '0.25rem' }}>
                                    {ticket['Ticket ID'] || `TK-${idx + 1}`}
                                  </div>
                                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{ticket['Customer Name'] || '-'}</h3>
                                </div>
                                <span style={{
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '20px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  background: config.bg,
                                  color: config.text,
                                  border: `1px solid ${config.border}`
                                }}>
                                  {config.label}
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <div style={{ color: '#64748b' }}>
                                  <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>ประเภทงาน</div>
                                  <div style={{ fontWeight: 600, color: THEME.primary }}>{ticket['Service Type'] || 'N/A'}</div>
                                </div>
                                <div style={{ color: '#64748b' }}>
                                  <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>วันที่นัดหมาย</div>
                                  <div style={{ fontWeight: 600 }}>{ticket['Appointment Date'] || '-'}</div>
                                </div>
                                <div style={{ color: '#64748b' }}>
                                  <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>ช่างที่ดูแล</div>
                                  <div style={{ fontWeight: 600 }}>{ticket['Technician'] || 'ยังไม่ระบุ'}</div>
                                </div>
                                <div style={{ color: '#64748b' }}>
                                  <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>S/N อุปกรณ์</div>
                                  <div style={{ fontWeight: 700, color: THEME.secondary }}>{ticket['Serial Number'] || '-'}</div>
                                </div>
                              </div>

                              <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#64748b' }}>ผลการแก้ไข:</div>
                                {getValueResilient(ticket, 'resolution') || '-'}
                              </div>

                              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                {status === 'Pending' && (
                                  <button
                                    onClick={async () => {
                                      const res = window.prompt('ระบุรายละเอียดความคืบหน้า (Progress/Resolution):', getValueResilient(ticket, 'resolution') || '');
                                      if (res === null) return;
                                      setFormLoading(true);
                                      try {
                                        const resKey = Object.keys(ticket).find(k => k.toLowerCase().includes('resolution') || k.toLowerCase().includes('problem')) || 'Resolution/Problems';
                                        const payload = {
                                          type: 'update_service_status',
                                          idColumn: 'Ticket ID',
                                          idValue: ticket['Ticket ID'],
                                          updates: { 'Status': 'In Progress', [resKey]: res }
                                        };
                                        await fetch(GAS_API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                                        alert('อัปเดตสถานะสำเร็จ');
                                        fetchAllSheets();
                                      } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                                    }}
                                    style={{ flex: 1, padding: '0.6rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                                  >⏳ เริ่มงาน</button>
                                )}
                                {status === 'In Progress' && (
                                  <button
                                    onClick={async () => {
                                      const res = window.prompt('ระบุผลการแก้ไข/ปิดงาน (Final Resolution):', getValueResilient(ticket, 'resolution') || '');
                                      if (res === null) return;
                                      setFormLoading(true);
                                      try {
                                        const resKey = Object.keys(ticket).find(k => k.toLowerCase().includes('resolution') || k.toLowerCase().includes('problem')) || 'Resolution/Problems';
                                        const payload = {
                                          type: 'update_service_status',
                                          idColumn: 'Ticket ID',
                                          idValue: ticket['Ticket ID'],
                                          updates: { 'Status': 'Completed', [resKey]: res }
                                        };
                                        await fetch(GAS_API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                                        alert('ปิดงานสำเร็จ');
                                        fetchAllSheets();
                                      } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                                    }}
                                    style={{ flex: 1, padding: '0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                                  >✅ ปิดงาน</button>
                                )}
                                <button
                                  onClick={() => setPreviewQt({ ...ticket, 'Customer Name': ticket['Customer Name'], 'Type': 'Service Ticket' })}
                                  style={{ padding: '0.6rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                >🔍</button>
                                <button
                                  onClick={() => {
                                    setServiceSubView('claims');
                                    setClaimFormData({
                                      ...claimFormData,
                                      jobId: ticket['Ticket ID'],
                                      customer: ticket['Customer Name'],
                                      description: ticket['Problem Details'] || ticket['Problem Reported'] || '',
                                      serialNumber: ticket['Serial Number'] || ''
                                    });
                                  }}
                                  style={{ padding: '0.6rem', background: '#fff7ed', color: '#c2410c', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                >🛡️ เคลม</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : serviceSubView === 'claims' ? (
                <div className="claims-view">
                  {/* 🛡️ Claims Summary & List */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ color: '#991b1b', fontSize: '0.85rem' }}>รอส่งซ่อม</h3>
                          <div className="value" style={{ color: '#b91c1c', fontSize: '2rem' }}>
                            {(claims || []).filter(c => c.Status === 'Received').length}
                          </div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>📥</div>
                      </div>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ color: '#92400e', fontSize: '0.85rem' }}>ส่งซัพพลายเออร์แล้ว</h3>
                          <div className="value" style={{ color: '#b45309', fontSize: '2rem' }}>
                            {claims.filter(c => c.Status === 'Sent to Vendor').length}
                          </div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>🚛</div>
                      </div>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ color: '#065f46', fontSize: '0.85rem' }}>ส่งคืนลูกค้าแล้ว</h3>
                          <div className="value" style={{ color: '#047857', fontSize: '2rem' }}>
                            {claims.filter(c => c.Status === 'Returned').length}
                          </div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>🤝</div>
                      </div>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ color: '#374151', fontSize: '0.85rem' }}>เคสทั้งหมด</h3>
                          <div className="value" style={{ color: '#111827', fontSize: '2rem' }}>
                            {claims.length}
                          </div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>📋</div>
                      </div>
                    </div>
                  </div>

                  {/* แถวสำหรับเพิ่มรายการเคลม */}
                  <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h2 style={{ color: THEME.primary, marginBottom: '1.5rem' }}>🆕 เปิดเคสเคลมอุปกรณ์ใหม่</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>เลขที่ Job ID (ถ้ามี)</label>
                        <input
                          type="text"
                          placeholder="พิมพ์เลขที่ Job (เช่น TK-...)"
                          className="search-input"
                          style={{ width: '100%' }}
                          value={claimFormData.jobId}
                          onChange={e => {
                            const val = e.target.value.trim();
                            const ticket = serviceTickets.find(t => {
                              const tid = String(t['Ticket ID'] || t['TicketID'] || t['ID'] || '').trim().toLowerCase();
                              return tid === val.toLowerCase();
                            });
                            if (ticket) {
                              setClaimFormData({
                                ...claimFormData,
                                jobId: e.target.value,
                                customer: ticket['Customer Name'] || ticket['Customer'] || ticket['Name'] || '',
                                serialNumber: ticket['Serial Number'] || ticket['SerialNumber'] || ticket['SN'] || ''
                              });
                            } else {
                              setClaimFormData({ ...claimFormData, jobId: e.target.value });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ลูกค้า / โครงการ</label>
                        <input type="text" className="search-input" style={{ width: '100%' }} value={claimFormData.customer} onChange={e => setClaimFormData({ ...claimFormData, customer: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>อุปกรณ์ที่ต้องการเคลม</label>
                        <select
                          className="filter-select"
                          style={{ width: '100%' }}
                          value={claimFormData.model}
                          onChange={e => setClaimFormData({ ...claimFormData, model: e.target.value })}
                        >
                          <option value="">-- เลือกรายการอุปกรณ์ --</option>
                          {products.map(p => (
                            <option key={p['Product ID']} value={p.Model}>
                              {p.Brand} - {p.Model}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>หมายเลข Serial Number</label>
                        <input type="text" className="search-input" style={{ width: '100%' }} value={claimFormData.serialNumber} onChange={e => setClaimFormData({ ...claimFormData, serialNumber: e.target.value })} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>รายละเอียดปัญหา</label>
                        <textarea className="search-input" style={{ width: '100%', minHeight: '60px' }} value={claimFormData.description} onChange={e => setClaimFormData({ ...claimFormData, description: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>สถานะเบื้องต้น</label>
                        <select className="filter-select" style={{ width: '100%' }} value={claimFormData.status} onChange={e => setClaimFormData({ ...claimFormData, status: e.target.value })}>
                          <option value="Received">📥 รับเรื่อง/รับของ (Received)</option>
                          <option value="Checking">🔍 กำลังตรวจสอบ (Checking)</option>
                          <option value="Sent to Vendor">🚛 ส่งโรงงาน/ซัพพลายเออร์ (Sent to Vendor)</option>
                        </select>
                      </div>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ width: '100%', marginTop: '1.5rem', background: THEME.secondary }}
                      onClick={async () => {
                        if (!claimFormData.serialNumber || !claimFormData.customer) return alert('กรุณาระบุ Serial และชื่อลูกค้า');
                        const claimId = 'CLM-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                        const payload = {
                          type: 'add_claim',
                          values: [
                            claimId,
                            new Date().toLocaleDateString('th-TH'),
                            claimFormData.customer,
                            claimFormData.model,
                            claimFormData.serialNumber,
                            claimFormData.description,
                            claimFormData.status || 'Received',
                            '', // Repair Details
                            ''  // Date Returned
                          ]
                        };
                        setFormLoading(true);
                        try {
                          await fetch(GAS_API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                          alert('บันทึกข้อมูลการเคลมสำเร็จ!');
                          setClaimFormData({ jobId: '', customer: '', productId: '', model: '', serialNumber: '', description: '', status: 'Received' });
                          fetchAllSheets();
                        } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                      }}
                    >
                      💾 บันทึกและเปิดเคสเคลม
                    </button>
                  </div>

                  {/* รายการเคลมทั้งหมด */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                    {claims.map((claim, idx) => {
                      const status = claim.Status || 'Received';
                      const statusConfig = {
                        'Returned': { bg: '#d1fae5', text: '#065f46', label: '✅ คืนลูกค้าแล้ว', border: '#10b981' },
                        'Returning': { bg: '#dbeafe', text: '#1e40af', label: '📦 รับคืนจากโรงงาน', border: '#3b82f6' },
                        'Sent to Vendor': { bg: '#fef3c7', text: '#92400e', label: '🚛 ส่งโรงงานแล้ว', border: '#f59e0b' },
                        'Checking': { bg: '#e0e7ff', text: '#4338ca', label: '🔍 กำลังตรวจสอบ', border: '#6366f1' },
                        'Received': { bg: '#fee2e2', text: '#991b1b', label: '📥 รับของเข้าระบบ', border: '#ef4444' }
                      };
                      const config = statusConfig[status] || statusConfig['Received'];

                      return (
                        <div key={idx} className="card-hover" style={{
                          background: 'white',
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.primary, marginBottom: '0.25rem' }}>
                                {claim.ClaimID || claim['Claim ID']}
                              </div>
                              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{claim.Customer || '-'}</h3>
                            </div>
                            <span style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '20px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: config.bg,
                              color: config.text,
                              border: `1px solid ${config.border}`
                            }}>
                              {config.label}
                            </span>
                          </div>

                          <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', borderLeft: `4px solid ${THEME.primary}` }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: THEME.primary }}>{claim.Equipment || claim['Equipment/Model'] || claim.Model || '-'}</div>
                            <div style={{ fontSize: '0.8rem', color: THEME.secondary, fontWeight: 700 }}>SN: {claim.SerialNumber || claim['Serial Number']}</div>
                          </div>

                          <div style={{ fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ color: '#64748b' }}>วันที่แจ้ง:</span>
                              <span style={{ fontWeight: 600 }}>{claim.Date || claim['Claim Date']}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#64748b' }}>อ้างอิง Job ID:</span>
                              <span style={{ fontWeight: 700, color: THEME.primary }}>{claim.JobID || claim['Job ID'] || '-'}</span>
                            </div>
                          </div>

                          <div style={{ marginTop: 'auto', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                            {status === 'Received' && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm('เปลี่ยนสถานะเป็น "ทางบริษัทได้รับของแล้ว" ใช่หรือไม่?')) return;
                                  setFormLoading(true);
                                  try {
                                    const payload = { type: 'update_claim_status', idColumn: 'Claim ID', idValue: claim.ClaimID || claim['Claim ID'], updates: { 'Status': 'Checking' } };
                                    await fetch(GAS_API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                                    alert('อัปเดตสถานะการตรวจสอบเรียบร้อย');
                                    fetchAllSheets();
                                  } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                                }}
                                style={{ flex: 1, padding: '0.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                              >🔍 ตรวจสอบ</button>
                            )}
                            {status === 'Checking' && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm('เปลี่ยนสถานะเป็น "ส่งสินค้าเคลมไปยังโรงงาน" ใช่หรือไม่?')) return;
                                  setFormLoading(true);
                                  try {
                                    const payload = { type: 'update_claim_status', idColumn: 'Claim ID', idValue: claim.ClaimID || claim['Claim ID'], updates: { 'Status': 'Sent to Vendor' } };
                                    await fetch(GAS_API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                                    alert('อัปเดตสถานะการส่งเคลมเรียบร้อย');
                                    fetchAllSheets();
                                  } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                                }}
                                style={{ flex: 1, padding: '0.5rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                              >🚛 ส่งโรงงาน</button>
                            )}
                            {status === 'Sent to Vendor' && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm('เปลี่ยนสถานะเป็น "รับของคืนจากโรงงานแล้ว" ใช่หรือไม่?')) return;
                                  setFormLoading(true);
                                  try {
                                    const payload = { type: 'update_claim_status', idColumn: 'Claim ID', idValue: claim.ClaimID || claim['Claim ID'], updates: { 'Status': 'Returning' } };
                                    await fetch(GAS_API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                                    alert('ได้รับสินค้าคืนจากโรงงานแล้ว');
                                    fetchAllSheets();
                                  } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                                }}
                                style={{ flex: 1, padding: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                              >📦 รับคืน</button>
                            )}
                            {status === 'Returning' && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm('เปลี่ยนสถานะเป็น "ส่งสินค้าคืนลูกค้าเรียบร้อยแล้ว" ใช่หรือไม่?')) return;
                                  setFormLoading(true);
                                  try {
                                    const payload = { type: 'update_claim_status', idColumn: 'Claim ID', idValue: claim.ClaimID || claim['Claim ID'], updates: { 'Status': 'Returned' } };
                                    await fetch(GAS_API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                                    alert('ส่งมอบคืนลูกค้าเรียบร้อย');
                                    fetchAllSheets();
                                  } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                                }}
                                style={{ flex: 1, padding: '0.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                              >🤝 คืนลูกค้า</button>
                            )}
                            <button style={{ padding: '0.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>👁️</button>
                          </div>
                        </div>
                      );
                    })}
                    {claims.length === 0 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>ยังไม่มีรายการเคลมในขณะนี้</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="calendar-view">
                  <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h2 style={{ margin: 0, color: THEME.primary }}>📅 ปฏิทินนัดหมายงานเซอร์วิส</h2>
                    </div>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                      {[...new Set((serviceTickets || []).map(t => t['Appointment Date']))]
                        .filter(d => d)
                        .sort()
                        .map((date, idx) => {
                          const dateJobs = serviceTickets.filter(t => t['Appointment Date'] === date);
                          return (
                            <div key={idx} style={{ borderLeft: `4px solid ${THEME.secondary}`, paddingLeft: '1.5rem' }}>
                              <div style={{ fontWeight: 800, color: THEME.secondary, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                                🗓️ {new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {dateJobs.map((job, jIdx) => (
                                  <div key={jIdx} className="stat-card" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '1rem', cursor: 'pointer' }} onClick={() => setPreviewQt({ ...job, 'Customer Name': job['Customer Name'], 'Type': 'Service Ticket' })}>
                                    <div style={{ fontWeight: 700, color: THEME.primary }}>{job['Ticket ID']}</div>
                                    <div style={{ fontWeight: 600 }}>👤 {job['Customer Name']}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>🔧 {job['Technician']}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        }

        {
          currentView === 'manage_stock' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                  className={`badge ${manageMode === 'out' ? 'badge-orange' : ''}`}
                  style={{ flex: 1, padding: '1rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '8px' }}
                  onClick={() => setManageMode('out')}
                >📤 จ่ายออกสินค้า (โครงการ / ขาย)</button>
                <button
                  className={`badge ${manageMode === 'in' ? 'badge-green' : ''}`}
                  style={{ flex: 1, padding: '1rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '8px' }}
                  onClick={() => setManageMode('in')}
                >📥 รับเข้าสินค้า (ซื้อใหม่ / เคลม)</button>
              </div>

              <div className="chart-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ color: THEME.primary, margin: 0 }}>
                    {manageMode === 'out' ? 'บันทึกรายการ: เบิกจ่ายออก' : 'บันทึกรายการ: รับเข้าสต๊อก'}
                  </h2>
                  {requisitionTransfer && manageMode === 'out' && (
                    <div className="card" style={{ marginBottom: '1.5rem', background: '#fffbeb', border: '1px solid #fcd34d', padding: '1rem', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: 0, color: '#92400e' }}>⚡ กำลังดำเนินการเบิกจ่ายตามใบเบิก: #{requisitionTransfer.id}</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#b45309' }}>โครงการ: {requisitionTransfer.project}</p>
                        </div>
                        <button
                          onClick={() => setRequisitionTransfer(null)}
                          style={{ background: '#f59e0b', border: 'none', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          ยกเลิกการเชื่อมโยง
                        </button>
                      </div>
                      <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {requisitionTransfer.items.map((it, idx) => (
                          <div
                            key={idx}
                            onClick={() => setFormData({ ...formData, productId: it.productId, qty: it.qty })}
                            style={{ background: 'white', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #fcd34d', cursor: 'pointer' }}
                          >
                            {it.name} x {it.qty}
                          </div>
                        ))}
                      </div>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: '#b45309' }}>* คลิกที่รายการสินค้าด้านบนเพื่อดึงข้อมูลลงฟอร์ม</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8f9fa', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid #dee2e6' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>โหมด:</span>
                    <button className={`badge ${!bulkMode && !noSerial ? 'badge-blue' : ''}`} onClick={() => { setBulkMode(false); setNoSerial(false); }} style={{ border: 'none', cursor: 'pointer' }}>รายชิ้น</button>
                    <button className={`badge ${bulkMode ? 'badge-orange' : ''}`} onClick={() => { setBulkMode(true); setNoSerial(false); }} style={{ border: 'none', cursor: 'pointer' }}>หลายชิ้น</button>
                    <button className={`badge ${noSerial ? 'badge-green' : ''}`} onClick={() => { setNoSerial(true); setBulkMode(false); }} style={{ border: 'none', cursor: 'pointer' }}>ไม่มีซีเรียล</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>วันที่</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>สินค้า</label>
                    <select
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    >
                      <option value="">เลือกสินค้า...</option>
                      {products.map(p => (
                        <option key={p['Product ID']} value={p['Product ID']}>{p.Model} ({p['Product ID']})</option>
                      ))}
                    </select>
                  </div>

                  {noSerial ? (
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                        value={formData.qty}
                        onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  ) : (
                    <div className="form-group" style={{ gridColumn: bulkMode ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        {bulkMode ? 'Serial Numbers (One per line)' : 'Serial Number'}
                      </label>
                      {bulkMode ? (
                        <textarea
                          placeholder="Paste serials..."
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd', minHeight: '120px', fontFamily: 'monospace' }}
                          value={formData.bulkSerials}
                          onChange={(e) => setFormData({ ...formData, bulkSerials: e.target.value })}
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="Enter Serial..."
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                          value={formData.serial}
                          onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                        />
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      {manageMode === 'in' ? 'ชื่อผู้รับสินค้า' : 'ชื่อผู้เบิกสินค้า'}
                    </label>
                    <input
                      type="text"
                      placeholder="ระบุชื่อ..."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd', background: '#f8fafc', color: '#64748b' }}
                      value={formData.person}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>หน่วยงาน (บริษัทที่รับ/จ่าย)</label>
                    <select
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                      value={formData.entity}
                      onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
                    >
                      <option value="">เลือกหน่วยงาน...</option>
                      <option value="Simat">Simat Technology (สำนักงานใหญ่)</option>
                      <option value="NPE">NPE (PPA)</option>
                      <option value="Ultimo Control">Ultimo Control (EPC)</option>
                    </select>
                  </div>

                  {manageMode === 'out' && (
                    <React.Fragment>
                      <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ประเภทโครงการ</label>
                        <select
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                          value={formData.projectType}
                          onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        >
                          <option value="">เลือกประเภท...</option>
                          <option value="EPC">โครงการ EPC</option>
                          <option value="PPA">โครงการ PPA</option>
                          <option value="Retail">ขายปลีก (Retail)</option>
                          <option value="Wholesale">ขายส่ง (Wholesale)</option>
                          <option value="Service">งานบริการ / เคลม</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ชื่อโครงการ / ชื่อลูกค้า</label>
                        <input
                          type="text"
                          placeholder="ระบุรายละเอียดโครงการ..."
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                          value={formData.project}
                          onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                        />
                      </div>
                    </React.Fragment>
                  )}

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      {manageMode === 'in' ? 'เลขที่ DO (ใบส่งของ)' : 'เลขที่อ้างอิง (PO / SO)'}
                    </label>
                    <input
                      type="text"
                      placeholder="ระบุเลขที่อ้างอิง..."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                      value={formData.refNumber}
                      onChange={(e) => setFormData({ ...formData, refNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>หมายเหตุ</label>
                    <input
                      type="text"
                      placeholder="บันทึกเพิ่มเติม..."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                      value={formData.remark}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <button
                    style={{
                      width: '100%', padding: '1rem', background: manageMode === 'out' ? THEME.secondary : THEME.success,
                      color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: formLoading ? 0.7 : 1
                    }}
                    disabled={formLoading}
                    onClick={async () => {
                      const serialsToProcess = noSerial ? ['NON-SERIAL'] : (bulkMode ? formData.bulkSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s) : [formData.serial.trim()]);
                      if (!formData.productId || !formData.refNumber || (serialsToProcess.length === 0)) {
                        setFormStatus({ type: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน (สินค้า, Serial/จำนวน, เลขที่อ้างอิง)' });
                        return;
                      }

                      // 🔍 ตรวจสอบ Serial Number ก่อนบันทึก
                      const validationErrors = [];
                      for (const sn of serialsToProcess) {
                        if (sn === 'NON-SERIAL') continue;

                        // ✅ ข้อ 1: ตรวจสอบ Serial Number ซ้ำ (สำหรับ Stock IN)
                        if (manageMode === 'in') {
                          const serialExists = stockStatus.in.some(item =>
                            item['Serial Number'] === sn
                          );
                          if (serialExists) {
                            validationErrors.push(`❌ Serial "${sn}" มีอยู่ในระบบแล้ว ไม่สามารถรับเข้าซ้ำได้`);
                          }
                        }

                        // ✅ ข้อ 2: ตรวจสอบสต๊อกก่อนเบิกออก (สำหรับ Stock OUT)
                        if (manageMode === 'out') {
                          const serialInStock = stockStatus.in.some(item =>
                            item['Serial Number'] === sn
                          );
                          const serialAlreadyOut = stockStatus.out.some(item =>
                            item['Serial Number'] === sn
                          );

                          if (!serialInStock) {
                            validationErrors.push(`❌ Serial "${sn}" ไม่มีในระบบสต๊อก`);
                          } else if (serialAlreadyOut) {
                            validationErrors.push(`❌ Serial "${sn}" ถูกเบิกออกไปแล้ว`);
                          }
                        }
                      }

                      // แสดง Validation Errors ถ้ามี
                      if (validationErrors.length > 0) {
                        setFormStatus({
                          type: 'error',
                          message: validationErrors.join('\n')
                        });
                        return;
                      }

                      setFormLoading(true);
                      setUploadProgress({ current: 0, total: serialsToProcess.length });
                      try {
                        const selectedProduct = products.find(p => p['Product ID'] === formData.productId);
                        const modelName = selectedProduct ? selectedProduct.Model : '';

                        for (let i = 0; i < serialsToProcess.length; i++) {
                          const sn = serialsToProcess[i];
                          setUploadProgress({ current: i + 1, total: serialsToProcess.length });

                          // 🟢 FIXED: Using Array-based payload for 100% Reliable Column Mapping
                          // These values must match the column order in your Google Sheet exactly.
                          let values = [];

                          if (manageMode === 'in') {
                            // Column Order: Date, Product ID, Model, Serial Number, Quantity, Entity, Ref No., Person, Status, Remark
                            values = [
                              formData.date.split('-').reverse().join('/'),
                              formData.productId,
                              modelName,
                              sn,
                              noSerial ? formData.qty : 1,
                              formData.entity,
                              formData.refNumber,
                              formData.person,
                              '', // Status (empty for now)
                              formData.remark
                            ];
                          } else {
                            // Column Order: Date, Product ID, Model, Serial Number, Quantity, Project Type, Project Name , Ref No., Person, Remark
                            values = [
                              formData.date.split('-').reverse().join('/'),
                              formData.productId,
                              modelName,
                              sn,
                              noSerial ? formData.qty : 1,
                              formData.projectType,
                              formData.project,
                              formData.refNumber,
                              formData.person,
                              formData.remark
                            ];
                          }

                          // Send type and values array for the GAS script to process
                          const payload = { type: manageMode, values };

                          await fetch(GAS_API_URL, {
                            method: 'POST',

                            body: JSON.stringify(payload)
                          });
                          if (serialsToProcess.length > 1) await new Promise(r => setTimeout(r, 200));
                        }
                        setFormStatus({ type: 'success', message: 'Recorded successfully!' });
                        addActivityLog('Stock Transaction', `${manageMode === 'in' ? 'รับเข้า' : 'เบิกออก'}: ${formData.refNumber} (${serialsToProcess.length} รายการ)`);
                        fetchAllSheets();
                      } catch (error) {
                        setFormStatus({ type: 'error', message: 'Error: ' + error.toString() });
                      } finally { setFormLoading(false); }
                    }}
                  >
                    {formLoading ? `กำลังบันทึกข้อมูล... (${uploadProgress.current}/${uploadProgress.total})` : `ยืนยันรายการ${manageMode === 'in' ? 'รับเข้าสินค้า' : 'เบิกจ่ายสินค้า'}`}
                  </button>
                  {formStatus.message && (
                    <div style={{
                      marginTop: '1rem', padding: '1rem', borderRadius: '6px', textAlign: 'center',
                      background: formStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                      color: formStatus.type === 'success' ? '#065f46' : '#991b1b'
                    }}>
                      {formStatus.message === 'Recorded successfully!' ? 'บันทึกสำเร็จ!' : formStatus.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }
        {
          currentView === 'crm' && (
            <div className="crm-container">
              {!activeGIDs.CUSTOMERS && (
                <div className="setup-alert" style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0, color: '#9a3412' }}>ฐานข้อมูล CRM ยังไม่เปิดใช้งาน</h3>
                  <p style={{ color: '#c2410c', fontSize: '0.9rem', margin: '0.5rem 0 1rem 0' }}>กรุณากดปุ่มด้านล่างเพื่อสร้างแผ่นงานที่จำเป็นใน Google Sheets ของคุณ</p>
                  <button
                    onClick={initSalesDatabase}
                    style={{ background: THEME.secondary, color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    🚀 ตั้งค่าฐานข้อมูลงานขาย & CRM
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>รายชื่อลูกค้า ({filteredCustomers.length})</h2>
                  </div>

                  <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {filteredCustomers.map((c, i) => {
                      const custType = c['Type'] || 'Retail';
                      let typeColor = '#64748b'; // Default Retail
                      if (custType === 'EPC') typeColor = '#2563eb';
                      if (custType === 'PPA') typeColor = '#10b981';
                      if (custType === 'Wholesale') typeColor = '#8b5cf6';

                      return (
                        <div key={i} className="card" style={{ padding: 0, border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                          <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
                              #{c['Customer ID'] || 'ID-NEW'}
                            </div>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 900,
                              padding: '0.25rem 0.6rem',
                              borderRadius: '20px',
                              background: `${typeColor}15`,
                              color: typeColor,
                              border: `1px solid ${typeColor}30`
                            }}>
                              {custType.toUpperCase()}
                            </span>
                          </div>

                          <div style={{ padding: '1.25rem', flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: THEME.primary, marginBottom: '0.25rem' }}>{c['Customer Name']}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                              🏢 {c['Company'] || 'ทั่วไป / บุคคลธรรมดา'}
                            </div>

                            <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <span style={{ opacity: 0.6, fontSize: '1rem' }}>📞</span>
                                <div style={{ color: '#334155', fontWeight: 600 }}>{c['Phone'] || '-'}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <span style={{ opacity: 0.6, fontSize: '1rem' }}>📍</span>
                                <div style={{ color: '#475569', lineHeight: 1.4, fontSize: '0.8rem' }}>
                                  {getValueResilient(c, 'address') || '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem' }}>
                            <button
                              style={{ flex: 1, padding: '0.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
                              onClick={() => setViewingHistory(c)}
                            >
                              📂 ดูประวัติ
                            </button>
                            <button
                              style={{ flex: 1, padding: '0.5rem', background: THEME.secondary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                              onClick={() => {
                                setEditingCustomer(c);
                                document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              ✏️ แก้ไข
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {customers.length === 0 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                        <div style={{ fontSize: '1.2rem', color: '#64748b' }}>ยังไม่มีรายชื่อลูกค้าในระบบ</div>
                      </div>
                    )}
                  </div>
                </div>

                {viewingHistory && (
                  <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, padding: '1rem'
                  }}>
                    <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: THEME.primary }}>ประวัติลูกค้า: {viewingHistory['Customer Name']}</h3>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{viewingHistory['Company'] || '-'} | {viewingHistory['Phone'] || viewingHistory['Sales Phone']}</div>
                        </div>
                        <button
                          onClick={() => setViewingHistory(null)}
                          style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                      <div style={{ padding: '1.5rem', overflowY: 'auto', background: '#f8fafc', flex: 1 }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#475569' }}>📦 ประวัติการเบิก/จองสินค้า (Sales Orders)</h4>
                        {salesOrders.filter(so => String(getValueResilient(so, 'customerid')) === String(viewingHistory['Customer ID'])).length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {salesOrders
                              .filter(so => String(getValueResilient(so, 'customerid')) === String(viewingHistory['Customer ID']))
                              .sort((a, b) => new Date(getValueResilient(b, 'date')) - new Date(getValueResilient(a, 'date')))
                              .map((so, idx) => (
                                <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontWeight: 600, color: THEME.primary }}>{getValueResilient(so, 'soid')}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>วันที่: {parseCSVDate(getValueResilient(so, 'date'))}</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: '0.25rem' }}>Project: {getValueResilient(so, 'projectname') || '-'}</div>
                                    {getValueResilient(so, 'qtref') && (
                                      <div style={{ fontSize: '0.8rem', color: THEME.secondary, marginTop: '0.2rem' }}>
                                        Ref: {getValueResilient(so, 'qtref')}
                                        {getValueResilient(so, 'qtlink') && (
                                          <a href={getValueResilient(so, 'qtlink')} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem', color: '#3b82f6', textDecoration: 'underline' }}>
                                            [ดูเอกสารแนบ 📄]
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>฿{parseCSVNumber(getValueResilient(so, 'grandtotal')).toLocaleString()}</div>
                                    <div style={{
                                      fontSize: '0.75rem',
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '12px',
                                      background: getValueResilient(so, 'status')?.includes('จอง') ? '#fef3c7' : '#dcfce7',
                                      color: getValueResilient(so, 'status')?.includes('จอง') ? '#d97706' : '#166534',
                                      display: 'inline-block',
                                      marginTop: '0.25rem',
                                      textAlign: 'center'
                                    }}>
                                      {getValueResilient(so, 'status')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: 'white', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                            ไม่มีประวัติการทำรายการ
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}


                <div style={{ width: '350px' }}>
                  <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                        {editingCustomer ? `แก้ไขข้อมูล: ${editingCustomer['Customer Name']}` : 'เพิ่มข้อมูลลูกค้าใหม่'}
                      </h3>
                      {editingCustomer && (
                        <button
                          onClick={() => setEditingCustomer(null)}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ยกเลิก
                        </button>
                      )}
                    </div>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target;

                      const isEdit = !!editingCustomer;
                      const customerId = isEdit ? (editingCustomer['Customer ID'] || editingCustomer.id) : ('CUST-' + Date.now());

                      const payload = isEdit ? {
                        type: 'edit_customer',
                        idColumn: 'Customer ID',
                        idValue: customerId,
                        updates: {
                          'Customer Name': form.name.value,
                          'Company': form.company.value,
                          'Phone': form.phone.value,
                          'Address': form.address.value,
                          'Type': form.custType.value,
                          'Tax ID': form.taxId.value
                        }
                      } : {
                        type: 'add_customer',
                        values: [
                          customerId,
                          form.name.value,
                          form.company.value,
                          form.phone.value,
                          form.address.value,
                          form.custType.value,
                          form.taxId.value
                        ]
                      };

                      setFormLoading(true);
                      try {
                        await fetch(GAS_API_URL, {
                          method: 'POST',
                          mode: 'no-cors',
                          body: JSON.stringify(payload)
                        });
                        alert(isEdit ? 'แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว' : 'บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว');
                        await addActivityLog('CRM', isEdit ? `แก้ไขลูกค้า: ${form.name.value}` : `เพิ่มลูกค้าใหม่: ${form.name.value}`);
                        fetchAllSheets();
                        setEditingCustomer(null);
                      } catch (err) {
                        alert('เกิดข้อผิดพลาดในการบันทึก');
                      } finally {
                        setFormLoading(false);
                      }
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>ชื่อลูกค้า / ผู้ติดต่อ</label>
                        <input
                          name="name"
                          type="text"
                          className="search-input"
                          style={{ width: '100%' }}
                          placeholder="ชื่อ-นามสกุล"
                          required
                          defaultValue={editingCustomer ? editingCustomer['Customer Name'] : ''}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>บริษัท (ถ้ามี)</label>
                        <input
                          name="company"
                          type="text"
                          className="search-input"
                          style={{ width: '100%' }}
                          placeholder="บริษัท จำกัด"
                          defaultValue={editingCustomer ? editingCustomer['Company'] : ''}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>เบอร์โทรศัพท์ติดต่อ</label>
                        <input
                          name="phone"
                          type="text"
                          className="search-input"
                          style={{ width: '100%' }}
                          placeholder="08xxxxxxxx"
                          required
                          defaultValue={editingCustomer ? (editingCustomer['Phone'] || editingCustomer['Sales Phone']) : ''}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>ที่อยู่ / สถานที่จัดส่ง</label>
                        <textarea
                          name="address"
                          className="search-input"
                          style={{ width: '100%', height: '80px', resize: 'vertical' }}
                          placeholder="ที่อยู่สำหรับออกใบกำกับภาษี"
                          defaultValue={editingCustomer ? getValueResilient(editingCustomer, 'address') : ''}
                        ></textarea>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>ประเภทลูกค้า</label>
                          <select
                            name="custType"
                            className="search-input"
                            style={{ width: '100%' }}
                            defaultValue={editingCustomer ? editingCustomer['Type'] : 'Retail'}
                          >
                            <option value="Retail">Retail (บุคคลธรรมดา)</option>
                            <option value="EPC">EPC (โครงการ/ผู้รับเหมา)</option>
                            <option value="PPA">PPA (ผู้ขายไฟ)</option>
                            <option value="Wholesale">Wholesale (ราคาส่ง)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>เลขผู้เสียภาษี</label>
                          <input
                            name="taxId"
                            type="text"
                            className="search-input"
                            style={{ width: '100%' }}
                            placeholder="-"
                            defaultValue={editingCustomer ? editingCustomer['Tax ID'] : ''}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={formLoading}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: editingCustomer ? '#f59e0b' : THEME.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          marginTop: '0.5rem',
                          cursor: formLoading ? 'not-allowed' : 'pointer',
                          opacity: formLoading ? 0.7 : 1
                        }}
                      >
                        {formLoading ? 'กำลังบันทึก...' : (editingCustomer ? 'บันทึกการแก้ไข' : 'เพิ่มลูกค้า')}
                      </button>
                    </form>
                  </div>
                </div>

              </div >
            </div >
          )}
        {
          currentView === 'quotation' && (
            <div className="quotation-view-container">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <button
                  onClick={() => setQtSubView('create')}
                  style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', border: 'none', background: qtSubView === 'create' ? THEME.primary : 'transparent', color: qtSubView === 'create' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer' }}
                >
                  ➕ สร้างใหม่ออกใบ QT
                </button>
                <button
                  onClick={() => setQtSubView('history')}
                  style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', border: 'none', background: qtSubView === 'history' ? THEME.primary : 'transparent', color: qtSubView === 'history' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer' }}
                >
                  📜 ประวัติลูกค้าที่ออก QT แล้ว
                </button>
              </div>

              {qtSubView === 'create' ? (
                <div className="quotation-container">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                    <div className="card" style={{ padding: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0 }}>สร้างใบเสนอราคาใหม่ (Ultimo Quotation)</h2>
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>เลขที่: QT-{new Date().getFullYear() + 543}/XXXX (Auto)</div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>เลือกลูกค้าจากระบบ CRM</label>
                          <select
                            className="filter-select"
                            style={{ width: '100%', padding: '0.75rem' }}
                            value={selectedCustomer?.['Customer ID'] || ''}
                            onChange={(e) => {
                              const selected = customers.find(c => c['Customer ID'] === e.target.value);
                              setSelectedCustomer(selected);
                            }}
                          >
                            <option value="">-- ค้นหา/เลือกรายชื่อลูกค้า --</option>
                            {customers.map(c => (
                              <option key={c['Customer ID']} value={c['Customer ID']}>
                                {c['Customer Name']} | {c['Company']} (Tax ID: {c['Tax ID'] || '-'})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>พนักงานขาย (Sales Person)</label>
                            <select
                              className="filter-select"
                              style={{ width: '100%', padding: '0.75rem' }}
                              value={selectedSalesperson?.Username || ''}
                              onChange={(e) => {
                                const selected = users.find(u => u.Username === e.target.value);
                                setSelectedSalesperson(selected);
                              }}
                            >
                              <option value="">-- เลือกพนักงานขาย --</option>
                              {users.map(u => (
                                <option key={u.Username} value={u.Username}>
                                  {u.Name} {u.Phone ? `(${u.Phone})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>ชื่อโครงการ / Project Name</label>
                            <input
                              type="text"
                              className="search-input"
                              style={{ width: '100%', padding: '0.75rem' }}
                              placeholder="ระบุชื่อโครงการ (ถ้ามี)"
                              value={qtProjectName}
                              onChange={(e) => setQtProjectName(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
                        <div className="card" style={{ padding: '1.2rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🔍 ค้นหาสินค้าจากสต๊อก
                          </h3>
                          <select
                            className="filter-select"
                            style={{ width: '100%', padding: '0.75rem' }}
                            onChange={(e) => {
                              const prod = products.find(p => p['Product ID'] === e.target.value);
                              if (prod) {
                                setQtItems(prev => [...prev, {
                                  id: Date.now(),
                                  name: prod.Model || prod.ProductName || 'สินค้าใหม่',
                                  description: prod.Specification || prod.Description || '',
                                  brand: prod.Brand || '-',
                                  unit: prod.Unit || 'หน่วย',
                                  qty: 1,
                                  price: parseCSVNumber(prod['Standard Price']) || 0
                                }]);
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>-- เลือกสินค้าเพื่อเพิ่มในรายการ --</option>
                            {products.map((p, idx) => (
                              <option key={idx} value={p['Product ID']}>
                                {p.Brand ? `[${p.Brand}] ` : ''}{p.Model || p.ProductName} {p['Quantity'] ? `(คงเหลือ: ${p['Quantity']})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="card" style={{ padding: '1.2rem', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📦 เลือกตัวเลือกแพ็คเกจ
                          </h3>
                          <select
                            className="filter-select"
                            style={{ width: '100%', padding: '0.75rem' }}
                            onChange={(e) => {
                              const pkg = salesPackages.find(p => p['Package Name'] === e.target.value);
                              if (pkg) addPackageToQt(pkg);
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>-- เลือกแพ็คเกจโซล่าเซลล์ --</option>
                            {salesPackages.map((pkg, idx) => (
                              <option key={idx} value={pkg['Package Name']}>
                                {pkg['Package Name']} (฿{parseCSVNumber(pkg['Standard Price']).toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>รายการในใบเสนอราคา</h3>
                        <button
                          style={{ background: '#64748b', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}
                          onClick={() => {
                            const name = prompt('ชื่อรายการ:');
                            if (name) {
                              setQtItems(prev => [...prev, { id: Date.now(), name, description: '', brand: '-', unit: 'หน่วย', qty: 1, price: 0 }]);
                            }
                          }}
                        >
                          + เพิ่มรายการแมนนวล
                        </button>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>
                            <th style={{ padding: '0.5rem' }}>รายการ</th>
                            <th style={{ padding: '0.5rem', width: '80px' }}>จำนวน</th>
                            <th style={{ padding: '0.5rem', width: '150px' }}>ราคา/หน่วย</th>
                            <th style={{ padding: '0.5rem', width: '120px' }}>รวม</th>
                            <th style={{ padding: '0.5rem', width: '50px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {qtItems.map((item) => (
                            <tr key={item.id} style={{ background: '#fff' }}>
                              <td style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', borderRadius: '8px 0 0 8px' }}>
                                <div style={{ fontWeight: 600 }}>{item.brand !== '-' ? `[${item.brand}] ` : ''}{item.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.description}</div>
                              </td>
                              <td style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                <input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) => updateQtItem(item.id, 'qty', Number(e.target.value))}
                                  style={{ width: '60px', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }}
                                />
                              </td>
                              <td style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => updateQtItem(item.id, 'price', Number(e.target.value))}
                                  style={{ width: '120px', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'right' }}
                                />
                              </td>
                              <td style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', fontWeight: 700, textAlign: 'right' }}>
                                ฿{(item.price * item.qty).toLocaleString()}
                              </td>
                              <td style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderRadius: '0 8px 8px 0', textAlign: 'center' }}>
                                <button
                                  onClick={() => removeQtItem(item.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                >✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {qtItems.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #e2e8f0', borderRadius: '12px', color: '#94a3b8', marginTop: '1rem' }}>
                          เลือกสินค้าจากเมนูด้านขวาเพื่อเพิ่มรายการ
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ padding: '1.5rem', background: THEME.primary, color: 'white' }}>
                      <h3 style={{ margin: '0 0 1.5rem 0' }}>สรุปยอดรวม</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>รวมเงินเบื้องต้น:</span>
                          <span>฿{qtSubtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>ส่วนลดพิเศษ:</span>
                          <input
                            type="number"
                            value={qtDiscount}
                            onChange={(e) => setQtDiscount(Number(e.target.value))}
                            placeholder="0.00"
                            style={{ width: '100px', padding: '0.3rem', borderRadius: '4px', border: 'none', textAlign: 'right' }}
                          />
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '0.5rem 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                          <span>ยอดสุทธิ:</span>
                          <span style={{ color: THEME.secondary }}>฿{(qtSubtotal - qtDiscount).toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        style={{ width: '100%', marginTop: '2rem', padding: '1rem', background: 'white', color: THEME.primary, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                        onClick={async () => {
                          if (!selectedCustomer) return alert('กรุณาเลือกลูกค้าก่อน');
                          if (qtItems.length === 0) return alert('กรุณาเพิ่มรายการสินค้า');

                          const qtId = editingQt ? editingQt['QT ID'] : 'QT-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                          const subtotal = qtSubtotal;
                          const totalBeforeVat = (subtotal - qtDiscount) / 1.07;
                          const vat7 = (subtotal - qtDiscount) - totalBeforeVat;

                          const qtData = {
                            type: editingQt ? 'edit_quotation' : 'add_quotation',
                            id: qtId,
                            projectName: qtProjectName,
                            customerId: selectedCustomer['Customer ID'],
                            salesperson: selectedSalesperson?.Name || currentUser?.Name,
                            salesPhone: selectedSalesperson?.Phone || currentUser?.Phone,
                            items: qtItems,
                            subtotal: subtotal,
                            discount: qtDiscount,
                            vat: vat7,
                            total: subtotal - qtDiscount
                          };

                          setFormLoading(true);
                          try {
                            await fetch(GAS_API_URL, {
                              method: 'POST',

                              body: JSON.stringify(qtData)
                            });
                            alert(editingQt ? 'แก้ไขใบเสนอราคาสำเร็จ!' : 'บันทึกใบเสนอราคาสำเร็จ!');
                            setQtItems([]);
                            setQtDiscount(0);
                            setQtProjectName('');
                            setSelectedCustomer(null);
                            setEditingQt(null);
                            addActivityLog('Quotation', `${editingQt ? 'แก้ไข' : 'ออก'}ใบเสนอราคา ${qtId} ให้: ${selectedCustomer['Customer Name']}`);
                            fetchAllSheets();
                          } catch (err) {
                            alert('เกิดข้อผิดพลาด');
                          } finally { setFormLoading(false); }
                        }}
                      >
                        {editingQt ? '💾 บันทึกการแก้ไข' : '💾 บันทึกและออกใบ QT'}
                      </button>
                      {editingQt && (
                        <button
                          style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => {
                            setEditingQt(null);
                            setQtItems([]);
                            setQtDiscount(0);
                            setQtProjectName('');
                            setSelectedCustomer(null);
                          }}
                        >
                          ยกเลิกการแก้ไข
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="quotation-history">
                  <div className="card" style={{ padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>เลขที่ QT</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>วันที่</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>ลูกค้า</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>ยอดรวมสุทธิ</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotations.map((q, idx) => {
                          const custId = getValueResilient(q, 'customerid');
                          const customer = customers.find(c => String(c['Customer ID']).trim() === String(custId).trim());
                          const grandTotal = parseCSVNumber(getValueResilient(q, 'grandtotal'));
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '1rem', fontWeight: 600 }}>{getValueResilient(q, 'qtid') || q['QT ID']}</td>
                              <td style={{ padding: '1rem' }}>{parseCSVDate(getValueResilient(q, 'date'))}</td>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: 600 }}>{customer ? customer['Customer Name'] : q['Customer ID']}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Project: {q['Project Name'] || '-'}</div>
                              </td>
                              <td style={{ padding: '1rem', fontWeight: 700, color: THEME.primary }}>฿{grandTotal.toLocaleString()}</td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '20px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  background: q['Status'] === 'Draft' ? '#f1f5f9' : '#dcfce7',
                                  color: q['Status'] === 'Draft' ? '#64748b' : '#166534'
                                }}>
                                  {q['Status'] || 'Ready'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => setPreviewQt(q)}
                                  style={{ background: THEME.secondary, color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
                                >
                                  🖨️ พิมพ์/PDF
                                </button>
                                <button
                                  onClick={() => {
                                    const custId = getValueResilient(q, 'customerid');
                                    const customer = customers.find(cust => String(cust['Customer ID']).trim() === String(custId).trim());
                                    setSelectedCustomer(customer);
                                    const salesperson = users.find(u => u.Name === q['Salesperson'] || u.Name === q['Sales Person']);
                                    setSelectedSalesperson(salesperson);
                                    setQtItems(safeJSONParse(getValueResilient(q, 'items')));
                                    setQtDiscount(parseCSVNumber(getValueResilient(q, 'discount')));
                                    setQtProjectName(getValueResilient(q, 'projectname') || '');
                                    setEditingQt(q);
                                    setQtSubView('create');
                                  }}
                                  style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  📝 แก้ไข
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {quotations.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>ยังไม่มีประวัติการออกใบเสนอราคา</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Preview Modal */}
              {previewQt && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                  <div style={{ background: 'white', width: '90%', maxWidth: '900px', height: '95vh', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>ตัวอย่างใบเสนอราคา ({previewQt['QT ID']})</h3>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={() => window.print()}
                          style={{ padding: '0.5rem 1rem', background: THEME.primary, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          🖨️ พิมพ์/Save PDF
                        </button>
                        <button
                          onClick={() => setPreviewQt(null)}
                          style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          ปิด
                        </button>
                      </div>
                    </div>

                    <div id="quotation-print-area" style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', background: '#fff', color: '#000', fontFamily: "'Inter', 'Sarabun', sans-serif" }}>
                      {/* Header Section */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '2px solid #1e3a8a', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <div style={{ width: '90px', height: '90px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src="https://lh3.googleusercontent.com/d/1X8g7-E6P_L6_Q6_K0_W9z6L5Z-W-v_L7" alt="Ultimo Logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                          </div>
                          <div>
                            <h1 style={{ margin: '0', fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a' }}>บริษัท อัลติโม คอนโทรล จำกัด (สำนักงานใหญ่)</h1>
                            <p style={{ margin: '0', fontSize: '0.85rem', lineHeight: '1.5', color: '#1f2937' }}>
                              Ultimo Control Co., Ltd. (Head Office)<br />
                              30/17 หมู่ที่ 13 แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210<br />
                              โทร: 02-574-3316-8 Fax: 02-982-7533 | Email: account@ultimo.co.th<br />
                              <strong>เลขประจำตัวผู้เสียภาษีอากร : 0105560095931</strong>
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ border: '2px solid #1e3a8a', padding: '0.5rem 1.5rem', borderRadius: '4px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a' }}>ใบเสนอราคา</h2>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#64748b' }}>QUOTATION</h3>
                          </div>
                        </div>
                      </div>

                      {/* Customer & Document Info */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0', border: '1px solid #1e3a8a', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRight: '1px solid #1e3a8a' }}>
                          <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>โครงการ (Project Name) :</strong> <span style={{ color: '#1e3a8a', fontWeight: 700 }}>{previewQt['Project Name'] || '-'}</span></div>
                          <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>ชื่อลูกค้า (Customer Name) :</strong> {customers.find(c => String(c['Customer ID']).trim() === String(previewQt['Customer ID']).trim())?.['Customer Name'] || previewQt['Customer ID']}</div>
                          <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>ที่อยู่ (Address) :</strong> {getValueResilient(customers.find(c => String(c['Customer ID']).trim() === String(previewQt['Customer ID']).trim()), 'address') || '-'}</div>
                          <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>เลขที่เสียภาษี (Tax ID) :</strong> {customers.find(c => String(c['Customer ID']).trim() === String(previewQt['Customer ID']).trim())?.['Tax ID'] || '-'}</div>
                          <div style={{ fontSize: '0.9rem' }}><strong>Tel :</strong> {customers.find(c => String(c['Customer ID']).trim() === String(previewQt['Customer ID']).trim())?.['Phone'] || '-'} <strong>Email :</strong> {customers.find(c => String(c['Customer ID']).trim() === String(previewQt['Customer ID']).trim())?.['Email'] || '-'}</div>
                        </div>
                        <div style={{ padding: '0.75rem', background: '#f8fafc' }}>
                          <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>เลขที่เอกสาร (No.) :</strong> <span style={{ fontWeight: 800 }}>{previewQt['QT ID']}</span></div>
                          <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>วันที่ (Date) :</strong> {(() => {
                            const d = new Date(previewQt['Date']);
                            return isNaN(d) ? previewQt['Date'] : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
                          })()}</div>
                          <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>พนักงานขาย (Sales) :</strong> {previewQt['Salesperson'] || previewQt['Sales Person'] || currentUser?.Name || '-'}</div>
                          <div style={{ fontSize: '0.9rem' }}><strong>โทร (Sales Tel) :</strong> {previewQt['Sales Phone'] || currentUser?.Phone || '-'}</div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
                        <thead>
                          <tr style={{ background: '#1e3a8a', color: 'white', fontSize: '0.85rem', textAlign: 'center' }}>
                            <th style={{ padding: '0.6rem', border: '1px solid #1e3a8a', width: '40px' }}>No.</th>
                            <th style={{ padding: '0.6rem', border: '1px solid #1e3a8a' }}>รายละเอียด (Description)</th>
                            <th style={{ padding: '0.6rem', border: '1px solid #1e3a8a', width: '100px' }}>แบรนด์</th>
                            <th style={{ padding: '0.6rem', border: '1px solid #1e3a8a', width: '60px' }}>หน่วย</th>
                            <th style={{ padding: '0.6rem', border: '1px solid #1e3a8a', width: '110px' }}>ราคาต่อหน่วย</th>
                            <th style={{ padding: '0.6rem', border: '1px solid #1e3a8a', width: '60px' }}>จำนวน</th>
                            <th style={{ padding: '0.6rem', border: '1px solid #1e3a8a', width: '130px' }}>จำนวนเงิน (บาท)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {safeJSONParse(getValueResilient(previewQt, 'items')).map((item, i) => (
                            <tr key={i} style={{ fontSize: '0.85rem', verticalAlign: 'top' }}>
                              <td style={{ padding: '0.6rem', border: '1px solid #ddd', textAlign: 'center' }}>{i + 1}</td>
                              <td style={{ padding: '0.6rem', border: '1px solid #ddd' }}>
                                <div style={{ fontWeight: 700, color: '#1e3a8a' }}>{item.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#4b5563', whiteSpace: 'pre-line', marginTop: '0.2rem' }}>{item.description}</div>
                              </td>
                              <td style={{ padding: '0.6rem', border: '1px solid #ddd', textAlign: 'center' }}>{item.brand || '-'}</td>
                              <td style={{ padding: '0.6rem', border: '1px solid #ddd', textAlign: 'center' }}>{item.unit || 'ชิ้น'}</td>
                              <td style={{ padding: '0.6rem', border: '1px solid #ddd', textAlign: 'right' }}>{parseCSVNumber(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '0.6rem', border: '1px solid #ddd', textAlign: 'center' }}>{item.qty}</td>
                              <td style={{ padding: '0.6rem', border: '1px solid #ddd', textAlign: 'right', fontWeight: 600 }}>{(parseCSVNumber(item.price) * parseCSVNumber(item.qty)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          {/* Filler rows */}
                          {[...Array(Math.max(0, 8 - safeJSONParse(getValueResilient(previewQt, 'items')).length))].map((_, i) => (
                            <tr key={`empty-${i}`} style={{ height: '2.5rem' }}>
                              <td style={{ border: '1px solid #eee' }}></td>
                              <td style={{ border: '1px solid #eee' }}></td>
                              <td style={{ border: '1px solid #eee' }}></td>
                              <td style={{ border: '1px solid #eee' }}></td>
                              <td style={{ border: '1px solid #eee' }}></td>
                              <td style={{ border: '1px solid #eee' }}></td>
                              <td style={{ border: '1px solid #eee' }}></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Summary Section */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', border: '1px solid #1e3a8a', borderTop: 'none' }}>
                        <div style={{ padding: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', background: '#f8fafc' }}>
                          <strong>จำนวนเงินรวมทั้งสิ้น (ตัวอักษร):</strong> <span style={{ marginLeft: '1rem', fontWeight: 800, color: '#1e3a8a' }}>({thaiBahtText(parseCSVNumber(getValueResilient(previewQt, 'grandtotal')) || parseCSVNumber(getValueResilient(previewQt, 'total')))})</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <tr>
                            <td style={{ padding: '0.4rem 0.75rem', borderLeft: '1px solid #1e3a8a', borderBottom: '1px dotted #cbd5e1' }}>ยอดรวม (Gross Total)</td>
                            <td style={{ padding: '0.4rem 0.75rem', borderBottom: '1px dotted #cbd5e1', textAlign: 'right', fontWeight: 600 }}>{parseCSVNumber(getValueResilient(previewQt, 'subtotal')).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '0.4rem 0.75rem', borderLeft: '1px solid #1e3a8a', borderBottom: '1px dotted #cbd5e1' }}>ส่วนลด (Discount)</td>
                            <td style={{ padding: '0.4rem 0.75rem', borderBottom: '1px dotted #cbd5e1', textAlign: 'right', color: '#dc2626' }}>{parseCSVNumber(getValueResilient(previewQt, 'discount')).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '0.4rem 0.75rem', borderLeft: '1px solid #1e3a8a', borderBottom: '1px dotted #cbd5e1' }}>ยอดก่อนภาษี (Sub Total)</td>
                            <td style={{ padding: '0.4rem 0.75rem', borderBottom: '1px dotted #cbd5e1', textAlign: 'right' }}>{(parseCSVNumber(getValueResilient(previewQt, 'grandtotal') || getValueResilient(previewQt, 'total')) / 1.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '0.4rem 0.75rem', borderLeft: '1px solid #1e3a8a', borderBottom: '1px solid #1e3a8a' }}>ภาษีมูลค่าเพิ่ม (VAT 7%)</td>
                            <td style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid #1e3a8a', textAlign: 'right' }}>{((parseCSVNumber(getValueResilient(previewQt, 'grandtotal') || getValueResilient(previewQt, 'total'))) * 0.07 / 1.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                          <tr style={{ background: '#1e3a8a', color: 'white' }}>
                            <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, fontSize: '0.95rem' }}>ยอดรวมสุทธิ (Grand Total)</td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 900, fontSize: '1.1rem' }}>{(parseCSVNumber(getValueResilient(previewQt, 'grandtotal') || getValueResilient(previewQt, 'total'))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </table>
                      </div>

                      {/* Footer: Terms & Payment */}
                      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.6', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <div style={{ borderBottom: '1px solid #1e3a8a', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.5rem', paddingBottom: '0.2rem' }}>เงื่อนไขการชำระเงินและการรับประกัน (Terms & Conditions)</div>
                          1. <strong>กำหนดส่งของ:</strong> ภายใน 30-45 วัน นับจากวันที่ได้รับเงินมัดจำ<br />
                          2. <strong>เงื่อนไขการชำระเงิน:</strong> ชำระเป็น 2 งวด ดังนี้<br />
                          &nbsp;&nbsp;&nbsp;• <strong>งวดที่ 1 (มัดจำ):</strong> 50% ของยอดเงินรวม เมื่อยืนยันสั่งซื้อสินค้า<br />
                          &nbsp;&nbsp;&nbsp;• <strong>งวดที่ 2 (จบงาน):</strong> 50% ที่เหลือ เมื่อติตตั้งและส่งมอบงานเรียบร้อย<br />
                          3. <strong>รายละเอียดการโอนเงิน:</strong><br />
                          &nbsp;&nbsp;&nbsp;• ชื่อบัญชี: <strong>บจก. อัลติโม คอนโทรล</strong><br />
                          &nbsp;&nbsp;&nbsp;• ธนาคาร: <strong>กรุงศรีอยุธยา</strong> สาขาเซ็นทรัลพลาซา แจ้งวัฒนะ<br />
                          &nbsp;&nbsp;&nbsp;• เลขที่บัญชี: <strong style={{ color: '#1e3a8a', fontSize: '0.9rem' }}>653-1-10515-5</strong> (ออมทรัพย์)<br />
                          4. <strong>การรับประกันสินค้า:</strong><br />
                          &nbsp;&nbsp;&nbsp;• งานติดตั้งและบริการ 2 ปี | แผงโซลาร์เซลล์ 15-25 ปี | อินเวอร์เตอร์ 12-25 ปี<br />
                          5. <strong>อายุใบเสนอราคา:</strong> 30 วัน นับจากวันที่ระบุในเอกสาร
                        </div>

                        {/* Signatures */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f8fafc' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>ผู้เสนอราคา / Sales Executive</div>
                            <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {/* Space for signature */}
                            </div>
                            <div style={{ borderBottom: '1px dotted #94a3b8', margin: '0.5rem 0.5rem 0.25rem' }}></div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>( {currentUser?.Name || '........................................'} )</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>วันที่: ...... / ...... / ......</div>
                          </div>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f8fafc' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>ผู้อนุมัติ / Authorized Person</div>
                            <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {/* Space for signature */}
                            </div>
                            <div style={{ borderBottom: '1px dotted #94a3b8', margin: '0.5rem 0.5rem 0.25rem' }}></div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>( ........................................ )</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>ตำแหน่ง: General Manager</div>
                          </div>
                        </div>
                      </div>

                      {/* PDF Footer Tip */}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        }

        {
          currentView === 'sales_order' && (
            <div className="quotation-view-container">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <button
                  onClick={() => setSoSubView('create')}
                  style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', border: 'none', background: soSubView === 'create' ? THEME.primary : 'transparent', color: soSubView === 'create' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer' }}
                >
                  ➕ สร้างใบเบิกอุปกรณ์ใหม่
                </button>
                <button
                  onClick={() => setSoSubView('history')}
                  style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', border: 'none', background: soSubView === 'history' ? THEME.primary : 'transparent', color: soSubView === 'history' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer' }}
                >
                  📜 ประวัติการเบิก/จองสินค้า
                </button>
              </div>

              {soSubView === 'create' ? (
                <div className="quotation-container">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                    <div className="card" style={{ padding: '2rem' }}>
                      <h2 style={{ marginBottom: '1.5rem' }}>รายการเบิก/จองอุปกรณ์สำหรับงานติดตั้ง</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>เลือกลูกค้า</label>
                          <select
                            className="filter-select"
                            style={{ width: '100%', padding: '0.75rem' }}
                            value={selectedSoCustomer?.['Customer ID'] || ''}
                            onChange={(e) => {
                              const selected = customers.find(c => c['Customer ID'] === e.target.value);
                              setSelectedSoCustomer(selected);
                            }}
                          >
                            <option value="">-- เลือกรายชื่อลูกค้า --</option>
                            {customers.map(c => (
                              <option key={c['Customer ID']} value={c['Customer ID']}>
                                {c['Customer Name']} | {c['Company']}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>ชื่อโครงการ / Project</label>
                          <input
                            type="text"
                            className="search-input"
                            style={{ width: '100%', padding: '0.75rem' }}
                            placeholder="ระบุชื่อโครงการ"
                            value={soProjectName}
                            onChange={(e) => setSoProjectName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>อ้างอิงใบเสนอราคา (QT Ref)</label>
                          <input
                            type="text"
                            className="search-input"
                            style={{ width: '100%', padding: '0.75rem' }}
                            placeholder="ระบุเลขที่ใบเสนอราคา (Manual)"
                            value={soQtRef}
                            onChange={(e) => setSoQtRef(e.target.value)}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>แนบลิงก์ใบเสนอราคา (External URL)</label>
                          <input
                            type="url"
                            className="search-input"
                            style={{ width: '100%', padding: '0.75rem' }}
                            placeholder="https://drive.google.com/..."
                            value={soQtLink || ''} // Assuming state needs to be added, logic below
                            onChange={(e) => setSoQtLink(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>รายการสินค้าที่จอง</h3>
                      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>
                            <th style={{ padding: '0.5rem' }}>สินค้า</th>
                            <th style={{ padding: '0.5rem' }}>จำนวน</th>
                            <th style={{ padding: '0.5rem' }}>ราคาประเมิน</th>
                            <th style={{ padding: '0.5rem' }}>รวม</th>
                            <th style={{ padding: '0.5rem' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {soItems.map((item) => (
                            <tr key={item.id} style={{ background: '#fff' }}>
                              <td style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', borderRadius: '8px 0 0 8px' }}>
                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.productId}</div>
                              </td>
                              <td style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                <input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) => updateSoItem(item.id, 'qty', Number(e.target.value))}
                                  style={{ width: '60px', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                />
                              </td>
                              <td style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => updateSoItem(item.id, 'price', Number(e.target.value))}
                                  style={{ width: '100px', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                />
                              </td>
                              <td style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>
                                ฿{(item.price * item.qty).toLocaleString()}
                              </td>
                              <td style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderRadius: '0 8px 8px 0' }}>
                                <button onClick={() => removeSoItem(item.id)} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {soItems.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #e2e8f0', borderRadius: '12px', color: '#94a3b8' }}>
                          ค้นหาสินค้าจากรายการด้านขวาเพื่อเพิ่มลงการจอง
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📦 ค้นหาสินค้าเพื่อจอง</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        <select
                          className="filter-select"
                          style={{ fontSize: '0.75rem', padding: '0.4rem' }}
                          value={soFilterCategory}
                          onChange={(e) => setSoFilterCategory(e.target.value)}
                        >
                          <option value="All">ทุกหมวดหมู่</option>
                          {[...new Set(products.map(p => p.Category))].filter(Boolean).sort().map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <select
                          className="filter-select"
                          style={{ fontSize: '0.75rem', padding: '0.4rem' }}
                          value={soFilterBrand}
                          onChange={(e) => setSoFilterBrand(e.target.value)}
                        >
                          <option value="All">ทุกแบรนด์</option>
                          {[...new Set(products.map(p => p.Brand))].filter(Boolean).sort().map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {products
                          .filter(p => (soFilterCategory === 'All' || p.Category === soFilterCategory) && (soFilterBrand === 'All' || p.Brand === soFilterBrand))
                          .map(p => (
                            <div
                              key={p['Product ID']}
                              className="nav-item"
                              onClick={() => addProductToSo(p)}
                              style={{ border: '1px solid #f1f5f9', background: 'white', color: THEME.primary, cursor: 'pointer', padding: '0.5rem', borderRadius: '6px' }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.Model}</div>
                              <div style={{ fontSize: '0.75rem', color: THEME.secondary }}>คงเหลือ: {p.CalculatedBalance} | รหัส: {p['Product ID']}</div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', background: THEME.primary, color: 'white' }}>
                      <h3 style={{ marginBottom: '1.5rem' }}>ยืนยันรายการจอง</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                        <span>ยอดประเมิน:</span>
                        <span style={{ color: THEME.secondary }}>฿{soSubtotal.toLocaleString()}</span>
                      </div>
                      <button
                        style={{ width: '100%', padding: '1rem', background: 'white', color: THEME.primary, border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        disabled={formLoading}
                        onClick={async () => {
                          if (!selectedSoCustomer) return alert('กรุณาเลือกลูกค้า');
                          if (soItems.length === 0) return alert('กรุณาเพิ่มสินค้า');

                          const soId = 'REQ-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                          const payload = {
                            type: 'add_sales_order',
                            values: [
                              soId,
                              new Date().toISOString().split('T')[0],
                              selectedSoCustomer['Customer ID'],
                              selectedSoCustomer['Customer Name'],
                              soProjectName,
                              JSON.stringify(soItems),
                              soItems.reduce((sum, item) => sum + parseFloat(item.qty || 0), 0),
                              soSubtotal,
                              'จองสินค้า',
                              soQtRef,
                              soQtLink
                            ]
                          };

                          setFormLoading(true);
                          try {
                            await fetch(GAS_API_URL, {
                              method: 'POST',
                              mode: 'no-cors',
                              body: JSON.stringify(payload)
                            });
                            alert('บันทึกใบเบิกและจองสต๊อกสำเร็จ!');
                            setSoItems([]);
                            setSoProjectName('');
                            setSoQtRef('');
                            setSoQtLink('');
                            setSelectedSoCustomer(null);
                            setSoSubView('history');
                            addActivityLog('Requisition', `สร้างใบเบิก ${soId} สำหรับโครงการ: ${soProjectName} (Ref: ${soQtRef || '-'})`);
                            fetchAllSheets();
                          } catch (err) {
                            alert('เกิดข้อผิดพลาด: ' + err.message);
                            console.error(err);
                          } finally {
                            setFormLoading(false);
                          }
                        }}
                      >
                        {formLoading ? 'กำลังบันทึก...' : '💾 บันทึกใบเบิกและจองของ'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="quotation-history">
                  <div className="card" style={{ padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>เลขที่ใบเบิก</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>วันที่</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>ลูกค้า / โครงการ</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>อ้างอิง QT</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>ยอดรวม</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesOrders.map((so, idx) => {
                          const customerId = getValueResilient(so, 'customerid');
                          const customer = customers.find(c => String(c['Customer ID'] || '').trim() === String(customerId || '').trim());
                          const status = getValueResilient(so, 'status');
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '1rem', fontWeight: 600 }}>{getValueResilient(so, 'soid')}</td>
                              <td style={{ padding: '1rem' }}>{parseCSVDate(getValueResilient(so, 'date'))}</td>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: 600 }}>{customer ? (customer['Customer Name'] || customer['Name']) : customerId}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Project: {getValueResilient(so, 'projectname') || '-'}</div>
                              </td>
                              <td style={{ padding: '1rem', color: THEME.secondary, fontWeight: 600 }}>{getValueResilient(so, 'qtref') || '-'}</td>
                              <td style={{ padding: '1rem', fontWeight: 700 }}>฿{parseCSVNumber(getValueResilient(so, 'grandtotal')).toLocaleString()}</td>
                              <td style={{ padding: '1rem' }}>
                                <span
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    backgroundColor: status === 'ยกเลิก' ? '#fee2e2' : (status?.includes('จอง') ? '#fef3c7' : '#dcfce7'),
                                    color: status === 'ยกเลิก' ? '#dc2626' : (status?.includes('จอง') ? '#d97706' : '#166534'),
                                    display: 'inline-block'
                                  }}
                                >
                                  {status || 'Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button
                                  className="badge badge-blue"
                                  style={{ border: 'none', cursor: 'pointer', background: '#3b82f6' }}
                                  onClick={() => setSelectedSoForView(so)}
                                >
                                  🔍 ดูรายการ
                                </button>
                                <button
                                  className="badge badge-green"
                                  style={{ border: 'none', cursor: 'pointer' }}
                                  onClick={() => {
                                    const items = JSON.parse(so.Items || '[]');
                                    setRequisitionTransfer({
                                      id: so['SO ID'],
                                      project: so['Project Name'],
                                      items: items
                                    });
                                    setManageMode('out');
                                    setFormData(prev => ({
                                      ...prev,
                                      project: so['Project Name'],
                                      refNumber: so['SO ID'],
                                      projectType: 'EPC'
                                    }));
                                    setCurrentView('manage_stock');
                                  }}
                                >
                                  📤 เบิกสินค้าจริง
                                </button>
                                <button
                                  className="badge badge-blue"
                                  style={{ border: 'none', cursor: 'pointer' }}
                                  onClick={async () => {
                                    if (!window.confirm('คุณต้องการยกเลิกการเบิก/จองนี้ใช่หรือไม่? คืนสต๊อกพร้อมขาย?')) return;
                                    const payload = {
                                      type: 'edit_sales_order_status',
                                      idColumn: 'SO ID',
                                      idValue: so['SO ID'],
                                      updates: { 'Status': 'ยกเลิก' }
                                    };
                                    try {
                                      await fetch(GAS_API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                                      alert('ยกเลิกรายการแล้ว');
                                      fetchAllSheets();
                                    } catch (e) { alert('ผิดพลาด'); }
                                  }}
                                >
                                  ✕ ยกเลิก
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {salesOrders.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>ยังไม่มีรายการเบิกหรือจองสินค้า</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        }
        {
          selectedSoForView && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '1rem'
            }}>
              <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
                  <div>
                    <h2 style={{ margin: 0, color: THEME.primary, fontSize: '1.5rem' }}>รายการสินค้าในใบเบิก: {getValueResilient(selectedSoForView, 'soid')}</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>วันที่: {parseCSVDate(getValueResilient(selectedSoForView, 'date'))}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSoForView(null)}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>ลูกค้า / Customer</label>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{customers.find(c => c['Customer ID'] === getValueResilient(selectedSoForView, 'customerid'))?.['Customer Name'] || getValueResilient(selectedSoForView, 'customerid')}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>โครงการ / อ้างอิง QT</label>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{getValueResilient(selectedSoForView, 'projectname') || '-'} {getValueResilient(selectedSoForView, 'qtref') ? `(Ref: ${getValueResilient(selectedSoForView, 'qtref')})` : ''}</div>
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', background: '#f8fafc', color: '#64748b', fontSize: '0.85rem' }}>
                        <th style={{ padding: '1rem' }}>รายการสินค้า</th>
                        <th style={{ padding: '1rem', textAlign: 'center' }}>จำนวน</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>ราคา/หน่วย</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeJSONParse(getValueResilient(selectedSoForView, 'items')).map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 600, color: THEME.primary }}>{it.name || it.Model || it.ProductName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {it.brand && <span style={{ marginRight: '0.5rem' }}>แบรนด์: {it.brand}</span>}
                              <span>รหัส: {it.productId || it.ID}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>{it.qty || it.Quantity || 0} {it.unit || 'ชิ้น'}</td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>฿{(it.price || 0).toLocaleString()}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: THEME.secondary }}>฿{((it.price || 0) * (it.qty || it.Quantity || 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>ยอดรวมประเมินทั้งสิ้น</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: THEME.primary }}>฿{parseCSVNumber(getValueResilient(selectedSoForView, 'grandtotal')).toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => setSelectedSoForView(null)}
                    style={{ padding: '0.75rem 3rem', background: THEME.primary, color: 'white', border: 'none', borderRadius: '30px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  >
                    ปิดหน้าต่างนี้
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </main >
    </div >
  );
};

export default App;
