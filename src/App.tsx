/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./stores/useAuthStore";
import { AppLayout } from "./components/layout/AppLayout";
import { Landing } from "./pages/Landing";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ScanPage } from "./pages/ScanPage";
import { HomesPage } from "./pages/HomesPage";
import { HomeCreatePage } from "./pages/HomeCreatePage";
import { HomeProfilePage } from "./pages/HomeProfilePage";
import { RoomCreatePage } from "./pages/RoomCreatePage";
import { RoomDetailPage } from "./pages/RoomDetailPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ReportPage } from "./pages/ReportPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { TimelinePage } from "./pages/TimelinePage";
import { CommunityPage } from "./pages/CommunityPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHomeStore } from "./stores/useHomeStore";
import { useScanStore } from "./stores/scanStore";

function ProtectedRoute() {
  const { user, loading, initialized } = useAuthStore();
  const { subscribe: subscribeHome } = useHomeStore();
  const { subscribe: subscribeScan } = useScanStore();

  useEffect(() => {
    if (user) {
      const unsubHome = subscribeHome(user.uid);
      const unsubScan = subscribeScan(user.uid);
      return () => {
        unsubHome();
        unsubScan();
      };
    }
  }, [user, subscribeHome, subscribeScan]);

  if (!initialized || loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => {
    init();
  }, [init]);

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/welcome" element={<OnboardingPage />} />

            <Route element={<AppLayout />}>
              <Route path="/overview" element={<DashboardPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/properties/:homeId/rooms/:roomId/scan" element={<ScanPage />} />
              <Route path="/properties/:homeId/rooms/:roomId/assessments/:reportId" element={<ReportPage />} />
              <Route path="/properties" element={<HomesPage />} />
              <Route path="/properties/new" element={<HomeCreatePage />} />
              <Route path="/properties/:homeId" element={<HomeProfilePage />} />
              <Route path="/properties/:homeId/rooms/new" element={<RoomCreatePage />} />
              <Route path="/properties/:homeId/rooms/:roomId" element={<RoomDetailPage />} />
              <Route path="/assessments" element={<ReportsPage />} />
              <Route path="/progress" element={<TimelinePage />} />
              <Route path="/marketplace" element={<ResourcesPage />} />
              <Route path="/network" element={<CommunityPage />} />
              <Route path="/profile" element={<SettingsPage />} />
              <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
              <Route path="/homes" element={<Navigate to="/properties" replace />} />
              <Route path="/reports" element={<Navigate to="/assessments" replace />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}
