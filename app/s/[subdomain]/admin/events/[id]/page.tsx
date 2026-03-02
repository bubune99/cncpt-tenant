"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Plus,
  Pencil,
  MapPin,
  Video,
  Users,
  Clock,
  Search,
  MoreHorizontal,
  User,
} from "lucide-react";
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
import { Label } from '@/components/cms/ui/label';
import { Textarea } from '@/components/cms/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/cms/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import { Switch } from '@/components/cms/ui/switch';
import { Badge } from '@/components/cms/ui/badge';
import { Separator } from '@/components/cms/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cms/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/cms/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/cms/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/cms/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/cms/ui/alert-dialog';
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

// ---- Interfaces ----

interface EventData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  type: "IN_PERSON" | "VIRTUAL" | "HYBRID";
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  startDate?: string;
  endDate?: string;
  timezone?: string;
  capacity?: number;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  virtualUrl?: string;
  platform?: string;
  organizerName?: string;
  organizerEmail?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  maxPerOrder?: number;
  salesStart?: string;
  salesEnd?: string;
  active: boolean;
  _count?: { registrations: number };
}

interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  day: number;
  speakerId?: string;
  speaker?: Speaker;
}

interface Speaker {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  company?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED" | "WAITLISTED";
  amount: number;
  checkedIn: boolean;
  createdAt: string;
  ticketType?: { name: string };
}

const registrationStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  REFUNDED: "secondary",
  WAITLISTED: "outline",
};

// ---- Component ----

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [event, setEvent] = useState<EventData | null>(null);

  // Details tab state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [status, setStatus] = useState<EventData["status"]>("DRAFT");
  const [featuredImage, setFeaturedImage] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Venue tab state
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [zip, setZip] = useState("");
  const [virtualUrl, setVirtualUrl] = useState("");
  const [platform, setPlatform] = useState("");

  // Tickets tab state
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [deleteTicket, setDeleteTicket] = useState<TicketType | null>(null);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    description: "",
    price: 0,
    quantity: "",
    maxPerOrder: "",
    salesStart: "",
    salesEnd: "",
    active: true,
  });

  // Schedule tab state
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<ScheduleItem | null>(null);
  const [deleteScheduleItem, setDeleteScheduleItem] = useState<ScheduleItem | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    day: 1,
    speakerId: "",
  });

  // Speakers tab state
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [speakerDialogOpen, setSpeakerDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [deleteSpeaker, setDeleteSpeaker] = useState<Speaker | null>(null);
  const [speakerForm, setSpeakerForm] = useState({
    name: "",
    title: "",
    bio: "",
    avatarUrl: "",
    company: "",
    website: "",
    twitter: "",
    linkedin: "",
  });

  // Registrations tab state
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regSearch, setRegSearch] = useState("");
  const [regStatusFilter, setRegStatusFilter] = useState("all");

  // Delete event state
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);

  // ---- Data fetching ----

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cms/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
        setTitle(data.title || "");
        setSlug(data.slug || "");
        setDescription(data.description || "");
        setShortDescription(data.shortDescription || "");
        setStatus(data.status || "DRAFT");
        setFeaturedImage(data.featuredImage || "");
        setMetaTitle(data.metaTitle || "");
        setMetaDescription(data.metaDescription || "");
        setVenueName(data.venueName || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setState(data.state || "");
        setCountry(data.country || "");
        setZip(data.zip || "");
        setVirtualUrl(data.virtualUrl || "");
        setPlatform(data.platform || "");
      } else {
        toast.error("Event not found");
        router.push("/admin/events");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load event");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketTypes = async () => {
    try {
      const response = await fetch(`/api/cms/events/${id}/ticket-types`);
      if (response.ok) {
        const data = await response.json();
        setTicketTypes(data.ticketTypes || data || []);
      }
    } catch (error) {
      console.error("Error fetching ticket types:", error);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/cms/events/${id}/schedule`);
      if (response.ok) {
        const data = await response.json();
        setScheduleItems(data.scheduleItems || data || []);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  };

  const fetchSpeakers = async () => {
    try {
      const response = await fetch(`/api/cms/events/${id}/speakers`);
      if (response.ok) {
        const data = await response.json();
        setSpeakers(data.speakers || data || []);
      }
    } catch (error) {
      console.error("Error fetching speakers:", error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`/api/cms/events/${id}/registrations`);
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations || data || []);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === "tickets") fetchTicketTypes();
    if (tab === "schedule") {
      fetchSchedule();
      fetchSpeakers();
    }
    if (tab === "speakers") fetchSpeakers();
    if (tab === "registrations") fetchRegistrations();
  };

  // ---- Details save ----

  const handleSaveDetails = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/cms/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          shortDescription: shortDescription.trim() || undefined,
          status,
          featuredImage: featuredImage.trim() || undefined,
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Event details saved");
        fetchEvent();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save event");
      }
    } catch (error) {
      toast.error("Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Venue save ----

  const handleSaveVenue = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/cms/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueName: venueName.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          country: country.trim() || undefined,
          zip: zip.trim() || undefined,
          virtualUrl: virtualUrl.trim() || undefined,
          platform: platform.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Venue details saved");
        fetchEvent();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save venue details");
      }
    } catch (error) {
      toast.error("Failed to save venue details");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Ticket CRUD ----

  const openTicketDialog = (ticket?: TicketType) => {
    if (ticket) {
      setEditingTicket(ticket);
      setTicketForm({
        name: ticket.name,
        description: ticket.description || "",
        price: ticket.price,
        quantity: ticket.quantity != null ? String(ticket.quantity) : "",
        maxPerOrder: ticket.maxPerOrder != null ? String(ticket.maxPerOrder) : "",
        salesStart: ticket.salesStart ? ticket.salesStart.slice(0, 16) : "",
        salesEnd: ticket.salesEnd ? ticket.salesEnd.slice(0, 16) : "",
        active: ticket.active,
      });
    } else {
      setEditingTicket(null);
      setTicketForm({
        name: "",
        description: "",
        price: 0,
        quantity: "",
        maxPerOrder: "",
        salesStart: "",
        salesEnd: "",
        active: true,
      });
    }
    setTicketDialogOpen(true);
  };

  const handleSaveTicket = async () => {
    if (!ticketForm.name.trim()) {
      toast.error("Ticket name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: ticketForm.name.trim(),
        description: ticketForm.description.trim() || undefined,
        price: Number(ticketForm.price),
        quantity: ticketForm.quantity ? Number(ticketForm.quantity) : null,
        maxPerOrder: ticketForm.maxPerOrder ? Number(ticketForm.maxPerOrder) : null,
        salesStart: ticketForm.salesStart ? new Date(ticketForm.salesStart).toISOString() : undefined,
        salesEnd: ticketForm.salesEnd ? new Date(ticketForm.salesEnd).toISOString() : undefined,
        active: ticketForm.active,
      };

      const url = editingTicket
        ? `/api/cms/events/${id}/ticket-types/${editingTicket.id}`
        : `/api/cms/events/${id}/ticket-types`;
      const method = editingTicket ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingTicket ? "Ticket updated" : "Ticket created");
        setTicketDialogOpen(false);
        fetchTicketTypes();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save ticket");
      }
    } catch (error) {
      toast.error("Failed to save ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTicket) return;
    try {
      const response = await fetch(`/api/cms/events/${id}/ticket-types/${deleteTicket.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Ticket deleted");
        fetchTicketTypes();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete ticket");
      }
    } catch (error) {
      toast.error("Failed to delete ticket");
    } finally {
      setDeleteTicket(null);
    }
  };

  const handleToggleTicketActive = async (ticket: TicketType) => {
    try {
      const response = await fetch(`/api/cms/events/${id}/ticket-types/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !ticket.active }),
      });
      if (response.ok) {
        fetchTicketTypes();
      }
    } catch (error) {
      toast.error("Failed to toggle ticket");
    }
  };

  // ---- Schedule CRUD ----

  const openScheduleDialog = (item?: ScheduleItem) => {
    if (item) {
      setEditingScheduleItem(item);
      setScheduleForm({
        title: item.title,
        description: item.description || "",
        startTime: item.startTime ? item.startTime.slice(0, 16) : "",
        endTime: item.endTime ? item.endTime.slice(0, 16) : "",
        location: item.location || "",
        day: item.day,
        speakerId: item.speakerId || "",
      });
    } else {
      setEditingScheduleItem(null);
      setScheduleForm({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
        day: selectedDay,
        speakerId: "",
      });
    }
    setScheduleDialogOpen(true);
  };

  const handleSaveScheduleItem = async () => {
    if (!scheduleForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: scheduleForm.title.trim(),
        description: scheduleForm.description.trim() || undefined,
        startTime: scheduleForm.startTime ? new Date(scheduleForm.startTime).toISOString() : undefined,
        endTime: scheduleForm.endTime ? new Date(scheduleForm.endTime).toISOString() : undefined,
        location: scheduleForm.location.trim() || undefined,
        day: Number(scheduleForm.day),
        speakerId: scheduleForm.speakerId || undefined,
      };

      const url = editingScheduleItem
        ? `/api/cms/events/${id}/schedule/${editingScheduleItem.id}`
        : `/api/cms/events/${id}/schedule`;
      const method = editingScheduleItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingScheduleItem ? "Schedule item updated" : "Schedule item added");
        setScheduleDialogOpen(false);
        fetchSchedule();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save schedule item");
      }
    } catch (error) {
      toast.error("Failed to save schedule item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScheduleItem = async () => {
    if (!deleteScheduleItem) return;
    try {
      const response = await fetch(`/api/cms/events/${id}/schedule/${deleteScheduleItem.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Schedule item deleted");
        fetchSchedule();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete schedule item");
      }
    } catch (error) {
      toast.error("Failed to delete schedule item");
    } finally {
      setDeleteScheduleItem(null);
    }
  };

  // ---- Speaker CRUD ----

  const openSpeakerDialog = (speaker?: Speaker) => {
    if (speaker) {
      setEditingSpeaker(speaker);
      setSpeakerForm({
        name: speaker.name,
        title: speaker.title || "",
        bio: speaker.bio || "",
        avatarUrl: speaker.avatarUrl || "",
        company: speaker.company || "",
        website: speaker.website || "",
        twitter: speaker.twitter || "",
        linkedin: speaker.linkedin || "",
      });
    } else {
      setEditingSpeaker(null);
      setSpeakerForm({
        name: "",
        title: "",
        bio: "",
        avatarUrl: "",
        company: "",
        website: "",
        twitter: "",
        linkedin: "",
      });
    }
    setSpeakerDialogOpen(true);
  };

  const handleSaveSpeaker = async () => {
    if (!speakerForm.name.trim()) {
      toast.error("Speaker name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: speakerForm.name.trim(),
        title: speakerForm.title.trim() || undefined,
        bio: speakerForm.bio.trim() || undefined,
        avatarUrl: speakerForm.avatarUrl.trim() || undefined,
        company: speakerForm.company.trim() || undefined,
        website: speakerForm.website.trim() || undefined,
        twitter: speakerForm.twitter.trim() || undefined,
        linkedin: speakerForm.linkedin.trim() || undefined,
      };

      const url = editingSpeaker
        ? `/api/cms/events/${id}/speakers/${editingSpeaker.id}`
        : `/api/cms/events/${id}/speakers`;
      const method = editingSpeaker ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingSpeaker ? "Speaker updated" : "Speaker added");
        setSpeakerDialogOpen(false);
        fetchSpeakers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save speaker");
      }
    } catch (error) {
      toast.error("Failed to save speaker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpeaker = async () => {
    if (!deleteSpeaker) return;
    try {
      const response = await fetch(`/api/cms/events/${id}/speakers/${deleteSpeaker.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Speaker removed");
        fetchSpeakers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete speaker");
      }
    } catch (error) {
      toast.error("Failed to delete speaker");
    } finally {
      setDeleteSpeaker(null);
    }
  };

  // ---- Delete event ----

  const handleDeleteEvent = async () => {
    try {
      const response = await fetch(`/api/cms/events/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Event deleted");
        router.push("/admin/events");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete event");
      }
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  // ---- Helpers ----

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "\u2014";
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  const getDayCount = () => {
    if (!event?.startDate || !event?.endDate) return 1;
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  };

  const daySchedule = scheduleItems.filter((item) => item.day === selectedDay);

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(regSearch.toLowerCase()) ||
      reg.email.toLowerCase().includes(regSearch.toLowerCase());
    const matchesStatus =
      regStatusFilter === "all" || reg.status === regStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const showVenueSection = event?.type === "IN_PERSON" || event?.type === "HYBRID";
  const showVirtualSection = event?.type === "VIRTUAL" || event?.type === "HYBRID";

  // ---- Loading state ----

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  // ---- Render ----

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-sm text-muted-foreground">
              Last updated {format(new Date(event.updatedAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDeleteEventOpen(true)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="venue">Venue / Virtual</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="speakers">Speakers</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: DETAILS ==================== */}
        <TabsContent value="details">
          <div className="space-y-6 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Event title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/events/</span>
                    <Input
                      id="slug"
                      placeholder="event-url-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea
                    id="shortDescription"
                    placeholder="Brief event description..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Full event description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value: EventData["status"]) => setStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featuredImage">Featured Image URL</Label>
                  <Input
                    id="featuredImage"
                    placeholder="https://..."
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    placeholder="SEO title (defaults to event title)"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {metaTitle.length || title.length}/60 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="SEO description"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    {metaDescription.length}/160 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveDetails} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Details
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 2: VENUE / VIRTUAL ==================== */}
        <TabsContent value="venue">
          <div className="space-y-6 max-w-3xl">
            {showVenueSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Venue Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="venueName">Venue Name</Label>
                    <Input
                      id="venueName"
                      placeholder="e.g. Convention Center"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Street address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">Zip / Postal Code</Label>
                      <Input
                        id="zip"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showVirtualSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Virtual Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="virtualUrl">Virtual URL</Label>
                    <Input
                      id="virtualUrl"
                      placeholder="https://zoom.us/j/..."
                      value={virtualUrl}
                      onChange={(e) => setVirtualUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="meet">Google Meet</SelectItem>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                        <SelectItem value="custom">Custom / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {!showVenueSection && !showVirtualSection && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No venue or virtual settings available for this event type.
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSaveVenue} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Venue Details
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 3: TICKETS ==================== */}
        <TabsContent value="tickets">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ticket Types</h3>
              <Button onClick={() => openTicketDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Ticket Type
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Sold</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketTypes.length > 0 ? (
                      ticketTypes.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ticket.name}</div>
                              {ticket.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {ticket.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatPrice(ticket.price)}</TableCell>
                          <TableCell>
                            {ticket.quantity != null ? ticket.quantity : "Unlimited"}
                          </TableCell>
                          <TableCell>{ticket._count?.registrations ?? 0}</TableCell>
                          <TableCell>
                            <Switch
                              checked={ticket.active}
                              onCheckedChange={() => handleToggleTicketActive(ticket)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openTicketDialog(ticket)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteTicket(ticket)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-muted-foreground">No ticket types yet</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Dialog */}
          <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTicket ? "Edit Ticket Type" : "Add Ticket Type"}</DialogTitle>
                <DialogDescription>
                  {editingTicket ? "Update ticket type details." : "Create a new ticket type for this event."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g. General Admission"
                    value={ticketForm.name}
                    onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Ticket description..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (cents)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0 for free"
                      value={ticketForm.price}
                      onChange={(e) => setTicketForm({ ...ticketForm, price: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(ticketForm.price)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Leave empty for unlimited"
                      value={ticketForm.quantity}
                      onChange={(e) => setTicketForm({ ...ticketForm, quantity: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Per Order</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="No limit"
                    value={ticketForm.maxPerOrder}
                    onChange={(e) => setTicketForm({ ...ticketForm, maxPerOrder: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sales Start</Label>
                    <Input
                      type="datetime-local"
                      value={ticketForm.salesStart}
                      onChange={(e) => setTicketForm({ ...ticketForm, salesStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sales End</Label>
                    <Input
                      type="datetime-local"
                      value={ticketForm.salesEnd}
                      onChange={(e) => setTicketForm({ ...ticketForm, salesEnd: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={ticketForm.active}
                    onCheckedChange={(checked) => setTicketForm({ ...ticketForm, active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTicketDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTicket} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTicket ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Ticket Confirm */}
          <AlertDialog open={!!deleteTicket} onOpenChange={() => setDeleteTicket(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Ticket Type</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{deleteTicket?.name}&quot;? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTicket}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ==================== TAB 4: SCHEDULE ==================== */}
        <TabsContent value="schedule">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Schedule</h3>
              <Button onClick={() => openScheduleDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Schedule Item
              </Button>
            </div>

            {/* Day selector */}
            <Tabs
              value={String(selectedDay)}
              onValueChange={(val) => setSelectedDay(Number(val))}
            >
              <TabsList>
                {Array.from({ length: getDayCount() }, (_, i) => (
                  <TabsTrigger key={i + 1} value={String(i + 1)}>
                    Day {i + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="space-y-3">
              {daySchedule.length > 0 ? (
                daySchedule
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((item) => (
                    <Card key={item.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{item.title}</div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.startTime ? format(new Date(item.startTime), "h:mm a") : "\u2014"}
                                {item.endTime ? ` - ${format(new Date(item.endTime), "h:mm a")}` : ""}
                              </span>
                              {item.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.location}
                                </span>
                              )}
                              {item.speaker && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {item.speaker.name}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openScheduleDialog(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteScheduleItem(item)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No schedule items for Day {selectedDay}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Schedule Dialog */}
          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingScheduleItem ? "Edit Schedule Item" : "Add Schedule Item"}
                </DialogTitle>
                <DialogDescription>
                  {editingScheduleItem
                    ? "Update this schedule item."
                    : "Add a new item to the event schedule."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g. Opening Keynote"
                    value={scheduleForm.title}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Item description..."
                    value={scheduleForm.description}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, description: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleForm.startTime}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleForm.endTime}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g. Main Hall"
                      value={scheduleForm.location}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Day</Label>
                    <Select
                      value={String(scheduleForm.day)}
                      onValueChange={(val) =>
                        setScheduleForm({ ...scheduleForm, day: Number(val) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: getDayCount() }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            Day {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Speaker</Label>
                  <Select
                    value={scheduleForm.speakerId}
                    onValueChange={(val) =>
                      setScheduleForm({ ...scheduleForm, speakerId: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select speaker (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {speakers.map((speaker) => (
                        <SelectItem key={speaker.id} value={speaker.id}>
                          {speaker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveScheduleItem} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingScheduleItem ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Schedule Item Confirm */}
          <AlertDialog open={!!deleteScheduleItem} onOpenChange={() => setDeleteScheduleItem(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Schedule Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{deleteScheduleItem?.title}&quot;?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteScheduleItem}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ==================== TAB 5: SPEAKERS ==================== */}
        <TabsContent value="speakers">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Speakers</h3>
              <Button onClick={() => openSpeakerDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Speaker
              </Button>
            </div>

            {speakers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {speakers.map((speaker) => (
                  <Card key={speaker.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {speaker.avatarUrl ? (
                            <img
                              src={speaker.avatarUrl}
                              alt={speaker.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{speaker.name}</div>
                          {speaker.title && (
                            <div className="text-sm text-muted-foreground">{speaker.title}</div>
                          )}
                          {speaker.company && (
                            <div className="text-sm text-muted-foreground">{speaker.company}</div>
                          )}
                          {speaker.bio && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                              {speaker.bio}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openSpeakerDialog(speaker)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteSpeaker(speaker)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p>No speakers added yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Speaker Dialog */}
          <Dialog open={speakerDialogOpen} onOpenChange={setSpeakerDialogOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSpeaker ? "Edit Speaker" : "Add Speaker"}</DialogTitle>
                <DialogDescription>
                  {editingSpeaker
                    ? "Update speaker information."
                    : "Add a new speaker to this event."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="Speaker name"
                    value={speakerForm.name}
                    onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="e.g. CTO"
                      value={speakerForm.title}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      placeholder="Company name"
                      value={speakerForm.company}
                      onChange={(e) =>
                        setSpeakerForm({ ...speakerForm, company: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    placeholder="Speaker biography..."
                    value={speakerForm.bio}
                    onChange={(e) => setSpeakerForm({ ...speakerForm, bio: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avatar URL</Label>
                  <Input
                    placeholder="https://..."
                    value={speakerForm.avatarUrl}
                    onChange={(e) =>
                      setSpeakerForm({ ...speakerForm, avatarUrl: e.target.value })
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    placeholder="https://..."
                    value={speakerForm.website}
                    onChange={(e) =>
                      setSpeakerForm({ ...speakerForm, website: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Twitter</Label>
                    <Input
                      placeholder="@handle"
                      value={speakerForm.twitter}
                      onChange={(e) =>
                        setSpeakerForm({ ...speakerForm, twitter: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn</Label>
                    <Input
                      placeholder="LinkedIn URL"
                      value={speakerForm.linkedin}
                      onChange={(e) =>
                        setSpeakerForm({ ...speakerForm, linkedin: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSpeakerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSpeaker} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSpeaker ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Speaker Confirm */}
          <AlertDialog open={!!deleteSpeaker} onOpenChange={() => setDeleteSpeaker(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Speaker</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove &quot;{deleteSpeaker?.name}&quot; from this event?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteSpeaker}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ==================== TAB 6: REGISTRATIONS ==================== */}
        <TabsContent value="registrations">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Registrations</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {registrations.length} total
              </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                />
              </div>
              <Select value={regStatusFilter} onValueChange={setRegStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ticket Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Checked In</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.name}</TableCell>
                          <TableCell className="text-muted-foreground">{reg.email}</TableCell>
                          <TableCell>{reg.ticketType?.name || "\u2014"}</TableCell>
                          <TableCell>
                            <Badge variant={registrationStatusColors[reg.status] || "outline"}>
                              {reg.status.charAt(0) + reg.status.slice(1).toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPrice(reg.amount)}</TableCell>
                          <TableCell>
                            <Switch
                              checked={reg.checkedIn}
                              onCheckedChange={async (checked) => {
                                try {
                                  await fetch(`/api/cms/events/${id}/registrations/${reg.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ checkedIn: checked }),
                                  });
                                  fetchRegistrations();
                                } catch {
                                  toast.error("Failed to update check-in status");
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(reg.createdAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">No registrations found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Event Confirmation */}
      <AlertDialog open={deleteEventOpen} onOpenChange={setDeleteEventOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? All associated tickets,
              schedule items, speakers, and registrations will also be deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
