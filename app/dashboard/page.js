'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_KEY
      );
      const { data } = await supabase.from('stock_prices').select('*');
      setStocks(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div>載入中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">📈 台股即時掃描儀表板</h1>
        <div className="mb-4">共 {stocks.length} 檔股票</div>
        {stocks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">找不到符合的股票</div>
        ) : (
          <table className="min-w-full bg-white rounded shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">代號</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">股價</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">漲跌</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">漲跌幅</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{s.symbol}</td>
                  <td className="px-6 py-4">{s.name}</td>
                  <td className="px-6 py-4">{s.close_price}</td>
                  <td className={`px-6 py-4 ${s.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change}
                  </td>
                  <td className={`px-6 py-4 ${s.change_percent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {s.change_percent >= 0 ? '+' : ''}{s.change_percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
