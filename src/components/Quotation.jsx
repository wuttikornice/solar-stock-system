import React from 'react';
import { THEME } from '../utils/constants';

const Quotation = ({
  qtSubView,
  setQtSubView,
  selectedCustomer,
  setSelectedCustomer,
  selectedSalesperson,
  setSelectedSalesperson,
  users,
  qtProjectName,
  setQtProjectName,
  qtItems,
  setQtItems,
  qtDiscount,
  setQtDiscount,
  qtSubtotal,
  editingQt,
  setEditingQt,
  salesPackages,
  stockData,
  quotations,
  customers,
  previewQt,
  setPreviewQt,
  formLoading,
  setFormLoading,
  currentUser,
  addPackageToQt,
  updateQtItem,
  removeQtItem,
  parseCSVNumber,
  parseCSVDate,
  safeJSONParse,
  getValueResilient,
  thaiBahtText,
  fetchAllSheets,
  addActivityLog,
  gasPostWithResponse,
}) => {
  return (
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
                      const prod = stockData.find(p => p['Product ID'] === e.target.value);
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
                    {stockData.map((p, idx) => (
                      <option key={idx} value={p['Product ID']}>
                        {p.Brand ? `[${p.Brand}] ` : ''}{p.Model || p.ProductName} (พร้อมเบิกขาย: {p.AvailableBalance} | จองแล้ว: {p.ReservedQuantity})
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
                          value={item.qty || item.Quantity || 0}
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
                    await gasPostWithResponse(qtData);
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
  );
};

export default Quotation;
