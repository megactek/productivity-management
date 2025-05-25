"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppDataContext } from "@/context/AppDataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Separator } from "@/components/ui/Separator";
import { AlertCircle, Check, Download, Moon, Palette, Settings2, Sun } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { storageService } from "@/services/storage";
import { toast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { settings, updateSettings, updateTheme, updateNotifications } = useAppDataContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<string | null>(null);
  const [useServerStorage, setUseServerStorage] = useState(settings?.useServerStorage ?? true);

  if (!settings) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Settings2 className="h-10 w-10 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-medium">Loading settings...</h2>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Handle theme change
  const handleThemeChange = async (theme: "light" | "dark" | "system") => {
    try {
      await updateTheme(theme);
      showSaveSuccess();
    } catch (error) {
      console.error("Failed to update theme:", error);
    }
  };

  // Handle notifications toggle
  const handleNotificationsChange = async (enabled: boolean) => {
    try {
      await updateNotifications(enabled);
      showSaveSuccess();
    } catch (error) {
      console.error("Failed to update notification settings:", error);
    }
  };

  // Handle working hours change
  const handleWorkingHoursChange = async (field: "start" | "end", value: string) => {
    try {
      await updateSettings({
        workingHours: {
          ...settings.workingHours,
          [field]: value,
        },
      });
      showSaveSuccess();
    } catch (error) {
      console.error("Failed to update working hours:", error);
    }
  };

  // Handle completion goal change
  const handleCompletionGoalChange = async (value: number) => {
    try {
      await updateSettings({ completionGoal: value });
      showSaveSuccess();
    } catch (error) {
      console.error("Failed to update completion goal:", error);
    }
  };

  // Show save success indicator
  const showSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  // Handle data export
  const handleExportData = () => {
    setIsExporting(true);

    try {
      // Get all data from localStorage
      const data: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("taskflow_data")) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || "null");
          } catch {
            // If parsing fails, store as string
            data[key] = localStorage.getItem(key);
          }
        }
      }

      // Create a download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taskflow-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 100);
    } catch (error) {
      console.error("Failed to export data:", error);
      setIsExporting(false);
    }
  };

  // Handle data import
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        try {
          // Preview the data
          const jsonData = event.target.result as string;
          setImportData(jsonData);
          setShowImportConfirm(true);
        } catch (err) {
          console.error("Failed to parse import file:", err);
        }
      }
    };
    reader.readAsText(file);
  };

  // Handle import confirmation
  const handleImportConfirm = () => {
    if (!importFile) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        // Import data to localStorage
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });

        // Reload the page to apply changes
        window.location.reload();
      } catch (error) {
        console.error("Failed to import data:", error);
        setIsImporting(false);
        setShowImportConfirm(false);
      }
    };

    reader.readAsText(importFile);
  };

  const handleStorageToggle = async (useServer: boolean) => {
    try {
      setUseServerStorage(useServer);
      storageService.setUseServerStorage(useServer);
      await updateSettings({ useServerStorage: useServer });
      toast.success({
        title: "Storage settings updated",
        description: `Using ${useServer ? "server" : "local"} storage`,
      });
    } catch (err) {
      console.error("Failed to update storage settings:", err);
      toast.error({
        title: "Error",
        description: "Failed to update storage settings",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Customize your TaskFlow experience.</p>
          </div>

          {saveSuccess && (
            <div className="flex items-center text-green-500 animate-in fade-in slide-in-from-top-5 duration-300">
              <Check className="h-4 w-4 mr-1" />
              <span className="text-sm">Settings saved</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Productivity Settings</CardTitle>
                <CardDescription>Configure your productivity preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="completionGoal">Daily Completion Goal</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="completionGoal"
                      type="number"
                      min="1"
                      max="50"
                      value={settings.completionGoal}
                      onChange={(e) => handleCompletionGoalChange(parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">tasks per day</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Working Hours</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="time"
                      value={settings.workingHours.start}
                      onChange={(e) => handleWorkingHoursChange("start", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={settings.workingHours.end}
                      onChange={(e) => handleWorkingHoursChange("end", e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data Storage</Label>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Server Storage</h4>
                      <p className="text-sm text-muted-foreground">
                        Store data on the server to prevent data loss when clearing browser data
                      </p>
                    </div>
                    <Switch checked={useServerStorage} onCheckedChange={handleStorageToggle} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Customize the appearance of TaskFlow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                        settings.theme === "light" ? "bg-secondary border-primary" : ""
                      }`}
                      onClick={() => handleThemeChange("light")}
                    >
                      <div className="h-10 w-10 rounded-full bg-white border shadow-sm flex items-center justify-center mb-2">
                        <Sun className="h-5 w-5 text-amber-500" />
                      </div>
                      <span className="text-sm font-medium">Light</span>
                    </div>

                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                        settings.theme === "dark" ? "bg-secondary border-primary" : ""
                      }`}
                      onClick={() => handleThemeChange("dark")}
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-900 border shadow-sm flex items-center justify-center mb-2">
                        <Moon className="h-5 w-5 text-indigo-300" />
                      </div>
                      <span className="text-sm font-medium">Dark</span>
                    </div>

                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                        settings.theme === "system" ? "bg-secondary border-primary" : ""
                      }`}
                      onClick={() => handleThemeChange("system")}
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white to-gray-900 border shadow-sm flex items-center justify-center mb-2">
                        <Palette className="h-5 w-5 text-purple-500" />
                      </div>
                      <span className="text-sm font-medium">System</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for due tasks and important updates
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={handleNotificationsChange}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Browser Permissions</p>
                      <p className="text-muted-foreground">
                        For notifications to work properly, you need to grant browser notification permissions.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          if (Notification.permission !== "granted") {
                            Notification.requestPermission();
                          }
                        }}
                      >
                        Request Permissions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export or import your TaskFlow data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full" onClick={handleExportData} disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : "Export Data"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("import-file")?.click()}
                    disabled={isImporting}
                    className="flex-1"
                  >
                    {isImporting ? "Importing..." : "Import Data"}
                  </Button>
                  <input id="import-file" type="file" accept=".json" className="hidden" onChange={handleFileSelected} />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    Exporting data will download a JSON file containing all your tasks, projects, and settings.
                  </p>
                  <p>Importing data will replace your current data with the imported data. This cannot be undone.</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">Storage Location</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {useServerStorage
                      ? "Your data is currently stored on the server in the application's data directory."
                      : "Your data is currently stored in your browser's localStorage."}
                  </p>
                  <div className="p-2 bg-muted rounded-md">
                    <p className="text-xs font-mono">
                      {useServerStorage
                        ? `${process.cwd()}/data/`
                        : "Browser localStorage (will be lost if browser data is cleared)"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Import Confirmation Dialog */}
      {showImportConfirm && importData && (
        <Dialog
          isOpen={showImportConfirm}
          onClose={() => setShowImportConfirm(false)}
          title="Confirm Import"
          description="This will replace your current data. Are you sure you want to continue?"
        >
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md max-h-40 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap">{importData}</pre>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowImportConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleImportConfirm}>
                {isImporting ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
