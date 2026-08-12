import { useState } from 'react';

export async function getServerSideProps() {
  try {
    // 第一步：抓取所有上市股票代號
    const allStocksUrl = 'https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json';
    const allStocksRes = await fetch(allStocksUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const allStocksJson = await allStocksRes.json();
    
    const allStocks = [];
    for (const category of allStocksJson.data) {
      if (category.type === '上市股票') {
        for (const stock of category.data) {
          allStocks.push({
            code: stock[0],
            name: stock[1],
          });
        }
      }
    }
    
    console.log(`成功抓取 ${allStocks.length} 檔上市股票`);
    
    // 第二步：並行抓取股價（每 10 檔一組）
    const stocks = [];
    const batchSize = 10;
    
    for (let i = 0; i < allStocks.length; i += batchSize) {
      const batch = allStocks.slice(i, i + batchSize);
      const batchPromises = batch.map(async (stock) => {
        try {
          const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&stockNo=${stock.code}`;
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0',
            },
          });
          const json = await res.json();
          
          if (!json.data || json.data.length === 0) {
            return {
              code: stock.code,
              name: stock.name,
              price: '無資料',
              change: '無資料',
              changePercent: '無資料',
            };
          }
          
          const lastRow = json.data[json.data.length - 1];
          const closePrice = lastRow ? parseFloat(lastRow[6].replace(/,/g, '')) : 0;
          const change = lastRow ? parseFloat(lastRow[7].replace(/,/g, '')) : 0;
          const prevClose = closePrice - change;
          const changePercent = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : 0;

          return {
            code: stock.code,
            name: stock.name,
            price: closePrice.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent,
          };
        } catch (err) {
          console.error(`Error fetching ${stock.code}:`, err);
          return {
            code: stock.code,
            name: stock.name,
            price: '無資料',
            change: '無資料',
            changePercent: '無資料',
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      stocks.push(...batchResults);
      
      console.log(`已抓取 ${Math.min(i + batchSize, allStocks.length)} / ${allStocks.length} 檔`);
    }
    
    return { props: { stocks, updateTime: new Date().toLocaleString('zh-TW') } };
    
  } catch (error) {
    console.error('Error:', error);
    return { props: { stocks: [], updateTime: new Date().toLocaleString('zh-TW') } };
  }
}

export default function Home({ stocks, updateTime }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStocks = stocks.filter(stock =>
    stock.code.includes(searchTerm) || stock.name.includes(searchTerm)
  );

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
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', color: typeof stock.change === 'string' ? '#999' : stock.change >= 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>
                  {typeof stock.change === 'string' ? stock.change : (stock.change >= 0 ? '+' : '') + stock.change}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', color: typeof stock.changePercent === 'string' ? '#999' : stock.changePercent >= 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>
                  {typeof stock.changePercent === 'string' ? stock.changePercent : (stock.changePercent >= 0 ? '+' : '') + stock.changePercent + '%'}
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
