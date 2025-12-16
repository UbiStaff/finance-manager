import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  amount: number;
  type: string;
  category: { name: string };
  time: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function Dashboard({ transactions }: { transactions: Transaction[] }) {
  // Process data for charts
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // By Category (Pie)
  const categoryData = expenseTransactions.reduce((acc, t) => {
    const cat = t.category?.name || '未分类';
    acc[cat] = (acc[cat] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  // By Month (Bar)
  const monthData = transactions.reduce((acc, t) => {
    const date = new Date(t.time);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0 };
    if (t.type === 'income') acc[month].income += t.amount;
    else acc[month].expense += t.amount;
    return acc;
  }, {} as Record<string, { name: string, income: number, expense: number }>);
  
  const barData = Object.values(monthData).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-4 rounded shadow-md">
        <h3 className="text-lg font-bold mb-4">支出按分类统计</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow-md">
        <h3 className="text-lg font-bold mb-4">月度收支对比</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#82ca9d" name="收入" />
              <Bar dataKey="expense" fill="#ff8042" name="支出" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
