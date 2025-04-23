"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Clock, 
  Waves, 
  Activity, 
  Filter, 
  BarChart2, 
  Sliders, 
  Plus, 
  Folder, 
  Copy, 
  Scissors, 
  Trash2, 
  Settings,
  ChevronRight
} from "lucide-react"
import { useAudioNodes, type NodeType } from "./audio-node-provider"
import { cn } from "@/lib/utils"

interface ContextMenuProps {
  position: { x: number; y: number } | null
  onClose: () => void
  selectedNodeIds?: string[]
  lastClickedNodeId?: string | null
  onDelete?: () => void
}

type MenuItem = {
  label: string
  icon: React.ReactNode
  action?: () => void
  submenu?: MenuItem[]
}

export function ContextMenu({ position, onClose, selectedNodeIds = [], lastClickedNodeId, onDelete }: ContextMenuProps) {
  const { addNode } = useAudioNodes()
  const menuRef = useRef<HTMLDivElement>(null)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  
  const nodeTypes: { type: NodeType; icon: React.FC<{ className?: string }>; label: string }[] = [
    { type: "oscillator", icon: Clock, label: "Oscillator" },
    { type: "mp3input", icon: Waves, label: "MP3 Input" },
    { type: "delay", icon: Clock, label: "Delay" },
    { type: "reverb", icon: Waves, label: "Reverb" },
    { type: "compressor", icon: Activity, label: "Compressor" },
    { type: "filter", icon: Filter, label: "Filter" },
    { type: "visualizer", icon: BarChart2, label: "Visualizer" },
    { type: "eq", icon: Sliders, label: "Parametric EQ" },
  ]

  const handleAddNode = (type: NodeType) => {
    if (position) {
      addNode(type, { x: position.x, y: position.y })
      onClose()
    }
  }
  
  const menuItems: MenuItem[] = [
    {
      label: "Add",
      icon: <Folder className="h-4 w-4" />,
      submenu: nodeTypes.map(({ type, icon: Icon, label }) => ({
        label,
        icon: <Icon className="h-4 w-4" />,
        action: () => handleAddNode(type)
      }))
    },
    // Only show Delete if node(s) selected
    ...(selectedNodeIds && selectedNodeIds.length > 0 ? [{
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      action: () => {
        if (onDelete) onDelete();
        onClose();
      }
    }] : []),
    // Additional menu items
    {
      label: "Cut",
      icon: <Scissors className="h-4 w-4" />,
      action: () => {
        console.log("Cut action");
        onClose();
      }
    },
    {
      label: "Copy",
      icon: <Copy className="h-4 w-4" />,
      action: () => {
        console.log("Copy action");
        onClose();
      }
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        console.log("Settings action");
        onClose();
      }
    }
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  useEffect(() => {
    // Reset active submenu when position changes (menu reopens)
    setActiveSubmenu(null)
  }, [position])

  if (!position) return null

  const renderMenuItem = (item: MenuItem, index: number) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isSubmenuActive = activeSubmenu === item.label

    return (
      <div 
        key={index} 
        className="relative"
        onMouseEnter={() => hasSubmenu && setActiveSubmenu(item.label)}
      >
        <button
          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
          onClick={item.action}
          disabled={hasSubmenu}
        >
          <span className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-sm bg-muted">
              {item.icon}
            </span>
            {item.label}
          </span>
          {hasSubmenu && <ChevronRight className="h-4 w-4" />}
        </button>
        
        {/* Submenu */}
        {hasSubmenu && isSubmenuActive && (
          <div 
            className="absolute left-full top-0 min-w-[180px] bg-popover border rounded-md shadow-md py-1"
            style={{ marginLeft: '1px' }}
          >
            {item.submenu.map((subItem, subIndex) => (
              <button
                key={subIndex}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
                onClick={subItem.action}
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-sm bg-muted">
                  {subItem.icon}
                </span>
                {subItem.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
        <div
      ref={menuRef}
      className="absolute z-50 min-w-[180px] bg-popover border rounded-md shadow-md py-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="py-1">
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </div>
    </div>
    </>

  )
}