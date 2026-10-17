import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
 Form,
 FormControl,
 FormDescription,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHomeStore } from "@/stores/useHomeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ArrowLeft, Check, Camera } from "lucide-react";
import { toast } from "sonner";
import { HomeType } from "@/types/home";
import { motion } from "motion/react";

const formSchema = z.object({
 name: z.string().min(2, "Name must be at least 2 characters").max(50),
 nickname: z.string().max(30).optional(),
 homeType: z.string().min(1, "Please select a home type"),
 address: z.string().max(100).optional(),
 floors: z.coerce.number().min(1).max(10),
 yearBuilt: z.coerce.number().min(1800).max(new Date().getFullYear()).optional(),
 description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

import { processImageForStorage } from "@/services/storageService";

export function HomeCreatePage() {
 const navigate = useNavigate();
 const { user } = useAuthStore();
 const { addHome } = useHomeStore();
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

 const getHomeTypeLabel = (val: string) => {
 switch (val) {
 case "house": return "Single Family House";
 case "apartment": return "Apartment";
 case "condo": return "Condo";
 case "townhouse": return "Townhouse";
 case "other": return "Other";
 default: return "";
 }
 };

 const form = useForm<FormValues>({
 resolver: zodResolver(formSchema) as any,
 defaultValues: {
 name: "",
 nickname: "",
 homeType: "",
 address: "",
 floors: 1,
 yearBuilt: undefined,
 description: "",
 } as any,
 });

 const onSubmit = async (values: z.infer<typeof formSchema>) => {
 if (!user) {
 toast.error("You must be logged in to add a property");
 return;
 }

 setIsSubmitting(true);
 
 try {
 await addHome(user.uid, {
 ...values,
 homeType: values.homeType as HomeType,
 coverImage: coverImagePreview || undefined,
 });
 
 toast.success("Property added successfully");
 navigate("/properties");
 } catch (error) {
 console.error(error);
 toast.error("Failed to add property");
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 const file = e.target.files[0];
 const photoUrl = await processImageForStorage(file);
 setCoverImagePreview(photoUrl);
 }
 };

 return (
 <div className="max-w-2xl space-y-10">
 <div className="flex items-center gap-4">
 <Button variant="ghost" onClick={() => navigate("/properties")}>
 <ArrowLeft className="w-4 h-4 mr-2" /> Properties
 </Button>
 </div>

 <div>
 <span className="field-tag text-muted-foreground block mb-2">New Property</span>
 <h1 className="text-4xl font-semibold tracking-tight mb-2">Setup Property</h1>
 <p className="text-muted-foreground text-lg">Create a new environment to begin tracking safety metrics.</p>
 </div>

 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
 
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-card p-8 md:p-10 border border-border space-y-8"
 >
 <div className="grid md:grid-cols-2 gap-8">
 <FormField
 control={form.control}
 name="name"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground">Property Name</FormLabel>
 <FormControl>
 <Input className="h-11" placeholder="e.g. Primary Residence" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 
 <FormField
 control={form.control}
 name="homeType"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground">Property Type</FormLabel>
 <Select onValueChange={field.onChange} value={field.value || ""}>
 <FormControl>
 <SelectTrigger className="h-12 w-full h-11">
 <span className="flex flex-1 text-left truncate">
 {getHomeTypeLabel(field.value) || "Select type"}
 </span>
 </SelectTrigger>
 </FormControl>
 <SelectContent className="rounded-md">
 <SelectItem value="house">Single Family House</SelectItem>
 <SelectItem value="apartment">Apartment</SelectItem>
 <SelectItem value="condo">Condo</SelectItem>
 <SelectItem value="townhouse">Townhouse</SelectItem>
 <SelectItem value="other">Other</SelectItem>
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="address"
 render={({ field }) => (
 <FormItem className="md:col-span-2">
 <FormLabel className="text-muted-foreground">Address (Optional)</FormLabel>
 <FormControl>
 <Input className="h-11" placeholder="123 Main St, City, State" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 
 <FormField
 control={form.control}
 name="floors"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground">Number of Floors</FormLabel>
 <FormControl>
 <Input type="number" className="h-11" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="yearBuilt"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground">Year Built (Optional)</FormLabel>
 <FormControl>
 <Input type="number" className="h-11" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>

 <div>
 <label className="text-sm font-medium block mb-3 text-muted-foreground">Cover Photo (Optional)</label>
 {coverImagePreview ? (
 <div className="relative overflow-hidden bg-muted h-64 group cursor-pointer brackets text-foreground/20" onClick={() => document.getElementById('cover-upload')?.click()}>
 <div className="bracket-tl" /><div className="bracket-br" />
 <img src={coverImagePreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <span className="text-white text-sm font-medium">Change Photo</span>
 </div>
 </div>
 ) : (
 <div 
 className="h-64 border-2 border-dashed border-border flex flex-col items-center justify-center text-center transition-colors hover:bg-muted/40 cursor-pointer"
 onClick={() => document.getElementById('cover-upload')?.click()}
 >
 <div className="w-12 h-12 border border-border flex items-center justify-center mb-4">
 <Camera className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
 </div>
 <p className="font-medium">Add a photo</p>
 <p className="text-sm text-muted-foreground mt-1 max-w-xs">Upload a clear photo to help identify this property</p>
 </div>
 )}
 <input 
 id="cover-upload" 
 type="file" 
 accept="image/*" 
 className="hidden" 
 onChange={handleImageUpload}
 />
 </div>
 </motion.div>

 <div className="flex justify-end gap-4">
 <Button 
 type="button" 
 variant="ghost" 
 onClick={() => navigate("/properties")} 
 disabled={isSubmitting}
 >
 Cancel
 </Button>
 <Button 
 type="submit" 
 variant="brand"
 disabled={isSubmitting}
 >
 {isSubmitting ? "Creating..." : "Create Property"}
 </Button>
 </div>
 
 </form>
 </Form>
 </div>
 );
}
