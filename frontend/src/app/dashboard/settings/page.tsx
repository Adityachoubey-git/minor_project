"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Base_Url from "@/hooks/Baseurl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import toast from "react-hot-toast";

interface Lab {
  id: number;
  name: string;
}

interface Device {
  id: number;
  Name: string;
  PinNumber: number;
  gmEnabled: boolean;
  gnEnabled: boolean;
  allowedDevices: boolean;
  studentAllowed: boolean;
  labId: number;
}

export default function GoodFeatureSettings() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>("all");

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Undo for SINGLE device update
  const [lastState, setLastState] = useState<{
    id: number;
    gm: boolean;
    gn: boolean;
  } | null>(null);

  const isStudent = false; // if needed, get from session

  // Fetch labs
  useEffect(() => {
    axios
      .get(`${Base_Url}/lab/get`, {
        params: { limit: 100 },
        withCredentials: true,
      })
      .then((res) => setLabs(res.data.labs))
      .catch(() => toast.error("Failed to load labs"));
  }, []);

  // Fetch devices based on lab filter
  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);

      const res = await axios.get(
        `${Base_Url}/settings/devices/gm-gn/list`,
        {
          params:
            selectedLabId !== "all" ? { labId: selectedLabId } : {},
          withCredentials: true,
        }
      );

      setDevices(res.data.devices);
      setLoading(false);
    };

    loadDevices();
  }, [selectedLabId]);

  // Update a SINGLE device
  const updateDevice = async (id: number, gm: boolean, gn: boolean) => {
    const prev = devices.find((d) => d.id === id);
    if (!prev) return;

    // Save undo state ONLY for single update
    setLastState({ id, gm: prev.gmEnabled, gn: prev.gnEnabled });

    try {
      await axios.post(
        `${Base_Url}/settings/devices/settings/update-good-features`,
        { deviceId: id, gmEnabled: gm, gnEnabled: gn },
        { withCredentials: true }
      );

      setDevices((prevDevices) =>
        prevDevices.map((d) =>
          d.id === id ? { ...d, gmEnabled: gm, gnEnabled: gn } : d
        )
      );

      // Custom notifications
      if (gm !== prev.gmEnabled) {
        toast.success(
          gm
            ? `Good Morning ENABLED for ${prev.Name}`
            : `Good Morning DISABLED for ${prev.Name}`
        );
      }

      if (gn !== prev.gnEnabled) {
        toast.success(
          gn
            ? `Good Night ENABLED for ${prev.Name}`
            : `Good Night DISABLED for ${prev.Name}`
        );
      }

      // Undo popup
      toast((t) => (
        <div className="flex justify-between items-center gap-4">
          <span>Updated {prev.Name}</span>
          <button
            onClick={() => {
              undoUpdate();
              toast.dismiss(t.id);
            }}
            className="text-blue-500 underline"
          >
            Undo
          </button>
        </div>
      ));
    } catch {
      toast.error("Update failed");
    }
  };

  // Undo last single update
  const undoUpdate = async () => {
    if (!lastState) return;

    try {
      await axios.post(
        `${Base_Url}/settings/devices/settings/update-good-features`,
        {
          deviceId: lastState.id,
          gmEnabled: lastState.gm,
          gnEnabled: lastState.gn,
        },
        { withCredentials: true }
      );

      setDevices((prev) =>
        prev.map((d) =>
          d.id === lastState.id
            ? { ...d, gmEnabled: lastState.gm, gnEnabled: lastState.gn }
            : d
        )
      );

      toast.success("Undo successful");
    } catch {
      toast.error("Undo failed");
    }
  };

  // Toggle GM/GN for ALL devices (optimized)
  const toggleAll = async (type: "gm" | "gn", value: boolean) => {
    toast.loading(
      `${type === "gm" ? "Good Morning" : "Good Night"} → ${
        value ? "ENABLE ALL" : "DISABLE ALL"
      }`
    );

    for (const d of devices) {
      // Update silently, no single toasts, no undo
      await axios.post(
        `${Base_Url}/settings/devices/settings/update-good-features`,
        {
          deviceId: d.id,
          gmEnabled: type === "gm" ? value : d.gmEnabled,
          gnEnabled: type === "gn" ? value : d.gnEnabled,
        },
        { withCredentials: true }
      );
    }

    setDevices((prev) =>
      prev.map((d) => ({
        ...d,
        gmEnabled: type === "gm" ? value : d.gmEnabled,
        gnEnabled: type === "gn" ? value : d.gnEnabled,
      }))
    );

    toast.dismiss();
    toast.success(
      type === "gm"
        ? `All GM ${value ? "ENABLED" : "DISABLED"}`
        : `All GN ${value ? "ENABLED" : "DISABLED"}`
    );
  };

  return (
    <div className="m-10 space-y-8">
      <h1 className="text-3xl font-bold">Good Morning / Good Night Settings</h1>

      {/* LAB FILTER */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Lab</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedLabId}
            onValueChange={setSelectedLabId}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Lab" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>

              {labs.map((lab) => (
                <SelectItem
                  key={lab.id}
                  value={lab.id.toString()}
                >
                  {lab.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* GLOBAL BUTTONS */}
      <div className="flex gap-4">
        <Button onClick={() => toggleAll("gm", true)}>
          Enable All GM
        </Button>
        <Button variant="secondary" onClick={() => toggleAll("gm", false)}>
          Disable All GM
        </Button>

        <Button onClick={() => toggleAll("gn", true)}>
          Enable All GN
        </Button>
        <Button variant="secondary" onClick={() => toggleAll("gn", false)}>
          Disable All GN
        </Button>
      </div>

      {/* DEVICE LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Devices</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Loader */}
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}

          {/* Device Items */}
          {!loading &&
            devices.map((d) => (
              <div
                key={d.id}
                className={`flex items-center justify-between border-b pb-3 pt-1 ${
                  isStudent && !d.studentAllowed ? "opacity-40" : ""
                }`}
              >
                <div>
                  <p className="font-semibold">{d.Name}</p>
                  <p className="text-xs text-muted-foreground">
                    Pin {d.PinNumber}
                  </p>
                </div>

                <div className="flex gap-6">
                  {/* GM */}
                  <label className="flex items-center gap-2">
                    <Checkbox
                      disabled={!d.allowedDevices}
                      checked={d.gmEnabled}
                      onCheckedChange={(v) =>
                        updateDevice(
                          d.id,
                          v === true,
                          d.gnEnabled
                        )
                      }
                    />
                    GM
                  </label>

                  {/* GN */}
                  <label className="flex items-center gap-2">
                    <Checkbox
                      disabled={!d.allowedDevices}
                      checked={d.gnEnabled}
                      onCheckedChange={(v) =>
                        updateDevice(
                          d.id,
                          d.gmEnabled,
                          v === true
                        )
                      }
                    />
                    GN
                  </label>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
