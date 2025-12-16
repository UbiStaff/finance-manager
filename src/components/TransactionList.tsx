import { Trash2 } from 'lucide-react';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  time: string;
  note: string;
  category: { name: string };
  account: { name: string };
}

export default function TransactionList({ transactions, onDelete }: { transactions: Transaction[], onDelete: (id: number) => void }) {
  return (
    <div className="bg-white rounded shadow-md overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">日期</th>
            <th className="p-3">类型</th>
            <th className="p-3">分类</th>
            <th className="p-3">账户</th>
            <th className="p-3">备注</th>
            <th className="p-3 text-right">金额</th>
            <th className="p-3 text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id} className="border-t">
              <td className="p-3">{new Date(t.time).toLocaleDateString()}</td>
              <td className="p-3">{t.type === 'income' ? '收入' : '支出'}</td>
              <td className="p-3">{t.category?.name}</td>
              <td className="p-3">{t.account?.name}</td>
              <td className="p-3">{t.note}</td>
              <td className={`p-3 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)}
              </td>
              <td className="p-3 text-center">
                <button onClick={() => onDelete(t.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-gray-500">暂无交易记录。</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
