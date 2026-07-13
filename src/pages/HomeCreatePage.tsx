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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useHomeStore } from "@/stores/useHomeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ArrowLeft, Check, ChevronRight, Home, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { HomeType } from "@/types/home";

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
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

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
      toast.error("You must be logged in to create a home");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addHome(user.uid, {
        ...values,
        homeType: values.homeType as HomeType,
        coverImage: coverImagePreview || undefined,
      });
      
      toast.success("Home created successfully");
      navigate("/homes");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create home");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Create object URL for preview
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/homes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create a Home Profile</h1>
          <p className="text-muted-foreground mt-1">Set up a new digital twin for AI analysis.</p>
        </div>
      </div>

      <div className="flex items-center justify-center py-6">
        <div className="flex items-center w-full max-w-sm">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted text-muted-foreground'} font-semibold text-sm`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted text-muted-foreground'} font-semibold text-sm`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted text-muted-foreground'} font-semibold text-sm`}>
            3
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-primary/10 shadow-sm">
            {step === 1 && (
              <div className="animate-in fade-in duration-300">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Tell us the basics about this property.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Smith Family Home" {...field} />
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
                        <FormLabel>Home Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a home type">
                                {field.value === "house" ? "Single Family House" :
                                 field.value === "apartment" ? "Apartment" :
                                 field.value === "condo" ? "Condominium" :
                                 field.value === "townhouse" ? "Townhouse" :
                                 field.value === "other" ? "Other" : null}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="house">Single Family House</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="condo">Condominium</SelectItem>
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
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 123 Main St, Portland, OR" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6 bg-muted/20">
                  <Button type="button" onClick={() => form.trigger(['name', 'homeType']).then(v => v && setStep(2))}>
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <CardHeader>
                  <CardTitle>Home Details</CardTitle>
                  <CardDescription>Help the AI understand the layout of the property.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="floors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Floors *</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} max={10} {...field} />
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
                          <FormLabel>Year Built (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="YYYY" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nickname (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mom's House" {...field} />
                        </FormControl>
                        <FormDescription>A short familiar name for the dashboard.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any specific accessibility concerns or details?" className="resize-none h-24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => form.trigger(['floors', 'yearBuilt']).then(v => v && setStep(3))}>
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <CardHeader>
                  <CardTitle>Customization</CardTitle>
                  <CardDescription>Personalize this home profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        <p className="text-xs text-muted-foreground mt-1">Make this home easily recognizable</p>
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
                  
                  <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3 border">
                    <Home className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Ready to create</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        After creating this profile, you'll be able to add individual rooms and upload photos for AI safety analysis.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Home Profile"}
                    {!isSubmitting && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </div>
            )}
          </Card>
        </form>
      </Form>
    </div>
  );
}
