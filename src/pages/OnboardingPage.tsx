import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  Check,
  Home as HomeIcon,
  Users,
  UserRound,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useHomeStore } from "@/stores/useHomeStore";
import { toast } from "sonner";
import { LensMark } from "@/components/brand/LensMark";
import type { HomeType, RoomType } from "@/types/home";

const EASE = [0.16, 1, 0.3, 1] as const;

const WHO_OPTIONS: { id: string; label: string; role: 'Homeowner' | 'Caregiver' | 'Family member' }[] = [
  { id: 'myself', label: 'Myself', role: 'Homeowner' },
  { id: 'parent', label: 'A parent', role: 'Caregiver' },
  { id: 'grandparent', label: 'A grandparent', role: 'Caregiver' },
  { id: 'relative', label: 'A relative', role: 'Family member' },
  { id: 'multiple', label: 'Multiple homes', role: 'Caregiver' },
];

const ROOM_OPTIONS: { type: RoomType; label: string; image: string }[] = [
  { type: 'bathroom', label: 'Bathroom', image: 'https://images.unsplash.com/photo-1776482128011-c707121f081a?q=80&w=1200&auto=format&fit=crop' },
  { type: 'kitchen', label: 'Kitchen', image: 'https://images.unsplash.com/photo-1764526624453-db32c24eca55?q=80&w=1200&auto=format&fit=crop' },
  { type: 'bedroom', label: 'Bedroom', image: 'https://images.unsplash.com/photo-1762845872088-12c352bbb119?q=80&w=1200&auto=format&fit=crop' },
  { type: 'living', label: 'Living room', image: 'https://images.unsplash.com/photo-1759238136854-a43787126db7?q=80&w=1200&auto=format&fit=crop' },
  { type: 'entryway', label: 'Entryway', image: 'https://images.unsplash.com/photo-1759782526827-5fecfb5f2d9c?q=80&w=1200&auto=format&fit=crop' },
  { type: 'garage', label: 'Garage', image: null as unknown as string },
];

/** Waits for a just-created home (or room within it) to arrive through the
 * real-time Firestore listener that's already subscribed for this user, so
 * we can deep-link straight into it. Falls back gracefully if it times out —
 * never blocks the user's progress. */
async function waitFor<T>(check: () => T | undefined, timeoutMs = 4000, intervalMs = 200): Promise<T | undefined> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = check();
    if (result) return result;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return undefined;
}

function StepShell({ eyebrow, title, subtitle, children, onBack, onNext, nextLabel, nextDisabled, isLoading }: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="w-full max-w-xl mx-auto"
    >
      <span className="field-tag text-muted-foreground block mb-4">{eyebrow}</span>
      <h1 className="narrative text-4xl md:text-5xl mb-3 text-balance">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-lg mb-10 max-w-md">{subtitle}</p>}
      <div className="mb-10">{children}</div>
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" onClick={onBack} type="button">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        )}
        <Button variant="brand" size="lg" onClick={onNext} disabled={nextDisabled || isLoading} className="ml-auto">
          {isLoading ? 'One moment...' : nextLabel} {!isLoading && <ArrowRight className="w-4 h-4 ml-1.5" />}
        </Button>
      </div>
    </motion.div>
  );
}

import { processImageForStorage } from "@/services/storageService";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { addHome, addRoom, homes } = useHomeStore();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard-local state
  const [who, setWho] = useState<string | null>(null);
  const [homeName, setHomeName] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [homeCoverImage, setHomeCoverImage] = useState<string | undefined>();
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [caregiverMode, setCaregiverMode] = useState(false);

  // Resolved after creation, used for the final deep link
  const [createdHomeId, setCreatedHomeId] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);

  const totalSteps = 5;

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const photoUrl = await processImageForStorage(file);
    setHomeCoverImage(photoUrl);
  };

  const handleWhoNext = async () => {
    const selected = WHO_OPTIONS.find((o) => o.id === who);
    if (selected && user) {
      try {
        await updateProfile({ role: selected.role });
      } catch {
        // Non-blocking — the wizard should never stall on a preference save.
      }
    }
    setStep(2);
  };

  const handleHomeNext = async () => {
    if (!homeName.trim() || !user) {
      toast.error('Please name your home to continue');
      return;
    }
    setIsLoading(true);
    try {
      await addHome(user.uid, {
        name: homeName.trim(),
        address: homeAddress.trim() || undefined,
        homeType: 'house' as HomeType,
        floors: 1,
        coverImage: homeCoverImage,
      });
      const home = await waitFor(() => useHomeStore.getState().homes.find(
        (h) => h.userId === user.uid && h.name === homeName.trim()
      ));
      if (home) setCreatedHomeId(home.id);
      setStep(3);
    } catch (error) {
      console.error(error);
      toast.error('Failed to add your home — you can try again from Properties.');
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomNext = async () => {
    if (!roomType || !createdHomeId) {
      setStep(4);
      return;
    }
    setIsLoading(true);
    try {
      const label = ROOM_OPTIONS.find((r) => r.type === roomType)?.label || 'Room';
      await addRoom(createdHomeId, { name: label, type: roomType, floor: 1 });
      const room = await waitFor(() => {
        const home = useHomeStore.getState().homes.find((h) => h.id === createdHomeId);
        return home?.rooms.find((r) => r.type === roomType && r.name === label);
      });
      if (room) setCreatedRoomId(room.id);
    } catch (error) {
      console.error(error);
      // Non-blocking — they can add the room from the property page instead.
    } finally {
      setIsLoading(false);
      setStep(4);
    }
  };

  const handlePreferencesNext = async () => {
    if (user) {
      try {
        await updateProfile({ notificationsEnabled });
      } catch {
        // Non-blocking.
      }
    }
    setStep(5);
  };

  const handleFinish = () => {
    if (createdHomeId && createdRoomId) {
      navigate(`/properties/${createdHomeId}/rooms/${createdRoomId}/scan`);
    } else if (createdHomeId) {
      navigate(`/properties/${createdHomeId}`);
    } else {
      navigate('/scan');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 md:px-10 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LensMark className="w-5 h-5 text-brand" />
          <span className="text-sm font-semibold tracking-tight">CARELENS</span>
        </div>
        {step > 0 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${i < step ? 'w-6 bg-brand' : 'w-1.5 bg-border'}`}
              />
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="w-full max-w-lg mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
                className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-8"
              >
                <Sparkles className="w-6 h-6 text-brand" strokeWidth={1.75} />
              </motion.div>
              <h1 className="narrative text-5xl md:text-6xl mb-4 text-balance">Welcome to CareLens.</h1>
              <p className="text-muted-foreground text-lg mb-12 max-w-sm mx-auto">
                Let's create a safer home together — it only takes a minute.
              </p>
              <Button variant="brand" size="lg" onClick={() => setStep(1)}>
                Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <StepShell
              eyebrow="Step 1 of 4"
              title="Who will you be protecting?"
              onBack={() => setStep(0)}
              onNext={handleWhoNext}
              nextLabel="Continue"
              nextDisabled={!who}
            >
              <div className="grid grid-cols-2 gap-3">
                {WHO_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setWho(opt.id)}
                    className={`flex items-center gap-3 p-4 border text-left transition-colors ${
                      who === opt.id ? 'border-brand bg-brand/5' : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${who === opt.id ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {opt.id === 'multiple' ? <HomeIcon className="w-4 h-4" /> : opt.id === 'myself' ? <UserRound className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </span>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              eyebrow="Step 2 of 4"
              title="What's the first home you'd like to monitor?"
              onBack={() => setStep(1)}
              onNext={handleHomeNext}
              nextLabel="Continue"
              nextDisabled={!homeName.trim()}
              isLoading={isLoading}
            >
              <div className="space-y-5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-[16/9] w-full bg-muted overflow-hidden cursor-pointer group border border-dashed border-border"
                >
                  {homeCoverImage ? (
                    <img src={homeCoverImage} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Camera className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-xs">Add a photo (optional)</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
                <div className="space-y-2">
                  <Label className="field-tag text-muted-foreground">Home name</Label>
                  <Input value={homeName} onChange={(e) => setHomeName(e.target.value)} placeholder="e.g. Mom's House" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="field-tag text-muted-foreground">Location (optional)</Label>
                  <Input value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder="City, State" className="h-12" />
                </div>
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              eyebrow="Step 3 of 4"
              title="Which room would you like to assess first?"
              subtitle="You can always add more rooms later."
              onBack={() => setStep(2)}
              onNext={handleRoomNext}
              nextLabel="Continue"
              nextDisabled={!roomType}
              isLoading={isLoading}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROOM_OPTIONS.map((room) => (
                  <button
                    key={room.type}
                    onClick={() => setRoomType(room.type)}
                    className={`relative aspect-square overflow-hidden group border-2 transition-colors ${
                      roomType === room.type ? 'border-brand' : 'border-transparent'
                    }`}
                  >
                    {room.image ? (
                      <img src={room.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <HomeIcon className="w-5 h-5 text-muted-foreground/40" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    {roomType === room.type && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                        <Check className="w-3 h-3 text-brand-foreground" strokeWidth={3} />
                      </span>
                    )}
                    <span className="absolute bottom-2.5 left-2.5 text-white text-xs font-medium">{room.label}</span>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell
              eyebrow="Step 4 of 4"
              title="Choose your preferences."
              onBack={() => setStep(3)}
              onNext={handlePreferencesNext}
              nextLabel="Continue"
            >
              <div className="space-y-0 border-t border-border">
                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">In-app notification center</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Show notification updates inside CareLens. This does not enable push or email alerts.</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium">Caregiver mode</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Emphasize accessibility and fall-risk findings.</p>
                  </div>
                  <Switch checked={caregiverMode} onCheckedChange={setCaregiverMode} />
                </div>
              </div>
            </StepShell>
          )}

          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="w-full max-w-lg mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
                className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-8"
              >
                <Check className="w-7 h-7 text-success" strokeWidth={2} />
              </motion.div>
              <h1 className="narrative text-5xl mb-4 text-balance">You're all set.</h1>
              <p className="text-muted-foreground text-lg mb-4 max-w-sm mx-auto">
                {createdRoomId
                  ? "Let's take a look at your first room. A few clear photos — corners, walkways, and any tight spots — give us the most to work with."
                  : "Your home is ready. Whenever you're ready, run your first assessment."}
              </p>
              <p className="text-xs text-muted-foreground/70 mb-10">Your images stay private, and analysis is encrypted end to end.</p>
              <Button variant="brand" size="lg" onClick={handleFinish}>
                {createdRoomId ? 'Start My First Scan' : 'Go to My Home'} <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
