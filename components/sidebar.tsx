"use client"

import { useAudioNodes } from "./audio-node-provider"
import { Button } from "@/components/ui/button"
import { Clock, Waves, Activity, Filter, PanelLeft } from "lucide-react"
import { useState } from "react"

export function Sidebar() {
  const { addNode } = useAudioNodes()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleAddNode = (type: "delay" | "reverb" | "compressor" | "filter") => {
    // Add node at a random position in the visible area
    const x = Math.random() * 500 + 200
    const y = Math.random() * 300 + 100
    addNode(type, { x, y })
  }

  return (
    <div className={`border-r bg-background transition-all duration-300 ${isCollapsed ? "w-12" : "w-64"}`}>
      <div className="flex items-center justify-between p-2 border-b">
        <h2 className={`font-semibold ${isCollapsed ? "hidden" : "block"}`}>Audio Nodes</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft className={`h-5 w-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
        </Button>
      </div>

      <div className="p-2">
        <div className={`space-y-2 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
          {!isCollapsed && (
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop nodes to create your audio processing chain.
            </p>
          )}

          <Button
            variant="outline"
            className={`w-full justify-start ${isCollapsed ? "px-0 justify-center" : ""}`}
            onClick={() => handleAddNode("delay")}
          >
            <Clock className="h-5 w-5 mr-2" />
            {!isCollapsed && <span>Delay</span>}
          </Button>

          <Button
            variant="outline"
            className={`w-full justify-start ${isCollapsed ? "px-0 justify-center" : ""}`}
            onClick={() => handleAddNode("reverb")}
          >
            <Waves className="h-5 w-5 mr-2" />
            {!isCollapsed && <span>Reverb</span>}
          </Button>

          <Button
            variant="outline"
            className={`w-full justify-start ${isCollapsed ? "px-0 justify-center" : ""}`}
            onClick={() => handleAddNode("compressor")}
          >
            <Activity className="h-5 w-5 mr-2" />
            {!isCollapsed && <span>Compressor</span>}
          </Button>

          <Button
            variant="outline"
            className={`w-full justify-start ${isCollapsed ? "px-0 justify-center" : ""}`}
            onClick={() => handleAddNode("filter")}
          >
            <Filter className="h-5 w-5 mr-2" />
            {!isCollapsed && <span>Filter</span>}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="mt-8 rounded-md bg-muted p-3">
            <h3 className="font-medium text-sm mb-2">Instructions</h3>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Click a node to add it to the canvas</li>
              <li>• Drag nodes to position them</li>
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

