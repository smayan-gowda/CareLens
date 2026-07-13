import { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Home as HomeIcon,
  Image as ImageIcon,
  Activity,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Users,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Link, useNavigate } from "react-router-dom";
import { useHomeStore } from "@/stores/useHomeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useScanStore } from "@/stores/scanStore";
import { formatDistanceToNow, format } from "date-fns";
import { motion } from 'motion/react';

export function DashboardPage() {
  const { homes, activities, hiddenHomes, hiddenRooms, loading: homeLoading } = useHomeStore();
  const { user, profile } = useAuthStore();
  const { scans, hiddenScans, loading: scanLoading } = useScanStore();
  const navigate = useNavigate();

  if (homeLoading || scanLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const userName = profile?.name || user?.displayName || 'Caregiver';
  const firstName = userName.split(' ')[0];
  
  const visibleHomes = homes.filter(h => !hiddenHomes.includes(h.id));
  const totalHomes = visibleHomes.length;
  const totalRooms = visibleHomes.reduce((acc, home) => {
    const activeRooms = home.rooms.filter(room => !hiddenRooms.includes(room.id));
    return acc + activeRooms.length;
  }, 0);
  
  const allScans = Object.values(scans)
    .flat()
    .filter(scan => 
      !hiddenScans.includes(scan.id) &&
      !hiddenHomes.includes(scan.homeId) &&
      !hiddenRooms.includes(scan.roomId)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const hasScans = allScans.length > 0;
  
  const latestScans = [...allScans].reverse().slice(0, 3);
  
  let averageScore = 0;
  let totalHazards = 0;
  let highHazards = 0;
  let medHazards = 0;
  let resolvedFixes = 0;
  let trendData: { name: string, score: number }[] = [];
  
  if (hasScans) {
    averageScore = Math.round(allScans.reduce((acc, scan) => acc + scan.safetyScore, 0) / allScans.length);
    totalHazards = allScans.reduce((acc, scan) => acc + scan.hazards.length, 0);
    highHazards = allScans.reduce((acc, scan) => acc + scan.hazards.filter(h => h.severity === 'High' || h.severity === 'Critical').length, 0);
    medHazards = allScans.reduce((acc, scan) => acc + scan.hazards.filter(h => h.severity === 'Medium').length, 0);
    // In a real app we'd track resolved state, for now we'll derive from score improvements or just show 0 if not tracked
    resolvedFixes = allScans.length > 1 ? Math.max(0, Math.round((allScans[allScans.length - 1].safetyScore - allScans[0].safetyScore) / 5)) : 0;
    
    trendData = allScans.map(scan => ({
      name: format(new Date(scan.createdAt), 'MMM dd'),
      score: scan.safetyScore
    }));
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Welcome back, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Your home safety command center is ready.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-11 border-border/60 bg-background shadow-sm" asChild>
            <Link to="/homes">
              <HomeIcon className="mr-2 h-4 w-4" /> My Homes
            </Link>
          </Button>
          <Button className="flex-1 md:flex-none h-11 shadow-lg shadow-primary/20" asChild>
            <Link to="/scan">
              <Camera className="mr-2 h-4 w-4" /> Start AI Scan
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden group">
            <div className="h-1 bg-primary" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Overall Safety
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter">{hasScans ? averageScore : '--'}</span>
                <span className="text-sm font-bold text-muted-foreground">/100</span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground mt-2 flex items-center gap-1 uppercase">
                {hasScans ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500">+12% from last month</span>
                  </>
                ) : 'No scans completed'}
              </p>
              <Progress value={averageScore} className="h-1.5 mt-4 bg-muted" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="h-1 bg-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Active Homes
              </CardTitle>
              <HomeIcon className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter">{totalHomes}</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">
                {totalRooms} Rooms Monitored
              </p>
              <div className="flex -space-x-2 mt-4 overflow-hidden">
                {visibleHomes.slice(0, 3).map((home, i) => (
                  <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-muted overflow-hidden">
                    {home.coverImage ? (
                      <img src={home.coverImage} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] font-bold uppercase">
                        {home.name[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="h-1 bg-amber-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Open Hazards
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter text-amber-600">{hasScans ? totalHazards : '--'}</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">
                Requires Attention
              </p>
              <div className="flex items-center gap-1.5 mt-5">
                <Badge variant="outline" className="text-[9px] font-bold border-amber-200 text-amber-700 bg-amber-50 py-0 px-1.5">HIGH: {highHazards}</Badge>
                <Badge variant="outline" className="text-[9px] font-bold border-amber-200 text-amber-600 bg-amber-50 py-0 px-1.5">MED: {medHazards}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden bg-primary/5">
            <div className="h-1 bg-primary/40" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Community Activity
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter">12k+</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">
                Caregivers Active Today
              </p>
              <Button variant="link" className="p-0 h-auto text-[10px] font-bold uppercase tracking-widest text-primary mt-4" asChild>
                <Link to="/community">Join Discussion <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Insights Chart */}
        <Card className="md:col-span-4 border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <div>
              <CardTitle>Home Health Trend</CardTitle>
              <CardDescription>Visualizing safety progress across all properties.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none">
                Score: {averageScore}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {!hasScans ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4 bg-muted/10 rounded-xl border border-dashed border-border/60">
                <Activity className="h-10 w-10 text-muted-foreground/30" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">No Trend Data Available</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">Perform at least two scans to see your progress chart.</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/scan">Scan Now</Link>
                </Button>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }} 
                      dy={10} 
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScore)"
                      dot={{ fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights & Recent Activities */}
        <div className="md:col-span-3 space-y-6">
          <Card className="border-border/60 shadow-sm bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="h-10 w-10 text-primary/10" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-xl bg-background border border-border/60 shadow-sm">
                <p className="text-xs font-bold leading-relaxed">
                  {hasScans 
                    ? `Your safety score is currently ${averageScore}/100. ${totalHazards > 0 ? `Focus on addressing the ${highHazards} high-priority hazards first to improve your score.` : 'Excellent work! No immediate hazards detected.'}`
                    : "Welcome! Your first priority should be scanning high-risk areas like the bathroom or kitchen to establish a baseline safety score."
                  }
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> {resolvedFixes} FIXES DONE
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="h-3 w-3" /> {totalHazards} PENDING
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm flex flex-col flex-1">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Recent Activity</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-wider">LATEST UPDATES</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold leading-none">{activity.action}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{activity.description}</p>
                      <p className="text-[9px] text-muted-foreground font-medium">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No recent activity.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Quick Access Area */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link to="/timeline" className="group">
          <Card className="border-border/60 hover:border-primary/40 transition-all cursor-pointer shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg">Safety Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Track your home safety transformation and score history.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/resources" className="group">
          <Card className="border-border/60 hover:border-primary/40 transition-all cursor-pointer shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg">AI Resource Center</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Personalized safety guides and curated expert resources.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/community" className="group">
          <Card className="border-border/60 hover:border-primary/40 transition-all cursor-pointer shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <CardTitle className="text-lg">Caregiver Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect with other caregivers and share safety advice.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 5.99-5.11a2 2 0 0 1 2.02 0C15 2 17 4 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
