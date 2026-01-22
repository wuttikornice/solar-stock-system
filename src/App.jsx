import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie
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

  // New State for Serial Tracking Tab
  const [serialViewMode, setSerialViewMode] = useState('all'); // 'all', 'in', 'out'

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
    const dailyTrend = Object.values(dailyMap).sort((a, b) => {
      const da = a.date.split('/').reverse().join('-');
      const db = b.date.split('/').reverse().join('-');
      return new Date(da) - new Date(db);
    }).slice(-15);

    return { totalUnits, lowStockItems, categories, dailyTrend, allMovement: stockStatus.in.length + stockStatus.out.length };
  }, [stockData, stockStatus]);

  const getDirectImageUrl = (url) => {
    if (!url) return null;
    // Handle Google Drive Links
    if (url.includes('drive.google.com')) {
      const idMatch = url.match(/\/d\/(.*?)\/|\?id=(.*?)$|id=(.*?)(&|$)/);
      if (idMatch) {
        const id = idMatch[1] || idMatch[2] || idMatch[3];
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
        (s.productId && s.productId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.model && s.model.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return [];
  }, [searchTerm, stockData, reconciledStock, currentView]);

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
    if (cur === 0) return { label: 'Out of Stock', class: 'stock-empty' };
    if (cur <= m) return { label: 'Low Stock', class: 'stock-low' };
    return { label: 'In Stock', class: 'stock-healthy' };
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f4f7f6' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: THEME.primary, marginBottom: '1rem' }}>Synchronizing Warehouse...</h2>
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
                            <img
                              src={displayImage}
                              alt={item.Model}
                              className="product-thumb"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.insertAdjacentHTML('afterend', '<div class="product-thumb-placeholder">📦</div>');
                              }}
                            />
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
                        <td>
                          <div className={`stock-badge ${status.class}`}>
                            <div className="pulsate"></div>
                            {status.label}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="expanded-row">
                          <td colSpan="8">
                            <div className="serial-list">
                              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Serial Numbers List ({item.serials.length})</h4>
                              {item.serials.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.5rem' }}>
                                  {item.serials.map((s, sIdx) => (
                                    <div key={sIdx} className="serial-item">
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
                              ) : (
                                <p style={{ fontSize: '0.75rem', color: '#999' }}>No serial data available</p>
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
        )}

        {currentView === 'serial_tracking' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                className={`badge ${serialViewMode === 'all' ? 'badge-blue' : ''}`}
                style={{ cursor: 'pointer', border: 'none', padding: '0.5rem 1rem' }}
                onClick={() => setSerialViewMode('all')}
              >All</button>
              <button
                className={`badge ${serialViewMode === 'in' ? 'badge-green' : ''}`}
                style={{ cursor: 'pointer', border: 'none', padding: '0.5rem 1rem' }}
                onClick={() => setSerialViewMode('in')}
              >In Stock</button>
              <button
                className={`badge ${serialViewMode === 'out' ? 'badge-orange' : ''}`}
                style={{ cursor: 'pointer', border: 'none', padding: '0.5rem 1rem' }}
                onClick={() => setSerialViewMode('out')}
              >Deployed</button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Serial Number</th><th>Product ID / Model</th><th>Current Status</th><th>Assignment / Location</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {displayedSerials.map((s, idx) => (
                    <tr key={idx} className="tr">
                      <td><span className="serial-tag">{s.serial}</span></td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{s.productId}</div>
                        <strong>{s.model}</strong>
                      </td>
                      <td>
                        <span className={`status-tag ${s.status === 'In Stock' ? 'status-in-stock' : 'status-deployed'}`}>
                          {s.status === 'In Stock' ? 'In Stock' : 'Deployed'}
                        </span>
                      </td>
                      <td>{s.projectName || 'Main Warehouse'}</td>
                      <td>{s.status === 'In Stock' ? s.inDate : s.outDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'reports' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Units</h3>
                <div className="value" style={{ color: THEME.primary }}>{reportData.totalUnits}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Units in Warehouse</div>
              </div>
              <div className="stat-card">
                <h3>Low Stock Items</h3>
                <div className="value" style={{ color: THEME.secondary }}>{reportData.lowStockItems}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Items needing restock</div>
              </div>
              <div className="stat-card">
                <h3>Total Movements</h3>
                <div className="value" style={{ color: THEME.success }}>{reportData.allMovement}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Total In/Out logs</div>
              </div>
            </div>

            <div className="report-grid">
              <div className="chart-card">
                <h3 style={{ marginBottom: '1.5rem' }}>Operational Trend (Last 15 Days)</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="in" name="Stock In" stroke={THEME.success} fill={THEME.success} fillOpacity={0.1} />
                      <Area type="monotone" dataKey="out" name="Stock Out" stroke={THEME.danger} fill={THEME.danger} fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <h3 style={{ marginBottom: '1.5rem' }}>Units by Category</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.categories} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '0.7rem' }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Units">
                        {reportData.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={THEME.chartColors[index % THEME.chartColors.length]} />
                        ))}
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