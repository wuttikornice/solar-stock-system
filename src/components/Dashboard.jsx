import React from 'react';
import { THEME, PRODUCT_OWNERS } from '../utils/constants';

const Dashboard = ({
  reportData,
  categoriesList,
  brandsList,
  filteredItems,
  stockData,
  stockStatus,
  lowStockItems,
  showLowStockAlerts,
  setShowLowStockAlerts,
  filterCategory,
  setFilterCategory,
  filterBrand,
  setFilterBrand,
  filterCompany,
  setFilterCompany,
  sortConfig,
  setSortConfig,
  expandedProduct,
  setExpandedProduct,
  setCurrentView,
  setManageMode,
  setServiceSubView,
  handleExportCSV,
  getStockStatus,
  getDirectImageUrl,
}) => {
  return (
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
            {PRODUCT_OWNERS.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
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
                      <span className={`badge ${
                        item.Company === 'Simat' ? 'badge-blue' :
                        item.Company === 'NPE' ? 'badge-orange' :
                        item.Company === 'UC' ? 'badge-green' :
                        'badge-blue'
                      }`} style={{ fontSize: '0.7rem' }}>
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
  );
};

export default Dashboard;
