const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAllStocks() {
  try {
    console.log('正在抓取所有台股代號...');
    
    // 第一步：抓取所有上市股票代號
    const allStocksUrl = 'https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json';
    const allStocksRes = await fetch(allStocksUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const allStocksJson = await allStocksRes.json();
    
    console.log('API 回傳:', JSON.stringify(allStocksJson, null, 2).substring(0, 500));
    
    const allStocks = [];
    
    // 檢查回傳格式
    if (!allStocksJson.data || !Array.isArray(allStocksJson.data)) {
      console.error('錯誤：API 回傳格式不對，data 不是陣列');
      console.error('回傳內容:', allStocksJson);
      return;
    }
    
    for (const category of allStocksJson.data) {
      if (category && category.type === '上市股票' && category.data && Array.isArray(category.data)) {
        for (const stock of category.data) {
          if (stock && stock[0]) {
            allStocks.push({
              code: stock[0],
              name: stock[1] || '',
            });
          }
        }
      }
    }
    
    console.log(`成功抓取 ${allStocks.length} 檔上市股票`);
    
    if (allStocks.length === 0) {
      console.error('錯誤：沒有抓取到任何股票');
      return;
    }
    
    // 第二步：並行抓取股價（每 10 檔一組）
    const stocksData = [];
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
            return null;
          }
          
          const lastRow = json.data[json.data.length - 1];
          const closePrice = lastRow ? parseFloat(lastRow[6].replace(/,/g, '')) : 0;
          const change = lastRow ? parseFloat(lastRow[7].replace(/,/g, '')) : 0;
          const prevClose = closePrice - change;
          const changePercent = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : 0;

          return {
            symbol: stock.code,
            name: stock.name,
            close_price: closePrice,
            change: change,
            change_percent: parseFloat(changePercent),
          };
        } catch (err) {
          console.error(`Error fetching ${stock.code}:`, err);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      stocksData.push(...batchResults.filter(r => r !== null));
      
      console.log(`已抓取 ${Math.min(i + batchSize, allStocks.length)} / ${allStocks.length} 檔`);
    }
    
    console.log(`成功抓取 ${stocksData.length} 檔股票資料`);
    
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
