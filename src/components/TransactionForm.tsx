import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface Category { id: number; name: string; type: string; }
interface Account { id: number; name: string; }

export default function TransactionForm({ onSave }: { onSave: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    time: new Date().toISOString().split('T')[0],
    note: '',
    categoryId: '',
    accountId: ''
  });

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/accounts').then(res => res.json()).then(setAccounts);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setFormData({ ...formData, amount: '', note: '' });
    onSave();
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow-md space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><Plus size={20} /> 添加交易</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">类型</label>
          <select 
            value={formData.type} 
            onChange={e => setFormData({...formData, type: e.target.value, categoryId: ''})}
            className="w-full border p-2 rounded"
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">金额</label>
          <input 
            type="number" 
            value={formData.amount} 
            onChange={e => setFormData({...formData, amount: e.target.value})}
            className="w-full border p-2 rounded" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium">分类</label>
          <select 
            value={formData.categoryId} 
            onChange={e => setFormData({...formData, categoryId: e.target.value})}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">选择分类</option>
            {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">账户</label>
          <select 
            value={formData.accountId} 
            onChange={e => setFormData({...formData, accountId: e.target.value})}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">选择账户</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">日期</label>
          <input 
            type="date" 
            value={formData.time} 
            onChange={e => setFormData({...formData, time: e.target.value})}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">备注</label>
          <input 
            type="text" 
            value={formData.note} 
            onChange={e => setFormData({...formData, note: e.target.value})}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">保存交易</button>
    </form>
  );
}
