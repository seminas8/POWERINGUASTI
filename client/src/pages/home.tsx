import { useState } from "react";
import { Header } from "@/components/Header";
import { FilterSidebar } from "@/components/FilterSidebar";
import MapContainer from "@/components/MapContainer";
import { MobileSidebar } from "@/components/MobileSidebar";
import { useOutages } from "@/hooks/useOutages";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/hooks/useTheme";

import type { Outage } from "@/lib/standalone-api";

export default function Home() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: {
      active: true,
      planned: true,
      resolved: false,
    },
    zone: "",
  });
  const { data: outages, isLoading, error, refetch, dataUpdatedAt } = useOutages();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Sistema di notifiche per guasti in Calabria
  const { settings } = useNotifications();

  // Filter outages based on current filters
  const filteredOutages = (outages || []).filter((outage: Outage) => {
    const statusMatch = (
      (filters.status.active && outage.status === 'active') ||
      (filters.status.planned && outage.status === 'planned') ||
      (filters.status.resolved && outage.status === 'resolved')
    );
    
    const zoneMatch = !filters.zone || filters.zone === 'all' || outage.zone.toLowerCase().includes(filters.zone.toLowerCase());
    
    return statusMatch && zoneMatch;
  });





  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Calculate statistics
  const stats = {
    totalActive: filteredOutages.filter((o: Outage) => o.status === 'active').length,
    totalPlanned: filteredOutages.filter((o: Outage) => o.status === 'planned').length,
    totalResolved: filteredOutages.filter((o: Outage) => o.status === 'resolved').length,
    totalAffected: filteredOutages.reduce((sum: number, outage: Outage) => sum + (outage.affectedUsers || 0), 0),
    avgDuration: calculateAverageDuration(filteredOutages),
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header
        onToggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          stats={stats}
          outages={filteredOutages}
        />
        
        <MapContainer
          outages={filteredOutages}
          isLoading={isLoading}
          error={error}
          onRefresh={refetch}
        />
      </div>



      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={toggleMobileSidebar}
        filters={filters}
        onFiltersChange={setFilters}
        stats={stats}
        outages={filteredOutages}
      />


    </div>
  );
}

function calculateAverageDuration(outages: Outage[]): string {
  const resolvedOutages = outages.filter(o => o.actualResolution && o.startTime);
  
  if (resolvedOutages.length === 0) {
    // For active outages, calculate current duration
    const activeOutages = outages.filter(o => o.status === 'active' && o.startTime);
    if (activeOutages.length === 0) return '0h';
    
    const totalMinutes = activeOutages.reduce((sum, outage) => {
      const start = new Date(outage.startTime).getTime();
      const now = Date.now();
      return sum + Math.max(0, (now - start) / (1000 * 60));
    }, 0);
    
    const avgMinutes = totalMinutes / activeOutages.length;
    return formatDuration(avgMinutes);
  }
  
  const totalMinutes = resolvedOutages.reduce((sum, outage) => {
    const start = new Date(outage.startTime).getTime();
    const end = new Date(outage.actualResolution!).getTime();
    return sum + Math.max(0, (end - start) / (1000 * 60));
  }, 0);
  
  const avgMinutes = totalMinutes / resolvedOutages.length;
  return formatDuration(avgMinutes);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}
