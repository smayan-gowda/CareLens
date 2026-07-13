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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useHomeStore } from "@/stores/useHomeStore";
import { ArrowLeft, Check, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { RoomType } from "@/types/home";

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
        <h2 className="text-2xl font-bold mb-2">Home not found</h2>
        <Button onClick={() => navigate("/homes")}>Return to Homes</Button>
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
      
      toast.success("Room added successfully");
      navigate(`/homes/${home.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add room");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/homes/${home.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add a Room</h1>
          <p className="text-muted-foreground mt-1">To {home.name}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
              <CardDescription>Tell us about this specific space in your home.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Master Bathroom, Kitchen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type">
                              {field.value === "bathroom" ? "Bathroom" :
                               field.value === "bedroom" ? "Bedroom" :
                               field.value === "kitchen" ? "Kitchen" :
                               field.value === "living" ? "Living Room" :
                               field.value === "dining" ? "Dining Room" :
                               field.value === "hallway" ? "Hallway" :
                               field.value === "laundry" ? "Laundry Room" :
                               field.value === "garage" ? "Garage" :
                               field.value === "basement" ? "Basement" :
                               field.value === "entryway" ? "Entryway" :
                               field.value === "office" ? "Office" :
                               field.value === "staircase" ? "Staircase" :
                               field.value === "custom" ? "Other" : null}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bathroom">Bathroom</SelectItem>
                          <SelectItem value="bedroom">Bedroom</SelectItem>
                          <SelectItem value="kitchen">Kitchen</SelectItem>
                          <SelectItem value="living">Living Room</SelectItem>
                          <SelectItem value="dining">Dining Room</SelectItem>
                          <SelectItem value="hallway">Hallway</SelectItem>
                          <SelectItem value="laundry">Laundry Room</SelectItem>
                          <SelectItem value="garage">Garage</SelectItem>
                          <SelectItem value="basement">Basement</SelectItem>
                          <SelectItem value="entryway">Entryway</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="staircase">Staircase</SelectItem>
                          <SelectItem value="custom">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor Level *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Use 1 for main, 0 for basement</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-3">Cover Image (Optional)</label>
                {coverImagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border">
                    <img src={coverImagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button type="button" variant="secondary" onClick={() => document.getElementById('cover-upload')?.click()}>
                        Change Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                  >
                    <div className="bg-primary/5 p-3 rounded-full mb-3">
                      <UploadCloud className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium">Upload a cover photo</p>
                    <p className="text-xs text-muted-foreground mt-1">Help visually identify this room</p>
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
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any specific concerns about this room?" className="resize-none h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
              <Button type="button" variant="outline" onClick={() => navigate(`/homes/${home.id}`)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Room"}
                {!isSubmitting && <Check className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
