import React from 'react';
import { THEME } from '../utils/constants';

const ManageStock = ({
  manageMode,
  setManageMode,
  bulkMode,
  setBulkMode,
  noSerial,
  setNoSerial,
  formData,
  setFormData,
  formLoading,
  setFormLoading,
  formStatus,
  setFormStatus,
  uploadProgress,
  setUploadProgress,
  products,
  stockStatus,
  salesOrders,
  requisitionTransfer,
  setRequisitionTransfer,
  getValueResilient,
  getSoFulfillment,
  fetchAllSheets,
  addActivityLog,
  gasPost,
  gasPostWithResponse,
}) => {
  return (
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
                {(() => {
                  const soObj = salesOrders.find(s => getValueResilient(s, 'soid') === requisitionTransfer.id);
                  const fulfillment = getSoFulfillment(soObj);
                  const pendingItems = fulfillment.items.filter(it => it.remaining > 0);

                  if (pendingItems.length === 0) {
                    return <div style={{ color: THEME.success, fontWeight: 700, padding: '0.5rem', background: '#dcfce7', borderRadius: '4px', width: '100%' }}>✅ เบิกสินค้าครบตามจำนวนที่จองแล้ว</div>;
                  }

                  return pendingItems.map((it, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormData({ ...formData, productId: it.productId || it.ID, qty: it.remaining })}
                      style={{ background: 'white', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #fcd34d', cursor: 'pointer', transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {it.name || it.Model} <b>x {it.remaining}</b>
                    </div>
                  ));
                })()}
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
              <option value="Simat">Simat</option>
              <option value="NPE">NPE</option>
              <option value="UC">UC</option>
              <option value="UE">UE</option>
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

              const validationErrors = [];
              for (const sn of serialsToProcess) {
                if (sn === 'NON-SERIAL') continue;
                if (manageMode === 'in') {
                  const serialExists = stockStatus.in.some(item => item['Serial Number'] === sn);
                  if (serialExists) {
                    validationErrors.push(`❌ Serial "${sn}" มีอยู่ในระบบแล้ว ไม่สามารถรับเข้าซ้ำได้`);
                  }
                }
                if (manageMode === 'out') {
                  const serialInStock = stockStatus.in.some(item => item['Serial Number'] === sn);
                  const serialAlreadyOut = stockStatus.out.some(item => item['Serial Number'] === sn);
                  if (!serialInStock) {
                    validationErrors.push(`❌ Serial "${sn}" ไม่มีในระบบสต๊อก`);
                  } else if (serialAlreadyOut) {
                    validationErrors.push(`❌ Serial "${sn}" ถูกเบิกออกไปแล้ว`);
                  }
                }
              }

              if (validationErrors.length > 0) {
                setFormStatus({ type: 'error', message: validationErrors.join('\n') });
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

                  let values = [];
                  if (manageMode === 'in') {
                    values = [
                      formData.date.split('-').reverse().join('/'),
                      formData.productId,
                      modelName,
                      sn,
                      noSerial ? formData.qty : 1,
                      formData.entity,
                      formData.refNumber,
                      formData.person,
                      '',
                      formData.remark
                    ];
                  } else {
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

                  const payload = { type: manageMode, values };
                  await gasPostWithResponse(payload);
                  if (serialsToProcess.length > 1) await new Promise(r => setTimeout(r, 200));
                }
                setFormStatus({ type: 'success', message: 'Recorded successfully!' });
                addActivityLog('Stock Transaction', `${manageMode === 'in' ? 'รับเข้า' : 'เบิกออก'}: ${formData.refNumber} (${serialsToProcess.length} รายการ)`);
                setFormData({
                  productId: '',
                  serial: '',
                  bulkSerials: '',
                  entity: '',
                  projectType: '',
                  refNumber: '',
                  date: new Date().toISOString().split('T')[0],
                  project: '',
                  person: currentUser?.Name || currentUser?.Username || '',
                  remark: '',
                  qty: 1
                });
                setBulkMode(false);
                setNoSerial(false);

                if (manageMode === 'out' && requisitionTransfer) {
                  const soIdVal = requisitionTransfer.id;
                  const soObj = salesOrders.find(s => getValueResilient(s, 'soid') === soIdVal);
                  const currentFulfillment = getSoFulfillment(soObj);
                  const subQty = serialsToProcess.length || Number(formData.quantity) || 1;
                  const newTotalWithdrawn = currentFulfillment.totalWithdrawn + subQty;
                  let newStatus = 'จ่ายบางส่วน';
                  if (newTotalWithdrawn >= currentFulfillment.totalReserved) {
                    newStatus = 'จ่ายสินค้าแล้ว';
                  }
                  const updatePayload = {
                    type: 'edit_sales_order_status',
                    id: soIdVal,
                    idColumn: 'SO ID',
                    idValue: soIdVal,
                    updates: { 'Status': newStatus, 'status': newStatus }
                  };
                  try {
                    await gasPost(updatePayload);
                    setRequisitionTransfer(null);
                  } catch (e) {
                    console.error("❌ Failed to update requisition status", e);
                  }
                }

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
  );
};

export default ManageStock;
