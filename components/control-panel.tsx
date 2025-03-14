"use client"

import { useAudioNodes } from "./audio-node-provider"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
      case "visualizer":
        if (param === "fftSize") return { min: 32, max: 32768, step: 32, label: "FFT Size" }
        if (param === "minDecibels") return { min: -150, max: -30, step: 1, label: "Min dB" }
        if (param === "maxDecibels") return { min: -80, max: 0, step: 1, label: "Max dB" }
        if (param === "smoothingTimeConstant") return { min: 0, max: 1, step: 0.01, label: "Smoothing" }
        break
      case "eq":
        if (param === "lowFreq") return { min: 20, max: 1000, step: 1, label: "Low Freq (Hz)" }
        if (param === "lowGain") return { min: -24, max: 24, step: 0.5, label: "Low Gain (dB)" }
        if (param === "midFreq") return { min: 200, max: 5000, step: 1, label: "Mid Freq (Hz)" }
        if (param === "midQ") return { min: 0.1, max: 10, step: 0.1, label: "Mid Q" }
        if (param === "midGain") return { min: -24, max: 24, step: 0.5, label: "Mid Gain (dB)" }
        if (param === "highFreq") return { min: 1000, max: 20000, step: 1, label: "High Freq (Hz)" }
        if (param === "highGain") return { min: -24, max: 24, step: 0.5, label: "High Gain (dB)" }
        break
    }
    return { min: 0, max: 1, step: 0.01, label: param }
  }

  // Group parameters for the EQ node
  const renderEQControls = () => {
    return (
      <Tabs defaultValue="low">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="low">Low</TabsTrigger>
          <TabsTrigger value="mid">Mid</TabsTrigger>
          <TabsTrigger value="high">High</TabsTrigger>
        </TabsList>
        <TabsContent value="low" className="space-y-4">
          {renderNodeParam("lowFreq")}
          {renderNodeParam("lowGain")}
        </TabsContent>
        <TabsContent value="mid" className="space-y-4">
          {renderNodeParam("midFreq")}
          {renderNodeParam("midQ")}
          {renderNodeParam("midGain")}
        </TabsContent>
        <TabsContent value="high" className="space-y-4">
          {renderNodeParam("highFreq")}
          {renderNodeParam("highGain")}
        </TabsContent>
      </Tabs>
    )
  }

  const renderNodeParam = (param: string) => {
    if (!(param in selectedNode.params)) return null
    
    const config = getParamConfig(param, selectedNode.type)
    const value = selectedNode.params[param]
    
    return (
      <div key={param} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${selectedNode.id}-${param}`}>{config.label}</Label>
          <span className="text-sm text-muted-foreground">
            {param.includes("Time") || param === "attack" || param === "release" || param === "preDelay"
              ? value.toFixed(3)
              : param.includes("Freq")
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
  }

  return (
    <div className="h-64 border-t p-4 bg-background overflow-y-auto">
      <h2 className="font-semibold mb-4">
        {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Parameters
      </h2>

      <div className="space-y-6">
        {selectedNode.type === "eq" ? (
          renderEQControls()
        ) : (
          Object.keys(selectedNode.params).map((param) => renderNodeParam(param))
        )}
      </div>
    </div>
  )
}