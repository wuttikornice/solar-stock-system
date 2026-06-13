import React from 'react';
import { THEME } from '../utils/constants';

const CRM = ({
  activeGIDs,
  filteredCustomers,
  customers,
  salesOrders,
  customerEquipments,
  viewingHistory,
  setViewingHistory,
  viewingEquipments,
  setViewingEquipments,
  editingCustomer,
  setEditingCustomer,
  formLoading,
  setFormLoading,
  getValueResilient,
  parseCSVDate,
  parseCSVNumber,
  handleExportCSV,
  initSalesDatabase,
  fetchAllSheets,
  addActivityLog,
  gasPost,
}) => {
  return (
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
              let typeColor = '#64748b';
              if (custType === 'EPC') typeColor = '#2563eb';
              if (custType === 'PPA') typeColor = '#10b981';
              if (custType === 'Wholesale') typeColor = '#8b5cf6';

              return (
                <div key={i} className="card" style={{ padding: 0, border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
                      #{c['Customer ID'] || 'ID-NEW'}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '0.25rem 0.6rem', borderRadius: '20px', background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30` }}>
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

                  <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      style={{ flex: '1 1 45%', padding: '0.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
                      onClick={() => setViewingHistory(c)}
                    >
                      📂 ประวัติ SO
                    </button>
                    <button
                      style={{ flex: '1 1 45%', padding: '0.5rem', background: THEME.secondary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => {
                        setEditingCustomer(c);
                        document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      style={{ flex: '1 1 100%', padding: '0.5rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setViewingEquipments(c)}
                    >
                      🔋 รายการอุปกรณ์ที่ติดตั้ง
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
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: THEME.primary }}>ประวัติลูกค้า: {viewingHistory['Customer Name']}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{viewingHistory['Company'] || '-'} | {viewingHistory['Phone'] || viewingHistory['Sales Phone']}</div>
                </div>
                <button onClick={() => setViewingHistory(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
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
                            <div style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: getValueResilient(so, 'status')?.includes('จอง') ? '#fef3c7' : '#dcfce7', color: getValueResilient(so, 'status')?.includes('จอง') ? '#d97706' : '#166534', display: 'inline-block', marginTop: '0.25rem', textAlign: 'center' }}>
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

        {viewingEquipments && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: THEME.primary }}>รายการอุปกรณ์ที่ติดตั้ง: {viewingEquipments['Customer Name']}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>รวมทั้งหมด {customerEquipments.length} รายการ</div>
                </div>
                <button onClick={() => setViewingEquipments(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ padding: '1.5rem', overflowY: 'auto', background: '#f8fafc', flex: 1 }}>
                {customerEquipments.length > 0 ? (
                  <div className="table-container" style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem' }}>วันที่</th>
                          <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem' }}>รหัสสินค้า/รุ่น</th>
                          <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem' }}>Serial Number</th>
                          <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem' }}>จำนวน</th>
                          <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem' }}>อ้างอิงใบเบิก</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerEquipments.map((eq, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{eq.Date || eq.date}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: 600, color: THEME.primary, fontSize: '0.85rem' }}>{eq.Model || eq.productId}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{eq['Product ID']}</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{eq['Serial Number'] || '-'}</span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{eq.Quantity || 1} {eq.Unit || ''}</td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>{eq.Reference || eq.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                    <div>ยังไม่มีข้อมูลการเบิกอุปกรณ์ไปติดตั้งสำหรับลูกค้ารายนี้</div>
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', textAlign: 'right', background: 'white' }}>
                <button
                  onClick={() => handleExportCSV(customerEquipments, `Equipments_${viewingEquipments['Customer Name']}`)}
                  className="btn-export"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  📥 ดาวน์โหลดรายการ (CSV)
                </button>
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
                values: [customerId, form.name.value, form.company.value, form.phone.value, form.address.value, form.custType.value, form.taxId.value]
              };
              setFormLoading(true);
              try {
                await gasPost(payload);
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
                <input name="name" type="text" className="search-input" style={{ width: '100%' }} placeholder="ชื่อ-นามสกุล" required defaultValue={editingCustomer ? editingCustomer['Customer Name'] : ''} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>บริษัท (ถ้ามี)</label>
                <input name="company" type="text" className="search-input" style={{ width: '100%' }} placeholder="บริษัท จำกัด" defaultValue={editingCustomer ? editingCustomer['Company'] : ''} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>เบอร์โทรศัพท์ติดต่อ</label>
                <input name="phone" type="text" className="search-input" style={{ width: '100%' }} placeholder="08xxxxxxxx" required defaultValue={editingCustomer ? (editingCustomer['Phone'] || editingCustomer['Sales Phone']) : ''} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>ที่อยู่ / สถานที่จัดส่ง</label>
                <textarea name="address" className="search-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} placeholder="ที่อยู่สำหรับออกใบกำกับภาษี" defaultValue={editingCustomer ? getValueResilient(editingCustomer, 'address') : ''}></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>ประเภทลูกค้า</label>
                  <select name="custType" className="search-input" style={{ width: '100%' }} defaultValue={editingCustomer ? editingCustomer['Type'] : 'Retail'}>
                    <option value="Retail">Retail (บุคคลธรรมดา)</option>
                    <option value="EPC">EPC (โครงการ/ผู้รับเหมา)</option>
                    <option value="PPA">PPA (ผู้ขายไฟ)</option>
                    <option value="Wholesale">Wholesale (ราคาส่ง)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>เลขผู้เสียภาษี</label>
                  <input name="taxId" type="text" className="search-input" style={{ width: '100%' }} placeholder="-" defaultValue={editingCustomer ? editingCustomer['Tax ID'] : ''} />
                </div>
              </div>
              <button
                type="submit"
                disabled={formLoading}
                style={{ width: '100%', padding: '0.75rem', background: editingCustomer ? '#f59e0b' : THEME.primary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.5rem', cursor: formLoading ? 'not-allowed' : 'pointer', opacity: formLoading ? 0.7 : 1 }}
              >
                {formLoading ? 'กำลังบันทึก...' : (editingCustomer ? 'บันทึกการแก้ไข' : 'เพิ่มลูกค้า')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRM;
