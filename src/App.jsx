import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';

const BASE_URL = 'https://docs.google.com/spreadsheets/d/1k11Jp6OXGdzn8Q8Rzt-cA7WjCwGSaIAoCuwuZe8Xfac/export?format=csv';

const GIDS = {
  PRODUCTS: '0',
  STOCK_IN: '314735558',
  STOCK_OUT: '1204118810'
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
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [expandedProduct, setExpandedProduct] = useState(null);

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

        const [prodData, inData, outData] = await Promise.all([
          fetchSheet(GIDS.PRODUCTS),
          fetchSheet(GIDS.STOCK_IN),
          fetchSheet(GIDS.STOCK_OUT)
        ]);

        setProducts(prodData);
        setStockStatus({ in: inData, out: outData });
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchAllSheets();
  }, []);

  // Smarter Logic: Reconcile by Serial Number
  const reconciledStock = useMemo(() => {
    const serialMap = {}; // serial -> status data

    // 1. Process all Inwards
    stockStatus.in.forEach(item => {
      const sn = item['Serial Number'];
      if (!sn) return;
      serialMap[sn] = {
        serial: sn,
        productId: item['Product ID'],
        model: item.Model,
        status: 'In Stock',
        projectName: null,
        inDate: item.Date,
        outDate: null
      };
    });

    // 2. Process all Outwards (Virtual Status Override)
    stockStatus.out.forEach(item => {
      const sn = item['Serial Number'];
      if (!sn || !serialMap[sn]) return;
      serialMap[sn].status = 'Deployed';
      serialMap[sn].projectName = item['Project Name'] || 'Unknown Project';
      serialMap[sn].outDate = item.Date;
    });

    return serialMap;
  }, [stockStatus]);

  const stockData = useMemo(() => {
    return products.map(product => {
      const pid = product['Product ID'] || product['ID'];
      const productSerials = Object.values(reconciledStock).filter(s => s.productId === pid);

      const totalIn = productSerials.length;
      const totalOut = productSerials.filter(s => s.status === 'Deployed').length;
      const balance = totalIn - totalOut;

      return {
        ...product,
        CalculatedBalance: balance,
        totalIn,
        totalOut,
        serials: productSerials
      };
    });
  }, [products, reconciledStock]);

  const reportData = useMemo(() => {
    const totalUnits = stockData.reduce((sum, p) => sum + p.CalculatedBalance, 0);
    const lowStockItems = stockData.filter(p => p.CalculatedBalance <= parseFloat(p['Min Stock'] || 0)).length;

    const catMap = {};
    stockData.forEach(p => {
      const cat = p.Category || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + p.CalculatedBalance;
    });

    const categories = Object.keys(catMap).map(name => ({ name, value: catMap[name] }))
      .sort((a, b) => b.value - a.value);

    // Daily Operational Trend
    const dailyMap = {};
    [...stockStatus.in.map(i => ({ ...i, t: 'IN' })), ...stockStatus.out.map(o => ({ ...o, t: 'OUT' }))].forEach(log => {
      const date = log.Date;
      if (!date) return;
      if (!dailyMap[date]) dailyMap[date] = { date, in: 0, out: 0 };
      if (log.t === 'IN') dailyMap[date].in++;
      else dailyMap[date].out++;
    });
    const dailyTrend = Object.values(dailyMap).sort((a, b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-'))).slice(-15);

    return { totalUnits, lowStockItems, categories, dailyTrend, allMovement: stockStatus.in.length + stockStatus.out.length };
  }, [stockData, stockStatus]);

  const getDirectImageUrl = (url) => {
    if (!url) return null;
    // Handle Google Drive Links
    if (url.includes('drive.google.com')) {
      const idMatch = url.match(/\/d\/(.*?)\/|\?id=(.*?)$/);
      if (idMatch) {
        const id = idMatch[1] || idMatch[2];
        return `https://drive.google.com/uc?export=view&id=${id}`;
      }
    }
    return url;
  };

  const filteredItems = useMemo(() => {
    if (currentView === 'dashboard') {
      return stockData.filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else if (currentView === 'serial_tracking') {
      return Object.values(reconciledStock).filter(s =>
        s.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.projectName && s.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.productId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return [];
  }, [searchTerm, stockData, reconciledStock, currentView]);

  const getStockStatus = (current, min) => {
    const cur = parseFloat(current || 0);
    const m = parseFloat(min || 0);
    if (cur === 0) return { label: 'Out of Stock', class: 'stock-empty' };
    if (cur <= m) return { label: 'Low Stock', class: 'stock-low' };
    return { label: 'In Stock', class: 'stock-healthy' };
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f4f7f6' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: THEME.primary, marginBottom: '1rem' }}>Sychronizing Warehouse...</h2>
        <p>Calculating Serial Number Reconciliation</p>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2><span style={{ color: THEME.secondary }}>☀️</span> CMI Solar</h2>
        <nav style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentView('dashboard'); setExpandedProduct(null); }}>Dashboard</div>
          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>Operations</div>
          <div className={`nav-item ${currentView === 'serial_tracking' ? 'active' : ''}`} onClick={() => setCurrentView('serial_tracking')}>🔍 Serial Tracking</div>
          <div className={`nav-item ${currentView === 'reports' ? 'active' : ''}`} onClick={() => setCurrentView('reports')}>📊 Reports</div>
        </nav>
        <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Reconciliation: Done</div>
      </aside>

      <main className="main-content">
        <header className="header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: THEME.primary }}>
              {currentView === 'dashboard' && 'Inventory Dashboard'}
              {currentView === 'serial_tracking' && 'Serial Number Reconciliation'}
              {currentView === 'reports' && 'Strategic Analysis'}
            </h1>
            <p style={{ color: '#666' }}>
              {currentView === 'dashboard' && 'Click product to view individual serial status'}
              {currentView === 'serial_tracking' && 'Track any item from entry to project site'}
              {currentView === 'reports' && 'Warehouse movement and category distribution'}
            </p>
          </div>
          <input type="text" placeholder="Search..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </header>

        {currentView === 'dashboard' && (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Image</th><th>ID</th><th>Category</th><th>Model</th><th>In</th><th>Out</th><th>Balance</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const status = getStockStatus(item.CalculatedBalance, item['Min Stock']);
                  const isExpanded = expandedProduct === item['Product ID'];
                  const displayImage = getDirectImageUrl(item.Image);
                  return (
                    <React.Fragment key={idx}>
                      <tr className="tr" onClick={() => setExpandedProduct(isExpanded ? null : item['Product ID'])}>
                        <td>
                          {displayImage ? (
                            <img src={displayImage} alt={item.Model} className="product-thumb" />
                          ) : (
                            <div className="product-thumb-placeholder">📦</div>
                          )}
                        </td>
                        <td><span className="badge badge-blue">{item['Product ID']}</span></td>
                        <td>{item.Category}</td>
                        <td><strong>{item.Model}</strong></td>
                        <td style={{ color: THEME.success }}>{item.totalIn}</td>
                        <td style={{ color: THEME.danger }}>{item.totalOut}</td>
                        <td style={{ fontWeight: 800 }}>{item.CalculatedBalance}</td>
                        <td><span className={`stock-badge ${status.class}`}><span className="pulsate"></span>{status.label}</span></td>
                      </tr>
                      {isExpanded && (
                        <tr className="expanded-row">
                          <td colSpan="7">
                            <div className="serial-list">
                              <h4 style={{ padding: '0 1rem', color: THEME.primary }}>Serial Status for {item.Model}</h4>
                              {item.serials.map((s, sidx) => (
                                <div key={sidx} className="serial-item">
                                  <span className="serial-tag">{s.serial}</span>
                                  <span className={`status-tag ${s.status === 'In Stock' ? 'status-in-stock' : 'status-deployed'}`}>
                                    {s.status}
                                  </span>
                                  <span style={{ fontSize: '0.85rem' }}>
                                    {s.status === 'Deployed' ? `📍 Project: ${s.projectName}` : `📥 Recvd on ${s.inDate}`}
                                  </span>
                                </div>
                              ))}
                              {item.serials.length === 0 && <p style={{ padding: '1rem' }}>No serial data found for this product.</p>}
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
        )}

        {currentView === 'serial_tracking' && (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Serial Number</th><th>Product ID / Model</th><th>Current Status</th><th>Assignment / Location</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filteredItems.map((s, idx) => (
                  <tr key={idx} className="tr">
                    <td><span className="serial-tag">{s.serial}</span></td>
                    <td><div style={{ fontSize: '0.75rem', color: '#666' }}>{s.productId}</div>{s.model}</td>
                    <td><span className={`status-tag ${s.status === 'In Stock' ? 'status-in-stock' : 'status-deployed'}`}>{s.status}</span></td>
                    <td><strong>{s.status === 'Deployed' ? s.projectName : 'Main Warehouse'}</strong></td>
                    <td>{s.status === 'Deployed' ? s.outDate : s.inDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentView === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section className="stats-grid">
              <div className="stat-card"><h3>Total Stock</h3><div className="value">{reportData.totalUnits}</div></div>
              <div className="stat-card"><h3>Transactions</h3><div className="value">{reportData.allMovement}</div></div>
              <div className="stat-card"><h3>Critical SKUs</h3><div className="value" style={{ color: THEME.danger }}>{reportData.lowStockItems}</div></div>
            </section>
            <div className="report-grid">
              <div className="chart-card">
                <h3>Movement Trend</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="in" name="In" stroke={THEME.success} fill={THEME.success} fillOpacity={0.2} />
                      <Area type="monotone" dataKey="out" name="Out" stroke={THEME.danger} fill={THEME.danger} fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="chart-card">
                <h3>Units by Category</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.categories} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Balance">
                        {reportData.categories.map((entry, index) => <Cell key={`cell-${index}`} fill={THEME.chartColors[index % THEME.chartColors.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
