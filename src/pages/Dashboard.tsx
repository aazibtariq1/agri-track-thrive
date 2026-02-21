import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import { DollarSign, TrendingDown, TrendingUp, Sprout } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
 import WeatherWidget from "@/components/WeatherWidget";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeCrops: 0,
    thisMonthIncome: 0,
    lastMonthIncome: 0,
    thisMonthExpenses: 0,
    lastMonthExpenses: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total income with dates
      const { data: incomeData } = await supabase
        .from("income")
        .select("amount, income_date")
        .eq("user_id", user.id);

      // Get total expenses with dates
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("amount, category, expense_date")
        .eq("user_id", user.id);

      // Get active crops
      const { data: cropsData } = await supabase
        .from("crops")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["planted", "growing"]);

      const totalIncome = incomeData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      // Month-over-month calculations
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];

      const thisMonthIncome = incomeData?.filter(i => i.income_date >= thisMonthStart).reduce((s, i) => s + Number(i.amount), 0) || 0;
      const lastMonthIncome = incomeData?.filter(i => i.income_date >= lastMonthStart && i.income_date < thisMonthStart).reduce((s, i) => s + Number(i.amount), 0) || 0;
      const thisMonthExpenses = expensesData?.filter(e => e.expense_date >= thisMonthStart).reduce((s, e) => s + Number(e.amount), 0) || 0;
      const lastMonthExpenses = expensesData?.filter(e => e.expense_date >= lastMonthStart && e.expense_date < thisMonthStart).reduce((s, e) => s + Number(e.amount), 0) || 0;

      // Calculate expenses by category
      const categoryMap = new Map();
      expensesData?.forEach((expense) => {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + Number(expense.amount));
      });

      const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      setStats({
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        activeCrops: cropsData?.length || 0,
        thisMonthIncome,
        lastMonthIncome,
        thisMonthExpenses,
        lastMonthExpenses,
      });

      setExpensesByCategory(categoryData);

      // Mock monthly data for demo
      setMonthlyData([
        { month: "Jan", income: totalIncome * 0.15, expenses: totalExpenses * 0.15 },
        { month: "Feb", income: totalIncome * 0.18, expenses: totalExpenses * 0.18 },
        { month: "Mar", income: totalIncome * 0.22, expenses: totalExpenses * 0.20 },
        { month: "Current", income: totalIncome * 0.45, expenses: totalExpenses * 0.47 },
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#8884d8", "#82ca9d", "#ffc658"];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
         <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">Your farm's financial summary at a glance</p>
        </div>
 
         {/* Weather Widget */}
         <WeatherWidget />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Income"
            value={`PKR ${stats.totalIncome.toFixed(2)}`}
            icon={TrendingUp}
            trend={stats.lastMonthIncome > 0 ? {
              value: `${stats.thisMonthIncome >= stats.lastMonthIncome ? "+" : ""}${((stats.thisMonthIncome - stats.lastMonthIncome) / stats.lastMonthIncome * 100).toFixed(0)}% vs last month`,
              positive: stats.thisMonthIncome >= stats.lastMonthIncome,
            } : undefined}
          />
          <StatCard
            title="Total Expenses"
            value={`PKR ${stats.totalExpenses.toFixed(2)}`}
            icon={TrendingDown}
            trend={stats.lastMonthExpenses > 0 ? {
              value: `${stats.thisMonthExpenses >= stats.lastMonthExpenses ? "+" : ""}${((stats.thisMonthExpenses - stats.lastMonthExpenses) / stats.lastMonthExpenses * 100).toFixed(0)}% vs last month`,
              positive: stats.thisMonthExpenses < stats.lastMonthExpenses,
            } : undefined}
          />
          <StatCard
            title="Net Profit"
            value={`PKR ${stats.netProfit.toFixed(2)}`}
            icon={DollarSign}
            trend={{
              value: stats.netProfit >= 0 ? "Profitable" : "Loss",
              positive: stats.netProfit >= 0,
            }}
          />
          <StatCard
            title="Active Crops"
            value={stats.activeCrops}
            icon={Sprout}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Income vs Expenses</CardTitle>
              <CardDescription>Track your financial trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>See where your money is going</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
