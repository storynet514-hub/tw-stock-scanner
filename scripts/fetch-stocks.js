const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAllStocks() {
  try {
    console.log('正在抓取台股資料...');
    
    // 直接用已知的股票代號測試
    const testStocks = [
      { code: '2330', name: '台積電' },
      { code: '2317', name: '鴻海' },
      { code: '2454', name: '聯發科' },
    ];
    
    const stocksData = [];
    
    for (const stock of testStocks) {
      try {
        const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&stockNo=${stock.code}`;
        console.log(`抓取 ${stock.code}...`);
        
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        });
        
        const text = await res.text();
        console.log(`${stock.code} 回傳前 200 字元:`, text.substring(0, 200));
        
        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          console.error(`${stock.code} JSON 解析失敗:`, e.message);
          continue;
        }
        
        console.log(`${stock.code} stat:`, json.stat);
        
        if (!json.data || json.data.length === 0) {
          console.log(`${stock.code} 沒有資料`);
          continue;
        }
        
        const lastRow = json.data[json.data.length - 1];
        console.log(`${stock.code} 最後一筆:`, lastRow);
        
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
    
    // 寫入 Supabase
    console.log('正在寫入 Supabase...');
    
    await supabase.from('stock_prices').delete().neq('id', 0);
    
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
