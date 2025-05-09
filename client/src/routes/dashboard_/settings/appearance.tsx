import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { usePreferencesStore } from "@/features/preferences/stores/preferences.store";
import { preferencesService } from "@/features/preferences/services/preferences";
import { Check } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/core/components/ui/switch";

export const Route = createFileRoute("/dashboard_/settings/appearance")({
  component: AppearanceSettingsComponent,
});


function AppearanceSettingsComponent() {
  const queryClient = useQueryClient();

  const theme = usePreferencesStore((state) => state.theme)
  const dark_sidebar = usePreferencesStore((state) => state.dark_sidebar)
  // const isLoading = usePreferenceStore((state) => state.isLoading)

  const updatePreferences = useMutation({
    mutationFn: preferencesService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Customize the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ThemeOption
                title="System"
                selected={theme === "system"}
                onClick={() => updatePreferences.mutate({ theme: "system" })}
              >
                <SystemThemeSvg />
              </ThemeOption>

              <ThemeOption
                title="Light"
                selected={theme === "light"}
                onClick={() => updatePreferences.mutate({ theme: "light" })}
              >
                <LightThemeSvg />
              </ThemeOption>

              <ThemeOption
                title="Dark"
                selected={theme === "dark"}
                onClick={() => updatePreferences.mutate({ theme: "dark" })}
              >
                <DarkThemeSvg />
              </ThemeOption>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex justify-between items-center">
        <CardHeader>
          <CardTitle>Dark Sidebar</CardTitle>
          <CardDescription>
            Display dark sidebar regardless of the selected Theme
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pr-6">
          <Switch checked={dark_sidebar} onCheckedChange={(checked) => updatePreferences.mutate({ dark_sidebar: checked })} />
        </CardContent>
      </Card>
    </div>
  );
}


interface ThemeOptionProps {
  title: string
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}

function ThemeOption({ title, selected, onClick, children }: ThemeOptionProps) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selected ? "border-primary" : "border-muted hover:border-muted-foreground/50"
        }`}
    >
      <div className="aspect-[3/2] w-full">{children}</div>
      <div className="p-2 text-center font-medium">{title}</div>
      {selected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

function SystemThemeSvg() {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#f8f9fa" />

      {/* Header */}
      <rect x="10" y="10" width="180" height="15" rx="2" fill="#e9ecef" />
      <rect x="15" y="15" width="50" height="5" rx="1" fill="#adb5bd" />
      <rect x="160" y="15" width="20" height="5" rx="1" fill="#adb5bd" />

      {/* Sidebar */}
      <rect x="10" y="30" width="40" height="110" rx="2" fill="#e9ecef" />
      <rect x="15" y="40" width="30" height="5" rx="1" fill="#adb5bd" />
      <rect x="15" y="55" width="30" height="5" rx="1" fill="#adb5bd" />
      <rect x="15" y="70" width="30" height="5" rx="1" fill="#adb5bd" />
      <rect x="15" y="85" width="30" height="5" rx="1" fill="#adb5bd" />
      <rect x="15" y="100" width="30" height="5" rx="1" fill="#adb5bd" />

      {/* Main content */}
      <rect x="60" y="30" width="130" height="20" rx="2" fill="#e9ecef" />
      <rect x="65" y="35" width="80" height="10" rx="1" fill="#adb5bd" />

      {/* Chart */}
      <rect x="60" y="60" width="130" height="40" rx="2" fill="#e9ecef" />
      <polyline
        points="70,90 85,75 100,85 115,65 130,80 145,70 160,75 175,60"
        stroke="#adb5bd"
        fill="none"
        strokeWidth="2"
      />

      {/* Data table */}
      <rect x="60" y="110" width="130" height="30" rx="2" fill="#e9ecef" />
      <rect x="65" y="115" width="120" height="5" rx="1" fill="#adb5bd" />
      <rect x="65" y="125" width="120" height="5" rx="1" fill="#adb5bd" />
      <rect x="65" y="135" width="120" height="5" rx="1" fill="#adb5bd" />
    </svg>
  )
}

function LightThemeSvg() {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#ffffff" />

      {/* Header */}
      <rect x="10" y="10" width="180" height="15" rx="2" fill="#f1f3f5" />
      <rect x="15" y="15" width="50" height="5" rx="1" fill="#adb5bd" />
      <rect x="160" y="15" width="20" height="5" rx="1" fill="#adb5bd" />

      {/* Sidebar */}
      <rect x="10" y="30" width="40" height="110" rx="2" fill="#f8f9fa" />
      <rect x="15" y="40" width="30" height="5" rx="1" fill="#adb5bd" />
      <rect x="15" y="55" width="30" height="5" rx="1" fill="#adb5bd" />
      <rect x="15" y="70" width="30" height="5" rx="1" fill="#adb5bd" />
      <rect x="15" y="85" width="30" height="5" rx="1" fill="#adb5bd" />
      <rect x="15" y="100" width="30" height="5" rx="1" fill="#adb5bd" />

      {/* Main content */}
      <rect x="60" y="30" width="130" height="20" rx="2" fill="#f8f9fa" />
      <rect x="65" y="35" width="80" height="10" rx="1" fill="#adb5bd" />

      {/* Chart */}
      <rect x="60" y="60" width="130" height="40" rx="2" fill="#f8f9fa" />
      <polyline
        points="70,90 85,75 100,85 115,65 130,80 145,70 160,75 175,60"
        stroke="#adb5bd"
        fill="none"
        strokeWidth="2"
      />

      {/* Data table */}
      <rect x="60" y="110" width="130" height="30" rx="2" fill="#f8f9fa" />
      <rect x="65" y="115" width="120" height="5" rx="1" fill="#adb5bd" />
      <rect x="65" y="125" width="120" height="5" rx="1" fill="#adb5bd" />
      <rect x="65" y="135" width="120" height="5" rx="1" fill="#adb5bd" />
    </svg>
  )
}

function DarkThemeSvg() {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#212529" />

      {/* Header */}
      <rect x="10" y="10" width="180" height="15" rx="2" fill="#343a40" />
      <rect x="15" y="15" width="50" height="5" rx="1" fill="#6c757d" />
      <rect x="160" y="15" width="20" height="5" rx="1" fill="#6c757d" />

      {/* Sidebar */}
      <rect x="10" y="30" width="40" height="110" rx="2" fill="#343a40" />
      <rect x="15" y="40" width="30" height="5" rx="1" fill="#6c757d" />
      <rect x="15" y="55" width="30" height="5" rx="1" fill="#6c757d" />
      <rect x="15" y="70" width="30" height="5" rx="1" fill="#6c757d" />
      <rect x="15" y="85" width="30" height="5" rx="1" fill="#6c757d" />
      <rect x="15" y="100" width="30" height="5" rx="1" fill="#6c757d" />

      {/* Main content */}
      <rect x="60" y="30" width="130" height="20" rx="2" fill="#343a40" />
      <rect x="65" y="35" width="80" height="10" rx="1" fill="#6c757d" />

      {/* Chart */}
      <rect x="60" y="60" width="130" height="40" rx="2" fill="#343a40" />
      <polyline
        points="70,90 85,75 100,85 115,65 130,80 145,70 160,75 175,60"
        stroke="#6c757d"
        fill="none"
        strokeWidth="2"
      />

      {/* Data table */}
      <rect x="60" y="110" width="130" height="30" rx="2" fill="#343a40" />
      <rect x="65" y="115" width="120" height="5" rx="1" fill="#6c757d" />
      <rect x="65" y="125" width="120" height="5" rx="1" fill="#6c757d" />
      <rect x="65" y="135" width="120" height="5" rx="1" fill="#6c757d" />
    </svg>
  )
}
