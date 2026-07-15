
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeStore } from "@/stores/useHomeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  User, 
  Home, 
  Bell, 
  Shield, 
  LogOut, 
  Trash2, 
  Save, 
  Camera,
  Mail,
  UserCircle,
  Plus,
  ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion } from 'motion/react';

export function SettingsPage() {
  const navigate = useNavigate();
  const { profile, user, logout, updateProfile } = useAuthStore();
  const { homes } = useHomeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: profile?.name || user?.displayName || '',
    email: profile?.email || user?.email || '',
    role: profile?.role || 'Caregiver',
    ageGroup: profile?.ageGroup || '65-74',
    notificationsEnabled: profile?.notificationsEnabled ?? true,
    privacyLevel: profile?.privacyLevel || 'Private',
    avatar: profile?.avatar || user?.photoURL || '',
  });

  const getRoleLabel = (val: string) => {
    switch (val) {
      case "Homeowner": return "Homeowner";
      case "Caregiver": return "Caregiver";
      case "Family member": return "Family Member";
      default: return val || "";
    }
  };

  const getAgeGroupLabel = (val: string) => {
    switch (val) {
      case "65-74": return "65-74 years";
      case "75-84": return "75-84 years";
      case "85+": return "85+ years";
      default: return val || "";
    }
  };

  const [switches, setSwitches] = useState({
    autoDetectRooms: true,
    saveOriginalPhotos: true,
    emailSummaries: true,
    newScanReports: true,
    communityMentions: true,
    hazardAlerts: true,
    accountActivity: true,
    shareAnonymizedData: true,
  });

  useEffect(() => {
    if (profile || user) {
      setFormData({
        name: profile?.name || user?.displayName || '',
        email: profile?.email || user?.email || '',
        role: profile?.role || 'Caregiver',
        ageGroup: profile?.ageGroup || '65-74',
        notificationsEnabled: profile?.notificationsEnabled ?? true,
        privacyLevel: profile?.privacyLevel || 'Private',
        avatar: profile?.avatar || user?.photoURL || '',
      });
    }
  }, [profile, user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      toast.success("Settings updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update settings");
    }
  };

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out successfully");
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'homes', label: 'Homes & Rooms', icon: <Home className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-12 pt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-3">Settings</h1>
          <p className="text-muted-foreground text-lg font-light">Manage your account and app preferences.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-black/5 dark:border-white/5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Status: Optimal
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <aside className="md:col-span-3 space-y-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Button 
                key={item.id}
                variant="ghost" 
                className={`w-full justify-start gap-4 h-14 rounded-2xl transition-all text-base ${activeTab === item.id ? 'bg-card border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50 font-light'}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon} {item.label}
              </Button>
            ))}
          </div>
          
          <div className="p-5 rounded-3xl border border-red-500/10 bg-red-50/5 mt-8">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-4 ml-2">Danger Zone</h4>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 h-12 rounded-2xl px-4 text-sm font-medium"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 h-12 rounded-2xl px-4 text-sm font-medium" onClick={() => toast.success("Account deletion request submitted")}>
                <Trash2 className="h-4 w-4" /> Delete Account
              </Button>
            </div>
          </div>
        </aside>

        <div className="md:col-span-9 space-y-8">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] bg-card rounded-[2.5rem] overflow-hidden">
                <CardHeader className="pb-8 pt-8 px-8">
                  <CardTitle className="text-2xl font-medium tracking-tight">Public Profile</CardTitle>
                  <CardDescription className="text-base font-light mt-2">Your identity within the CareLens community.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 px-8">
                  <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-border/40">
                    <div className="relative group">
                      <Avatar className="h-28 w-28 border-4 border-background ring-2 ring-border/40 group-hover:ring-primary/40 transition-all shadow-xl">
                        <AvatarImage src={formData.avatar || undefined} />
                        <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">{formData.name ? formData.name[0] : 'U'}</AvatarFallback>
                      </Avatar>
                      <Button size="icon" variant="outline" className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-background shadow-lg border-border/60 hover:bg-muted" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="h-4 w-4" />
                      </Button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    <div className="space-y-2 text-center sm:text-left">
                      <h3 className="text-xl font-bold">Profile Picture</h3>
                      <p className="text-sm text-muted-foreground max-w-[300px]">
                        Visible to other caregivers when you post in the community.
                      </p>
                      <div className="flex gap-2 justify-center sm:justify-start pt-2">
                        <Button variant="outline" size="sm" className="rounded-xl px-4 h-9 font-bold" onClick={() => fileInputRef.current?.click()}>Upload New</Button>
                        <Button variant="ghost" size="sm" className="rounded-xl px-4 h-9 font-bold text-red-500 hover:text-red-600" onClick={handleRemoveImage}>Remove</Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Full Name</Label>
                      <div className="relative">
                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="pl-12 h-14 bg-muted/30 border-transparent focus:border-border rounded-2xl shadow-none text-base"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                        <Input 
                          type="email"
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="pl-12 h-14 bg-muted/30 border-transparent focus:border-border rounded-2xl shadow-none text-base"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Your Primary Role</Label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(val: any) => setFormData({...formData, role: val})}
                      >
                        <SelectTrigger className="h-14 w-full bg-muted/30 border-transparent focus:border-border rounded-2xl shadow-none text-base pl-4">
                          <span className="flex flex-1 text-left truncate">
                            {getRoleLabel(formData.role) || "Select role"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-border shadow-xl">
                          <SelectItem value="Homeowner" className="py-3 rounded-xl">Homeowner</SelectItem>
                          <SelectItem value="Caregiver" className="py-3 rounded-xl">Caregiver</SelectItem>
                          <SelectItem value="Family member" className="py-3 rounded-xl">Family Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Resident Age Group</Label>
                      <Select 
                        value={formData.ageGroup} 
                        onValueChange={(val: any) => setFormData({...formData, ageGroup: val})}
                      >
                        <SelectTrigger className="h-14 w-full bg-muted/30 border-transparent focus:border-border rounded-2xl shadow-none text-base pl-4">
                          <span className="flex flex-1 text-left truncate">
                            {getAgeGroupLabel(formData.ageGroup) || "Select age group"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-border shadow-xl">
                          <SelectItem value="65-74" className="py-3 rounded-xl">65-74 years</SelectItem>
                          <SelectItem value="75-84" className="py-3 rounded-xl">75-84 years</SelectItem>
                          <SelectItem value="85+" className="py-3 rounded-xl">85+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-8 border-t border-border/40 flex justify-between items-center bg-muted/10 px-8 h-24">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Saved locally</p>
                  <Button onClick={handleSave} className="gap-2 px-8 h-12 rounded-[1.5rem] bg-foreground text-background shadow-md transition-all active:scale-95 text-sm">
                    <Save className="h-4 w-4" /> Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {activeTab === 'homes' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] bg-card rounded-[2.5rem] overflow-hidden">
                <CardHeader className="pb-8 pt-8 px-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-medium tracking-tight">Manage Homes</CardTitle>
                      <CardDescription className="text-base font-light mt-2">Configure your monitored properties.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-2xl h-10 px-5 font-medium border-border hover:bg-muted/50" onClick={() => navigate('/properties/new')}>
                      <Plus className="mr-2 h-4 w-4" /> Add Home
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-8">
                  {homes.map((home) => (
                    <div key={home.id} className="p-5 rounded-3xl border border-border/40 bg-muted/10 flex items-center justify-between group hover:border-border hover:bg-muted/30 transition-all cursor-pointer" onClick={() => navigate(`/properties/${home.id}`)}>
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-background border border-black/5 dark:border-white/5 flex items-center justify-center text-foreground shadow-sm">
                          <Home className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-base tracking-tight">{home.name}</h4>
                          <p className="text-sm text-muted-foreground font-light">{home.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground">
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] bg-card rounded-[2.5rem] overflow-hidden">
                <CardHeader className="pb-8 pt-8 px-8">
                  <CardTitle className="text-2xl font-medium tracking-tight">Room Settings</CardTitle>
                  <CardDescription className="text-base font-light mt-2">Default configurations for your safety scans.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-8">
                  <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-muted/10">
                    <div className="space-y-1">
                      <h4 className="text-base font-medium tracking-tight">Auto-detect Rooms</h4>
                      <p className="text-sm text-muted-foreground font-light">Automatically identify room types during scans.</p>
                    </div>
                    <Switch checked={switches.autoDetectRooms} onCheckedChange={(val) => setSwitches({...switches, autoDetectRooms: val})} />
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-muted/10">
                    <div className="space-y-1">
                      <h4 className="text-base font-medium tracking-tight">Save Original Photos</h4>
                      <p className="text-sm text-muted-foreground font-light">Keep unannotated copies of all scan images.</p>
                    </div>
                    <Switch checked={switches.saveOriginalPhotos} onCheckedChange={(val) => setSwitches({...switches, saveOriginalPhotos: val})} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] bg-card rounded-[2.5rem] overflow-hidden">
                <CardHeader className="pb-8 pt-8 px-8">
                  <CardTitle className="text-2xl font-medium tracking-tight">Alert Preferences</CardTitle>
                  <CardDescription className="text-base font-light mt-2">Choose how and when you want to be notified.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 px-8 pb-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Channels</h4>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-muted/10">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-sm">
                            <Bell className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-base font-medium tracking-tight">Push Notifications</p>
                            <p className="text-sm text-muted-foreground font-light">Receive real-time alerts on your device.</p>
                          </div>
                        </div>
                        <Switch checked={formData.notificationsEnabled} onCheckedChange={(val) => setFormData({...formData, notificationsEnabled: val})} />
                      </div>
                      <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-muted/10">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-2xl bg-background border border-black/5 dark:border-white/5 text-foreground flex items-center justify-center shadow-sm">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-base font-medium tracking-tight">Email Summaries</p>
                            <p className="text-sm text-muted-foreground font-light">Weekly safety and activity reports.</p>
                          </div>
                        </div>
                        <Switch checked={switches.emailSummaries} onCheckedChange={(val) => setSwitches({...switches, emailSummaries: val})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Event Types</h4>
                    <div className="space-y-3 bg-muted/5 border border-border/40 rounded-3xl p-3">
                        <div className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-muted/30 transition-colors">
                          <Label className="text-base font-medium">New Scan Reports</Label>
                          <Switch checked={switches.newScanReports} onCheckedChange={(val) => setSwitches({...switches, newScanReports: val})} />
                        </div>
                        <div className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-muted/30 transition-colors">
                          <Label className="text-base font-medium">Community Mentions</Label>
                          <Switch checked={switches.communityMentions} onCheckedChange={(val) => setSwitches({...switches, communityMentions: val})} />
                        </div>
                        <div className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-muted/30 transition-colors">
                          <Label className="text-base font-medium">Hazard Alerts</Label>
                          <Switch checked={switches.hazardAlerts} onCheckedChange={(val) => setSwitches({...switches, hazardAlerts: val})} />
                        </div>
                        <div className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-muted/30 transition-colors">
                          <Label className="text-base font-medium">Account Activity</Label>
                          <Switch checked={switches.accountActivity} onCheckedChange={(val) => setSwitches({...switches, accountActivity: val})} />
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] bg-card rounded-[2.5rem] overflow-hidden">
                <CardHeader className="pb-8 pt-8 px-8">
                  <CardTitle className="text-2xl font-medium tracking-tight">Security</CardTitle>
                  <CardDescription className="text-base font-light mt-2">Protect your account and safety data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-8">
                  <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-muted/10">
                    <div className="space-y-1">
                      <h4 className="text-base font-medium tracking-tight">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground font-light">Add an extra layer of security to your account.</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-2xl h-10 px-5 font-medium" onClick={() => toast.success("Two-Factor Authentication setup email sent")}>Enable</Button>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-muted/10">
                    <div className="space-y-1">
                      <h4 className="text-base font-medium tracking-tight">Account Password</h4>
                      <p className="text-sm text-muted-foreground font-light">Update your password regularly for better security.</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-2xl h-10 px-5 font-medium" onClick={() => toast.success("Password reset email sent")}>Change</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] bg-card rounded-[2.5rem] overflow-hidden">
                <CardHeader className="pb-8 pt-8 px-8">
                  <CardTitle className="text-2xl font-medium tracking-tight">Data Privacy</CardTitle>
                  <CardDescription className="text-base font-light mt-2">Control how your data is used and shared.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-muted/10">
                      <div className="space-y-1">
                        <Label className="text-base font-medium tracking-tight">Profile Visibility</Label>
                        <p className="text-sm text-muted-foreground font-light">Control who can see your profile in the community.</p>
                      </div>
                      <Select 
                        value={formData.privacyLevel} 
                        onValueChange={(val: any) => setFormData({...formData, privacyLevel: val})}
                      >
                        <SelectTrigger className="w-40 h-12 rounded-2xl bg-background border-border">
                          <SelectValue placeholder="Privacy" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-border shadow-xl">
                          <SelectItem value="Private" className="py-2.5 rounded-xl">Private</SelectItem>
                          <SelectItem value="Limited" className="py-2.5 rounded-xl">Limited</SelectItem>
                          <SelectItem value="Public" className="py-2.5 rounded-xl">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-muted/10">
                      <div className="space-y-1">
                        <h4 className="text-base font-medium tracking-tight">Share Anonymized Data</h4>
                        <p className="text-sm text-muted-foreground font-light">Help improve our AI by sharing anonymous scan data.</p>
                      </div>
                      <Switch checked={switches.shareAnonymizedData} onCheckedChange={(val) => setSwitches({...switches, shareAnonymizedData: val})} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
