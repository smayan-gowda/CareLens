
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and app preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <aside className="md:col-span-3 space-y-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Button 
                key={item.id}
                variant="ghost" 
                className={`w-full justify-start gap-3 h-10 rounded-lg transition-colors ${activeTab === item.id ? 'bg-muted/50 text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon} {item.label}
              </Button>
            ))}
          </div>
          
          <div className="pt-4 mt-4 border-t border-border/50">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-red-500 hover:bg-red-500/10 hover:text-red-500 h-10 rounded-lg px-4"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:bg-red-500/10 hover:text-red-500 h-10 rounded-lg px-4 mt-1" onClick={() => toast.success("Account deletion request submitted")}>
              <Trash2 className="h-4 w-4" /> Delete Account
            </Button>
          </div>
        </aside>

        <div className="md:col-span-9 space-y-8">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-border/50 shadow-sm bg-card rounded-2xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-border/40">
                  <CardTitle className="text-lg font-medium">Public Profile</CardTitle>
                  <CardDescription className="text-sm">Your identity within the CareLens community.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/40">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 border border-border/50 shadow-sm">
                        <AvatarImage src={formData.avatar || undefined} />
                        <AvatarFallback className="text-2xl font-medium bg-muted text-muted-foreground">{formData.name ? formData.name[0] : 'U'}</AvatarFallback>
                      </Avatar>
                      <Button size="icon" variant="outline" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background shadow-sm border-border/50 hover:bg-muted" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="h-3.5 w-3.5" />
                      </Button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <h3 className="text-sm font-medium">Profile Picture</h3>
                      <p className="text-xs text-muted-foreground max-w-[300px]">
                        Visible to other caregivers when you post in the community.
                      </p>
                      <div className="flex gap-2 justify-center sm:justify-start pt-2">
                        <Button variant="outline" size="sm" className="rounded-lg px-3 h-8 text-xs font-medium" onClick={() => fileInputRef.current?.click()}>Upload New</Button>
                        <Button variant="ghost" size="sm" className="rounded-lg px-3 h-8 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleRemoveImage}>Remove</Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="pl-9 h-10 bg-background border-border/50 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email"
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="pl-9 h-10 bg-background border-border/50 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Primary Role</Label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(val: any) => setFormData({...formData, role: val})}
                      >
                        <SelectTrigger className="h-10 w-full bg-background border-border/50 rounded-lg text-sm">
                          <span className="flex flex-1 text-left truncate">
                            {getRoleLabel(formData.role) || "Select role"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="Homeowner">Homeowner</SelectItem>
                          <SelectItem value="Caregiver">Caregiver</SelectItem>
                          <SelectItem value="Family member">Family Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resident Age Group</Label>
                      <Select 
                        value={formData.ageGroup} 
                        onValueChange={(val: any) => setFormData({...formData, ageGroup: val})}
                      >
                        <SelectTrigger className="h-10 w-full bg-background border-border/50 rounded-lg text-sm">
                          <span className="flex flex-1 text-left truncate">
                            {getAgeGroupLabel(formData.ageGroup) || "Select age group"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="65-74">65-74 years</SelectItem>
                          <SelectItem value="75-84">75-84 years</SelectItem>
                          <SelectItem value="85+">85+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-6 border-t border-border/40 flex justify-between items-center bg-muted/20 px-6 h-16">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Saved locally</p>
                  <Button onClick={handleSave} className="gap-2 px-6 h-9 rounded-lg text-sm transition-transform active:scale-95">
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {activeTab === 'homes' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-border/50 shadow-sm bg-card rounded-2xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-medium">Manage Homes</CardTitle>
                      <CardDescription className="text-sm">Configure your monitored properties.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 font-medium text-xs hover:bg-muted/50" onClick={() => navigate('/homes/new')}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Home
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {homes.map((home) => (
                    <div key={home.id} className="p-4 rounded-xl border border-border/50 bg-muted/10 flex items-center justify-between group hover:border-border transition-colors cursor-pointer" onClick={() => navigate(`/homes/${home.id}`)}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground">
                          <Home className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-foreground">{home.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{home.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground group-hover:text-foreground">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm bg-card rounded-2xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-border/40">
                  <CardTitle className="text-lg font-medium">Room Settings</CardTitle>
                  <CardDescription className="text-sm">Default configurations for your safety scans.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-foreground">Auto-detect Rooms</h4>
                      <p className="text-xs text-muted-foreground">Automatically identify room types during scans.</p>
                    </div>
                    <Switch checked={switches.autoDetectRooms} onCheckedChange={(val) => setSwitches({...switches, autoDetectRooms: val})} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-foreground">Save Original Photos</h4>
                      <p className="text-xs text-muted-foreground">Keep unannotated copies of all scan images.</p>
                    </div>
                    <Switch checked={switches.saveOriginalPhotos} onCheckedChange={(val) => setSwitches({...switches, saveOriginalPhotos: val})} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-border/50 shadow-sm bg-card rounded-2xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-border/40">
                  <CardTitle className="text-lg font-medium">Alert Preferences</CardTitle>
                  <CardDescription className="text-sm">Choose how and when you want to be notified.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Channels</h4>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground">
                            <Bell className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Push Notifications</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Receive real-time alerts on your device.</p>
                          </div>
                        </div>
                        <Switch checked={formData.notificationsEnabled} onCheckedChange={(val) => setFormData({...formData, notificationsEnabled: val})} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Email Summaries</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Weekly safety and activity reports.</p>
                          </div>
                        </div>
                        <Switch checked={switches.emailSummaries} onCheckedChange={(val) => setSwitches({...switches, emailSummaries: val})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Event Types</h4>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/30 rounded-lg transition-colors">
                          <Label className="text-sm font-medium cursor-pointer flex-1">New Scan Reports</Label>
                          <Switch checked={switches.newScanReports} onCheckedChange={(val) => setSwitches({...switches, newScanReports: val})} />
                        </div>
                        <div className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/30 rounded-lg transition-colors">
                          <Label className="text-sm font-medium cursor-pointer flex-1">Community Mentions</Label>
                          <Switch checked={switches.communityMentions} onCheckedChange={(val) => setSwitches({...switches, communityMentions: val})} />
                        </div>
                        <div className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/30 rounded-lg transition-colors">
                          <Label className="text-sm font-medium cursor-pointer flex-1">Hazard Alerts</Label>
                          <Switch checked={switches.hazardAlerts} onCheckedChange={(val) => setSwitches({...switches, hazardAlerts: val})} />
                        </div>
                        <div className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/30 rounded-lg transition-colors">
                          <Label className="text-sm font-medium cursor-pointer flex-1">Account Activity</Label>
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
              <Card className="border-border/50 shadow-sm bg-card rounded-2xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-border/40">
                  <CardTitle className="text-lg font-medium">Security</CardTitle>
                  <CardDescription className="text-sm">Protect your account and safety data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 font-medium text-xs hover:bg-muted/50" onClick={() => toast.success("Two-Factor Authentication setup email sent")}>Enable</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Account Password</h4>
                      <p className="text-xs text-muted-foreground">Update your password regularly for better security.</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 font-medium text-xs hover:bg-muted/50" onClick={() => toast.success("Password reset email sent")}>Change</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm bg-card rounded-2xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-border/40">
                  <CardTitle className="text-lg font-medium">Data Privacy</CardTitle>
                  <CardDescription className="text-sm">Control how your data is used and shared.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Profile Visibility</Label>
                        <p className="text-xs text-muted-foreground">Control who can see your profile in the community.</p>
                      </div>
                      <Select 
                        value={formData.privacyLevel} 
                        onValueChange={(val: any) => setFormData({...formData, privacyLevel: val})}
                      >
                        <SelectTrigger className="w-32 h-9 rounded-lg text-xs font-medium border-border/50">
                          <SelectValue placeholder="Privacy" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="Private" className="text-xs">Private</SelectItem>
                          <SelectItem value="Limited" className="text-xs">Limited</SelectItem>
                          <SelectItem value="Public" className="text-xs">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Share Anonymized Data</h4>
                        <p className="text-xs text-muted-foreground">Help improve our AI by sharing anonymous scan data.</p>
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
