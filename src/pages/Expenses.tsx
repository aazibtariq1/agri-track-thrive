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
 import { Plus, TrendingDown, Trash2, Pencil } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { getUserFriendlyError } from "@/lib/error-handler";
 import { expenseSchema, formatValidationError } from "@/lib/validation-schemas";
 import { formatPKR } from "@/lib/utils";
 
 interface Expense {
   id: string;
   category: string;
   amount: number;
   description: string | null;
   expense_date: string;
   crop_id: string | null;
 }
 
 interface Crop {
   id: string;
   crop_name: string;
 }
 
 const categories = [
   "seeds",
   "fertilizers",
   "pesticides",
   "labor",
   "machinery",
   "water",
   "electricity",
   "fuel",
   "maintenance",
   "other",
 ];
 
 export default function Expenses() {
   const [expenses, setExpenses] = useState<Expense[]>([]);
   const [crops, setCrops] = useState<Crop[]>([]);
   const [loading, setLoading] = useState(true);
   const [open, setOpen] = useState(false);
   const [editingId, setEditingId] = useState<string | null>(null);
   const [formData, setFormData] = useState({
     category: "seeds",
     amount: "",
     description: "",
     expense_date: new Date().toISOString().split("T")[0],
     crop_id: "",
   });
   const navigate = useNavigate();
   const { toast } = useToast();
 
   const isEditing = editingId !== null;
 
   useEffect(() => {
     checkAuth();
     loadExpenses();
     loadCrops();
   }, []);
 
   const resetForm = () => {
     setFormData({
       category: "seeds",
       amount: "",
       description: "",
       expense_date: new Date().toISOString().split("T")[0],
       crop_id: "",
     });
     setEditingId(null);
   };
 
   const handleEdit = (expense: Expense) => {
     setFormData({
       category: expense.category,
       amount: expense.amount.toString(),
       description: expense.description || "",
       expense_date: expense.expense_date,
       crop_id: expense.crop_id || "",
     });
     setEditingId(expense.id);
     setOpen(true);
   };
 
   const handleOpenChange = (isOpen: boolean) => {
     setOpen(isOpen);
     if (!isOpen) {
       resetForm();
     }
   };
 
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
         .select("id, crop_name")
         .eq("user_id", user.id)
         .order("crop_name");
 
       if (error) throw error;
       setCrops(data || []);
     } catch (error: any) {
       console.error('Load crops error:', error);
       toast({
         title: "Error loading crops",
         description: getUserFriendlyError(error),
         variant: "destructive",
       });
     }
   };
 
   const loadExpenses = async () => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
 
       const { data, error } = await supabase
         .from("expenses")
         .select("*")
         .eq("user_id", user.id)
         .order("expense_date", { ascending: false });
 
       if (error) throw error;
       setExpenses(data || []);
     } catch (error: any) {
       console.error('Load expenses error:', error);
       toast({
         title: "Error loading expenses",
         description: getUserFriendlyError(error),
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       const validationResult = expenseSchema.safeParse({
         category: formData.category,
         amount: parseFloat(formData.amount),
         description: formData.description || undefined,
         expense_date: formData.expense_date,
         crop_id: formData.crop_id || undefined,
       });
 
       if (!validationResult.success) {
         toast({
           title: "Validation Error",
           description: formatValidationError(validationResult.error),
           variant: "destructive",
         });
         return;
       }
 
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
 
       if (isEditing) {
         const { error } = await supabase
           .from("expenses")
           .update({
             category: formData.category,
             amount: parseFloat(formData.amount),
             description: formData.description || null,
             expense_date: formData.expense_date,
             crop_id: formData.crop_id || null,
           })
           .eq("id", editingId);
 
         if (error) throw error;
 
         toast({
           title: "Expense updated successfully",
           description: `PKR ${formData.amount} expense updated.`,
         });
       } else {
         const { error } = await supabase.from("expenses").insert([
           {
             user_id: user.id,
             category: formData.category,
             amount: parseFloat(formData.amount),
             description: formData.description || null,
             expense_date: formData.expense_date,
             crop_id: formData.crop_id || null,
           },
         ]);
 
         if (error) throw error;
 
         toast({
           title: "Expense added successfully",
           description: `PKR ${formData.amount} expense recorded.`,
         });
       }
 
       setOpen(false);
       resetForm();
       loadExpenses();
     } catch (error: any) {
       console.error('Save expense error:', error);
       toast({
         title: isEditing ? "Error updating expense" : "Error adding expense",
         description: getUserFriendlyError(error),
         variant: "destructive",
       });
     }
   };
 
   const handleDelete = async (id: string) => {
     try {
       const { error } = await supabase.from("expenses").delete().eq("id", id);
       if (error) throw error;
 
       toast({
         title: "Expense deleted",
         description: "Expense record removed successfully.",
       });
       loadExpenses();
     } catch (error: any) {
       console.error('Delete expense error:', error);
       toast({
         title: "Error deleting expense",
         description: getUserFriendlyError(error),
         variant: "destructive",
       });
     }
   };
 
   const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
 
   if (loading) {
     return (
       <Layout>
         <div className="flex items-center justify-center h-64">
           <p className="text-muted-foreground">Loading expenses...</p>
         </div>
       </Layout>
     );
   }
 
   return (
     <Layout>
       <div className="space-y-6">
         <div className="flex justify-between items-center">
           <div>
             <h2 className="text-3xl font-bold tracking-tight">Expense Tracking</h2>
             <p className="text-muted-foreground">Monitor and manage all farm expenses</p>
           </div>
           <Dialog open={open} onOpenChange={handleOpenChange}>
             <DialogTrigger asChild>
               <Button>
                 <Plus className="mr-2 h-4 w-4" />
                 Add Expense
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>{isEditing ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                 <DialogDescription>
                   {isEditing ? "Update the expense details" : "Record a new farm expense"}
                 </DialogDescription>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="category">Category *</Label>
                   <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {categories.map((cat) => (
                         <SelectItem key={cat} value={cat}>
                           {cat.charAt(0).toUpperCase() + cat.slice(1)}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="amount">Amount (PKR) *</Label>
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
                   <Label htmlFor="expense_date">Date *</Label>
                   <Input
                     id="expense_date"
                     type="date"
                     value={formData.expense_date}
                     onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="crop_id">Crop (Optional)</Label>
                   <Select value={formData.crop_id || undefined} onValueChange={(value) => setFormData({ ...formData, crop_id: value })}>
                     <SelectTrigger>
                       <SelectValue placeholder="Select a crop (optional)" />
                     </SelectTrigger>
                     <SelectContent>
                       {crops.map((crop) => (
                         <SelectItem key={crop.id} value={crop.id}>
                           {crop.crop_name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="description">Description</Label>
                   <Textarea
                     id="description"
                     value={formData.description}
                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     placeholder="Details about this expense..."
                   />
                 </div>
                 <Button type="submit" className="w-full">
                   {isEditing ? "Update Expense" : "Add Expense"}
                 </Button>
               </form>
             </DialogContent>
           </Dialog>
         </div>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <TrendingDown className="h-5 w-5" />
               Total Expenses
             </CardTitle>
             <CardDescription className="text-3xl font-bold text-destructive">
               {formatPKR(totalExpenses)}
             </CardDescription>
           </CardHeader>
         </Card>
 
         {expenses.length === 0 ? (
           <Card>
             <CardContent className="flex flex-col items-center justify-center py-16">
               <TrendingDown className="h-16 w-16 text-muted-foreground mb-4" />
               <h3 className="text-lg font-semibold mb-2">No expenses recorded</h3>
               <p className="text-muted-foreground mb-4">Start tracking your farm expenses</p>
               <Button onClick={() => setOpen(true)}>
                 <Plus className="mr-2 h-4 w-4" />
                 Add Expense
               </Button>
             </CardContent>
           </Card>
         ) : (
           <Card>
             <CardHeader>
               <CardTitle>Recent Expenses</CardTitle>
               <CardDescription>Your latest expense records</CardDescription>
             </CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Date</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead>Crop</TableHead>
                     <TableHead>Description</TableHead>
                     <TableHead className="text-right">Amount</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {expenses.map((expense) => (
                     <TableRow key={expense.id}>
                       <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                       <TableCell className="capitalize">{expense.category}</TableCell>
                       <TableCell>{crops.find(c => c.id === expense.crop_id)?.crop_name || "-"}</TableCell>
                       <TableCell>{expense.description || "-"}</TableCell>
                       <TableCell className="text-right font-medium">{formatPKR(Number(expense.amount))}</TableCell>
                       <TableCell className="text-right space-x-1">
                         <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                           <Pencil className="h-4 w-4" />
                         </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="sm">
                               <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Are you sure you want to delete this expense of {formatPKR(Number(expense.amount))}? This action cannot be undone.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDelete(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                 Delete
                               </AlertDialogAction>
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