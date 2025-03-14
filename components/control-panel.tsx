"use client"

import { useAudioNodes } from "./audio-node-provider"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface ControlPanelProps {
  selectedNodeId: string | null
}

export function ControlPanel({ selectedNodeId }: ControlPanelProps) {
  const { nodes, updateNodeParam } = useAudioNodes()

  const selectedNode = selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) : null

  if (!selectedNode || Object.keys(selectedNode.params || {}).length === 0) {
    return (
      <div className="h-64 border-t p-4 bg-background">
        <div className="flex h-full items-center justify-center text-muted-foreground">
          {selectedNodeId ? "No parameters available for this node" : "Select a node to view parameters"}
        </div>
      </div>
    )
  }

  const handleParamChange = (param: string, value: number[]) => {
    updateNodeParam(selectedNode.id, param, value[0])
  }

  const getParamConfig = (param: string, nodeType: string) => {
    switch (nodeType) {
      case "delay":
        if (param === "delayTime") return { min: 0, max: 2, step: 0.01, label: "Delay Time (s)" }
        if (param === "feedback") return { min: 0, max: 0.95, step: 0.01, label: "Feedback" }
        break
      case "reverb":
        if (param === "decay") return { min: 0.1, max: 10, step: 0.1, label: "Decay (s)" }
        if (param === "preDelay") return { min: 0, max: 0.1, step: 0.001, label: "Pre-Delay (s)" }
        break
      case "compressor":
        if (param === "threshold") return { min: -60, max: 0, step: 1, label: "Threshold (dB)" }
        if (param === "ratio") return { min: 1, max: 20, step: 0.5, label: "Ratio" }
        if (param === "attack") return { min: 0, max: 1, step: 0.001, label: "Attack (s)" }
        if (param === "release") return { min: 0, max: 1, step: 0.01, label: "Release (s)" }
        break
      case "filter":
        if (param === "frequency") return { min: 20, max: 20000, step: 1, label: "Frequency (Hz)" }
        if (param === "Q") return { min: 0.1, max: 20, step: 0.1, label: "Q" }
        if (param === "gain") return { min: -30, max: 30, step: 0.5, label: "Gain (dB)" }
        break
    }
    return { min: 0, max: 1, step: 0.01, label: param }
  }

  return (
    <div className="h-64 border-t p-4 bg-background overflow-y-auto">
      <h2 className="font-semibold mb-4">
        {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Parameters
      </h2>

      <div className="space-y-6">
        {Object.entries(selectedNode.params).map(([param, value]) => {
          const config = getParamConfig(param, selectedNode.type)

          return (
            <div key={param} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${selectedNode.id}-${param}`}>{config.label}</Label>
                <span className="text-sm text-muted-foreground">
                  {param.includes("Time") || param === "attack" || param === "release" || param === "preDelay"
                    ? value.toFixed(3)
                    : param === "frequency"
                      ? value.toFixed(0)
                      : value.toFixed(2)}
                </span>
              </div>
              <Slider
                id={`${selectedNode.id}-${param}`}
                min={config.min}
                max={config.max}
                step={config.step}
                value={[value]}
                onValueChange={(newValue) => handleParamChange(param, newValue)}
                aria-label={config.label}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

