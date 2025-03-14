"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { useAudioNodes } from "./audio-node-provider"
import { AudioNodeComponent } from "./audio-node"

interface NodeEditorProps {
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
}

export function NodeEditor({ selectedNodeId, onSelectNode }: NodeEditorProps) {
  const { nodes, connections, updateNodePosition, removeConnection } = useAudioNodes()
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; output: string } | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const editorRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return // Only left mouse button

    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })

    setDraggingNodeId(nodeId)
    onSelectNode(nodeId)
    e.stopPropagation()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    if (draggingNodeId) {
      const editorRect = editorRef.current?.getBoundingClientRect()
      if (!editorRect) return

      const x = e.clientX - editorRect.left - dragOffset.x
      const y = e.clientY - editorRect.top - dragOffset.y

      updateNodePosition(draggingNodeId, { x, y })
    }
  }

  const handleMouseUp = () => {
    setDraggingNodeId(null)
    setConnectingFrom(null)
  }

  const handleEditorClick = (e: React.MouseEvent) => {
    // Deselect when clicking on the background
    if (e.target === editorRef.current) {
      onSelectNode(null)
    }
  }

  const handleStartConnecting = (nodeId: string, output: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConnectingFrom({ nodeId, output })
  }

  const handleEndConnecting = (nodeId: string, input: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (connectingFrom) {
      const { nodeId: sourceId, output } = connectingFrom
      // The actual connection is handled in the AudioNodeProvider
      // This just triggers the UI update
      setConnectingFrom(null)
    }
  }

  const handleConnectionClick = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeConnection(connectionId)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedNodeId) {
        // Don't allow deleting source or destination
        if (selectedNodeId !== "source" && selectedNodeId !== "destination") {
          // removeNode is handled in the AudioNodeProvider
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedNodeId])

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleEditorClick}
    >
      <div className="relative h-[2000px] w-[2000px]">
        {/* Render connection lines */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          {connections.map((connection) => (
            <path
              key={connection.id}
              d={connection.path}
              stroke="#6366f1"
              strokeWidth="2"
              fill="none"
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => handleConnectionClick(connection.id, e)}
            />
          ))}

          {/* Render in-progress connection */}
          {connectingFrom && (
            <path
              d={`M ${nodes.find((n) => n.id === connectingFrom.nodeId)?.position.x! + 150} 
                  ${nodes.find((n) => n.id === connectingFrom.nodeId)?.position.y! + 30} 
                  C ${nodes.find((n) => n.id === connectingFrom.nodeId)?.position.x! + 250} 
                  ${nodes.find((n) => n.id === connectingFrom.nodeId)?.position.y! + 30}, 
                  ${mousePosition.x - 100} ${mousePosition.y}, 
                  ${mousePosition.x} ${mousePosition.y}`}
              stroke="#6366f1"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />
          )}
        </svg>

        {/* Render nodes */}
        {nodes.map((node) => (
          <AudioNodeComponent
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onStartConnecting={handleStartConnecting}
            onEndConnecting={handleEndConnecting}
          />
        ))}
      </div>
    </div>
  )
}

