import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Category { id: number; name: string; type: string; }
interface Account { id: number; name: string; }

export default function Settings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');
  const [newAccName, setNewAccName] = useState('');

  const fetchData = () => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/accounts').then(res => res.json()).then(setAccounts);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addCategory = async () => {
    if (!newCatName) return;
    await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, type: newCatType })
    });
    setNewCatName('');
    fetchData();
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('确定要删除该分类吗？如果已被使用则无法删除。')) return;
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        alert('无法删除：该分类下已有交易记录');
    } else {
        fetchData();
    }
  };

  const addAccount = async () => {
    if (!newAccName) return;
    await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAccName })
    });
    setNewAccName('');
    fetchData();
  };

  const deleteAccount = async (id: number) => {
    if (!confirm('确定要删除该账户吗？如果已被使用则无法删除。')) return;
    const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        alert('无法删除：该账户下已有交易记录');
    } else {
        fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-center gap-4">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">管理分类与账户</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">分类管理</h2>
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="分类名称" 
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="border p-2 rounded flex-1"
                />
                <select 
                    value={newCatType} 
                    onChange={e => setNewCatType(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="expense">支出</option>
                    <option value="income">收入</option>
                </select>
                <button onClick={addCategory} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    <Plus size={20} />
                </button>
            </div>
            <ul className="space-y-2">
                {categories.map(c => (
                    <li key={c.id} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                        <span>{c.name} <span className="text-xs text-gray-500">({c.type === 'income' ? '收入' : '支出'})</span></span>
                        <button onClick={() => deleteCategory(c.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={16} />
                        </button>
                    </li>
                ))}
            </ul>
        </div>

        {/* Accounts Section */}
        <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">账户管理</h2>
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="账户名称 (如: 支付宝)" 
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                    className="border p-2 rounded flex-1"
                />
                <button onClick={addAccount} className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
                    <Plus size={20} />
                </button>
            </div>
            <ul className="space-y-2">
                {accounts.map(a => (
                    <li key={a.id} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                        <span>{a.name}</span>
                        <button onClick={() => deleteAccount(a.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={16} />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
}
