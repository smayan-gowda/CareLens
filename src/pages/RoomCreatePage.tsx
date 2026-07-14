import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { RoomType } from "@/types/home";
import { motion } from "motion/react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  type: z.string().min(1, "Please select a room type"),
  floor: z.coerce.number().min(-5).max(20),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RoomCreatePage() {
  const { homeId } = useParams();
  const navigate = useNavigate();
  const { homes, addRoom } = useHomeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const getRoomTypeLabel = (val: string) => {
    switch (val) {
      case "bathroom": return "Bathroom";
      case "bedroom": return "Bedroom";
      case "kitchen": return "Kitchen";
      case "living": return "Living Room";
      case "dining": return "Dining Room";
      case "hallway": return "Hallway";
      case "staircase": return "Staircase";
      case "custom": return "Other";
      default: return "";
    }
  };

  const home = homes.find(h => h.id === homeId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      type: "",
      floor: 1,
      description: "",
    } as any,
  });

  if (!home) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-medium mb-2">Property not found</h2>
        <Button onClick={() => navigate("/properties")} className="rounded-full">Return to Properties</Button>
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      await addRoom(home.id, {
        ...values,
        type: values.type as RoomType,
        coverImage: coverImagePreview || undefined,
      });
      
      toast.success("Zone added successfully");
      navigate(`/properties/${home.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add zone");
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
          onClick={() => navigate(`/properties/${home.id}`)}
          className="text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">Add a Zone</h1>
        <p className="text-neutral-500 text-lg font-light">Configure a new monitoring zone for {home.name}</p>
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
                      <FormLabel className="text-neutral-500">Zone Name</FormLabel>
                      <FormControl>
                        <Input className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800" placeholder="e.g. Master Bathroom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-500">Zone Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="h-12 w-full rounded-xl border-neutral-200 dark:border-neutral-800">
                            <span className="flex flex-1 text-left truncate">
                              {getRoomTypeLabel(field.value) || "Select type"}
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="bathroom">Bathroom</SelectItem>
                          <SelectItem value="bedroom">Bedroom</SelectItem>
                          <SelectItem value="kitchen">Kitchen</SelectItem>
                          <SelectItem value="living">Living Room</SelectItem>
                          <SelectItem value="dining">Dining Room</SelectItem>
                          <SelectItem value="hallway">Hallway</SelectItem>
                          <SelectItem value="staircase">Staircase</SelectItem>
                          <SelectItem value="custom">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>

             <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem className="md:w-1/2">
                    <FormLabel className="text-neutral-500">Floor Level</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800" {...field} />
                    </FormControl>
                    <FormDescription>0 for basement, 1 for main floor</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
             />

             <div>
                <label className="text-sm font-medium block mb-3 text-neutral-500">Reference Photo (Optional)</label>
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
                    <p className="text-sm text-neutral-500 mt-1 max-w-xs">Upload a clear photo to help identify this zone</p>
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
              onClick={() => navigate(`/properties/${home.id}`)} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="rounded-full h-12 px-8 bg-black text-white shadow-lg transition-transform hover:scale-105"
            >
              {isSubmitting ? "Creating..." : "Create Zone"}
            </Button>
          </div>
          
        </form>
      </Form>
    </div>
  );
}
