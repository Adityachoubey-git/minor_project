"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectItem, SelectValue, SelectContent } from "@/components/ui/select";
import { Zap } from "lucide-react";
import Base_Url from "@/hooks/Baseurl";
import axios from "axios";

interface Lab {
  id: number;
  name: string;
}

interface Device {
  id: number;
  Name: string;
  PinNumber: number;
  value: boolean;
  studentAllowed: boolean;
}

export default function StudentDashboard() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState<string>("");
  const [devices, setDevices] = useState<Device[]>([]);

  // ------------------- LOAD LABS -------------------
  const loadLabs = async () => {
    try {
      const res = await axios.get(`${Base_Url}/lab/get`, {
        params: { limit: 100 },
        withCredentials: true,
      });
      setLabs(res.data?.labs || []);
    } catch (err) {
      console.error("Error fetching labs:", err);
    }
  };

  // ------------------- LOAD DEVICES -------------------
  const loadDevices = async (labId: string) => {
    if (!labId) return;
    try {
      const res = await axios.get(`${Base_Url}/devices/lab/${labId}`, {
        withCredentials: true,
      });
      setDevices(res.data?.devices || []);
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  };

  // ------------------- TOGGLE DEVICE (Student Allowed Only) -------------------
  const toggleDevice = async (device: Device) => {
    if (!device.studentAllowed) return; // extra safety

    const newState = device.value ? "off" : "on";

    try {
      const res = await axios.post(
        `${Base_Url}/relay/control`,
        {
          deviceIds: [device.id],
          state: newState,
        },
        { withCredentials: true }
      );

      if (!res.data?.success) {
        console.error("Failed to control device:", res.data);
        return;
      }

      // Reload devices for the selected lab so `device.value` updates
      if (selectedLab) {
        await loadDevices(selectedLab);
      }
    } catch (err) {
      console.error("Error toggling device:", err);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Device Control Panel</h1>
        <p className="text-muted-foreground">Filter lab-wise and control allowed devices</p>
      </div>

      {/* Lab Selector */}
      <div className="w-full max-w-sm">
        <Select
          value={selectedLab}
          onValueChange={(val) => {
            setSelectedLab(val);
            loadDevices(val);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Lab" />
          </SelectTrigger>
          <SelectContent>
            {labs.map((lab) => (
              <SelectItem value={lab.id.toString()} key={lab.id}>
                {lab.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Devices Section */}
      {selectedLab && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {devices.map((device) => (
            <Card key={device.id} className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-primary" />
                  {device.Name}
                </CardTitle>
                <CardDescription>Pin: {device.PinNumber}</CardDescription>
              </CardHeader>

              <CardContent>
                {/* Status */}
                <p className="mb-3 text-sm">
                  Status:
                  <span
                    className={`ml-2 font-bold ${
                      device.value ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {device.value ? "ON" : "OFF"}
                  </span>
                </p>

                {/* Toggle Allowed Only */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {device.studentAllowed ? "You can control this" : "Not allowed"}
                  </span>
                   {/* //switch works as turned on when actually hardware is connected  */}
                  <Switch
                    checked={device.value}
                    disabled={!device.studentAllowed}
                    onCheckedChange={() => toggleDevice(device)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!selectedLab && (
        <p className="text-muted-foreground text-sm">
          Please select a lab to view devices
        </p>
      )}
    </div>
  );
}
