import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cropSchema, formatValidationError } from "@/lib/validation-schemas";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, TrendingUp } from "lucide-react";
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

export default function Crops() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    crop_name: "",
    crop_type: "",
    planting_date: "",
    harvest_date: "",
    expected_yield: "",
    market_price: "",
    status: "planted",
    notes: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadCrops();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
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
      toast({
        title: "Error loading crops",
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

      // Validate input using Zod schema before database insert
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
        toast({
          title: "Validation Error",
          description: formatValidationError(validationResult.error),
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("crops").insert([
        {
          user_id: user.id,
          crop_name: validationResult.data.crop_name,
          crop_type: validationResult.data.crop_type,
          planting_date: validationResult.data.planting_date,
          harvest_date: validationResult.data.harvest_date || null,
          expected_yield: validationResult.data.expected_yield || null,
          market_price: validationResult.data.market_price || null,
          status: formData.status,
          notes: validationResult.data.notes || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Crop added successfully",
        description: `${validationResult.data.crop_name} has been added to your records.`,
      });

      setOpen(false);
      setFormData({
        crop_name: "",
        crop_type: "",
        planting_date: "",
        harvest_date: "",
        expected_yield: "",
        market_price: "",
        status: "planted",
        notes: "",
      });
      loadCrops();
    } catch (error: any) {
      toast({
        title: "Error adding crop",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planted":
        return "bg-blue-500";
      case "growing":
        return "bg-primary";
      case "harvested":
        return "bg-secondary";
      case "sold":
        return "bg-accent";
      default:
        return "bg-muted";
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Crop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Crop</DialogTitle>
                <DialogDescription>Enter the details of your new crop</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crop_name">Crop Name *</Label>
                    <Input
                      id="crop_name"
                      value={formData.crop_name}
                      onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crop_type">Crop Type *</Label>
                    <Input
                      id="crop_type"
                      value={formData.crop_type}
                      onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planting_date">Planting Date *</Label>
                    <Input
                      id="planting_date"
                      type="date"
                      value={formData.planting_date}
                      onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="harvest_date">Expected Harvest Date</Label>
                    <Input
                      id="harvest_date"
                      type="date"
                      value={formData.harvest_date}
                      onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected_yield">Expected Yield (mands)</Label>
                    <Input
                      id="expected_yield"
                      type="number"
                      step="0.01"
                      value={formData.expected_yield}
                      onChange={(e) => setFormData({ ...formData, expected_yield: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="market_price">Market Price (PKR/mand)</Label>
                    <Input
                      id="market_price"
                      type="number"
                      step="0.01"
                      value={formData.market_price}
                      onChange={(e) => setFormData({ ...formData, market_price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planted">Planted</SelectItem>
                      <SelectItem value="growing">Growing</SelectItem>
                      <SelectItem value="harvested">Harvested</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this crop..."
                  />
                </div>
                <Button type="submit" className="w-full">Add Crop</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {crops.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No crops yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first crop</p>
              <Button onClick={() => setOpen(true)}>
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
                    <Badge className={getStatusColor(crop.status)}>
                      {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
                    </Badge>
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
