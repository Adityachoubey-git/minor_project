"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Base_Url from "@/hooks/Baseurl";

import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";

import { toast } from "sonner";
import {
  Sunrise,
  Moon,
  Power,
  Clock,
  Users,
  Zap,
  Cpu,
  Building2,
  GraduationCap
} from "lucide-react";

import { motion } from "framer-motion";
import SetAlarmModal from "./components/set-alarm-modal";

/* ------------------------- Types ---------------------------- */
interface Stats {
  totalUsers: number;
  totalDevices: number;
  totalLabs: number;
  totalStudents: number;
  totalFaculty: number;
}

interface Lab {
  id: number;
  name: string;
}

interface Device {
  id: number;
  Name: string;
  PinNumber: number;
  labId: number;
  allowedDevices: boolean;
  gmEnabled: boolean;
  gnEnabled: boolean;
  studentAllowed: boolean;
}

interface DeviceState {
  [key: number]: boolean;
}

/* ------------------------- Component ---------------------------- */
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStates, setDeviceStates] = useState<DeviceState>({});

  const [selectedLabId, setSelectedLabId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [togglingDevice, setTogglingDevice] = useState<number | null>(null);
  const [togglingAllDevices, setTogglingAllDevices] = useState(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);

  /* -------------------- Load Stats + Labs -------------------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, labsRes] = await Promise.all([
          axios.get(`${Base_Url}/auth/admin/stats`, { withCredentials: true }),
          axios.get(`${Base_Url}/lab/get`, {
            params: { limit: 200 },
            withCredentials: true
          })
        ]);

        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (labsRes.data.success) setLabs(labsRes.data.labs);
      } catch {
        toast.error("Failed fetching dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* -------------------- Load Devices -------------------- */
  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${Base_Url}/devices/get`, {
          params:
            selectedLabId !== "all"
              ? { labId: selectedLabId, limit: 200 }
              : { limit: 200 },
          withCredentials: true
        });

        if (res.data.success) {
          setDevices(res.data.devices);
          await fetchDeviceStates(res.data.devices);
        }
      } catch {
        toast.error("Failed to load devices");
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, [selectedLabId]);

  /* -------------------- Fetch Real Relay States -------------------- */
  const fetchDeviceStates = async (deviceList: Device[]) => {
    try {
      const pins = deviceList.map((d) => d.PinNumber);
      const res = await axios.post(
        `${Base_Url}/relay/live-state`,
        { pins },
        { withCredentials: true }
      );

      if (res.data.success) {
        const map: DeviceState = {};
        res.data.states.forEach((s: { pin: number; state?: string }) => {
          const dev = deviceList.find((d) => d.PinNumber === s.pin);
          if (dev) map[dev.id] = s.state === "on";
        });
        setDeviceStates(map);
      }
    } catch {}
  };

  /* -------------------- Toggle Single Device -------------------- */
  const handleToggleDevice = async (device: Device) => {
    setTogglingDevice(device.id);

    try {
      const newState = deviceStates[device.id] ? "off" : "on";

      const res = await axios.post(
        `${Base_Url}/relay/control`,
        { deviceIds: [device.id], state: newState },
        { withCredentials: true }
      );

      if (res.data.success) {
        setDeviceStates((prev) => ({
          ...prev,
          [device.id]: newState === "on"
        }));
        toast.success(`Device turned ${newState}`);
      }
    } catch {
      toast.error("Failed to toggle device");
    } finally {
      setTogglingDevice(null);
    }
  };

  /* -------------------- GM/GN UI Sync Logic -------------------- */
  const applyGM_UI = () => {
    setDeviceStates((prev) => {
      const updated = { ...prev };
      devices.forEach((d) => {
        if (d.gmEnabled && d.allowedDevices) updated[d.id] = true;
      });
      return updated;
    });
  };

  const applyGN_UI = () => {
    setDeviceStates((prev) => {
      const updated = { ...prev };
      devices.forEach((d) => {
        if (d.gnEnabled && d.allowedDevices) updated[d.id] = false;
      });
      return updated;
    });
  };

  /* -------------------- GLOBAL GM/GN -------------------- */
  const handleGlobalGoodMorning = async () => {
    try {
      setTogglingAllDevices(true);
      await axios.post(
        `${Base_Url}/settings/features/good-morning`,
        {},
        { withCredentials: true }
      );
      toast.success("Global Good Morning Applied!");
      applyGM_UI();
    } catch {
      toast.error("Global GM failed");
    } finally {
      setTogglingAllDevices(false);
    }
  };

  const handleGlobalGoodNight = async () => {
    try {
      setTogglingAllDevices(true);
      await axios.post(
        `${Base_Url}/settings/features/good-night`,
        {},
        { withCredentials: true }
      );
      toast.success("Global Good Night Applied!");
      applyGN_UI();
    } catch {
      toast.error("Global GN failed");
    } finally {
      setTogglingAllDevices(false);
    }
  };

  /* -------------------- LAB-WISE GM/GN -------------------- */
  const handleLabGoodMorning = async () => {
    if (selectedLabId === "all") return toast.error("Select a lab first");

    try {
      setTogglingAllDevices(true);
      await axios.post(
        `${Base_Url}/settings/features/good-morning`,
        { labId: selectedLabId },
        { withCredentials: true }
      );
      toast.success("Lab Good Morning Applied!");

      setDeviceStates((prev) => {
        const updated = { ...prev };
        devices
          .filter((d) => d.labId.toString() === selectedLabId)
          .forEach((d) => {
            if (d.gmEnabled && d.allowedDevices) updated[d.id] = true;
          });
        return updated;
      });
    } catch {
      toast.error("GM failed");
    } finally {
      setTogglingAllDevices(false);
    }
  };

  const handleLabGoodNight = async () => {
    if (selectedLabId === "all") return toast.error("Select a lab first");

    try {
      setTogglingAllDevices(true);
      await axios.post(
        `${Base_Url}/settings/features/good-night`,
        { labId: selectedLabId },
        { withCredentials: true }
      );

      toast.success("Lab Good Night Applied!");

      setDeviceStates((prev) => {
        const updated = { ...prev };
        devices
          .filter((d) => d.labId.toString() === selectedLabId)
          .forEach((d) => {
            if (d.gnEnabled && d.allowedDevices) updated[d.id] = false;
          });
        return updated;
      });
    } catch {
      toast.error("GN failed");
    } finally {
      setTogglingAllDevices(false);
    }
  };

  /* -------------------- UI -------------------- */
  if (loading && !stats) return <Loader fullScreen />;

  return (
    <div className="m-10 space-y-8">

      {/* ---------------- STATS SECTION RESTORED ---------------- */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Total Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDevices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Total Labs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLabs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" /> Faculty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFaculty}</div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* ---------------- GLOBAL GM/GN BUTTONS ---------------- */}
      <div className="flex gap-4">
        <Button
          onClick={handleGlobalGoodMorning}
          disabled={togglingAllDevices}
          className="bg-yellow-500 text-white"
        >
          <Sunrise className="h-4 w-4 mr-2" /> Global Good Morning
        </Button>

        <Button
          onClick={handleGlobalGoodNight}
          disabled={togglingAllDevices}
          className="bg-indigo-600 text-white"
        >
          <Moon className="h-4 w-4 mr-2" /> Global Good Night
        </Button>
      </div>

      {/* ---------------- LAB FILTER ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Devices by Lab</CardTitle>
          <CardDescription>Select a lab to view devices</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Select value={selectedLabId} onValueChange={setSelectedLabId}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select a lab..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              {labs.map((lab) => (
                <SelectItem key={lab.id} value={lab.id.toString()}>
                  {lab.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lab GM/GN Buttons */}
          {selectedLabId !== "all" && devices.length > 0 && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleLabGoodMorning}
                disabled={togglingAllDevices}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
              >
                <Sunrise className="h-4 w-4" /> Lab Good Morning
              </Button>

              <Button
                onClick={handleLabGoodNight}
                disabled={togglingAllDevices}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <Moon className="h-4 w-4" /> Lab Good Night
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- DEVICE LIST ---------------- */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {selectedLabId === "all" ? "All Devices" : "Lab Devices"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const isOn = deviceStates[device.id];
            const loadingThis = togglingDevice === device.id;

            const blocked =
              !device.allowedDevices ||
              (!device.gmEnabled && !device.gnEnabled);

            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <motion.div
                  className={`rounded-xl ${
                    blocked ? "opacity-50 pointer-events-none" : ""
                  }`}
                  animate={{
                    scale: isOn ? 1.02 : 1,
                    boxShadow: isOn
                      ? "0 0 15px rgba(0,255,100,0.4)"
                      : "0 0 10px rgba(255,0,0,0.3)"
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 15 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{device.Name}</CardTitle>
                      <CardDescription>Pin {device.PinNumber}</CardDescription>

                      {/* Disabled Label */}
                      {blocked && (
                        <div className="mt-2 px-2 py-1 text-xs rounded bg-red-200 text-red-700 font-semibold inline-block">
                          Not GM/GN Allowed
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Status */}
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span>Status</span>
                        <motion.div
                          animate={{
                            backgroundColor: isOn
                              ? "rgba(16,185,129,0.3)"
                              : "rgba(239,68,68,0.3)",
                            scale: isOn ? 1.1 : 1
                          }}
                          transition={{ duration: 0.3 }}
                          className="px-3 py-1 rounded-full text-sm font-semibold"
                        >
                          {isOn ? "ON" : "OFF"}
                        </motion.div>
                      </div>

                      {/* Toggle */}
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          className={`w-full ${
                            isOn
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                          disabled={loadingThis || blocked}
                          onClick={() => handleToggleDevice(device)}
                        >
                          {loadingThis ? "Processing..." : <><Power className="h-4 w-4 mr-2" /> Turn {isOn ? "OFF" : "ON"}</>}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ---------------- Alarm Modal ---------------- */}
      <SetAlarmModal
        open={isAlarmModalOpen}
        onOpenChange={setIsAlarmModalOpen}
        selectedLabId={selectedLabId}
      />
    </div>
  );
}
