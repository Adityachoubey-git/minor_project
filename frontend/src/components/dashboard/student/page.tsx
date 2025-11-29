"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Base_Url from "@/hooks/Baseurl";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectItem, SelectValue, SelectContent } from "@/components/ui/select";

import { Zap, Sunrise, Moon, Power } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

/* ---------------------------- Types ---------------------------- */
interface Lab {
  id: number;
  name: string;
}

interface Device {
  id: number;
  Name: string;
  PinNumber: number;
  value: boolean; // DB value (not used for live state after change)
  studentAllowed: boolean;
  allowedDevices: boolean;
  gmEnabled: boolean;
  gnEnabled: boolean;
  labId: number;
}

type DeviceLiveState = "on" | "off" | "unreachable";

export default function StudentDashboard() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStates, setDeviceStates] = useState<{ [key: number]: DeviceLiveState }>({});
  const [selectedLab, setSelectedLab] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [togglingDevice, setTogglingDevice] = useState<number | null>(null);
  const [togglingAll, setTogglingAll] = useState(false);

  /* ---------------------------- Load Labs ---------------------------- */
  useEffect(() => {
    const loadLabs = async () => {
      try {
        const res = await axios.get(`${Base_Url}/lab/get`, {
          params: { limit: 200 },
          withCredentials: true,
        });
        setLabs(res.data?.labs || []);
      } catch {
        toast.error("Failed to load labs");
      }
    };

    loadLabs();
  }, []);

  /* ---------------------------- Fetch Live Relay States ---------------------------- */
  const fetchDeviceStates = async (deviceList: Device[]) => {
    if (!deviceList.length) {
      setDeviceStates({});
      return;
    }

    try {
      const pins = deviceList.map((d) => d.PinNumber);
      const res = await axios.post(
        `${Base_Url}/relay/live-state`,
        { pins },
        { withCredentials: true }
      );

      if (res.data.success) {
        const map: { [key: number]: DeviceLiveState } = {};

        res.data.states.forEach(
          (s: { pin: number; state?: number; error?: string }) => {
            const dev = deviceList.find((d) => d.PinNumber === s.pin);
            if (!dev) return;

            if (s.error === "unreachable") {
              map[dev.id] = "unreachable";
            } else if (s.state === 0) {
              // 0 => ON
              map[dev.id] = "on";
            } else if (s.state === 1) {
              // 1 => OFF
              map[dev.id] = "off";
            }
          }
        );

        setDeviceStates(map);
      }
    } catch (err) {
      console.error("[StudentDashboard] Error fetching device states:", err);
    }
  };

  /* ---------------------------- Load Devices ---------------------------- */
  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          selectedLab === "all"
            ? `${Base_Url}/devices/get`
            : `${Base_Url}/devices/lab/${selectedLab}`,
          {
            params: selectedLab === "all" ? { limit: 200 } : {},
            withCredentials: true,
          }
        );

        const list: Device[] = res.data?.devices || res.data?.devices || [];
        setDevices(list);

        // Use live relay state instead of DB `value`
        await fetchDeviceStates(list);
      } catch {
        toast.error("Failed to load devices");
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, [selectedLab]);

  /* Optional: periodic live refresh */
  useEffect(() => {
    if (!devices.length) return;

    const interval = setInterval(() => {
      fetchDeviceStates(devices);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [devices]);

  /* ---------------------------- Toggle Device ---------------------------- */
  const toggleDevice = async (device: Device) => {
    if (!device.studentAllowed) return;

    const current = deviceStates[device.id];
    const isOn = current === "on";
    const newState = isOn ? "off" : "on";

    setTogglingDevice(device.id);

    try {
      const res = await axios.post(
        `${Base_Url}/relay/control`,
        {
          deviceIds: [device.id],
          state: newState,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(`Device turned ${newState.toUpperCase()}`);
        // Re-sync with live state
        await fetchDeviceStates([device]);
      }
    } catch {
      toast.error("Failed to toggle device");
    } finally {
      setTogglingDevice(null);
    }
  };

  /* ---------------------------- Student GM/GN APPLY ---------------------------- */
  const studentGM = async () => {
    if (selectedLab === "") return toast.error("Select a lab");

    setTogglingAll(true);
    try {
      const allowedIDs = devices
        .filter(
          (d) =>
            d.studentAllowed &&
            d.allowedDevices &&
            d.gmEnabled &&
            (selectedLab === "all" || d.labId.toString() === selectedLab)
        )
        .map((d) => d.id);

      if (allowedIDs.length === 0) return toast.error("No GM-enabled devices allowed");

      await axios.post(
        `${Base_Url}/relay/control`,
        { deviceIds: allowedIDs, state: "on" },
        { withCredentials: true }
      );

      toast.success("Good Morning Applied!");

      // Sync UI with live state
      await fetchDeviceStates(devices);
    } catch {
      toast.error("Failed to apply GM");
    } finally {
      setTogglingAll(false);
    }
  };

  const studentGN = async () => {
    if (selectedLab === "") return toast.error("Select a lab");

    setTogglingAll(true);
    try {
      const allowedIDs = devices
        .filter(
          (d) =>
            d.studentAllowed &&
            d.allowedDevices &&
            d.gnEnabled &&
            (selectedLab === "all" || d.labId.toString() === selectedLab)
        )
        .map((d) => d.id);

      if (allowedIDs.length === 0) return toast.error("No GN-enabled devices allowed");

      await axios.post(
        `${Base_Url}/relay/control`,
        { deviceIds: allowedIDs, state: "off" },
        { withCredentials: true }
      );

      toast.success("Good Night Applied!");

      // Sync UI with live state
      await fetchDeviceStates(devices);
    } catch {
      toast.error("Failed to apply GN");
    } finally {
      setTogglingAll(false);
    }
  };

  /* ---------------------------- UI ---------------------------- */
  return (
    <div className="m-10 space-y-8">
      {/* ---------------- Header ---------------- */}
      <h1 className="text-3xl font-bold">Student Dashboard</h1>

      {/* ---------------- Lab Filter + GM/GN buttons ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Select Lab</CardTitle>
          <CardDescription>Choose which lab you want to control</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Select value={selectedLab} onValueChange={(v) => setSelectedLab(v)}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select Lab" />
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

          {/* GM/GN buttons - Only show when a specific lab is selected */}
          {selectedLab !== "all" && devices.length > 0 && (
            <div className="flex gap-4 pt-2">
              <Button
                onClick={studentGM}
                disabled={togglingAll}
                className="flex-1 bg-yellow-500 text-white"
              >
                <Sunrise className="h-4 w-4 mr-2" /> Good Morning
              </Button>

              <Button
                onClick={studentGN}
                disabled={togglingAll}
                className="flex-1 bg-indigo-600 text-white"
              >
                <Moon className="h-4 w-4 mr-2" /> Good Night
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- Device Grid ---------------- */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Devices</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d) => {
            const state = deviceStates[d.id];
            const isOn = state === "on";
            const isUnreachable = state === "unreachable";
            const blocked = !d.studentAllowed || !d.allowedDevices;

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className={`rounded-xl ${
                    blocked ? "opacity-50 pointer-events-none" : ""
                  }`}
                  animate={{
                    scale: isOn ? 1.02 : 1,
                    boxShadow: isUnreachable
                      ? "0 0 10px rgba(107,114,128,0.4)"
                      : isOn
                      ? "0 0 15px rgba(0,255,100,0.3)"
                      : "0 0 10px rgba(255,0,0,0.25)",
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 15 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="w-5 h-5 text-primary" />
                        {d.Name}
                      </CardTitle>
                      <CardDescription>Pin: {d.PinNumber}</CardDescription>

                      {!d.studentAllowed && (
                        <p className="text-xs mt-2 text-red-500 font-semibold">
                          Not Allowed for Students
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Status */}
                      <p className="text-sm">
                        Status:
                        <span
                          className={`ml-2 font-bold ${
                            isUnreachable
                              ? "text-gray-500"
                              : isOn
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {isUnreachable ? "Unreachable" : isOn ? "ON" : "OFF"}
                        </span>
                      </p>

                      {/* Toggle */}
                      <Button
                        className={`w-full flex items-center justify-center gap-2 ${
                          isOn
                            ? "bg-green-600"
                            : "bg-red-600"
                        } text-white`}
                        disabled={blocked || togglingDevice === d.id}
                        onClick={() => toggleDevice(d)}
                      >
                        <Power className="w-4 h-4" />
                        {togglingDevice === d.id
                          ? "Processing..."
                          : `Turn ${isOn ? "OFF" : "ON"}`}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
