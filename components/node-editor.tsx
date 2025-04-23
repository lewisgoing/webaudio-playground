"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react";
import { useAudioNodes } from "./audio-node-provider"
import { AudioNodeComponent } from "./audio-node"
import { ContextMenu } from "./context-menu"

interface NodeEditorProps {
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
}

export function NodeEditor({ selectedNodeId, onSelectNode }: NodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { nodes, connections, addNode, removeNode, addConnection, removeConnection, updateNodePosition, getNodeById } = useAudioNodes();
  
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; output: string } | null>(null);
  const connectingFromRef = useRef<{ nodeId: string; output: string } | null>(null); // <-- Add Ref
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  
  const gridSize = 20 // Size of grid dots

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
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
  }, [onSelectNode])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + editorRef.current.scrollLeft
      const y = e.clientY - rect.top + editorRef.current.scrollTop
      
      setMousePosition({ x, y })
    }

    if (draggingNodeId) {
      const editorRect = editorRef.current?.getBoundingClientRect()
      if (!editorRect) return

      // Calculate position including scroll offset
      const x = e.clientX - editorRect.left - dragOffset.x + (editorRef.current?.scrollLeft || 0)
      const y = e.clientY - editorRect.top - dragOffset.y + (editorRef.current?.scrollTop || 0)

      // Snap to grid
      const snappedX = Math.round(x / gridSize) * gridSize
      const snappedY = Math.round(y / gridSize) * gridSize

      updateNodePosition(draggingNodeId, { x: snappedX, y: snappedY })
    }
  }

  const handleMouseUp = () => {
    setDraggingNodeId(null)
    // Do not reset connectingFrom on general mouse up - only reset when connection is completed or cancelled explicitly
  }

  const handleEditorClick = (e: React.MouseEvent) => {
    // Deselect when clicking on the background
    if (e.target === editorRef.current) {
      onSelectNode(null)
      // Cancel connection if clicking on background
      if (connectingFromRef.current) {
        console.log('Resetting connection attempt (ref) due to background click');
        connectingFromRef.current = null;
        setConnectingFrom(null);
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + editorRef.current.scrollLeft
      const y = e.clientY - rect.top + editorRef.current.scrollTop
      
      // Set the position for the context menu
      setContextMenuPosition({ x, y })
    }
  }

  const handleStartConnecting = (nodeId: string, output: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Starting connection from (ref & state):', nodeId, output);
    const startInfo = { nodeId, output };
    connectingFromRef.current = startInfo; // Set ref
    setConnectingFrom(startInfo);        // Set state (for visual line)
  };

  const handleEndConnecting = async (nodeId: string, input: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const startInfo = connectingFromRef.current; // Read from ref
    console.log('Ending connection at:', nodeId, input, 'connecting from ref:', startInfo);
  
    if (startInfo) { // Use the info from the ref
      const { nodeId: sourceId, output } = startInfo;
      console.log('Attempting to connect (using ref):', sourceId, output, 'to', nodeId, input);
      try {
        await addConnection(sourceId, output, nodeId, input);
        console.log('Connection successful');
      } catch (error) {
        console.error('Connection failed:', error);
      }
    } else {
       console.warn('handleEndConnecting called but connectingFromRef was null.');
    }
  
    // Clear ref and state regardless of success/failure of addConnection
    connectingFromRef.current = null;
    setConnectingFrom(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Deselect node if clicking on the background
    if (e.target === editorRef.current) {
      onSelectNode(null);
      // Reset connection attempt if clicking background
      if (connectingFromRef.current) { // Check ref
        console.log('Resetting connection attempt (ref) due to background click');
        connectingFromRef.current = null; // Clear ref
        setConnectingFrom(null);          // Clear state
      }
    }
  };

  const handleConnectionClick = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeConnection(connectionId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    const nodeType = e.dataTransfer.getData("nodeType") as import("./audio-node-provider").NodeType
    
    if (nodeType && editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + editorRef.current.scrollLeft
      const y = e.clientY - rect.top + editorRef.current.scrollTop
      
      // Snap to grid
      const snappedX = Math.round(x / gridSize) * gridSize
      const snappedY = Math.round(y / gridSize) * gridSize
      
      addNode(nodeType, { x: snappedX, y: snappedY })
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedNodeId) {
        // Don't allow deleting source or destination
        if (selectedNodeId !== "source" && selectedNodeId !== "destination") {
          removeNode(selectedNodeId)
          onSelectNode(null)
        }
      }
      
      // Close context menu on Escape
      if (e.key === "Escape") {
        setContextMenuPosition(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedNodeId, removeNode, onSelectNode])

  // Create a grid pattern style
  const gridStyle = {
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundImage: `
      radial-gradient(circle, #9ca3af33 1px, transparent 1px)
    `,
    backgroundPosition: '0 0',
  }

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleEditorClick}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="relative h-[2000px] w-[2000px]" style={gridStyle}>
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

        {/* Context Menu */}
        <ContextMenu
          position={contextMenuPosition}
          onClose={() => setContextMenuPosition(null)}
        />
      </div>
    </div>
  )
}