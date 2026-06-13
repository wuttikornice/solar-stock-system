import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { THEME } from '../utils/constants';

const Reports = ({ reportData }) => {
  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Row 1: Strategic Forecasts (Simple Text Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color: 'white' }}>
          <h3 style={{ color: '#94a3b8' }}>เบิกจ่ายสูงสุดตามประเภท</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {reportData.projectDistribution[0]?.name || 'ไม่มีข้อมูล'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
            สัดส่วน {((reportData.projectDistribution[0]?.value / reportData.projectDistribution.reduce((a, b) => a + b.value, 0)) * 100 || 0).toFixed(1)}% ของรายการเบิกจ่ายทั้งหมด
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #047857 0%, #059669 100%)', color: 'white' }}>
          <h3 style={{ color: '#a7f3d0' }}>สินค้าเคลื่อนไหวดีที่สุด</h3>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {reportData.topDeployedItems[0]?.name || 'ไม่มีข้อมูล'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#ecfdf5', marginTop: '0.5rem' }}>
            เบิกจ่ายไปแล้ว {reportData.topDeployedItems[0]?.value || 0} หน่วย
          </div>
        </div>
      </div>

      {/* Row 2: Project & Consumption Charts */}
      <div className="report-grid">
        <div className="chart-card">
          <h3 style={{ marginBottom: '1.5rem' }}>สัดส่วนสินค้าแยกตามประเภทโครงการ</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.projectDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportData.projectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[THEME.primary, THEME.secondary, THEME.success, '#f59e0b', '#6366f1'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 style={{ marginBottom: '1.5rem' }}>สินค้าเบิกจ่ายสูงสุด 5 อันดับแรก</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.topDeployedItems} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '0.7rem' }} />
                <Tooltip />
                <Bar dataKey="value" name="จำนวน (หน่วย)" fill={THEME.secondary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Operational Trends */}
      <div className="chart-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>แนวโน้มการดำเนินงาน (รายเดือน)</h3>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>ย้อนหลัง 6 เดือน</div>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={reportData.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="in" name="รับเข้า" stroke={THEME.success} fill={THEME.success} fillOpacity={0.1} />
              <Area type="monotone" dataKey="out" name="เบิกออก" stroke={THEME.danger} fill={THEME.danger} fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Consumable Insights */}
      {reportData.nonSerialStats.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: THEME.primary }}>⚡ เจาะลึกสินค้าสิ้นเปลือง (ไม่มีซีเรียล)</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รุ่นสินค้า</th>
                  <th>สต๊อกคงเหลือ</th>
                  <th>เบิกจ่ายสะสม</th>
                  <th>อัตราการใช้รายเดือน</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {reportData.nonSerialStats.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.model}</td>
                    <td>{item.balance}</td>
                    <td>{item.totalOut}</td>
                    <td>{item.burnRate} / เดือน</td>
                    <td>
                      <span className={`badge ${item.status === 'Critical' ? 'badge-orange' : 'badge-green'}`}>
                        {item.status === 'Critical' ? 'วิกฤต' : 'ปกติ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
