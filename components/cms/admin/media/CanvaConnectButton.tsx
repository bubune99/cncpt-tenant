"use client"

import { useState, useEffect } from "react"
import { Button } from "../../ui/button"
import { Loader2 } from "lucide-react"

interface CanvaConnectButtonProps {
  onStatusChange?: (connected: boolean) => void
}

export function CanvaConnectButton({ onStatusChange }: CanvaConnectButtonProps) {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    try {
      const response = await fetch("/api/cms/canva/auth/status")
      if (response.ok) {
        const data = await response.json()
        setConnected(data.connected)
        onStatusChange?.(data.connected)
      }
    } catch {
      // Canva not configured — leave as disconnected
    } finally {
      setLoading(false)
    }
  }

  function handleConnect() {
    // Navigate to OAuth flow
    window.location.href = "/api/cms/canva/auth/connect"
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const response = await fetch("/api/cms/canva/auth/disconnect", {
        method: "POST",
      })
      if (response.ok) {
        setConnected(false)
        onStatusChange?.(false)
      }
    } catch (error) {
      console.error("Failed to disconnect Canva:", error)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking...
      </Button>
    )
  }

  if (connected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleDisconnect}
        disabled={disconnecting}
      >
        {disconnecting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : null}
        Disconnect Canva
      </Button>
    )
  }

  return (
    <Button variant="default" size="sm" onClick={handleConnect}>
      Connect Canva
    </Button>
  )
}
