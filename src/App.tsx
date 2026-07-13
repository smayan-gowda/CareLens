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
      console.log('Subscribing to user data for:', user.uid);
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
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/homes/:homeId/rooms/:roomId/scan" element={<ScanPage />} />
              <Route path="/homes/:homeId/rooms/:roomId/reports/:reportId" element={<ReportPage />} />
              <Route path="/homes" element={<HomesPage />} />
              <Route path="/homes/new" element={<HomeCreatePage />} />
              <Route path="/homes/:homeId" element={<HomeProfilePage />} />
              <Route path="/homes/:homeId/rooms/new" element={<RoomCreatePage />} />
              <Route path="/homes/:homeId/rooms/:roomId" element={<RoomDetailPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}
