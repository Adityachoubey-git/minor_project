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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { toast } from "sonner";
import { Power, Sunrise, Moon, Clock } from "lucide-react";

import { motion } from "framer-motion";
import SetAlarmModal from "../admin/components/set-alarm-modal";

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */
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
  gmEnabled?: boolean;
  gnEnabled?: boolean;
  studentAllowed?: boolean;
}

interface DeviceState {
  [key: number]: "on" | "off" | "unreachable";
}

/* ---------------------------------------------------------
   COMPONENT
--------------------------------------------------------- */
export default function FacultyDashboard() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStates, setDeviceStates] = useState<DeviceState>({});

  const [selectedLabId, setSelectedLabId] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [togglingDevice, setTogglingDevice] = useState<number | null>(null);
  const [togglingAllDevices, setTogglingAllDevices] = useState(false);

  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);

  /* ---------------------------------------------------------
     LOAD LABS
--------------------------------------------------------- */
  useEffect(() => {
    const loadLabs = async () => {
      try {
        const res = await axios.get(`${Base_Url}/lab/get`, {
          params: { limit: 200 },
          withCredentials: true
        });

        if (res.data.success) setLabs(res.data.labs);
      } catch {
        toast.error("Failed to load labs");
      }
    };

    loadLabs();
  }, []);

  /* ---------------------------------------------------------
     FETCH LIVE STATES (NEW FORMAT: 0/1 + unreachable)
--------------------------------------------------------- */
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
        const map: DeviceState = {};

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
    } catch {
      // optional: console.error
    }
  };

  /* ---------------------------------------------------------
     LOAD DEVICES — ALL devices on load
--------------------------------------------------------- */
  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${Base_Url}/devices/get`, {
          params:
            selectedLabId === "all"
              ? { limit: 200 }
              : { labId: selectedLabId, limit: 200 },
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

  /* ---------------------------------------------------------
     TOGGLE A SINGLE DEVICE
--------------------------------------------------------- */
  const handleToggleDevice = async (device: Device) => {
    if (!device.allowedDevices)
      return toast.error("This device is restricted by admin");

    setTogglingDevice(device.id);
    const current = deviceStates[device.id];
    const newState = current === "on" ? "off" : "on";

    try {
      const res = await axios.post(
        `${Base_Url}/relay/control`,
        { deviceIds: [device.id], state: newState },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(`Device turned ${newState.toUpperCase()}`);
        await fetchDeviceStates(devices);
      } else {
        toast.error("Failed to toggle device");
      }
    } catch {
      toast.error("Failed to toggle device");
    } finally {
      setTogglingDevice(null);
    }
  };

  /* ---------------------------------------------------------
     GOOD MORNING — FACULTY ALLOWED ONLY (ALLOWED DEVICES)
--------------------------------------------------------- */
  const handleGoodMorning = async () => {
    if (selectedLabId === "all")
      return toast.error("Select a lab for Good Morning");

    const allowedIds = devices
      .filter((d) => d.allowedDevices)
      .map((d) => d.id);

    if (allowedIds.length === 0)
      return toast.error("No allowed devices in this lab");

    setTogglingAllDevices(true);

    try {
      const res = await axios.post(
        `${Base_Url}/relay/control`,
        {
          deviceIds: allowedIds,
          state: "on"
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Good Morning Applied!");

        setDeviceStates((prev) => {
          const updated: DeviceState = { ...prev };
          allowedIds.forEach((id) => {
            updated[id] = "on";
          });
          return updated;
        });
      } else {
        toast.error("Failed to apply Good Morning");
      }
    } catch {
      toast.error("Failed to apply Good Morning");
    } finally {
      setTogglingAllDevices(false);
    }
  };

  /* ---------------------------------------------------------
     GOOD NIGHT — FACULTY ALLOWED ONLY (ALLOWED DEVICES)
--------------------------------------------------------- */
  const handleGoodNight = async () => {
    if (selectedLabId === "all")
      return toast.error("Select a lab for Good Night");

    const allowedIds = devices
      .filter((d) => d.allowedDevices)
      .map((d) => d.id);

    if (allowedIds.length === 0)
      return toast.error("No allowed devices in this lab");

    setTogglingAllDevices(true);

    try {
      const res = await axios.post(
        `${Base_Url}/relay/control`,
        {
          deviceIds: allowedIds,
          state: "off"
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Good Night Applied!");

        setDeviceStates((prev) => {
          const updated: DeviceState = { ...prev };
          allowedIds.forEach((id) => {
            updated[id] = "off";
          });
          return updated;
        });
      } else {
        toast.error("Failed to apply Good Night");
      }
    } catch {
      toast.error("Failed to apply Good Night");
    } finally {
      setTogglingAllDevices(false);
    }
  };

  /* ---------------------------------------------------------
     UI
--------------------------------------------------------- */

  if (loading && !devices.length) return <Loader fullScreen />;

  return (
    <div className="m-10 space-y-8">
      {/* ---------- Header ---------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>

        <Button
          onClick={() => setIsAlarmModalOpen(true)}
          className="gap-2 flex items-center"
        >
          <Clock className="h-4 w-4" /> Set Alarm
        </Button>
      </div>

      {/* ---------- LAB FILTER ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Devices</CardTitle>
          <CardDescription>
            Select a lab to see devices or choose all devices
          </CardDescription>
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

          {/* GM/GN buttons — hidden when ALL selected */}
          {selectedLabId !== "all" && devices.length > 0 && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleGoodMorning}
                disabled={togglingAllDevices}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
              >
                <Sunrise className="h-4 w-4" />
                {togglingAllDevices ? "Processing..." : "Good Morning"}
              </Button>

              <Button
                onClick={handleGoodNight}
                disabled={togglingAllDevices}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <Moon className="h-4 w-4" />
                {togglingAllDevices ? "Processing..." : "Good Night"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- DEVICE GRID ---------- */}
      <h2 className="text-2xl font-bold mt-6 mb-4">
        {selectedLabId === "all" ? "All Devices" : "Lab Devices"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => {
          const state = deviceStates[device.id];
          const isOn = state === "on";
          const isUnreachable = state === "unreachable";
          const isBlocked = !device.allowedDevices;
          const isLoading = togglingDevice === device.id;

          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                className={`rounded-xl ${
                  isBlocked ? "opacity-60 pointer-events-none" : ""
                }`}
                animate={{
                  scale: isOn ? 1.02 : 1,
                  boxShadow: isUnreachable
                    ? "0 0 10px rgba(107,114,128,0.5)"
                    : isOn
                    ? "0 0 15px rgba(0,255,100,0.4)"
                    : "0 0 10px rgba(255,0,0,0.3)"
                }}
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{device.Name}</CardTitle>
                    <CardDescription>Pin {device.PinNumber}</CardDescription>

                    {isBlocked && (
                      <span className="text-xs mt-2 bg-red-200 text-red-600 px-2 py-1 rounded">
                        Not Allowed (Admin Restricted)
                      </span>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* STATUS */}
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span>Status</span>
                      <motion.div
                        animate={{
                          backgroundColor: isUnreachable
                            ? "rgba(107,114,128,0.4)" // gray
                            : isOn
                            ? "rgba(16,185,129,0.3)" // green
                            : "rgba(239,68,68,0.3)", // red
                          scale: isOn ? 1.1 : 1
                        }}
                        transition={{ duration: 0.3 }}
                        className="px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        {isUnreachable
                          ? "Unreachable"
                          : isOn
                          ? "ON"
                          : "OFF"}
                      </motion.div>
                    </div>

                    {/* TOGGLE BUTTON */}
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => handleToggleDevice(device)}
                        disabled={isLoading || isBlocked || isUnreachable}
                        className={`w-full gap-2 ${
                          isOn
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        <Power className="h-4 w-4" />
                        {isLoading
                          ? "Processing..."
                          : `Turn ${isOn ? "OFF" : "ON"}`}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* ---------- ALARM MODAL ---------- */}
      <SetAlarmModal
        open={isAlarmModalOpen}
        onOpenChange={setIsAlarmModalOpen}
        selectedLabId={selectedLabId}
      />
    </div>
  );
}
