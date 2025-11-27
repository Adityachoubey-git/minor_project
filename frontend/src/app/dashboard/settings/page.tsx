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
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { toast } from "sonner";

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
  const [selectedLabId, setSelectedLabId] = useState<string>("");
  const [devices, setDevices] = useState<Device[]>([]);

  // Load labs
  useEffect(() => {
    axios
      .get(`${Base_Url}/lab/get`, { params: { limit: 100 }, withCredentials: true })
      .then((res) => setLabs(res.data.labs))
      .catch(() => toast.error("Failed to load labs"));
  }, []);

  // Load devices based on lab
  useEffect(() => {
    const loadDevices = async () => {
      const res = await axios.get(`${Base_Url}/devices/gm-gn/list`, {
        params: selectedLabId ? { labId: selectedLabId } : {},
        withCredentials: true,
      });
      setDevices(res.data.devices);
    };

    loadDevices();
  }, [selectedLabId]);

  // Update settings
  const updateDevice = async (id: number, gm: boolean, gn: boolean) => {
    await axios.post(
      `${Base_Url}/devices/settings/update-good-features`,
      { deviceId: id, gmEnabled: gm, gnEnabled: gn },
      { withCredentials: true }
    );
    toast.success("Updated");
  };

  return (
    <div className="m-10 space-y-8">
      <h1 className="text-3xl font-bold">Good Morning / Good Night Settings</h1>

      {/* Lab Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Lab</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedLabId} onValueChange={setSelectedLabId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select lab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All labs</SelectItem>
              {labs.map((lab) => (
                <SelectItem key={lab.id} value={lab.id.toString()}>
                  {lab.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Devices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between border-b pb-3 pt-1"
            >
              <div>
                <p className="font-semibold">{d.Name}</p>
                <p className="text-xs text-muted-foreground">
                  Pin {d.PinNumber}
                </p>
                <p className="text-xs">
                  Allowed:{" "}
                  <span
                    className={`${
                      d.allowedDevices ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {d.allowedDevices ? "Yes" : "No"}
                  </span>{" "}
                  | Student:{" "}
                  <span
                    className={`${
                      d.studentAllowed ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {d.studentAllowed ? "Yes" : "No"}
                  </span>
                </p>
              </div>

              <div className="flex gap-6">
                {/* GM */}
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={d.gmEnabled}
                    onCheckedChange={(v) =>
                      updateDevice(d.id, v === true, d.gnEnabled)
                    }
                  />
                  GM
                </label>

                {/* GN */}
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={d.gnEnabled}
                    onCheckedChange={(v) =>
                      updateDevice(d.id, d.gmEnabled, v === true)
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
