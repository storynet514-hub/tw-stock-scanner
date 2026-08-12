// 這個腳本用來抓取所有台股代號
// 在本地執行：node scripts/fetch-stocks.js

const fs = require('fs');
const path = require('path');

async function fetchAllStocks() {
  try {
    // 抓取所有上市股票代號
    const url = 'https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const json = await res.json();
    
    // 解析 API 回傳的資料
    // 格式：{ stat: 'OK', data: [ { type: '上市股票', data: [...] }, ... ] }
    const allStocks = [];
    
    for (const category of json.data) {
      if (category.type === '上市股票' || category.type === '上櫃股票') {
        for (const stock of category.data) {
          allStocks.push({
            code: stock[0], // 代號
            name: stock[1], // 名稱
            type: category.type, // 上市/上櫃
          });
        }
      }
    }
    
    // 寫入 data/twse.json
    const dataPath = path.join(__dirname, '..', 'data', 'twse.json');
    fs.writeFileSync(dataPath, JSON.stringify(allStocks, null, 2));
    
    console.log(`成功抓取 ${allStocks.length} 檔股票`);
    console.log('已寫入 data/twse.json');
    
  } catch (error) {
    console.error('錯誤:', error);
  }
}

fetchAllStocks();
