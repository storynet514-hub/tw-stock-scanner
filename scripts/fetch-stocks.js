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
    
    console.log('完整回傳:', JSON.stringify(allStocksJson).substring(0, 2000));
    
  } catch (error) {
    console.error('錯誤:', error);
  }
}

fetchAllStocks();
