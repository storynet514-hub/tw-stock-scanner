import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updateTime, setUpdateTime] = useState('');

  useEffect(() => {
    fetchStocks();
  }, []);

  async function fetchStocks() {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .order('code', { ascending: true });

      if (error) {
        console.error('Error fetching stocks:', error);
      } else {
        setStocks(data);
        setUpdateTime(new Date().toLocaleString('zh-TW'));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredStocks = stocks.filter(stock =>
    stock.code.includes(searchTerm) || stock.name.includes(searchTerm)
  );

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>載入中...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>📈 台股即時掃描儀表板</h1>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
        最後更新：{updateTime} | 共 {stocks.length} 檔股票
      </p>

      {/* 搜尋框 */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <input
          type="text"
          placeholder="搜尋股票代號或名稱..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 15px',
            fontSize: '16px',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            outline: 'none',
          }}
        />
      </div>

      {/* 表格 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#4a90e2', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>代號</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>名稱</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>股價</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>漲跌</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>漲跌幅 %</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock) => (
              <tr key={stock.code} style={{ backgroundColor: '#fff' }}>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>{stock.code}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>{stock.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                  {stock.price}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', color: stock.change >= 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>
                  {stock.change >= 0 ? '+' : ''}{stock.change}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', color: stock.changePercent >= 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStocks.length === 0 && (
        <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>找不到符合的股票</p>
      )}
    </div>
  );
}
