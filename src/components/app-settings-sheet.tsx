import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Zap, Smartphone, Moon, Sun, Edit3, Trash2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
  haptics: boolean;
  onHapticsChange: (haptics: boolean) => void;
  isNotificationsGranted: boolean;
  onNotificationToggle: () => void;
  isTestingPush: boolean;
  onTestPush: () => void;
  onNavigateProfile: () => void;
  onClearData: () => void;
  onSignOut: () => void;
}

export function AppSettingsSheet({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  haptics,
  onHapticsChange,
  isNotificationsGranted,
  onNotificationToggle,
  isTestingPush,
  onTestPush,
  onNavigateProfile,
  onClearData,
  onSignOut,
}: AppSettingsSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", bounce: 0, duration: 0.4 }} 
            className="fixed bottom-0 left-0 right-0 z-[70] mx-auto w-full max-w-lg overflow-y-auto rounded-t-[2.5rem] border border-white/10 bg-slate-900 p-6 shadow-2xl md:bottom-auto md:top-[15%] md:max-h-[85vh] md:rounded-[2.5rem]"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">App Settings</h2>
                <p className="text-sm text-slate-400">Manage your preferences & data.</p>
              </div>
              <button 
                onClick={onClose} 
                className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6 pb-6">
              
              {/* 1. Preferences */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Preferences</h3>
                <div className="space-y-2">
                  
                  {/* Push Notifications Toggle */}
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-green-500/20">
                        <Bell className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">Push Notifications</div>
                        <div className="text-xs text-slate-400">Daily reminders</div>
                      </div>
                    </div>
                    <button 
                      onClick={onNotificationToggle} 
                      className={cn("h-7 w-12 cursor-pointer rounded-full p-1 transition-colors duration-300", isNotificationsGranted ? "bg-green-500" : "bg-slate-700")}
                    >
                      <motion.div layout className="h-5 w-5 rounded-full bg-white shadow-sm" animate={{ x: isNotificationsGranted ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    </button>
                  </div>

                  {/* Test Push Trigger */}
                  {isNotificationsGranted && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 flex items-center justify-between rounded-2xl bg-white/5 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-500/20">
                          <Zap className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">Test Connection</div>
                          <div className="text-xs text-slate-400">Send a live ping to this screen</div>
                        </div>
                      </div>
                      <button
                        onClick={onTestPush}
                        disabled={isTestingPush}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                      >
                        {isTestingPush ? "Testing..." : "Test Push"}
                      </button>
                    </motion.div>
                  )}

                  {/* Haptics Toggle */}
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-500/20">
                        <Smartphone className="h-5 w-5 text-indigo-400" />
                      </div>
                      <span className="font-semibold text-slate-200">Haptic Feedback</span>
                    </div>
                    <button onClick={() => onHapticsChange(!haptics)} className={cn("h-7 w-12 cursor-pointer rounded-full p-1 transition-colors duration-300", haptics ? "bg-indigo-500" : "bg-slate-700")}>
                      <motion.div layout className="h-5 w-5 rounded-full bg-white shadow-sm" animate={{ x: haptics ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    </button>
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/20">
                        {theme === "dark" ? <Moon className="h-5 w-5 text-amber-400" /> : <Sun className="h-5 w-5 text-amber-400" />}
                      </div>
                      <span className="font-semibold text-slate-200">App Theme</span>
                    </div>
                    <div className="flex gap-1 rounded-xl bg-slate-800 p-1">
                      <button onClick={() => onThemeChange("dark")} className={cn("rounded-lg px-3 py-1 text-xs font-bold transition-all", theme === "dark" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}>Dark</button>
                      <button onClick={() => onThemeChange("light")} className={cn("rounded-lg px-3 py-1 text-xs font-bold transition-all", theme === "light" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}>Light</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Account Details */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Account</h3>
                <div className="space-y-2">
                  <button onClick={() => { onClose(); onNavigateProfile(); }} className="flex w-full items-center justify-between rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500/20">
                        <Edit3 className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-200">Edit Profile</div>
                        <div className="text-xs text-slate-400">Update username or avatar</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* 3. Danger Zone */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-red-500/70">Danger Zone</h3>
                <div className="space-y-2">
                  <button onClick={onClearData} className="flex w-full items-center gap-4 rounded-2xl bg-red-500/5 p-4 text-red-400 transition-colors hover:bg-red-500/10">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-red-500/10">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold">Clear Local Data</div>
                      <div className="text-xs text-red-400/70">Wipes unsaved offline preferences</div>
                    </div>
                  </button>

                  <button onClick={() => { onClose(); onSignOut(); }} className="flex w-full items-center gap-4 rounded-2xl bg-red-500/10 p-4 text-red-400 transition-colors hover:bg-red-500/20">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-red-500/20">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <span className="font-bold">Sign Out</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
                    }
