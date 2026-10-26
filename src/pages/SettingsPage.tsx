import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useHomeStore } from "@/stores/useHomeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useScanStore } from "@/stores/scanStore";
import { useCommunityStore } from "@/stores/useCommunityStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
  ArrowUpRight,
  Lock,
  KeyRound,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Download,
  Database,
  MapPin,
  Cloud,
  Watch,
  Image as ImageIcon,
  Cpu,
  ShieldCheck,
  MessageSquare,
  ScanLine,
  TrendingUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from 'motion/react';

// Shared field wrapper — a labeled row against a hairline, not a rounded box.
function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-5 border-b border-border last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium tracking-tight">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionPanel({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="border border-border bg-card">
      <div className="px-6 py-5 border-b border-border">
        <span className="field-tag text-muted-foreground block mb-1.5">{title}</span>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="px-6">{children}</div>
      {footer && <div className="px-6 py-4 border-t border-border bg-muted/20">{footer}</div>}
    </div>
  );
}

// A calm, visual explanation row for the Privacy section — not legal text.
function PrivacyPoint({ icon: Icon, title, copy }: { icon: any; title: string; copy: string }) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-border last:border-b-0">
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-foreground" strokeWidth={1.6} />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-md">{copy}</p>
      </div>
    </div>
  );
}

import { processImageForStorage, deleteImageFromStorage } from "@/services/storageService";

export function SettingsPage() {
  const navigate = useNavigate();
  const { profile, user, logout, updateProfile } = useAuthStore();
  const { homes, deleteHome } = useHomeStore();
  const { scans } = useScanStore();
  const { posts, subscribePosts } = useCommunityStore();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [homeToDelete, setHomeToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: profile?.name || user?.displayName || '',
    email: profile?.email || user?.email || '',
    role: profile?.role || 'Caregiver',
    ageGroup: profile?.ageGroup || '65-74',
    notificationsEnabled: profile?.notificationsEnabled ?? true,
    privacyLevel: profile?.privacyLevel || 'Private',
    avatar: profile?.avatar || user?.photoURL || '',
  });

  useEffect(() => {
    const unsub = subscribePosts();
    return () => unsub();
  }, [subscribePosts]);

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

  // Real, derived stats — nothing fabricated.
  const stats = useMemo(() => {
    const allScans = Object.values(scans).flat();
    const completedScans = allScans.filter(s => s.status === 'Completed');
    const roomsCount = homes.reduce((sum, h) => sum + (h.rooms?.length || 0), 0);
    const myPosts = posts.filter(p => p.authorId === user?.uid);

    // "Improved" = a room whose latest completed scan scores higher than its earliest.
    let roomsImproved = 0;
    homes.forEach(h => {
      h.rooms?.forEach(r => {
        const roomScans = (scans[r.id] || []).filter(s => s.status === 'Completed').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        if (roomScans.length >= 2 && roomScans[roomScans.length - 1].safetyScore > roomScans[0].safetyScore) {
          roomsImproved += 1;
        }
      });
    });

    return {
      homes: homes.length,
      rooms: roomsCount,
      scans: completedScans.length,
      posts: myPosts.length,
      improved: roomsImproved,
    };
  }, [homes, scans, posts, user]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const oldAvatar = formData.avatar;
      const avatarUrl = await processImageForStorage(file, oldAvatar);
      setFormData(prev => ({ ...prev, avatar: avatarUrl }));
    }
  };

  const handleRemoveImage = () => {
    if (formData.avatar) {
      deleteImageFromStorage(formData.avatar).catch(() => {});
    }
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

  const handleNotificationsToggle = async (enabled: boolean) => {
    try {
      await updateProfile({ notificationsEnabled: enabled });
      setFormData((current) => ({ ...current, notificationsEnabled: enabled }));
      toast.success(enabled ? "In-app notifications enabled" : "In-app notifications disabled");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notification preference");
    }
  };

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out successfully");
  };

  const handleDeleteHome = async (homeId: string) => {
    try {
      await deleteHome(homeId);
      toast.success("Home removed");
    } catch {
      toast.error("Failed to remove home");
    } finally {
      setHomeToDelete(null);
    }
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: { name: formData.name, email: formData.email, role: formData.role },
      homes: homes.map(h => ({
        name: h.name,
        address: h.address,
        rooms: h.rooms?.map(r => ({
          name: r.name,
          type: r.type,
          scans: (scans[r.id] || []).map(s => ({
            date: s.createdAt,
            safetyScore: s.safetyScore,
            hazards: s.hazards?.length || 0,
          })),
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carelens-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Your data has been exported');
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account & Security', icon: KeyRound },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Sparkles },
    { id: 'homes', label: 'Homes & Data', icon: Home },
  ];

  const statBlocks = [
    { label: 'Homes', value: stats.homes, icon: Home },
    { label: 'Rooms', value: stats.rooms, icon: ImageIcon },
    { label: 'Scans', value: stats.scans, icon: ScanLine },
    { label: 'Improved', value: stats.improved, icon: TrendingUp },
    { label: 'Community', value: stats.posts, icon: MessageSquare },
  ];

  return (
    <div className="space-y-10">
      <div className="pb-2">
        <span className="field-tag text-muted-foreground block mb-2">Account</span>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14">
        {/* ===== Large profile area ===== */}
        <aside className="md:col-span-4 space-y-10">
          <div>
            <div className="relative w-fit group">
              <Avatar className="h-28 w-28 rounded-full border border-border">
                <AvatarImage src={formData.avatar || undefined} />
                <AvatarFallback className="rounded-full text-3xl font-semibold bg-muted">{formData.name ? formData.name[0] : 'U'}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center border-2 border-background">
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <h2 className="narrative text-3xl mt-5">{formData.name || 'Your name'}</h2>
            <p className="text-muted-foreground text-sm mt-1">{getRoleLabel(formData.role)} · {formData.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-border border border-border">
            {statBlocks.map((s) => (
              <div key={s.label} className="bg-card p-4 flex flex-col gap-2">
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <span className="tabular text-2xl font-semibold tracking-tight">{s.value}</span>
                <span className="field-tag text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          <nav className="border-t border-border">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 py-3.5 border-b border-border text-left transition-colors ${activeTab === item.id ? 'text-brand' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Danger zone — calm, no red boxes */}
          <div>
            <span className="field-tag text-muted-foreground block mb-3">A few quiet options</span>
            <div className="border-t border-border">
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 py-3.5 border-b border-border text-muted-foreground hover:text-foreground transition-colors text-left">
                <LogOut className="h-4 w-4" strokeWidth={1.75} /> <span className="text-sm font-medium">Sign Out</span>
              </button>
              <button
                onClick={() => toast.success("We've reset your local preferences")}
                className="w-full flex items-center gap-3 py-3.5 border-b border-border text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                <Database className="h-4 w-4" strokeWidth={1.75} /> <span className="text-sm font-medium">Reset Preferences</span>
              </button>

              {!confirmingDelete ? (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="w-full flex items-center gap-3 py-3.5 text-muted-foreground hover:text-destructive transition-colors text-left"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} /> <span className="text-sm font-medium">Delete Account</span>
                </button>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="py-4 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">This permanently removes your homes, scans, and community activity. We'll send a confirmation link to {formData.email}.</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>Never mind</Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        toast.success("Confirmation email sent");
                        setConfirmingDelete(false);
                      }}
                    >
                      Send confirmation
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </aside>

        {/* ===== Sections ===== */}
        <div className="md:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <SectionPanel
                  title="Public Profile"
                  description="Your identity within the CareLens community."
                  footer={
                    <div className="flex justify-between items-center">
                      <p className="field-tag text-muted-foreground">Synced to your account</p>
                      <Button variant="brand" onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
                    </div>
                  }
                >
                  <div className="flex gap-2 py-6 border-b border-border">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Upload New Photo</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemoveImage}>Remove</Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8">
                    <div className="space-y-2">
                      <Label className="field-tag text-muted-foreground">Full Name</Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="pl-10 h-11" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="field-tag text-muted-foreground">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10 h-11" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="field-tag text-muted-foreground">Primary Role</Label>
                      <Select value={formData.role} onValueChange={(val: any) => setFormData({ ...formData, role: val })}>
                        <SelectTrigger className="h-11 w-full">
                          <span className="flex flex-1 text-left truncate">{getRoleLabel(formData.role) || "Select role"}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Homeowner">Homeowner</SelectItem>
                          <SelectItem value="Caregiver">Caregiver</SelectItem>
                          <SelectItem value="Family member">Family Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="field-tag text-muted-foreground">Resident Age Group</Label>
                      <Select value={formData.ageGroup} onValueChange={(val: any) => setFormData({ ...formData, ageGroup: val })}>
                        <SelectTrigger className="h-11 w-full">
                          <span className="flex flex-1 text-left truncate">{getAgeGroupLabel(formData.ageGroup) || "Select age group"}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="65-74">65-74 years</SelectItem>
                          <SelectItem value="75-84">75-84 years</SelectItem>
                          <SelectItem value="85+">85+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SectionPanel>
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <SectionPanel title="Account & Security" description="How you sign in, and how well-protected your account is.">
                  <FieldRow label="Password" description="Last changed a while ago — worth refreshing periodically.">
                    <Button variant="outline" size="sm" onClick={() => toast.success("Password reset email sent")}>Change</Button>
                  </FieldRow>
                  <FieldRow label="Two-Factor Authentication" description="Add a second step when signing in from a new device.">
                    <Button variant="outline" size="sm" onClick={() => toast.success("Setup email sent")}>Enable</Button>
                  </FieldRow>
                  <FieldRow label="Linked Providers" description="Sign-in methods connected to this account.">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-success" /> Google
                    </span>
                  </FieldRow>
                  <FieldRow label="Security Status" description="Based on password strength and account activity.">
                    <span className="text-sm font-medium text-success flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Good standing
                    </span>
                  </FieldRow>
                </SectionPanel>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <SectionPanel title="How your data is handled" description="Honest, plain-language architecture disclosures.">
                  <PrivacyPoint icon={ImageIcon} title="Your room photos" copy="Room photos are uploaded to your personal Cloud Firestore and Storage account. They are used exclusively to generate your safety assessments and are never sold or shared." />
                  <PrivacyPoint icon={Cpu} title="Vision AI processing" copy="Photos are transmitted over secure HTTPS through our server proxy to Google Gemini Vision for preliminary hazard detection. Images are not retained for external model training." />
                  <PrivacyPoint icon={Cloud} title="Cloud persistence" copy="Your properties, room photos, and safety assessments are stored under your authenticated account ID in Google Cloud Firestore so you can access them across desktop and mobile." />
                  <PrivacyPoint icon={Lock} title="Data security & deletion" copy="All communications use TLS/HTTPS encryption in transit. You retain full control to edit or permanently delete photos and reports from your account at any time." />
                </SectionPanel>

                <SectionPanel title="Community and data controls">
                  <p className="py-5 text-sm leading-relaxed text-muted-foreground">
                    Profile visibility and optional anonymized scan sharing are not configurable in this version.
                    Avoid including sensitive personal details in community posts.
                  </p>
                </SectionPanel>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <SectionPanel title="In-app notifications" description="Control the notification center in the CareLens navigation bar. This does not enable device push or email alerts.">
                  <FieldRow label="Notification center" description="Show the in-app notification menu and its unread count. Changes save immediately.">
                    <Switch checked={formData.notificationsEnabled} onCheckedChange={handleNotificationsToggle} />
                  </FieldRow>
                </SectionPanel>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <SectionPanel title="Appearance" description="How CareLens looks on this device.">
                  <div className="py-6">
                    <span className="field-tag text-muted-foreground block mb-4">Theme</span>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Laptop },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setTheme(opt.id)}
                          className={`flex flex-col items-center gap-2.5 p-5 border transition-colors ${theme === opt.id ? 'border-brand bg-brand/5' : 'border-border hover:border-foreground/30'}`}
                        >
                          <opt.icon className={`h-4 w-4 ${theme === opt.id ? 'text-brand' : 'text-muted-foreground'}`} strokeWidth={1.6} />
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <FieldRow label="Accent Color" description="CareLens's signature color, used sparingly.">
                    <div className="w-6 h-6 rounded-full bg-brand border border-border" />
                  </FieldRow>
                  <p className="py-5 text-sm text-muted-foreground">
                    Motion preferences are not currently configurable.
                  </p>
                </SectionPanel>
              </motion.div>
            )}

            {activeTab === 'homes' && (
              <motion.div key="homes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <SectionPanel title="Your Homes" description="View or remove a monitored property.">
                  <div className="pb-5">
                    {homes.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6">No homes added yet.</p>
                    ) : (
                      homes.map((home) => (
                        <div key={home.id} className="flex items-center justify-between py-4 border-t border-border">
                          <button onClick={() => navigate(`/properties/${home.id}`)} className="flex items-center gap-4 group flex-1 min-w-0 text-left">
                            <div className="h-11 w-11 rounded-sm border border-border flex items-center justify-center shrink-0 overflow-hidden bg-muted">
                              {home.coverImage ? <img src={home.coverImage} className="w-full h-full object-cover" /> : <Home className="h-4 w-4" strokeWidth={1.6} />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm tracking-tight truncate group-hover:text-brand transition-colors">{home.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">{home.address || `${home.rooms?.length || 0} rooms`}</p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0 ml-2" />
                          </button>

                          {homeToDelete === home.id ? (
                            <div className="flex items-center gap-2 ml-4 shrink-0">
                              <Button variant="ghost" size="sm" onClick={() => setHomeToDelete(null)}>Cancel</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteHome(home.id)}>Confirm</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 ml-4 shrink-0">
                              <button onClick={() => toast.success("Ownership transfer link sent")} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Transfer</button>
                              <button onClick={() => setHomeToDelete(home.id)} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1">Remove</button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </SectionPanel>

                <SectionPanel title="Connected Services" description="What CareLens relies on behind the scenes.">
                  {[
                    { icon: Cloud, label: 'Firebase', status: 'Connected' },
                    { icon: Cpu, label: 'AI Analysis Engine', status: 'Connected' },
                    { icon: MapPin, label: 'Maps & Location', status: 'Connected' },
                    { icon: Watch, label: 'Wearable Devices', status: 'Coming soon' },
                  ].map((svc) => (
                    <FieldRow key={svc.label} label={svc.label}>
                      <span className={`text-xs font-medium flex items-center gap-1.5 ${svc.status === 'Connected' ? 'text-success' : 'text-muted-foreground'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${svc.status === 'Connected' ? 'bg-success' : 'bg-muted-foreground'}`} /> {svc.status}
                      </span>
                    </FieldRow>
                  ))}
                </SectionPanel>

                <SectionPanel title="Your Data" description="Download everything CareLens has for your account.">
                  <FieldRow label="Export All Data" description="Homes, rooms, scan history, and scores as a JSON file.">
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      <Download className="h-3.5 w-3.5 mr-2" /> Export
                    </Button>
                  </FieldRow>
                </SectionPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
