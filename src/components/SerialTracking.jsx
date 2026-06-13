import React from 'react';
import { THEME } from '../utils/constants';

const SerialTracking = ({
  serialViewMode,
  setSerialViewMode,
  serialSearch,
  setSerialSearch,
  serialHistory,
  setSerialHistory,
  handleSerialSearch,
  groupedTransactions,
  expandedTransaction,
  setExpandedTransaction,
}) => {
  return (
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
  );
};

export default SerialTracking;
