"use client"

import { useState } from "react"
import { Clock, Waves, Activity, Filter, PanelLeft, BarChart2, Sliders } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAudioNodes } from "./audio-node-provider"

export function Sidebar() {
  const { addNode } = useAudioNodes()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleAddNode = (type: import("./audio-node-provider").NodeType) => {
    // Add node at a random position in the visible area
    const x = Math.random() * 500 + 200
    const y = Math.random() * 300 + 100
    addNode(type, { x, y })
  }

  const handleDragStart = (e: React.DragEvent, type: import("./audio-node-provider").NodeType) => {
    e.dataTransfer.setData("nodeType", type)
    // Create a ghost image for dragging
    const ghostElement = document.createElement("div")
    ghostElement.classList.add("w-20", "h-10", "bg-indigo-500", "rounded", "flex", "items-center", "justify-center", "text-white")
    ghostElement.innerText = type.charAt(0).toUpperCase() + type.slice(1)
    document.body.appendChild(ghostElement)
    e.dataTransfer.setDragImage(ghostElement, 40, 20)
    
    // Schedule removal of the ghost element
    setTimeout(() => {
      document.body.removeChild(ghostElement)
    }, 0)
  }

  const nodeTypes = [
    { type: "oscillator", icon: Clock, label: "Oscillator" },
    { type: "mp3input", icon: Waves, label: "MP3 Input" },
    { type: "delay", icon: Clock, label: "Delay" },
    { type: "reverb", icon: Waves, label: "Reverb" },
    { type: "compressor", icon: Activity, label: "Compressor" },
    { type: "filter", icon: Filter, label: "Filter" },
    { type: "visualizer", icon: BarChart2, label: "Visualizer" },
    { type: "eq", icon: Sliders, label: "Parametric EQ" },
  ] as const

  return (
    <div className={cn(
      "border-r bg-background transition-all duration-300",
      isCollapsed ? "w-12" : "w-64"
    )}>
      <div className="flex items-center justify-between p-2 border-b">
        <h2 className={isCollapsed ? "hidden" : "block font-semibold"}>Audio Nodes</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft className={cn(
            "h-5 w-5 transition-transform",
            isCollapsed ? "rotate-180" : ""
          )} />
        </Button>
      </div>

      <div className="p-2">
        <div className={cn(
          "space-y-2",
          isCollapsed ? "flex flex-col items-center" : ""
        )}>
          {!isCollapsed && (
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop nodes to create your audio processing chain.
            </p>
          )}

          {nodeTypes.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant="outline"
              className={cn(
                "w-full justify-start",
                isCollapsed ? "px-0 justify-center" : ""
              )}
              onClick={() => handleAddNode(type)}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
            >
              <Icon className={cn(
                "h-5 w-5",
                isCollapsed ? "mx-2" : "mr-2"
              )} />
              {!isCollapsed && <span>{label}</span>}
            </Button>
          ))}
        </div>

        {!isCollapsed && (
          <div className="mt-8 rounded-md bg-muted p-3">
            <h3 className="font-medium text-sm mb-2">Instructions</h3>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Click a node to add it to the canvas</li>
              <li>• Drag nodes from sidebar to position them</li>
              <li>• Right-click on canvas to add nodes</li>
              <li>• Connect outputs to inputs</li>
              <li>• Select a node to edit parameters</li>
              <li>• Press Delete to remove a node</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}