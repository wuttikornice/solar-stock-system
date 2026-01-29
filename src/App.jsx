import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

const BASE_URL = 'https://docs.google.com/spreadsheets/d/1k11Jp6OXGdzn8Q8Rzt-cA7WjCwGSaIAoCuwuZe8Xfac/export?format=csv';
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbw_v2nU8UZeHw2FSES66RjQ18xXW3jy6lnF_4gix0LIG4t0AVWd6Z-AG2q56rWRlKLZAg/exec';

const GIDS = {
  PRODUCTS: '0',
  STOCK_IN: '314735558',
  STOCK_OUT: '1204118810',
  USERS: '1357094185' // Updated to the correct GID from the user's sheet
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
    company: 'Simat',
    image: ''
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [filterCompany, setFilterCompany] = useState('All');
  const [showLowStockAlerts, setShowLowStockAlerts] = useState(false);

  useEffect(() => {
    const fetchAllSheets = async () => {
      try {
        const fetchSheet = async (gid) => {
          const response = await fetch(`${BASE_URL}&gid=${gid}`);
          const csvText = await response.text();
          return new Promise((resolve) => {
            Papa.parse(csvText, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => resolve(results.data)
            });
          });
        };

        const [prodData, inData, outData, userData] = await Promise.all([
          fetchSheet(GIDS.PRODUCTS),
          fetchSheet(GIDS.STOCK_IN),
          fetchSheet(GIDS.STOCK_OUT),
          fetchSheet(GIDS.USERS).catch(() => []) // Fallback if sheet doesn't exist yet
        ]);

        setProducts(prodData);
        setStockStatus({ in: inData, out: outData });
        setUsers(userData);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchAllSheets();
  }, []);

  const addActivityLog = async (action, details = '') => {
    try {
      await fetch(GAS_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log',
          timestamp: new Date().toISOString(),
          username: currentUser?.Username || 'guest',
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
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));
      setFormData(prev => ({ ...prev, person: user.Name }));
      addActivityLog('Login', `เข้าสู่ระบบสำเร็จ (${user.Role})`);
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

  const stockData = useMemo(() => {
    return products.map(product => {
      const pid = product['Product ID'] || product['ID'];
      const agg = reconciledStock[pid] || { in: 0, out: 0, serials: {} };
      const balance = agg.in - agg.out;

      return {
        ...product,
        CalculatedBalance: balance,
        totalIn: agg.in,
        totalOut: agg.out,
        serials: Object.values(agg.serials)
      };
    });
  }, [products, reconciledStock]);

  const reportData = useMemo(() => {
    const totalUnits = stockData.reduce((sum, p) => sum + p.CalculatedBalance, 0);
    const lowStockItems = stockData.filter(p => p.CalculatedBalance <= parseFloat(p['Min Stock'] || 0)).length;

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
      lowStockItems,
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
      const ref = item['Ref No.'] || item['Ref No'] || item['Reference No'] || '-';
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
          qty: parseInt(item['Quantity'] || item['quantity'] || 1)
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
          <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentView('dashboard'); setExpandedProduct(null); }}>🏠 ภาพรวมคลังสินค้า</div>
          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>การดำเนินการ</div>
          <div className={`nav-item ${currentView === 'serial_tracking' ? 'active' : ''}`} onClick={() => setCurrentView('serial_tracking')}>🔍 ติดตามซีเรียล</div>
          <div className={`nav-item ${currentView === 'reports' ? 'active' : ''}`} onClick={() => setCurrentView('reports')}>📊 รายงานสรุป</div>
          <div className={`nav-item ${currentView === 'product_management' ? 'active' : ''}`} onClick={() => setCurrentView('product_management')}>📦 ข้อมูลสินค้า</div>
          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>แอดมิน</div>
          <div className={`nav-item ${currentView === 'manage_stock' ? 'active' : ''}`} onClick={() => setCurrentView('manage_stock')}>⚙️ ทำรายการสต๊อก</div>
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
            </h1>
            <p style={{ color: '#666' }}>
              {currentView === 'dashboard' && 'คลิกชื่อสินค้าเพื่อดูรายละเอียดหมายเลขซีเรียล'}
              {currentView === 'serial_tracking' && 'ติดตามสินค้าตั้งแต่เริ่มเข้าคลังจนถึงการติดตั้งที่หน้างาน'}
              {currentView === 'reports' && 'สรุปการเคลื่อนย้ายคลังสินค้าและสัดส่วนตามประเภทโครงการ'}
              {currentView === 'manage_stock' && 'บันทึกการเข้า/ออกของสินค้าทั้งที่มีและไม่มีซีเรียล'}
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

            {reportData.lowStockItems > 0 && (
              <div className="alert-banner">
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setShowLowStockAlerts(!showLowStockAlerts)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <h3 style={{ margin: 0, color: '#991b1b' }}>สินค้าที่ต้องสั่งซื้อเพิ่ม ({reportData.lowStockItems} รายการ)</h3>
                  </div>
                  <button className="badge" style={{ border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer' }}>
                    {showLowStockAlerts ? '🔼 ซ่อนรายละเอียด' : '🔽 ดูรายการทั้งหมด'}
                  </button>
                </div>
                {showLowStockAlerts && (
                  <div className="alert-grid" style={{ marginTop: '1.5rem' }}>
                    {stockData.filter(p => p.CalculatedBalance <= parseFloat(p['Min Stock'] || 0)).map((p, i) => (
                      <div key={i} className="alert-card">
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.Model}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>เหลือ {p.CalculatedBalance} {p.Unit || 'ชิ้น'} (Min: {p['Min Stock']})</div>
                      </div>
                    ))}
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
                        คงเหลือ {sortConfig.key === 'CalculatedBalance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
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
                          <td style={{ fontWeight: 800 }}>{item.CalculatedBalance}</td>
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
                        const payload = { type: 'add_product', ...productFormData };
                        await fetch(GAS_API_URL, {
                          method: 'POST',
                          mode: 'no-cors',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });
                        setFormStatus({ type: 'success', message: 'Product added successfully! Refreshing data...' });
                        setTimeout(() => window.location.reload(), 2000);
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
                              <span>รับจาก: <strong>{h.Entity || '-'}</strong> (DO: {h['Ref No.'] || h['Reference No'] || '-'})</span>
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
                        setFormStatus({ type: 'error', message: 'Please fill in required fields (Product, Serial/Qty, Ref No)' });
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

                          // Map payload with original keys + header-matching keys for maximum compatibility
                          const payload = {
                            type: manageMode,
                            // Original keys (likely what the GAS script expects)
                            date: formData.date,
                            productId: formData.productId,
                            serial: sn,
                            qty: noSerial ? formData.qty : 1,
                            person: formData.person,
                            refNumber: formData.refNumber,
                            remark: formData.remark,
                            entity: formData.entity,
                            projectType: formData.projectType,
                            project: formData.project,
                            model: modelName,

                            // Header-matching keys (for potential dynamic scripts)
                            'Date': formData.date.split('-').reverse().join('/'),
                            'Product ID': formData.productId,
                            'Model': modelName,
                            'Serial Number': sn,
                            'Quantity': noSerial ? formData.qty : 1,
                            'Person': formData.person,
                            'Ref No.': formData.refNumber,
                            'Remark': formData.remark,
                            'Entity': formData.entity,
                            'Project Type': formData.projectType,
                            'Project Name ': formData.project
                          };

                          await fetch(GAS_API_URL, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          });
                          if (serialsToProcess.length > 1) await new Promise(r => setTimeout(r, 200));
                        }
                        setFormStatus({ type: 'success', message: 'Recorded successfully!' });
                        addActivityLog('Stock Transaction', `${manageMode === 'in' ? 'รับเข้า' : 'เบิกออก'}: ${formData.refNumber} (${serialsToProcess.length} รายการ)`);
                        setTimeout(() => window.location.reload(), 2000);
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
      </main >
    </div >
  );
};

export default App;