"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"

export type NodeType = "source" | "destination" | "delay" | "reverb" | "compressor" | "filter"

export interface AudioNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  inputs: string[]
  outputs: string[]
  params: Record<string, number>
}

export interface Connection {
  id: string
  sourceId: string
  sourceOutput: string
  targetId: string
  targetInput: string
  path: string
}

interface AudioNodeContextType {
  nodes: AudioNode[]
  connections: Connection[]
  audioContext: AudioContext | null
  addNode: (type: NodeType, position: { x: number; y: number }) => void
  removeNode: (id: string) => void
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  updateNodeParam: (id: string, param: string, value: number) => void
  addConnection: (sourceId: string, sourceOutput: string, targetId: string, targetInput: string) => void
  removeConnection: (id: string) => void
  calculatePath: (startX: number, startY: number, endX: number, endY: number) => string
}

const AudioNodeContext = createContext<AudioNodeContextType | undefined>(undefined)

export function AudioNodeProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<AudioNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    // Initialize with source and destination nodes
    setNodes([
      {
        id: "source",
        type: "source",
        position: { x: 100, y: 100 },
        inputs: [],
        outputs: ["output"],
        params: {},
      },
      {
        id: "destination",
        type: "destination",
        position: { x: 500, y: 100 },
        inputs: ["input"],
        outputs: [],
        params: {},
      },
    ])

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }

  const addNode = (type: NodeType, position: { x: number; y: number }) => {
    const id = `${type}-${Date.now()}`
    let newNode: AudioNode

    switch (type) {
      case "delay":
        newNode = {
          id,
          type,
          position,
          inputs: ["input"],
          outputs: ["output"],
          params: { delayTime: 0.5, feedback: 0.5 },
        }
        break
      case "reverb":
        newNode = {
          id,
          type,
          position,
          inputs: ["input"],
          outputs: ["output"],
          params: { decay: 2.0, preDelay: 0.01 },
        }
        break
      case "compressor":
        newNode = {
          id,
          type,
          position,
          inputs: ["input"],
          outputs: ["output"],
          params: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25 },
        }
        break
      case "filter":
        newNode = {
          id,
          type,
          position,
          inputs: ["input"],
          outputs: ["output"],
          params: { frequency: 1000, Q: 1, gain: 0 },
        }
        break
      default:
        return
    }

    setNodes((prev) => [...prev, newNode])
  }

  const removeNode = (id: string) => {
    // Don't allow removing source or destination
    if (id === "source" || id === "destination") return

    setNodes((prev) => prev.filter((node) => node.id !== id))
    setConnections((prev) => prev.filter((conn) => conn.sourceId !== id && conn.targetId !== id))
  }

  const updateNodePosition = (id: string, position: { x: number; y: number }) => {
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, position } : node)))

    // Update connection paths
    setConnections((prev) => {
      return prev.map((conn) => {
        if (conn.sourceId === id || conn.targetId === id) {
          const sourceNode = nodes.find((n) => n.id === conn.sourceId)
          const targetNode = nodes.find((n) => n.id === conn.targetId)

          if (sourceNode && targetNode) {
            const sourcePos = sourceNode.id === id ? position : sourceNode.position
            const targetPos = targetNode.id === id ? position : targetNode.position

            const path = calculatePath(
              sourcePos.x + 150, // Assuming node width is 150
              sourcePos.y + 30, // Offset for output connector
              targetPos.x,
              targetPos.y + 30, // Offset for input connector
            )

            return { ...conn, path }
          }
        }
        return conn
      })
    })
  }

  const updateNodeParam = (id: string, param: string, value: number) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id
          ? {
              ...node,
              params: { ...node.params, [param]: value },
            }
          : node,
      ),
    )
  }

  const addConnection = (sourceId: string, sourceOutput: string, targetId: string, targetInput: string) => {
    // Prevent connecting to self
    if (sourceId === targetId) return

    // Prevent duplicate connections
    const exists = connections.some(
      (conn) =>
        conn.sourceId === sourceId &&
        conn.targetId === targetId &&
        conn.sourceOutput === sourceOutput &&
        conn.targetInput === targetInput,
    )

    if (exists) return

    const sourceNode = nodes.find((n) => n.id === sourceId)
    const targetNode = nodes.find((n) => n.id === targetId)

    if (!sourceNode || !targetNode) return

    const path = calculatePath(
      sourceNode.position.x + 150, // Assuming node width is 150
      sourceNode.position.y + 30, // Offset for output connector
      targetNode.position.x,
      targetNode.position.y + 30, // Offset for input connector
    )

    const newConnection: Connection = {
      id: `${sourceId}-${targetId}-${Date.now()}`,
      sourceId,
      sourceOutput,
      targetId,
      targetInput,
      path,
    }

    setConnections((prev) => [...prev, newConnection])
  }

  const removeConnection = (id: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== id))
  }

  const calculatePath = (startX: number, startY: number, endX: number, endY: number) => {
    const controlPointOffset = Math.abs(endX - startX) / 2
    return `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`
  }

  return (
    <AudioNodeContext.Provider
      value={{
        nodes,
        connections,
        audioContext: audioContextRef.current,
        addNode,
        removeNode,
        updateNodePosition,
        updateNodeParam,
        addConnection,
        removeConnection,
        calculatePath,
      }}
    >
      {children}
    </AudioNodeContext.Provider>
  )
}

export function useAudioNodes() {
  const context = useContext(AudioNodeContext)
  if (context === undefined) {
    throw new Error("useAudioNodes must be used within an AudioNodeProvider")
  }
  return context
}

