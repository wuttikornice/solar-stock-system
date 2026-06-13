import React from 'react';
import { THEME } from '../utils/constants';

const SalesOrder = ({
  soSubView,
  setSoSubView,
  soItems,
  setSoItems,
  soProjectName,
  setSoProjectName,
  soQtRef,
  setSoQtRef,
  soQtLink,
  setSoQtLink,
  selectedSoCustomer,
  setSelectedSoCustomer,
  soFilterCategory,
  setSoFilterCategory,
  soFilterBrand,
  setSoFilterBrand,
  editingSo,
  setEditingSo,
  selectedSoForView,
  setSelectedSoForView,
  customers,
  products,
  stockData,
  salesOrders,
  setSalesOrders,
  formLoading,
  setFormLoading,
  getValueResilient,
  findSheetKey,
  parseCSVDate,
  safeJSONParse,
  getSoFulfillment,
  addProductToSo,
  updateSoItem,
  removeSoItem,
  setManageMode,
  setFormData,
  setCurrentView,
  setRequisitionTransfer,
  fetchAllSheets,
  addActivityLog,
  gasPost,
}) => {
  return (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>{editingSo ? `แก้ไขใบเบิก/จองอุปกรณ์ (${getValueResilient(editingSo, 'soid')})` : 'รายการเบิก/จองอุปกรณ์สำหรับงานติดตั้ง'}</h2>
                {editingSo && (
                  <button
                    onClick={() => {
                      setEditingSo(null);
                      setSoItems([]);
                      setSoProjectName('');
                      setSoQtRef('');
                      setSoQtLink('');
                      setSelectedSoCustomer(null);
                    }}
                    style={{ padding: '0.4rem 0.8rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    ❌ ยกเลิกหน่วยแก้ไข
                  </button>
                )}
              </div>
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

              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>รายการสินค้าที่จอง</h3>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>
                    <th style={{ padding: '0.5rem' }}>สินค้า</th>
                    <th style={{ padding: '0.5rem' }}>จำนวน</th>

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
                          value={item.qty || item.Quantity || 0}
                          onChange={(e) => updateSoItem(item.id, 'qty', Number(e.target.value))}
                          style={{ width: '60px', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
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
                {stockData
                  .filter(p => (soFilterCategory === 'All' || p.Category === soFilterCategory) && (soFilterBrand === 'All' || p.Brand === soFilterBrand))
                  .map(p => (
                    <div
                      key={p['Product ID']}
                      className="nav-item"
                      onClick={() => addProductToSo(p)}
                      style={{ border: '1px solid #f1f5f9', background: 'white', color: THEME.primary, cursor: 'pointer', padding: '0.5rem', borderRadius: '6px' }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.Model}</div>
                      <div style={{ fontSize: '0.75rem', color: THEME.secondary }}>พร้อมเบิก: {p.AvailableBalance} (จองแล้ว: {p.ReservedQuantity}) | รหัส: {p['Product ID']}</div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', background: THEME.primary, color: 'white' }}>
              <h3 style={{ marginBottom: '1rem' }}>ยืนยันรายการจอง</h3><div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}><span>จำนวนอุปกรณ์รวมทั้งหมด:</span><span style={{ fontWeight: 800, fontSize: '1.25rem' }}>{soItems.reduce((sum, item) => sum + Number(item.qty || item.Quantity || 0), 0)} ชิ้น</span></div></div>

              <button
                style={{ width: '100%', padding: '1rem', background: editingSo ? '#f59e0b' : 'white', color: editingSo ? 'white' : THEME.primary, border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                disabled={formLoading}
                onClick={async () => {
                  if (!selectedSoCustomer) return alert('กรุณาเลือกลูกค้า');
                  if (soItems.length === 0) return alert('กรุณาเพิ่มสินค้า');

                  const isEdit = !!editingSo;
                  const soId = isEdit ? getValueResilient(editingSo, 'soid') : ('REQ-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'));

                  const totalQty = soItems.reduce((sum, item) => sum + Number(item.qty || item.Quantity || 0), 0);
                  const itemsJSON = JSON.stringify(soItems);

                  const payload = isEdit ? {
                    type: 'edit_sales_order_status',
                    // 🔑 Hybrid Structure for compatibility
                    id: soId,
                    idColumn: findSheetKey(editingSo, ['SO ID', 'REQ ID', 'เลขที่ใบเบิก']),
                    idValue: soId,
                    updates: {
                       [findSheetKey(editingSo, ['Date', 'QT IDRef', 'วันที่'])]: new Date().toISOString().split('T')[0],
                       [findSheetKey(editingSo, ['Customer ID', 'รหัสลูกค้า', 'Date'])]: selectedSoCustomer['Customer ID'],
                       [findSheetKey(editingSo, ['Customer Name', 'ชื่อลูกค้า', 'Delivery Status'])]: selectedSoCustomer['Customer Name'],
                       [findSheetKey(editingSo, ['Project Name', 'ชื่อโครงการ', ','])]: soProjectName,
                       [findSheetKey(editingSo, ['Items', 'รายการ', 'Item List', 'Linked_DO_Ref'])]: itemsJSON,
                       [findSheetKey(editingSo, ['Total Quantity', 'จำนวนรวม', 'จำนวนอุปกรณ์รวม (ชิ้น)'])]: totalQty,
                       [findSheetKey(editingSo, ['Status', 'สถานะ'])]: isEdit ? (getValueResilient(editingSo, 'status') || 'จองสินค้า') : 'จองสินค้า',
                       [findSheetKey(editingSo, ['QT Ref', 'อ้างอิง QT', 'QT'])]: soQtRef,
                       [findSheetKey(editingSo, ['QT Link', 'ลิงก์ QT'])]: soQtLink
                     }
                  } : {
                    type: 'add_sales_order',
                    values: [
                      soId,
                      new Date().toISOString().split('T')[0],
                      selectedSoCustomer['Customer ID'],
                      selectedSoCustomer['Customer Name'],
                      soProjectName,
                      itemsJSON,
                      totalQty,
                      'จองสินค้า',
                      soQtRef,
                      soQtLink
                    ]
                  };

                  console.log("🚀 [SENDING PAYLOAD]:", payload);

                  setFormLoading(true);
                  try {
                    await gasPost(payload);
                    alert(isEdit ? 'แก้ไขใบเบิกเรียบร้อยแล้ว!' : 'บันทึกใบเบิกและจองสต๊อกสำเร็จ!');
                    setSoItems([]);
                    setSoProjectName('');
                    setSoQtRef('');
                    setSoQtLink('');
                    setSelectedSoCustomer(null);
                    setEditingSo(null);
                    setSoSubView('history');
                    addActivityLog('Requisition', `${isEdit ? 'แก้ไข' : 'สร้าง'}ใบเบิก ${soId} สำหรับโครงการ: ${soProjectName} (Ref: ${soQtRef || '-'})`);
                    fetchAllSheets();
                  } catch (err) {
                    alert('เกิดข้อผิดพลาด: ' + err.message);
                    console.error(err);
                  } finally {
                    setFormLoading(false);
                  }
                }}
              >
                {formLoading ? 'กำลังบันทึก...' : (editingSo ? '💾 บันทึกการแก้ไขใบเบิก' : '💾 บันทึกใบเบิกและจองของ')}
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
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>จำนวนอุปกรณ์รวม (ชิ้น)</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.map((so, idx) => {
                  const customerId = getValueResilient(so, 'customerid');
                  const customer = customers.find(c => String(c['Customer ID'] || '').trim() === String(customerId || '').trim());
                  const fulfillment = getSoFulfillment(so);
                  const status = fulfillment.calculatedStatus;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{getValueResilient(so, 'soid')}</td>
                      <td style={{ padding: '1rem' }}>{parseCSVDate(getValueResilient(so, 'date'))}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{customer ? (customer['Customer Name'] || customer['Name']) : customerId}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Project: {getValueResilient(so, 'projectname') || '-'}</div>
                      </td>
                      <td style={{ padding: '1rem', color: THEME.secondary, fontWeight: 600 }}>{getValueResilient(so, 'qtref') || '-'}</td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: THEME.primary }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', color: fulfillment.totalWithdrawn < fulfillment.totalReserved && fulfillment.totalWithdrawn > 0 ? '#3b82f6' : 'inherit' }}>
                            {fulfillment.totalWithdrawn} / {fulfillment.totalReserved}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>เบิกแล้ว / จองทั้งหมด</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: status === 'ยกเลิก' ? '#fee2e2' : (status === 'จ่ายบางส่วน' ? '#eff6ff' : (status?.includes('จอง') ? '#fef3c7' : '#dcfce7')),
                            color: status === 'ยกเลิก' ? '#dc2626' : (status === 'จ่ายบางส่วน' ? '#3b82f6' : (status?.includes('จอง') ? '#d97706' : '#166534')),
                            display: 'inline-block'
                          }}
                        >
                          {status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="badge badge-orange"
                          style={{ border: 'none', cursor: 'pointer', background: '#f59e0b' }}
                          onClick={() => {
                            const items = safeJSONParse(getValueResilient(so, 'items'));
                            const custId = getValueResilient(so, 'customerid');
                            const custObj = customers.find(c => String(c['Customer ID'] || '').trim() === String(custId || '').trim());

                            setEditingSo(so);
                            setSelectedSoCustomer(custObj || { 'Customer ID': custId, 'Customer Name': getValueResilient(so, 'customername') });
                            setSoProjectName(getValueResilient(so, 'projectname'));
                            setSoItems(items.map(it => ({ ...it, qty: Number(it.qty || it.Quantity || 1) })));
                            setSoQtRef(getValueResilient(so, 'qtref'));
                            setSoQtLink(getValueResilient(so, 'qtlink'));
                            setSoSubView('create');
                          }}
                        >
                          ✏️ แก้ไข
                        </button>
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
                            const items = safeJSONParse(getValueResilient(so, 'items'));
                            setRequisitionTransfer({
                              id: getValueResilient(so, 'soid'),
                              project: getValueResilient(so, 'projectname'),
                              items: items
                            });
                            setManageMode('out');
                            setFormData(prev => ({
                              ...prev,
                              project: getValueResilient(so, 'projectname'),
                              refNumber: getValueResilient(so, 'soid'),
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
                            const soIdVal = String(getValueResilient(so, 'soid') || '').trim();
                            const payload = {
                              type: 'edit_sales_order_status',
                              // Support for older GAS Script
                              id: soIdVal,
                              status: 'ยกเลิก',
                              // Support for Universal GAS Script
                              idColumn: 'SO ID',
                              idValue: soIdVal,
                              updates: { 'Status': 'ยกเลิก', 'status': 'ยกเลิก' }
                            };
                            try {
                              await gasPost(payload);
                              setSalesOrders(prev => prev.map(order => {
                                if (getValueResilient(order, 'soid') === soIdVal) {
                                  const newOrder = { ...order, Status: 'ยกเลิก', status: 'ยกเลิก' };
                                  // Force overwrite the old status in whichever broken key PapaParse assigned it to
                                  Object.keys(newOrder).forEach(k => {
                                    if (/^(จอง|เบิก|Pending|Reserved|Completed)/i.test(String(newOrder[k]))) {
                                      newOrder[k] = 'ยกเลิก';
                                    }
                                  });
                                  return newOrder;
                                }
                                return order;
                              }));
                              alert('ยกเลิกรายการแล้ว');
                              setTimeout(() => fetchAllSheets(), 2000); // Give backend time to process before background sync
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

      {selectedSoForView && (
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
                    <th style={{ padding: '1rem', textAlign: 'center' }}>จอง (Reserved)</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>เบิกแล้ว (Withdrawn)</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>คงเหลือ (Remaining)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const fulfillment = getSoFulfillment(selectedSoForView);
                    return fulfillment.items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, color: THEME.primary }}>{it.name || it.Model || it.ProductName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {it.brand && <span style={{ marginRight: '0.5rem' }}>แบรนด์: {it.brand}</span>}
                            <span>รหัส: {it.productId || it.ID}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{it.reserved} {it.unit || 'ชิ้น'}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: it.withdrawn > 0 ? '#059669' : 'inherit' }}>{it.withdrawn} {it.unit || 'ชิ้น'}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: it.remaining > 0 ? '#dc2626' : '#059669' }}>
                          {it.remaining > 0 ? `+${it.remaining}` : 'ครบแล้ว'}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
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
      )}
    </div>
  );
};

export default SalesOrder;
