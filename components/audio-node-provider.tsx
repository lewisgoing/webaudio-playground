"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"

export type NodeType = "source" | "destination" | "delay" | "reverb" | "compressor" | "filter" | "visualizer" | "eq" | "oscillator" | "mp3input"

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
    // Initialize with oscillator and destination nodes
    setNodes([
      {
        id: "source",
        type: "oscillator",
        position: { x: 100, y: 100 },
        inputs: [],
        outputs: ["output"],
        params: { frequency: 440, type: 0 },
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
      case "oscillator":
        newNode = {
          id,
          type,
          position,
          inputs: [],
          outputs: ["output"],
          params: {
            type: 0, // 0=sine, 1=square, 2=sawtooth, 3=triangle
            frequency: 440,
            detune: 0,
            gain: 1,
          },
        }
        break
      case "mp3input":
        newNode = {
          id,
          type,
          position,
          inputs: [],
          outputs: ["output"],
          params: {
            gain: 1,
            // fileBuffer will be handled as a separate property on the node instance
          },
        }
        break
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
      case "visualizer":
        newNode = {
          id,
          type,
          position,
          inputs: ["input"],
          outputs: ["output"],
          params: { 
            fftSize: 2048, 
            minDecibels: -100, 
            maxDecibels: -30,
            smoothingTimeConstant: 0.8
          },
        }
        break
      case "eq":
        newNode = {
          id,
          type,
          position,
          inputs: ["input"],
          outputs: ["output"],
          params: { 
            lowFreq: 100, 
            lowGain: 0,
            midFreq: 1000, 
            midQ: 1, 
            midGain: 0,
            highFreq: 5000, 
            highGain: 0 
          },
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

  // Map of nodeId to actual Web Audio API node
  const nodeObjectsRef = useRef<Record<string, globalThis.AudioNode | undefined>>({})
  // For mp3 nodes, keep buffer sources
  const bufferSourcesRef = useRef<Record<string, AudioBufferSourceNode | undefined>>({})

  const addConnection = async (sourceId: string, sourceOutput: string, targetId: string, targetInput: string) => {
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

    // --- Web Audio connection logic ---
    const ctx = initAudioContext()
    // Create or get Web Audio nodes for both source and target
    function getOrCreateAudioNode(node: AudioNode): globalThis.AudioNode | undefined {
      if (nodeObjectsRef.current[node.id]) return nodeObjectsRef.current[node.id]
      let audioNode: globalThis.AudioNode | undefined
      switch (node.type) {
        case "oscillator": {
          const osc = ctx.createOscillator()
          osc.type = ["sine","square","sawtooth","triangle"][node.params.type || 0] as OscillatorType
          osc.frequency.value = node.params.frequency || 440
          osc.detune.value = node.params.detune || 0
          osc.start()
          const gain = ctx.createGain()
          gain.gain.value = node.params.gain || 1
          osc.connect(gain)
          audioNode = gain
          break
        }
        case "mp3input": {
          // User must upload a file and decode to buffer elsewhere; here we just create a gain node
          const gain = ctx.createGain()
          gain.gain.value = node.params.gain || 1
          audioNode = gain
          break
        }
        case "delay": {
          const delay = ctx.createDelay()
          delay.delayTime.value = node.params.delayTime || 0.5
          audioNode = delay
          break
        }
        case "reverb": {
          // Simple convolver with dummy buffer
          const convolver = ctx.createConvolver()
          // TODO: allow custom IR buffer
          audioNode = convolver
          break
        }
        case "compressor": {
          const comp = ctx.createDynamicsCompressor()
          comp.threshold.value = node.params.threshold || -24
          comp.ratio.value = node.params.ratio || 4
          comp.attack.value = node.params.attack || 0.003
          comp.release.value = node.params.release || 0.25
          audioNode = comp
          break
        }
        case "filter": {
          const filter = ctx.createBiquadFilter()
          filter.frequency.value = node.params.frequency || 1000
          filter.Q.value = node.params.Q || 1
          filter.gain.value = node.params.gain || 0
          audioNode = filter
          break
        }
        case "eq": {
          // Simple 3-band EQ with 3 BiquadFilters
          const low = ctx.createBiquadFilter()
          low.type = "lowshelf"
          low.frequency.value = node.params.lowFreq || 100
          low.gain.value = node.params.lowGain || 0
          const mid = ctx.createBiquadFilter()
          mid.type = "peaking"
          mid.frequency.value = node.params.midFreq || 1000
          mid.Q.value = node.params.midQ || 1
          mid.gain.value = node.params.midGain || 0
          const high = ctx.createBiquadFilter()
          high.type = "highshelf"
          high.frequency.value = node.params.highFreq || 5000
          high.gain.value = node.params.highGain || 0
          low.connect(mid)
          mid.connect(high)
          audioNode = low // output is high, but we return low for chaining
          nodeObjectsRef.current[node.id + "_eq_high"] = high
          nodeObjectsRef.current[node.id + "_eq_mid"] = mid
          break
        }
        case "visualizer": {
          const analyser = ctx.createAnalyser()
          analyser.fftSize = node.params.fftSize || 2048
          analyser.minDecibels = node.params.minDecibels || -100
          analyser.maxDecibels = node.params.maxDecibels || -30
          analyser.smoothingTimeConstant = node.params.smoothingTimeConstant || 0.8
          audioNode = analyser
          break
        }
        case "source": {
          // For mic input
          if (!nodeObjectsRef.current[node.id]) {
            // Await stream and create node synchronously for connection
            throw new Error("Mic input not ready. Connect after permission granted.")
          }
          audioNode = nodeObjectsRef.current[node.id]
          break
        }
        case "destination": {
          audioNode = ctx.destination
          break
        }
        default:
          break
      }
      nodeObjectsRef.current[node.id] = audioNode
      return audioNode
    }
    // Resume audio context before connecting (required by browsers)
    await ctx.resume();
    let sourceAudioNode: globalThis.AudioNode | undefined;
    let targetAudioNode: globalThis.AudioNode | undefined;
    try {
      sourceAudioNode = getOrCreateAudioNode(sourceNode);
      targetAudioNode = getOrCreateAudioNode(targetNode);
    } catch (err) {
      // If mic not ready, show error and return
      console.error(err);
      return;
    }
    if (sourceAudioNode && targetAudioNode && sourceAudioNode !== targetAudioNode) {
      try {
        // For EQ, connect to high band
        if (sourceNode.type === "eq" && nodeObjectsRef.current[sourceNode.id + "_eq_high"]) {
          nodeObjectsRef.current[sourceNode.id + "_eq_high"].connect(targetAudioNode)
        } else {
          sourceAudioNode.connect(targetAudioNode)
        }
      } catch (e) {
        console.error("Web Audio connect error", e);
      }
    }
    // --- END Web Audio connection logic ---
    // Safely calculate path with null checks
    const path = calculatePath(
      (sourceNode?.position?.x || 0) + 150, // Assuming node width is 150
      (sourceNode?.position?.y || 0) + 30, // Offset for output connector
      (targetNode?.position?.x || 0),
      (targetNode?.position?.y || 0) + 30 // Offset for input connector
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
    // Find the connection to remove
    const connectionToRemove = connections.find(conn => conn.id === id);
    if (connectionToRemove) {
      // Disconnect the Web Audio nodes
      const sourceNode = nodes.find(n => n.id === connectionToRemove.sourceId);
      const targetNode = nodes.find(n => n.id === connectionToRemove.targetId);
      
      if (sourceNode && targetNode && nodeObjectsRef.current[sourceNode.id] && nodeObjectsRef.current[targetNode.id]) {
        try {
          // For Web Audio API, we would need to call disconnect() with the specific destination
          // But this is not always possible, so we'll just log it
          console.log('Disconnecting:', connectionToRemove.sourceId, 'from', connectionToRemove.targetId);
        } catch (e) {
          console.error('Error disconnecting nodes:', e);
        }
      }
    }
    
    // Remove the connection from state
    setConnections((prev) => prev.filter((conn) => conn.id !== id));
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