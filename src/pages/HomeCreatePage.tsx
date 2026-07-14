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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/properties")}
          className="text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Properties
        </Button>
      </div>

      <div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">Setup Property</h1>
        <p className="text-neutral-500 text-lg font-light">Create a new environment to begin tracking safety metrics.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-900 rounded-3xl p-8 md:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8"
          >
             <div className="grid md:grid-cols-2 gap-8">
               <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-500">Property Name</FormLabel>
                      <FormControl>
                        <Input className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800" placeholder="e.g. Primary Residence" {...field} />
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
                      <FormLabel className="text-neutral-500">Property Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="h-12 w-full rounded-xl border-neutral-200 dark:border-neutral-800">
                            <span className="flex flex-1 text-left truncate">
                              {getHomeTypeLabel(field.value) || "Select type"}
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
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
                      <FormLabel className="text-neutral-500">Address (Optional)</FormLabel>
                      <FormControl>
                        <Input className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800" placeholder="123 Main St, City, State" {...field} />
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
                      <FormLabel className="text-neutral-500">Number of Floors</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800" {...field} />
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
                      <FormLabel className="text-neutral-500">Year Built (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>

             <div>
                <label className="text-sm font-medium block mb-3 text-neutral-500">Cover Photo (Optional)</label>
                {coverImagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 h-64 group cursor-pointer" onClick={() => document.getElementById('cover-upload')?.click()}>
                    <img src={coverImagePreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-white font-medium">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="h-64 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                  >
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                      <Camera className="h-6 w-6 text-neutral-400" />
                    </div>
                    <p className="font-medium">Add a photo</p>
                    <p className="text-sm text-neutral-500 mt-1 max-w-xs">Upload a clear photo to help identify this property</p>
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
              className="rounded-full h-12 px-6"
              onClick={() => navigate("/properties")} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="rounded-full h-12 px-8 bg-black text-white shadow-lg transition-transform hover:scale-105"
            >
              {isSubmitting ? "Creating..." : "Create Property"}
            </Button>
          </div>
          
        </form>
      </Form>
    </div>
  );
}
