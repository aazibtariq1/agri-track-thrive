import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cropSchema, formatValidationError } from "@/lib/validation-schemas";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, TrendingUp, Pencil, Trash2, Download } from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import CropFinancialCard from "@/components/CropFinancialCard";

interface Crop {
  id: string;
  crop_name: string;
  crop_type: string;
  planting_date: string;
  harvest_date: string | null;
  expected_yield: number | null;
  actual_yield: number | null;
  market_price: number | null;
  status: string;
  notes: string | null;
}

const INITIAL_FORM = {
  crop_name: "",
  crop_type: "",
  planting_date: "",
  harvest_date: "",
  expected_yield: "",
  actual_yield: "",
  market_price: "",
  status: "planted",
  notes: "",
};

const STATUS_OPTIONS = ["planted", "growing", "harvested", "sold"] as const;

export default function Crops() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadCrops();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const loadCrops = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("crops")
        .select("*")
        .eq("user_id", user.id)
        .order("planting_date", { ascending: false });
      if (error) throw error;
      setCrops(data || []);
    } catch (error: any) {
      toast({ title: "Error loading crops", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setOpen(true);
  };

  const openEditDialog = (crop: Crop) => {
    setEditingId(crop.id);
    setFormData({
      crop_name: crop.crop_name,
      crop_type: crop.crop_type,
      planting_date: crop.planting_date,
      harvest_date: crop.harvest_date || "",
      expected_yield: crop.expected_yield?.toString() || "",
      actual_yield: crop.actual_yield?.toString() || "",
      market_price: crop.market_price?.toString() || "",
      status: crop.status || "planted",
      notes: crop.notes || "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const validationResult = cropSchema.safeParse({
        crop_name: formData.crop_name,
        crop_type: formData.crop_type,
        planting_date: formData.planting_date,
        harvest_date: formData.harvest_date || undefined,
        expected_yield: formData.expected_yield ? parseFloat(formData.expected_yield) : undefined,
        market_price: formData.market_price ? parseFloat(formData.market_price) : undefined,
        notes: formData.notes || undefined,
      });

      if (!validationResult.success) {
        toast({ title: "Validation Error", description: formatValidationError(validationResult.error), variant: "destructive" });
        return;
      }

      const record = {
        crop_name: validationResult.data.crop_name,
        crop_type: validationResult.data.crop_type,
        planting_date: validationResult.data.planting_date,
        harvest_date: validationResult.data.harvest_date || null,
        expected_yield: validationResult.data.expected_yield || null,
        actual_yield: formData.actual_yield ? parseFloat(formData.actual_yield) : null,
        market_price: validationResult.data.market_price || null,
        status: formData.status,
        notes: validationResult.data.notes || null,
      };

      if (editingId) {
        const { error } = await supabase.from("crops").update(record).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Crop updated", description: `${record.crop_name} has been updated.` });
      } else {
        const { error } = await supabase.from("crops").insert([{ ...record, user_id: user.id }]);
        if (error) throw error;
        toast({ title: "Crop added", description: `${record.crop_name} has been added.` });
      }

      setOpen(false);
      setFormData(INITIAL_FORM);
      setEditingId(null);
      loadCrops();
    } catch (error: any) {
      toast({ title: "Error saving crop", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("crops").delete().eq("id", deleteId);
      if (error) throw error;
      toast({ title: "Crop deleted", description: "The crop and its data have been removed." });
      setDeleteId(null);
      loadCrops();
    } catch (error: any) {
      toast({ title: "Error deleting crop", description: error.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (cropId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("crops").update({ status: newStatus }).eq("id", cropId);
      if (error) throw error;
      toast({ title: "Status updated", description: `Crop status changed to ${newStatus}.` });
      loadCrops();
    } catch (error: any) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planted": return "bg-blue-500";
      case "growing": return "bg-primary";
      case "harvested": return "bg-secondary";
      case "sold": return "bg-accent";
      default: return "bg-muted";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading crops...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Crop Management</h2>
            <p className="text-muted-foreground">Track and manage all your crops</p>
          </div>
          <div className="flex gap-2">
            {crops.length > 0 && (
              <Button variant="outline" onClick={() => {
                const headers = ["Crop Name", "Type", "Status", "Planting Date", "Harvest Date", "Expected Yield (mands)", "Actual Yield (mands)", "Market Price (PKR/mand)", "Notes"];
                const rows = crops.map(c => [
                  c.crop_name, c.crop_type, c.status || "", c.planting_date,
                  c.harvest_date || "", c.expected_yield?.toString() || "", c.actual_yield?.toString() || "",
                  c.market_price?.toString() || "", c.notes || "",
                ]);
                exportToCSV(`crops_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
              }}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            )}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingId(null); }}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Crop
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Crop" : "Add New Crop"}</DialogTitle>
                <DialogDescription>{editingId ? "Update the details of your crop" : "Enter the details of your new crop"}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crop_name">Crop Name *</Label>
                    <Input id="crop_name" value={formData.crop_name} onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crop_type">Crop Type *</Label>
                    <Input id="crop_type" value={formData.crop_type} onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planting_date">Planting Date *</Label>
                    <Input id="planting_date" type="date" value={formData.planting_date} onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="harvest_date">Expected Harvest Date</Label>
                    <Input id="harvest_date" type="date" value={formData.harvest_date} onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected_yield">Expected Yield (mands)</Label>
                    <Input id="expected_yield" type="number" step="0.01" value={formData.expected_yield} onChange={(e) => setFormData({ ...formData, expected_yield: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual_yield">Actual Yield (mands)</Label>
                    <Input id="actual_yield" type="number" step="0.01" value={formData.actual_yield} onChange={(e) => setFormData({ ...formData, actual_yield: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="market_price">Market Price (PKR/mand)</Label>
                    <Input id="market_price" type="number" step="0.01" value={formData.market_price} onChange={(e) => setFormData({ ...formData, market_price: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes about this crop..." />
                </div>
                <Button type="submit" className="w-full">{editingId ? "Update Crop" : "Add Crop"}</Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this crop?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Linked expense and income records will no longer reference this crop.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {crops.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No crops yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first crop</p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Crop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {crops.map((crop) => (
              <Card key={crop.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{crop.crop_name}</CardTitle>
                      <CardDescription>{crop.crop_type}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(crop)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(crop.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Status quick-update */}
                  <div className="flex gap-1 flex-wrap mt-2">
                    {STATUS_OPTIONS.map((s) => (
                      <Badge
                        key={s}
                        className={`cursor-pointer ${crop.status === s ? getStatusColor(s) : "bg-muted text-muted-foreground"}`}
                        onClick={() => crop.status !== s && handleStatusChange(crop.id, s)}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Planted: </span>
                    <span className="ml-1">{new Date(crop.planting_date).toLocaleDateString()}</span>
                  </div>
                  {crop.harvest_date && (
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Harvest: </span>
                      <span className="ml-1">{new Date(crop.harvest_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {crop.expected_yield && (
                    <div className="flex items-center text-sm">
                      <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Expected: </span>
                      <span className="ml-1">{crop.expected_yield} mands</span>
                    </div>
                  )}
                  {crop.actual_yield && (
                    <div className="flex items-center text-sm">
                      <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Actual: </span>
                      <span className="ml-1 font-semibold">{crop.actual_yield} mands</span>
                    </div>
                  )}
                  {crop.market_price && (
                    <div className="flex items-center text-sm font-semibold text-primary">
                      PKR {crop.market_price}/mand
                    </div>
                  )}
                  {crop.notes && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{crop.notes}</p>
                  )}
                  <div className="mt-4">
                    <CropFinancialCard cropId={crop.id} cropName={crop.crop_name} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
