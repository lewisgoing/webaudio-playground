"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react";
import { useAudioNodes } from "./audio-node-provider"
import { AudioNodeComponent } from "./audio-node"
import { ContextMenu } from "./context-menu"

interface NodeEditorProps {
  selectedNodeIds: string[]
  onSelectNode: (ids: string[]) => void
}

export function NodeEditor({ selectedNodeIds = [], onSelectNode }: NodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { nodes, connections, addNode, removeNode, addConnection, removeConnection, updateNodePosition, getNodeById } = useAudioNodes();
  
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; output: string } | null>(null);
  const connectingFromRef = useRef<{ nodeId: string; output: string } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [marquee, setMarquee] = useState<{start: {x: number, y: number}, end: {x: number, y: number}}|null>(null);
  const [lastClickedNodeId, setLastClickedNodeId] = useState<string|null>(null);
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
    // Multi-select logic
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      // Add to selection
      if (!selectedNodeIds.includes(nodeId)) {
        onSelectNode([...selectedNodeIds, nodeId])
        setLastClickedNodeId(nodeId)
      }
    } else {
      onSelectNode([nodeId])
      setLastClickedNodeId(nodeId)
    }
    e.stopPropagation()
  }, [onSelectNode, selectedNodeIds])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + editorRef.current.scrollLeft
      const y = e.clientY - rect.top + editorRef.current.scrollTop
      setMousePosition({ x, y })
      if (marquee) {
        setMarquee({ ...marquee, end: { x, y } })
      }
    }
    if (draggingNodeId) {
      const editorRect = editorRef.current?.getBoundingClientRect()
      if (!editorRect) return
      const x = e.clientX - editorRect.left - dragOffset.x + (editorRef.current?.scrollLeft || 0)
      const y = e.clientY - editorRect.top - dragOffset.y + (editorRef.current?.scrollTop || 0)
      const snappedX = Math.round(x / gridSize) * gridSize
      const snappedY = Math.round(y / gridSize) * gridSize
      updateNodePosition(draggingNodeId, { x: snappedX, y: snappedY })
    }
  }

  const handleMouseUp = () => {
    setDraggingNodeId(null)
    // Marquee selection: select all nodes inside rectangle
    if (marquee && editorRef.current) {
      const {start, end} = marquee;
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      const selected = nodes.filter(n => {
        const {x, y} = n.position;
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
      }).map(n => n.id);
      onSelectNode(selected);
      setLastClickedNodeId(selected.length > 0 ? selected[selected.length-1] : null);
      setMarquee(null);
    }
  }

  const handleEditorClick = (e: React.MouseEvent) => {
    // Deselect when clicking on the background
    if (e.target === editorRef.current) {
      onSelectNode([])
      setLastClickedNodeId(null)
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
      setContextMenuPosition({ x, y })
    }
    // If right click on node, select it (multi-select aware)
    // (This will be handled in AudioNodeComponent with onContextMenu)
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
      if (e.key === "Delete" && selectedNodeIds.length > 0) {
        selectedNodeIds.forEach(id => {
          if (id !== "source" && id !== "destination") removeNode(id)
        })
        onSelectNode([])
        setLastClickedNodeId(null)
      }
      // Close context menu on Escape
      if (e.key === "Escape") {
        setContextMenuPosition(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedNodeIds, removeNode, onSelectNode])

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
      onMouseDown={e => {
        if (e.target === editorRef.current && e.button === 0) {
          // Start marquee selection
          const rect = editorRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left + editorRef.current.scrollLeft;
          const y = e.clientY - rect.top + editorRef.current.scrollTop;
          setMarquee({start: {x, y}, end: {x, y}});
        }
      }}
    >
      <div className="relative h-[2000px] w-[2000px]" style={gridStyle}>
        {/* Render selection rectangle */}
        {marquee && (
          <div
            className="absolute border-2 border-indigo-400 bg-indigo-300/10 pointer-events-none z-50"
            style={{
              left: Math.min(marquee.start.x, marquee.end.x),
              top: Math.min(marquee.start.y, marquee.end.y),
              width: Math.abs(marquee.end.x - marquee.start.x),
              height: Math.abs(marquee.end.y - marquee.start.y),
            }}
          />
        )}
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
            isSelected={selectedNodeIds.includes(node.id)}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onStartConnecting={handleStartConnecting}
            onEndConnecting={handleEndConnecting}
            onContextMenu={e => {
              // Right-click select for multi-select
              if (!selectedNodeIds.includes(node.id)) {
                onSelectNode([node.id]);
                setLastClickedNodeId(node.id);
              }
            }}
          />
        ))}
        {/* Context Menu */}
        <ContextMenu
          position={contextMenuPosition}
          onClose={() => setContextMenuPosition(null)}
          selectedNodeIds={selectedNodeIds}
          lastClickedNodeId={lastClickedNodeId}
          onDelete={() => {
            selectedNodeIds.forEach(id => {
              if (id !== "source" && id !== "destination") removeNode(id)
            });
            onSelectNode([])
            setLastClickedNodeId(null)
          }}
        />
      </div>
    </div>
  )
}