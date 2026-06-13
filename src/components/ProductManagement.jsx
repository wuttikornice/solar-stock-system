import React from 'react';
import { THEME, PRODUCT_OWNERS } from '../utils/constants';

const ProductManagement = ({
  filteredItems,
  categoriesList,
  brandsList,
  filterCategory,
  setFilterCategory,
  filterBrand,
  setFilterBrand,
  filterCompany,
  setFilterCompany,
  isAddingProduct,
  setIsAddingProduct,
  productFormData,
  setProductFormData,
  formLoading,
  formStatus,
  setFormStatus,
  products,
  fetchAllSheets,
  gasPost,
  getDirectImageUrl,
}) => {
  return (
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

      {!isAddingProduct && (
        <div className="filters-bar" style={{ marginBottom: '1.5rem' }}>
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
        </div>
      )}

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
                {PRODUCT_OWNERS.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
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
                setFormStatus({ type: 'loading', message: 'กำลังบันทึก...' });
                try {
                  const payload = {
                    type: 'add_product',
                    values: [
                      productFormData.id,
                      productFormData.category,
                      productFormData.brand,
                      productFormData.model,
                      productFormData.specification,
                      productFormData.unit,
                      productFormData.minStock,
                      productFormData.image,
                      productFormData.company
                    ]
                  };
                  await gasPost(payload);
                  setFormStatus({ type: 'success', message: 'Product added successfully!' });
                  fetchAllSheets();
                } catch (err) {
                  setFormStatus({ type: 'error', message: 'Failed to add product: ' + err.toString() });
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
  );
};

export default ProductManagement;
