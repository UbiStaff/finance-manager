import React, { useState, useEffect } from 'react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import Dashboard from '../components/Dashboard';
import { Upload, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(setTransactions)
      .catch(console.error);
  }, [refresh]);

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除吗？')) {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      setRefresh(r => r + 1);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/transactions/import', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            alert(`导入成功！\n共解析到 ${data.totalFound} 条数据\n成功导入 ${data.count} 条新记录\n(重复记录已自动跳过)`);
            setRefresh(r => r + 1);
        } else {
            alert('导入失败：' + data.error);
        }
    } catch (err) {
        alert('导入请求失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">个人收支管理系统</h1>
        <div className="flex gap-4">
             <Link to="/settings" className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                <Settings size={18} /> 管理分类/账户
             </Link>
             <label className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-700">
                <Upload size={18} /> 导入 Excel/CSV
                <input type="file" accept=".xlsx,.csv" className="hidden" onChange={handleImport} />
             </label>
        </div>
      </header>

      <Dashboard transactions={transactions} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <TransactionForm onSave={() => setRefresh(r => r + 1)} />
        </div>
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">最近交易记录</h2>
            <TransactionList transactions={transactions} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
