import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Income {
  id: string;
  source: string;
  amount: number;
  description: string | null;
  income_date: string;
}

const sources = [
  "crop_sale",
  "livestock",
  "equipment_rental",
  "consultation",
  "other",
];

export default function Income() {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    source: "crop_sale",
    amount: "",
    description: "",
    income_date: new Date().toISOString().split("T")[0],
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadIncome();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadIncome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .order("income_date", { ascending: false });

      if (error) throw error;
      setIncome(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading income",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("income").insert([
        {
          user_id: user.id,
          source: formData.source,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          income_date: formData.income_date,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Income added successfully",
        description: `$${formData.amount} income recorded.`,
      });

      setOpen(false);
      setFormData({
        source: "crop_sale",
        amount: "",
        description: "",
        income_date: new Date().toISOString().split("T")[0],
      });
      loadIncome();
    } catch (error: any) {
      toast({
        title: "Error adding income",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalIncome = income.reduce((sum, inc) => sum + Number(inc.amount), 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading income...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Income Tracking</h2>
            <p className="text-muted-foreground">Record and monitor all farm income</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Income</DialogTitle>
                <DialogDescription>Record new farm income</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source *</Label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((src) => (
                        <SelectItem key={src} value={src}>
                          {src.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income_date">Date *</Label>
                  <Input
                    id="income_date"
                    type="date"
                    value={formData.income_date}
                    onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about this income..."
                  />
                </div>
                <Button type="submit" className="w-full">Add Income</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Total Income
            </CardTitle>
            <CardDescription className="text-3xl font-bold text-primary">
              ${totalIncome.toFixed(2)}
            </CardDescription>
          </CardHeader>
        </Card>

        {income.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No income recorded</h3>
              <p className="text-muted-foreground mb-4">Start tracking your farm income</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Income</CardTitle>
              <CardDescription>Your latest income records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {income.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell>{new Date(inc.income_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">
                        {inc.source.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                      </TableCell>
                      <TableCell>{inc.description || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-primary">${Number(inc.amount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
