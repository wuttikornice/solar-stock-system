import React from 'react';
import { THEME, INSTALLATION_TEAMS } from '../utils/constants';

const ServiceView = ({
  activeGIDs,
  serviceSubView,
  setServiceSubView,
  serviceTickets,
  claims,
  customers,
  products,
  stockStatus,
  serviceFormData,
  setServiceFormData,
  claimFormData,
  setClaimFormData,
  formLoading,
  setFormLoading,
  editingServiceStatus,
  setEditingServiceStatus,
  selectedBrokenItem,
  setSelectedBrokenItem,
  brokenSN,
  setBrokenSN,
  setPreviewQt,
  handleExportCSV,
  getValueResilient,
  initSalesDatabase,
  fetchAllSheets,
  gasPost,
}) => {
  return (
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
                    setServiceFormData({
                      ...serviceFormData,
                      customer: selectedId,
                      location: selectedCust ? (
                        getValueResilient(selectedCust, 'address') ||
                        selectedCust['สถานที่ติดตั้ง'] ||
                        Object.values(selectedCust).find(v => String(v).includes('เขต') || String(v).includes('แขวง') || String(v).includes('จ.')) ||
                        ''
                      ) : ''
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

              {/* ทีมติดตั้ง */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                  ทีมติดตั้ง <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%', padding: '0.75rem' }}
                  value={serviceFormData.technician}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, technician: e.target.value })}
                >
                  <option value="">-- เลือกทีมติดตั้ง --</option>
                  {INSTALLATION_TEAMS.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
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

              {/* ผลการแก้ไข */}
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
                    return alert('กรุณาระบุลูกค้า, ประเภทงาน และทีมติดตั้ง');
                  }

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
                    const selectedCust = customers.find(c => String(c['Customer ID']) === String(serviceFormData.customer));
                    const customerName = selectedCust ? selectedCust['Customer Name'] : serviceFormData.customer;
                    const payload = {
                      type: 'add_service',
                      values: [
                        ticketId,
                        serviceFormData.appointmentDate,
                        new Date().toLocaleDateString('th-TH'),
                        '',
                        '',
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
                    await gasPost(payload);
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
                <select className="filter-select" style={{ padding: '0.5rem 1rem' }}>
                  <option value="All">ทุกสถานะ</option>
                  <option value="Pending">⏳ รอดำเนินการ</option>
                  <option value="In Progress">🔧 กำลังดำเนินการ</option>
                  <option value="Completed">✅ เสร็จสิ้น</option>
                  <option value="Cancelled">❌ ยกเลิก</option>
                </select>
                <button onClick={() => handleExportCSV(serviceTickets, 'service_tickets')} className="btn-export">
                  📥 Export CSV
                </button>
              </div>
            </div>

            {serviceTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛠️</div>
                <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>ยังไม่มีงานเซอร์วิสในระบบ</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>เริ่มต้นโดยการสร้างงานเซอร์วิสใหม่จากฟอร์มด้านบน</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {serviceTickets.map((ticket, idx) => {
                  const status = getValueResilient(ticket, 'status') || 'Pending';
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
                      background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
                      padding: '1.5rem', position: 'relative', transition: 'all 0.3s ease',
                      display: 'flex', flexDirection: 'column', gap: '1rem',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.primary, marginBottom: '0.25rem' }}>
                            {ticket['Ticket ID'] || `TK-${idx + 1}`}
                          </div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{ticket['Customer Name'] || '-'}</h3>
                        </div>
                        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: config.bg, color: config.text, border: `1px solid ${config.border}` }}>
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
                          <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>วันที่เริ่มงาน</div>
                          <div style={{ fontWeight: 600, color: '#0284c7' }}>
                            {Object.entries(ticket).find(([k]) => k.toLowerCase().includes('start') || k.includes('เริ่ม') || k.includes('ติดตั้ง'))?.[1] || '-'}
                          </div>
                        </div>
                        <div style={{ color: '#64748b' }}>
                          <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>วันที่ปิดงาน</div>
                          <div style={{ fontWeight: 600, color: '#059669' }}>
                            {Object.entries(ticket).find(([k]) => k.toLowerCase().includes('finish') || k.toLowerCase().includes('closed') || k.includes('เสร็จ') || k.includes('ปิด'))?.[1] || '-'}
                          </div>
                        </div>
                        <div style={{ color: '#64748b' }}>
                          <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>ทีมติดตั้ง</div>
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
                        {(status === 'Pending' || status === 'รอดำเนินการ') && (
                          <button
                            onClick={() => {
                              setEditingServiceStatus({ ticket, nextStatus: 'In Progress', title: 'เริ่มดำเนินงานเซอร์วิส' });
                              setSelectedBrokenItem('');
                              setBrokenSN('');
                            }}
                            style={{ flex: 1, padding: '0.6rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                          >⏳ เริ่มงาน</button>
                        )}
                        {(status === 'In Progress' || status === 'กำลังดำเนินการ') && (
                          <button
                            onClick={() => {
                              setEditingServiceStatus({ ticket, nextStatus: 'Completed', title: 'เสร็จสิ้นงานเซอร์วิส' });
                              setSelectedBrokenItem('');
                              setBrokenSN('');
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

          {editingServiceStatus && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
            }}>
              <div className="card" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: THEME.primary }}>{editingServiceStatus.title}</h3>
                  <button onClick={() => setEditingServiceStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>ลูกค้า:</div>
                    <div style={{ fontWeight: 700 }}>{editingServiceStatus.ticket['Customer Name']}</div>
                  </div>
                  {editingServiceStatus.nextStatus === 'Completed' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', background: '#f1f5f9', borderRadius: '12px' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>🔧 ข้อมูลอุปกรณ์ที่เสีย/เปลี่ยน</div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>ชื่ออุปกรณ์</label>
                        <select
                          className="filter-select"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                          value={selectedBrokenItem}
                          onChange={e => setSelectedBrokenItem(e.target.value)}
                        >
                          <option value="">-- เลือกอุปกรณ์ --</option>
                          {(products || []).map((p, i) => {
                            const pName = p['Product Name'] || p['Model'] || p['Name'] || Object.values(p)[1] || 'Unknown Item';
                            return <option key={i} value={pName}>{pName}</option>;
                          })}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Serial Number</label>
                        <input
                          type="text"
                          className="search-input"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                          placeholder="S/N ตัวที่เสีย..."
                          value={brokenSN}
                          onChange={e => setBrokenSN(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    รายละเอียดความคืบหน้า / ผลการแก้ไข:
                  </label>
                  <textarea
                    id="service-resolution-input"
                    defaultValue={getValueResilient(editingServiceStatus.ticket, 'resolution') || ''}
                    style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', marginBottom: '1rem' }}
                    placeholder="พิมพ์รายละเอียดการแก้ไขที่นี่..."
                  />

                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    {editingServiceStatus.nextStatus === 'In Progress' ? '📅 วันที่เริ่มงาน/ติดตั้ง:' : '📅 วันที่เสร็จสิ้น/ปิดงาน:'}
                  </label>
                  <input
                    type="date"
                    id="service-date-input"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button
                      onClick={() => setEditingServiceStatus(null)}
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >ยกเลิก</button>
                    <button
                      disabled={formLoading}
                      onClick={async () => {
                        const baseRes = document.getElementById('service-resolution-input').value;
                        const selectedDate = document.getElementById('service-date-input').value;
                        const { ticket, nextStatus } = editingServiceStatus;

                        let finalRes = baseRes;
                        if (selectedBrokenItem) {
                          finalRes = `[เสีย: ${selectedBrokenItem}${brokenSN ? ` S/N: ${brokenSN}` : ''}] ${baseRes}`;
                        }

                        setFormLoading(true);
                        try {
                          const idCol = Object.keys(ticket).find(k => k.toLowerCase().replace(/\s/g, '') === 'ticketid' || k.toLowerCase() === 'id' || k === 'รหัสงาน') || 'Ticket ID';
                          const idVal = ticket[idCol] || ticket['Ticket ID'] || ticket['id'];
                          const resKey = Object.keys(ticket).find(k => k.toLowerCase().includes('resolution') || k.toLowerCase().includes('problem')) || 'Resolution/Problems';
                          const dateKey = nextStatus === 'In Progress'
                            ? (Object.keys(ticket).find(k => k.toLowerCase().includes('start date') || k.includes('เริ่มงาน')) || 'Start Date')
                            : (Object.keys(ticket).find(k => k.toLowerCase().includes('finish date') || k.includes('เสร็จสิ้น') || k.includes('ปิดงาน')) || 'Finish Date');

                          const payload = {
                            type: 'update_service_status',
                            idColumn: idCol,
                            idValue: idVal,
                            updates: {
                              'Status': nextStatus === 'In Progress' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น',
                              [resKey]: finalRes,
                              [dateKey]: selectedDate
                            }
                          };
                          await gasPost(payload);
                          alert('บันทึกข้อมูลสำเร็จ!');
                          setEditingServiceStatus(null);
                          fetchAllSheets();
                        } catch (e) { alert('เกิดข้อผิดพลาด'); } finally { setFormLoading(false); }
                      }}
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: editingServiceStatus.nextStatus === 'Completed' ? '#10b981' : '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {formLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : serviceSubView === 'claims' ? (
        <div className="claims-view">
          {/* 🛡️ Claims Summary & List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h3 style={{ color: '#991b1b', fontSize: '0.85rem' }}>รอส่งซ่อม</h3>
                  <div className="value" style={{ color: '#b91c1c', fontSize: '2rem' }}>{(claims || []).filter(c => c.Status === 'Received').length}</div>
                </div>
                <div style={{ fontSize: '2rem' }}>📥</div>
              </div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h3 style={{ color: '#92400e', fontSize: '0.85rem' }}>ส่งซัพพลายเออร์แล้ว</h3>
                  <div className="value" style={{ color: '#b45309', fontSize: '2rem' }}>{claims.filter(c => c.Status === 'Sent to Vendor').length}</div>
                </div>
                <div style={{ fontSize: '2rem' }}>🚛</div>
              </div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h3 style={{ color: '#065f46', fontSize: '0.85rem' }}>ส่งคืนลูกค้าแล้ว</h3>
                  <div className="value" style={{ color: '#047857', fontSize: '2rem' }}>{claims.filter(c => c.Status === 'Returned').length}</div>
                </div>
                <div style={{ fontSize: '2rem' }}>🤝</div>
              </div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h3 style={{ color: '#374151', fontSize: '0.85rem' }}>เคสทั้งหมด</h3>
                  <div className="value" style={{ color: '#111827', fontSize: '2rem' }}>{claims.length}</div>
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
                <select className="filter-select" style={{ width: '100%' }} value={claimFormData.model} onChange={e => setClaimFormData({ ...claimFormData, model: e.target.value })}>
                  <option value="">-- เลือกรายการอุปกรณ์ --</option>
                  {products.map(p => (
                    <option key={p['Product ID']} value={p.Model}>{p.Brand} - {p.Model}</option>
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
                  values: [claimId, new Date().toLocaleDateString('th-TH'), claimFormData.customer, claimFormData.model, claimFormData.serialNumber, claimFormData.description, claimFormData.status || 'Received', '', '']
                };
                setFormLoading(true);
                try {
                  await gasPost(payload);
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
                <div key={idx} className="card-hover" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.primary, marginBottom: '0.25rem' }}>{claim.ClaimID || claim['Claim ID']}</div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{claim.Customer || '-'}</h3>
                    </div>
                    <span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: config.bg, color: config.text, border: `1px solid ${config.border}` }}>
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
                      <button onClick={async () => {
                        if (!window.confirm('เปลี่ยนสถานะเป็น "ทางบริษัทได้รับของแล้ว" ใช่หรือไม่?')) return;
                        setFormLoading(true);
                        try {
                          await gasPost({ type: 'update_claim_status', idColumn: 'Claim ID', idValue: claim.ClaimID || claim['Claim ID'], updates: { 'Status': 'Checking' } });
                          alert('อัปเดตสถานะการตรวจสอบเรียบร้อย'); fetchAllSheets();
                        } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                      }} style={{ flex: 1, padding: '0.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>🔍 ตรวจสอบ</button>
                    )}
                    {status === 'Checking' && (
                      <button onClick={async () => {
                        if (!window.confirm('เปลี่ยนสถานะเป็น "ส่งสินค้าเคลมไปยังโรงงาน" ใช่หรือไม่?')) return;
                        setFormLoading(true);
                        try {
                          await gasPost({ type: 'update_claim_status', idColumn: 'Claim ID', idValue: claim.ClaimID || claim['Claim ID'], updates: { 'Status': 'Sent to Vendor' } });
                          alert('อัปเดตสถานะการส่งเคลมเรียบร้อย'); fetchAllSheets();
                        } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                      }} style={{ flex: 1, padding: '0.5rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>🚛 ส่งโรงงาน</button>
                    )}
                    {status === 'Sent to Vendor' && (
                      <button onClick={async () => {
                        if (!window.confirm('เปลี่ยนสถานะเป็น "รับของคืนจากโรงงานแล้ว" ใช่หรือไม่?')) return;
                        setFormLoading(true);
                        try {
                          await gasPost({ type: 'update_claim_status', idColumn: 'Claim ID', idValue: claim.ClaimID || claim['Claim ID'], updates: { 'Status': 'Returning' } });
                          alert('ได้รับสินค้าคืนจากโรงงานแล้ว'); fetchAllSheets();
                        } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                      }} style={{ flex: 1, padding: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>📦 รับคืน</button>
                    )}
                    {status === 'Returning' && (
                      <button onClick={async () => {
                        if (!window.confirm('เปลี่ยนสถานะเป็น "ส่งสินค้าคืนลูกค้าเรียบร้อยแล้ว" ใช่หรือไม่?')) return;
                        setFormLoading(true);
                        try {
                          await gasPost({ type: 'update_claim_status', idColumn: 'Claim ID', idValue: claim.ClaimID || claim['Claim ID'], updates: { 'Status': 'Returned' } });
                          alert('ส่งมอบคืนลูกค้าเรียบร้อย'); fetchAllSheets();
                        } catch (e) { alert('ผิดพลาด'); } finally { setFormLoading(false); }
                      }} style={{ flex: 1, padding: '0.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>🤝 คืนลูกค้า</button>
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
  );
};

export default ServiceView;
