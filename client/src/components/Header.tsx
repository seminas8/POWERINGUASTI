import { Zap, Sun, Moon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HeaderProps {
  onToggleTheme: () => void;
  isDarkMode: boolean;
  showSettingsButton?: boolean;
}

export function Header({ onToggleTheme, isDarkMode, showSettingsButton = true }: HeaderProps) {
  const [, setLocation] = useLocation();



  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Powering Guasti</h1>
        </div>
        
        {/* Controls */}
        <div className="ml-auto flex items-center space-x-2">
          {showSettingsButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/settings')}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
