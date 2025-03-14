"use client"

import type React from "react"
import { Mic, Speaker, Clock, Waves, Activity, Filter, BarChart2, Sliders } from "lucide-react"
import type { AudioNode } from "./audio-node-provider"
import { Visualizer } from "./visualizer"

interface AudioNodeProps {
  node: AudioNode
  isSelected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onStartConnecting: (nodeId: string, output: string, e: React.MouseEvent) => void
  onEndConnecting: (nodeId: string, input: string, e: React.MouseEvent) => void
}

export function AudioNodeComponent({
  node,
  isSelected,
  onMouseDown,
  onStartConnecting,
  onEndConnecting,
}: AudioNodeProps) {
  const getNodeIcon = () => {
    switch (node.type) {
      case "source":
        return <Mic className="h-5 w-5" />
      case "destination":
        return <Speaker className="h-5 w-5" />
      case "delay":
        return <Clock className="h-5 w-5" />
      case "reverb":
        return <Waves className="h-5 w-5" />
      case "compressor":
        return <Activity className="h-5 w-5" />
      case "filter":
        return <Filter className="h-5 w-5" />
      case "visualizer":
        return <BarChart2 className="h-5 w-5" />
      case "eq":
        return <Sliders className="h-5 w-5" />
      default:
        return null
    }
  }

  const getNodeColor = () => {
    switch (node.type) {
      case "source":
        return "bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800"
      case "destination":
        return "bg-purple-100 border-purple-300 dark:bg-purple-950 dark:border-purple-800"
      case "delay":
        return "bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800"
      case "reverb":
        return "bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800"
      case "compressor":
        return "bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800"
      case "filter":
        return "bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800"
      case "visualizer":
        return "bg-indigo-100 border-indigo-300 dark:bg-indigo-950 dark:border-indigo-800"
      case "eq":
        return "bg-teal-100 border-teal-300 dark:bg-teal-950 dark:border-teal-800"
      default:
        return "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
    }
  }

  const getNodeTitle = () => {
    switch (node.type) {
      case "source":
        return "Audio Source"
      case "destination":
        return "Output"
      case "delay":
        return "Delay"
      case "reverb":
        return "Reverb"
      case "compressor":
        return "Compressor"
      case "filter":
        return "Filter"
      case "visualizer":
        return "Visualizer"
      case "eq":
        return "Parametric EQ"
      default:
        return "Node"
    }
  }

  return (
    <div
      className={`absolute w-[150px] rounded-md border-2 shadow-md transition-shadow ${getNodeColor()} ${isSelected ? "ring-2 ring-indigo-500 shadow-lg" : ""}`}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
      }}
      onMouseDown={onMouseDown}
      aria-selected={isSelected}
      role="button"
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b p-2 cursor-move">
        {getNodeIcon()}
        <span className="font-medium">{getNodeTitle()}</span>
      </div>

      {/* Body */}
      <div className="p-2">
        {/* Input connectors */}
        {node.inputs.length > 0 && (
          <div className="flex items-center mb-2">
            {node.inputs.map((input) => (
              <div key={input} className="relative">
                <div
                  className="absolute -left-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-indigo-500 cursor-pointer"
                  onClick={(e) => onEndConnecting(node.id, input, e)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${getNodeTitle()} input connector`}
                />
                <span className="text-xs ml-2">Input</span>
              </div>
            ))}
          </div>
        )}

        {/* Visualization canvas for visualizer node */}
        {node.type === "visualizer" && (
          <div className="my-2 h-20 w-full">
            <Visualizer node={node} />
          </div>
        )}

        {/* Output connectors */}
        {node.outputs.length > 0 && (
          <div className="flex items-center justify-end mt-2">
            {node.outputs.map((output) => (
              <div key={output} className="relative">
                <span className="text-xs mr-2">Output</span>
                <div
                  className="absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-indigo-500 cursor-pointer"
                  onClick={(e) => onStartConnecting(node.id, output, e)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${getNodeTitle()} output connector`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}