import fs from 'fs';
import path from 'path';
import cheerio from 'cheerio';

export async function getServerSideProps() {
  const dataPath = path.join(process.cwd(), 'data', 'twse.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const stocks = [];

  for (const stock of data) {
    const url = `https://www.twse.com.tw/zh/products/stocks/${stock.code}.html`;
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const priceText = $('.stock-price').text().trim();
    const changeText = $('.stock-change').text().trim();

    stocks.push({
      code: stock.code,
      name: stock.name,
      price: priceText,
      change: changeText,
    });
  }

  return { props: { stocks } };
}

export default function Home({ stocks }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>台股即時掃描</h1>
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
