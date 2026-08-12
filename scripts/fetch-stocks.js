const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAllStocks() {
  try {
    console.log('正在抓取所有台股代號...');
    
    // 使用正確的 API 抓取上市股票列表
    const allStocksUrl = 'https://www.twse.com.tw/exchangeReport/MI_5MINS_TRADE_INFO?response=json';
    const allStocksRes = await fetch(allStocksUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const allStocksJson = await allStocksRes.json();
    
    console.log('API 回傳 stat:', allStocksJson.stat);
    console.log('API 回傳 type:', allStocksJson.type);
    
    const allStocks = [];
    
    // 檢查回傳格式
    if (allStocksJson.data && Array.isArray(allStocksJson.data)) {
      for (const row of allStocksJson.data) {
        if (row && row[0]) {
          allStocks.push({
            code: row[0],
            name: row[1] || '',
          });
        }
      }
    }
    
    console.log(`成功抓取 ${allStocks.length} 檔股票`);
    console.log('前 10 檔:', allStocks.slice(0, 10));
    
    if (allStocks.length === 0) {
      console.error('錯誤：沒有抓取到任何股票');
      return;
    }
    
    // 第二步：只抓取前 5 檔測試
    const stocksData = [];
    const testStocks = allStocks.slice(0, 5);
    
    console.log('開始抓取股價...');
    
    for (const stock of testStocks) {
      try {
        const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&stockNo=${stock.code}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        });
        const json = await res.json();
        
        console.log(`${stock.code} 回傳:`, json.stat);
        
        if (!json.data || json.data.length === 0) {
          continue;
        }
        
        const lastRow = json.data[json.data.length - 1];
        const closePrice = lastRow ? parseFloat(lastRow[6].replace(/,/g, '')) : 0;
        const change = lastRow ? parseFloat(lastRow[7].replace(/,/g, '')) : 0;
        const prevClose = closePrice - change;
        const changePercent = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : 0;

        stocksData.push({
          symbol: stock.code,
          name: stock.name,
          close_price: closePrice,
          change: change,
          change_percent: parseFloat(changePercent),
        });
      } catch (err) {
        console.error(`Error fetching ${stock.code}:`, err);
      }
    }
    
    console.log(`成功抓取 ${stocksData.length} 檔股票資料`);
    console.log('資料:', stocksData);
    
    // 第三步：寫入 Supabase
    console.log('正在寫入 Supabase...');
    
    // 先清空舊資料
    await supabase.from('stock_prices').delete().neq('id', 0);
    
    // 寫入新資料
    const { error } = await supabase.from('stock_prices').insert(stocksData);
    
    if (error) {
      console.error('寫入 Supabase 錯誤:', error);
    } else {
      console.log(`成功寫入 ${stocksData.length} 筆資料到 Supabase`);
    }
    
  } catch (error) {
    console.error('錯誤:', error);
  }
}

fetchAllStocks();
