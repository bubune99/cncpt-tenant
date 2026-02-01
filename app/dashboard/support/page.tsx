"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  MessageSquare,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Send,
  ArrowLeft,
  Filter,
  RefreshCw,
  Loader2,
  History,
  Mail,
  Phone,
  Globe,
  StickyNote,
  UserCircle,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

// Types
interface SupportTicket {
  id: string
  title: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "normal" | "high" | "critical"
  category: string
  createdAt: string
  updatedAt: string
  userId: string
  customerName: string
  customerEmail: string
  assignedTo?: string
  messageCount: number
}

interface TicketMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  senderType: "customer" | "support" | "system"
  createdAt: string
}

interface CustomerHistory {
  tickets: SupportTicket[]
  notes: CustomerNote[]
}

interface CustomerNote {
  id: string
  content: string
  authorId: string
  authorName: string
  isPinned: boolean
  createdAt: string
}

interface Stats {
  open: number
  inProgress: number
  resolved: number
  closed: number
  total: number
}

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export default function SupportPage() {
  // State
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<Stats>({ open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 })
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [newMessage, setNewMessage] = useState("")
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  const [isCustomerSheetOpen, setIsCustomerSheetOpen] = useState(false)
  const [customerHistory, setCustomerHistory] = useState<CustomerHistory | null>(null)
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "General",
    priority: "normal" as const,
  })

  // Loading states
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [creatingTicket, setCreatingTicket] = useState(false)

  // Load tickets
  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard/support?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
        setStats(data.stats || { open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 })
      }
    } catch (error) {
      console.error("Failed to load tickets:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  // Load messages for selected ticket
  const loadMessages = useCallback(async (ticketId: string) => {
    try {
      setLoadingMessages(true)
      const res = await fetch(`/api/dashboard/support/${ticketId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // Load customer history
  const loadCustomerHistory = useCallback(async (customerId: string) => {
    try {
      const res = await fetch(`/api/dashboard/support?userId=${customerId}`)
      if (res.ok) {
        const data = await res.json()
        setCustomerHistory({
          tickets: data.tickets || [],
          notes: [], // TODO: Implement notes API
        })
      }
    } catch (error) {
      console.error("Failed to load customer history:", error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Load messages when ticket selected
  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id)
    } else {
      setMessages([])
    }
  }, [selectedTicket, loadMessages])

  // Filter tickets client-side for search
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return

    setSendingMessage(true)
    try {
      const res = await fetch(`/api/dashboard/support/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, {
          ...data.message,
          senderName: "You",
        }])
        setNewMessage("")

        // Update ticket status if changed
        if (data.ticketStatus !== selectedTicket.status) {
          setSelectedTicket((prev) => prev ? { ...prev, status: data.ticketStatus } : null)
          setTickets((prev) =>
            prev.map((t) =>
              t.id === selectedTicket.id ? { ...t, status: data.ticketStatus } : t
            )
          )
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Create new ticket
  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) return

    setCreatingTicket(true)
    try {
      const res = await fetch("/api/dashboard/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      })

      if (res.ok) {
        const data = await res.json()
        setTickets((prev) => [{ ...data.ticket, customerName: "You", customerEmail: "", messageCount: 1 }, ...prev])
        setNewTicket({ title: "", description: "", category: "General", priority: "normal" })
        setIsNewTicketOpen(false)
        setStats((prev) => ({ ...prev, open: prev.open + 1, total: prev.total + 1 }))
      }
    } catch (error) {
      console.error("Failed to create ticket:", error)
    } finally {
      setCreatingTicket(false)
    }
  }

  // Update ticket status
  const handleStatusChange = async (status: SupportTicket["status"]) => {
    if (!selectedTicket) return

    try {
      const res = await fetch("/api/dashboard/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selectedTicket.id, status }),
      })

      if (res.ok) {
        setSelectedTicket((prev) => prev ? { ...prev, status } : null)
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? { ...t, status } : t))
        )
        loadTickets() // Refresh stats
      }
    } catch (error) {
      console.error("Failed to update status:", error)
    }
  }

  // View customer history
  const handleViewCustomer = (customerId: string) => {
    loadCustomerHistory(customerId)
    setIsCustomerSheetOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Ticket List Sidebar */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Support Tickets</h2>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={loadTickets} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                    <DialogDescription>
                      Submit a new support inquiry or request
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        placeholder="Brief description of your issue"
                        value={newTicket.title}
                        onChange={(e) => setNewTicket((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select
                          value={newTicket.category}
                          onValueChange={(v) => setNewTicket((prev) => ({ ...prev, category: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Technical">Technical</SelectItem>
                            <SelectItem value="Billing">Billing</SelectItem>
                            <SelectItem value="Feature Request">Feature Request</SelectItem>
                            <SelectItem value="Bug Report">Bug Report</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <Select
                          value={newTicket.priority}
                          onValueChange={(v) =>
                            setNewTicket((prev) => ({
                              ...prev,
                              priority: v as SupportTicket["priority"],
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Describe your issue in detail..."
                        rows={4}
                        value={newTicket.description}
                        onChange={(e) =>
                          setNewTicket((prev) => ({ ...prev, description: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTicket} disabled={creatingTicket}>
                      {creatingTicket ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Ticket"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets ({stats.total})</SelectItem>
              <SelectItem value="open">Open ({stats.open})</SelectItem>
              <SelectItem value="in_progress">In Progress ({stats.inProgress})</SelectItem>
              <SelectItem value="resolved">Resolved ({stats.resolved})</SelectItem>
              <SelectItem value="closed">Closed ({stats.closed})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="p-4 border-b grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
            <div className="text-xs text-muted-foreground">Open</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>

        {/* Ticket List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? "bg-accent border-accent-foreground/20"
                      : "bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-sm line-clamp-1">{ticket.title}</span>
                    <Badge className={`text-xs shrink-0 ${statusColors[ticket.status]}`}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{ticket.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
                    <Badge className={`text-xs ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </Badge>
                    {ticket.messageCount > 0 && (
                      <span className="ml-auto">
                        <MessageSquare className="h-3 w-3 inline mr-1" />
                        {ticket.messageCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Ticket Detail / Chat */}
      <div className="flex-1 flex flex-col">
        {selectedTicket ? (
          <>
            {/* Ticket Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedTicket(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedTicket.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                      <button
                        onClick={() => handleViewCustomer(selectedTicket.userId)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        <UserCircle className="h-4 w-4" />
                        {selectedTicket.customerName}
                      </button>
                      {selectedTicket.customerEmail && (
                        <>
                          <span>•</span>
                          <span>{selectedTicket.customerEmail}</span>
                        </>
                      )}
                      <span>•</span>
                      <Badge variant="outline">{selectedTicket.category}</Badge>
                      <Badge className={priorityColors[selectedTicket.priority]}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewCustomer(selectedTicket.userId)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(v) => handleStatusChange(v as SupportTicket["status"])}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          Open
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                          In Progress
                        </div>
                      </SelectItem>
                      <SelectItem value="resolved">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Resolved
                        </div>
                      </SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === "support" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.senderType === "support"
                            ? "bg-primary text-primary-foreground"
                            : message.senderType === "system"
                              ? "bg-muted text-muted-foreground text-center w-full"
                              : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{message.senderName}</span>
                          <span className="text-xs opacity-70">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Textarea
                  placeholder="Type your reply..."
                  className="min-h-[80px] resize-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="self-end"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Ctrl+Enter to send
              </p>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Select a ticket</h3>
              <p className="text-muted-foreground mb-4">
                Choose a ticket from the list to view the conversation
              </p>
              <Button onClick={() => setIsNewTicketOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Ticket
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customer History Sheet */}
      <Sheet open={isCustomerSheetOpen} onOpenChange={setIsCustomerSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Customer History
            </SheetTitle>
            <SheetDescription>
              View all interactions and history for this customer
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="tickets" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tickets">
                <MessageSquare className="h-4 w-4 mr-2" />
                Tickets ({customerHistory?.tickets.length || 0})
              </TabsTrigger>
              <TabsTrigger value="notes">
                <StickyNote className="h-4 w-4 mr-2" />
                Notes ({customerHistory?.notes.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tickets" className="mt-4">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3">
                  {customerHistory?.tickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => {
                        setSelectedTicket(ticket)
                        setIsCustomerSheetOpen(false)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm line-clamp-1">{ticket.title}</h4>
                          <Badge className={`text-xs ${statusColors[ticket.status]}`}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                          <Badge variant="outline" className="text-xs">
                            {ticket.category}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!customerHistory?.tickets || customerHistory.tickets.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No ticket history</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <div className="space-y-4">
                <Textarea placeholder="Add a note about this customer..." rows={3} />
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-400px)] mt-4">
                <div className="space-y-3">
                  {customerHistory?.notes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="p-4">
                        <p className="text-sm">{note.content}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <User className="h-3 w-3" />
                          {note.authorName}
                          <span>•</span>
                          {format(new Date(note.createdAt), "MMM d, yyyy")}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!customerHistory?.notes || customerHistory.notes.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notes yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  )
}
