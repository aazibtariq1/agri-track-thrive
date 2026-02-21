import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp, Trash2, Pencil, WifiOff, Download, Search } from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUserFriendlyError } from "@/lib/error-handler";
import { incomeSchema, formatValidationError } from "@/lib/validation-schemas";
import { formatPKR } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { addToQueue, getQueue, type QueueEntry } from "@/lib/offline-queue";
import { NoCropsWarning } from "@/components/NoCropsWarning";

interface Income {
  id: string;
  source: string;
  amount: number;
  description: string | null;
  income_date: string;
  crop_id: string | null;
}

interface Crop {
  id: string;
  crop_name: string;
}

const sources = ["crop_sale", "livestock", "equipment_rental", "consultation", "other"];

export default function Income() {
  const [income, setIncome] = useState<Income[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [offlineEntries, setOfflineEntries] = useState<QueueEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [formData, setFormData] = useState({
    source: "crop_sale",
    amount: "",
    description: "",
    income_date: new Date().toISOString().split("T")[0],
    crop_id: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline, refreshPendingCount } = useOnlineStatus();

  const isEditing = editingId !== null;

  useEffect(() => {
    checkAuth();
    loadIncome();
    loadCrops();
    loadOfflineEntries();
  }, []);

  const loadOfflineEntries = () => {
    setOfflineEntries(getQueue().filter(e => e.table === 'income'));
  };

  const resetForm = () => {
    setFormData({
      source: "crop_sale",
      amount: "",
      description: "",
      income_date: new Date().toISOString().split("T")[0],
      crop_id: "",
    });
    setEditingId(null);
  };

  const handleEdit = (inc: Income) => {
    setFormData({
      source: inc.source,
      amount: inc.amount.toString(),
      description: inc.description || "",
      income_date: inc.income_date,
      crop_id: inc.crop_id || "",
    });
    setEditingId(inc.id);
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const loadCrops = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("crops").select("id, crop_name").eq("user_id", user.id).order("crop_name");
      if (error) throw error;
      setCrops(data || []);
    } catch (error: any) {
      console.error('Load crops error:', error);
      toast({ title: "Error loading crops", description: getUserFriendlyError(error), variant: "destructive" });
    }
  };

  const loadIncome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("income").select("*").eq("user_id", user.id).order("income_date", { ascending: false });
      if (error) throw error;
      setIncome(data || []);
    } catch (error: any) {
      console.error('Load income error:', error);
      toast({ title: "Error loading income", description: getUserFriendlyError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validationResult = incomeSchema.safeParse({
        source: formData.source,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        income_date: formData.income_date,
        crop_id: formData.crop_id,
      });

      if (!validationResult.success) {
        toast({ title: "Validation Error", description: formatValidationError(validationResult.error), variant: "destructive" });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!isOnline) {
        addToQueue('income', {
          user_id: user.id,
          source: formData.source,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          income_date: formData.income_date,
          crop_id: formData.crop_id || null,
        });
        toast({ title: "Saved offline", description: "Income will sync when you're back online." });
        setOpen(false);
        resetForm();
        loadOfflineEntries();
        refreshPendingCount();
        return;
      }

      if (isEditing) {
        const { error } = await supabase.from("income").update({
          source: formData.source,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          income_date: formData.income_date,
          crop_id: formData.crop_id || null,
        }).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Income updated successfully", description: `PKR ${formData.amount} income updated.` });
      } else {
        const { error } = await supabase.from("income").insert([{
          user_id: user.id,
          source: formData.source,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          income_date: formData.income_date,
          crop_id: formData.crop_id || null,
        }]);
        if (error) throw error;
        toast({ title: "Income added successfully", description: `PKR ${formData.amount} income recorded.` });
      }

      setOpen(false);
      resetForm();
      loadIncome();
    } catch (error: any) {
      console.error('Save income error:', error);
      toast({ title: isEditing ? "Error updating income" : "Error adding income", description: getUserFriendlyError(error), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("income").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Income deleted", description: "Income record removed successfully." });
      loadIncome();
    } catch (error: any) {
      console.error('Delete income error:', error);
      toast({ title: "Error deleting income", description: getUserFriendlyError(error), variant: "destructive" });
    }
  };

  const filteredIncome = income.filter((inc) => {
    const matchesSearch = searchQuery === "" ||
      inc.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (crops.find(c => c.id === inc.crop_id)?.crop_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFrom = !fromDate || inc.income_date >= fromDate;
    const matchesTo = !toDate || inc.income_date <= toDate;
    return matchesSearch && matchesFrom && matchesTo;
  });

  const totalIncome = filteredIncome.reduce((sum, inc) => sum + Number(inc.amount), 0);

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
          <div className="flex gap-2">
            {income.length > 0 && (
              <Button variant="outline" onClick={() => {
                const headers = ["Date", "Source", "Crop", "Amount (PKR)", "Description"];
                const rows = filteredIncome.map(inc => [
                  inc.income_date, inc.source.split("_").join(" "),
                  crops.find(c => c.id === inc.crop_id)?.crop_name || "-",
                  Number(inc.amount).toFixed(2), inc.description || "",
                ]);
                exportToCSV(`income_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
              }}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            )}
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button disabled={crops.length === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Income
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Income" : "Add New Income"}</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Update the income details" : "Record new farm income"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source *</Label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label htmlFor="amount">Amount (PKR) *</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income_date">Date *</Label>
                  <Input id="income_date" type="date" value={formData.income_date}
                    onChange={(e) => setFormData({ ...formData, income_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crop_id">Crop *</Label>
                  <Select value={formData.crop_id || undefined} onValueChange={(value) => setFormData({ ...formData, crop_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select a crop" /></SelectTrigger>
                    <SelectContent>
                      {crops.map((crop) => (
                        <SelectItem key={crop.id} value={crop.id}>{crop.crop_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about this income..." />
                </div>
                <Button type="submit" className="w-full">
                  {!isOnline && <WifiOff className="mr-2 h-4 w-4" />}
                  {isEditing ? "Update Income" : isOnline ? "Add Income" : "Save Offline"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {crops.length === 0 && <NoCropsWarning context="income" />}

        {/* Search & Date Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by source, crop, description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[150px]" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[150px]" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Total Income
            </CardTitle>
            <CardDescription className="text-3xl font-bold text-primary">
              {formatPKR(totalIncome)}
            </CardDescription>
          </CardHeader>
        </Card>

        {offlineEntries.length > 0 && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <WifiOff className="h-4 w-4" />
                Pending Offline Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offlineEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.data.income_date}</TableCell>
                      <TableCell className="capitalize">{entry.data.source?.split("_").join(" ")}</TableCell>
                      <TableCell className="text-right">{formatPKR(Number(entry.data.amount))}</TableCell>
                      <TableCell><Badge variant="secondary">Offline</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {income.length === 0 && offlineEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No income recorded</h3>
              <p className="text-muted-foreground mb-4">Start tracking your farm income</p>
              <Button onClick={() => setOpen(true)} disabled={crops.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Button>
            </CardContent>
          </Card>
        ) : income.length > 0 && (
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
                    <TableHead>Crop</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncome.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell>{new Date(inc.income_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">
                        {inc.source.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                      </TableCell>
                      <TableCell>{crops.find(c => c.id === inc.crop_id)?.crop_name || "-"}</TableCell>
                      <TableCell>{inc.description || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-primary">{formatPKR(Number(inc.amount))}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(inc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Income</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this income of {formatPKR(Number(inc.amount))}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(inc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
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
