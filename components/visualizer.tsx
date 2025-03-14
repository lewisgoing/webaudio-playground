"use client"

import { useRef, useEffect } from 'react'
import type { AudioNode } from './audio-node-provider'

interface VisualizerProps {
  node: AudioNode
}

export function Visualizer({ node }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  
  // This would normally connect to a real AudioContext
  // For demo purposes, we'll just create a dummy visualization
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
    }
    
    setCanvasDimensions()
    
    // Demo visualization - creates random bars that look like an audio visualizer
    const draw = () => {
      if (!ctx || !canvas) return
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Set colors based on node parameters
      ctx.fillStyle = '#00FFFF'
      ctx.strokeStyle = '#00BFFF'
      ctx.lineWidth = 2
      
      const barWidth = canvas.width / 64
      const barSpacing = 1
      const maxBarHeight = canvas.height * 0.9
      
      // Get parameters for visualization
      const smoothingFactor = node.params.smoothingTimeConstant || 0.8
      
      // Generate random heights with smoothing effect
      for (let i = 0; i < 64; i++) {
        // Random height with smoothing to make it look more like audio
        const height = Math.min(
          maxBarHeight, 
          Math.random() * maxBarHeight * 0.8 + maxBarHeight * 0.2
        ) * Math.sin(Date.now() * 0.001 + i * 0.2) * 0.5 + 0.5
        
        // Draw the bar
        const x = i * (barWidth + barSpacing)
        const y = canvas.height - height
        
        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
        gradient.addColorStop(0, '#00FFFF')
        gradient.addColorStop(1, '#006080')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth, height)
        
        // Add stroke
        ctx.strokeRect(x, y, barWidth, height)
      }
      
      // Continue animation
      animationRef.current = requestAnimationFrame(draw)
    }
    
    // Start animation
    draw()
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [node.params])
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded" 
      style={{ backgroundColor: '#000' }}
    />
  )
}