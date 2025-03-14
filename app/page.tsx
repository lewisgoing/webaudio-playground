"use client"

import { useState } from "react"
import { NodeEditor } from "@/components/node-editor"
import { Sidebar } from "@/components/sidebar"
import { ControlPanel } from "@/components/control-panel"
import { AudioNodeProvider } from "@/components/audio-node-provider"

export default function Home() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  return (
    <AudioNodeProvider>
      <div className="flex h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="relative flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900">
            <NodeEditor selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
          </div>
          <ControlPanel selectedNodeId={selectedNodeId} />
        </main>
      </div>
    </AudioNodeProvider>
  )
}

