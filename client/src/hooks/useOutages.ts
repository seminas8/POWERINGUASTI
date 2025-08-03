import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEnelOutages, refreshOutages, type Outage } from "@/lib/standalone-api";

export function useOutages(filters?: { status?: string; zone?: string }) {
  const queryClient = useQueryClient();
  
  const query = useQuery<Outage[], Error>({
    queryKey: ['outages-standalone', filters],
    queryFn: fetchEnelOutages,
    refetchInterval: 60000, // Aggiornamento ogni minuto
    staleTime: 300000, // Dati considerati freschi per 5 minuti (cache API)
    gcTime: 600000, // Cache mantenuta per 10 minuti
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Mount iniziale per caricare i dati
    retry: (failureCount, error: Error) => {
      console.log('🔄 Retry API standalone:', failureCount, error.message);
      return failureCount < 2; // Solo 2 tentativi per API esterna
    }
  });

  // Enhanced refetch function for standalone mode
  const enhancedRefetch = async () => {
    try {
      console.log('🔄 Force refresh standalone API...');
      
      // Invalida cache e forza refresh API Enel
      await queryClient.invalidateQueries({ 
        queryKey: ['outages-standalone'],
        exact: false 
      });
      
      // Chiama direttamente refreshOutages che invalida cache interna
      const freshData = await refreshOutages();
      
      // Aggiorna la cache di React Query
      queryClient.setQueryData(['outages-standalone', filters], freshData);
      
      return { data: freshData };
    } catch (error) {
      console.error('❌ Enhanced refresh failed:', error);
      // Fallback to normal refetch
      return await query.refetch();
    }
  };

  return {
    ...query,
    refetch: enhancedRefetch
  };
}

export function useOutage(id: string) {
  const { data: outages } = useOutages();
  
  return useQuery<Outage | undefined, Error>({
    queryKey: ['outage-standalone', id],
    queryFn: () => {
      const outage = outages?.find(o => o.id === id);
      if (!outage) {
        throw new Error('Outage not found');
      }
      return outage;
    },
    enabled: !!id && !!outages,
    retry: false // Non ha senso fare retry per ricerca locale
  });
}
