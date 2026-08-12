import fs from 'fs';
import path from 'path';

export async function getServerSideProps() {
  const dataPath = path.join(process.cwd(), 'data', 'twse.json');
  
  let data;
  try {
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { props: { stocks: [], error: '無法讀取資料檔案' } };
  }

  const stocks = [];

  for (const stock of data) {
    try {
      // 使用台交所 API（個股）
      const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=20260813&stockNo=${stock.code}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });
      const json = await res.json();
      
      // API 回傳的最后一筆是最新收盤價
      const lastRow = json.data[json.data.length - 1];
      
      // 印出所有欄位看看
      console.log(`${stock.code} 欄位:`, lastRow);
      
      // 根據實際測試，調整索引
      // 假設：索引 4=開盤, 5=最高, 6=最低, 7=收盤, 8=漲跌
      const closePrice = lastRow ? lastRow[7] : 'N/A';
      const change = lastRow ? lastRow[8] : 'N/A';

      stocks.push({
        code: stock.code,
        name: stock.name,
        price: closePrice,
        change: change,
      });
    } catch (err) {
      console.error(`Error fetching ${stock.code}:`, err);
      stocks.push({
        code: stock.code,
        name: stock.name,
        price: 'Error',
        change: 'Error',
      });
    }
  }

  return { props: { stocks, error: null } };
}

export default function Home({ stocks, error }) {
  if (error) {
    return <div style={{ padding: '20px' }}>錯誤：{error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>台股即時掃描</h1>
      <p>請查看 Vercel Functions Logs 看欄位順序</p>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>代號</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>名稱</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>股價</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>漲跌</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.code}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{stock.code}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{stock.name}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{stock.price}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{stock.change}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
