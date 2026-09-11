import React, { useState, useEffect, useRef } from "react";
import {
  UserProfile,
  WorkerDepartment,
  WorkerReportedIssue,
  WorkerMediaAttachment,
  ScreenType,
  UserRole,
  CalendarBlock,
} from "../types";
import {
  DEPARTMENT_SUPERVISOR_MAP,
  INITIAL_WORKER_REPORTED_ISSUES,
  DEMO_USER_PROFILES,
} from "../mockData";
import { WorkerTaskCalendar } from "./WorkerTaskCalendar";
import { HierarchyTabBar } from "./HierarchyTabBar";
import { ComplaintMediaGallery } from "./ComplaintMediaGallery";
import {
  WORKER_TEXTS,
  WorkerLanguage,
  getLocalizedStatus,
  getLocalizedDept,
  CENTRAL_LINE_STATIONS,
  MUMBAI_CENTRAL_STATIONS,
  FALLBACK_VOICE_PHRASES,
} from "../locales/workerTranslations";
import {
  MapPin,
  Mic,
  MicOff,
  Upload,
  Image as ImageIcon,
  Film,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  Phone,
  UserCheck,
  Radio,
  Navigation as NavIcon,
  X,
  FileCheck,
  RefreshCw,
  Eye,
  Play,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Map,
  Check,
  CheckCheck,
  Activity,
  Lock,
} from "lucide-react";

interface WorkerDashboardScreenProps {
  user: UserProfile;
  onSwitchUser?: (newUser: UserProfile) => void;
  onIssueReported?: (issue: WorkerReportedIssue) => void;
  onIssueReportedToSystem?: (issue: WorkerReportedIssue) => void;
  onNavigateToBlockPlanner?: () => void;
  onNavigate?: (screen: ScreenType) => void;
  onSwitchUserRole?: (role: UserRole) => void;
  calendarBlocks?: CalendarBlock[];
}

export const WorkerDashboardScreen: React.FC<WorkerDashboardScreenProps> = ({
  user,
  onSwitchUser,
  onIssueReported,
  onIssueReportedToSystem,
  onNavigateToBlockPlanner,
  onNavigate,
  onSwitchUserRole,
  calendarBlocks,
}) => {
  const handleReportNotice = onIssueReported || onIssueReportedToSystem;
  // Navigation Tabs within Worker Dashboard (Strictly Worker Related)
  const [activeTab, setActiveTab] = useState<"report" | "my-issues" | "complaint-status" | "work-orders" | "contacts">("report");

  useEffect(() => {
    const handleOpenCalendar = () => {
      setActiveTab("work-orders");
    };
    window.addEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
    return () => window.removeEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
  }, []);

  const [language, setLanguage] = useState<WorkerLanguage>("en");
  const t = WORKER_TEXTS[language];
  const [supervisorNotes, setSupervisorNotes] = useState<{ [ticketNo: string]: string }>({});
  const [supervisorActionTaken, setSupervisorActionTaken] = useState<{ [ticketNo: string]: string }>({});

  // Form State: Department Dropdown ("Track", "Electrical", "Signal", "Other")
  const initialDept: WorkerDepartment = (() => {
    const d = (user?.department || "").toLowerCase();
    if (d.includes("elect") || d.includes("trd") || d.includes("tract")) return "Electrical";
    if (d.includes("sign") || d.includes("s&t") || d.includes("comm")) return "Signal";
    return "Track";
  })();
  const [selectedDept, setSelectedDept] = useState<WorkerDepartment>(initialDept);

  // Sync selectedDept if user profile changes
  useEffect(() => {
    const d = (user?.department || "").toLowerCase();
    if (d.includes("elect") || d.includes("trd") || d.includes("tract")) setSelectedDept("Electrical");
    else if (d.includes("sign") || d.includes("s&t") || d.includes("comm")) setSelectedDept("Signal");
    else setSelectedDept("Track");
  }, [user?.department]);

  // Form State: Location
  const [locationAddress, setLocationAddress] = useState("Dadar - Matunga Junction Track Section");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 19.0178,
    lng: 72.8478,
  });
  const [trackSection, setTrackSection] = useState("DR – GC (Dadar - Ghatkopar)");
  const [nearestKmPost, setNearestKmPost] = useState("Km 10/18 (Mast #10/24)");
  const [lineType, setLineType] = useState<"Down Fast" | "Up Fast" | "Down Slow" | "Up Slow" | "Yard / Siding">("Down Slow");
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(4.8);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Form State: Issue Description (Text + Voice)
  const [description, setDescription] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [voiceInterimText, setVoiceInterimText] = useState("");
  const recognitionRef = useRef<any>(null);

  // Form State: Estimated Time (Number input)
  const [estimatedFixMinutes, setEstimatedFixMinutes] = useState<number>(45);

  // Form State: Media Uploads (Images & Short Videos)
  const [mediaAttachments, setMediaAttachments] = useState<WorkerMediaAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewMediaModal, setPreviewMediaModal] = useState<WorkerMediaAttachment | null>(null);

  // Issue Lists
  const [reportedIssues, setReportedIssues] = useState<WorkerReportedIssue[]>([]);
  const [submittedSuccessTicket, setSubmittedSuccessTicket] = useState<string | null>(null);
  const [formFeedbackError, setFormFeedbackError] = useState<string | null>(null);
  const [viewingHandoverSubmission, setViewingHandoverSubmission] = useState<WorkerReportedIssue | null>(null);

  // Emergency SOS Modal
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  // Dynamic Supervisor calculation based on selected Department & Logged-in User Profile
  const assignedSupervisor = React.useMemo(() => {
    const deptMapInfo = DEPARTMENT_SUPERVISOR_MAP[selectedDept] || DEPARTMENT_SUPERVISOR_MAP.Track;

    if (user?.reportingTo?.name) {
      const userDeptCode: WorkerDepartment = (() => {
        const d = (user?.department || "").toLowerCase();
        if (d.includes("elect") || d.includes("trd") || d.includes("tract")) return "Electrical";
        if (d.includes("sign") || d.includes("s&t") || d.includes("comm")) return "Signal";
        return "Track";
      })();

      if (selectedDept === userDeptCode) {
        return {
          name: user.reportingTo.name,
          empId: user.reportingTo.empId || deptMapInfo.empId,
          designation:
            user.reportingTo.role === "supervisor"
              ? `Senior Section Engineer (SSE / ${selectedDept})`
              : deptMapInfo.designation,
          phone: deptMapInfo.phone,
          depot: deptMapInfo.depot,
          status: "Active on Duty" as const,
          email: deptMapInfo.email,
        };
      }
    }
    return deptMapInfo;
  }, [selectedDept, user?.reportingTo, user?.department]);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // English (India) with support for railway terms

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let finalTranscriptChunk = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptChunk += event.results[i][0].transcript + " ";
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTranscriptChunk) {
          setDescription((prev) => (prev ? `${prev.trim()} ${finalTranscriptChunk}` : finalTranscriptChunk));
          setVoiceInterimText("");
        } else {
          setVoiceInterimText(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone access was denied. Please allow microphone permissions in your browser.");
        } else if (event.error === "no-speech") {
          // Keep listening or ignore
        } else {
          setSpeechError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceInterimText("");
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Error initializing speech recognition:", e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Update speech recognition language when user switches between English and Hindi
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";
    }
  }, [language]);

  // Fetch real complaints submitted by this worker from the backend / Supabase
  useEffect(() => {
    const authToken = localStorage.getItem("railpravah_token");
    fetch(`/api/issues?role=worker&empId=${user.empId}`, {
      headers: {
        "x-user-role": "worker",
        "x-user-empid": user.empId,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.issues)) {
          const mapped: WorkerReportedIssue[] = data.issues.map((iss: any) => ({
            id: iss.id,
            ticketNo: iss.ticketNo,
            department: iss.department || "Track",
            assignedSupervisor: iss.supervisor || assignedSupervisor,
            location: {
              address: iss.station || "Central Line",
              coordinates: iss.activeRequest?.coordinates || { lat: 19.0178, lng: 72.8478 },
              trackSection: iss.activeRequest?.trackSection || "DR – GC",
              nearestKmPost: iss.activeRequest?.nearestKmPost || "Km 10/4",
              lineType: iss.activeRequest?.lineType || "Down Slow",
            },
            description: iss.activeRequest?.description || iss.description || "",
            estimatedFixTimeMinutes: iss.activeRequest?.estimatedFixTimeMinutes || 30,
            media: iss.activeRequest?.media || [],
            priority: iss.activeRequest?.priority || "Medium",
            status: iss.currentStatus?.startsWith("Resolved") ? "Resolved" : (iss.currentStatus || "Under Supervisor Review"),
            reportedBy: iss.originalRequest?.reportedBy || { name: user.name, empId: user.empId },
            createdAt: iss.createdAt || new Date().toISOString().substring(0, 16).replace("T", " "),
          }));
          setReportedIssues(mapped);
        }
      })
      .catch((err) => console.warn("Error fetching worker issues:", err));
  }, [user.empId]);

  // Toggle Voice Recording
  const handleToggleVoice = () => {
    if (!speechSupported) {
      // Fallback: insert sample railway dictate in current language
      const phrases = FALLBACK_VOICE_PHRASES[language];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setDescription((prev) => (prev ? `${prev.trim()} ${randomPhrase}` : randomPhrase));
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
      }
    }
  };

  // Fetch GPS Coordinates using Browser Geolocation
  const handleFetchGpsLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setFormFeedbackError(t.alertGeoNotSupported);
      return;
    }

    setFormFeedbackError(null);
    setIsFetchingGps(true);
    setGpsLocked(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;

        setCoordinates({ lat, lng });
        setGpsAccuracy(acc ? Math.round(acc * 10) / 10 : 5.0);
        setGpsLocked(true);
        setIsFetchingGps(false);

        // Derive Mumbai Central Line Section based on rough coordinates or simulated railway tag
        if (lat >= 19.08) {
          setLocationAddress(`Ghatkopar - Vikhroli Section (Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)})`);
          setTrackSection("GC – VK (Ghatkopar - Vikhroli)");
          setNearestKmPost("Km 18/22 (Mast #18/30)");
        } else if (lat >= 19.04) {
          setLocationAddress(`Kurla - Vidyavihar Section (Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)})`);
          setTrackSection("DR – GC (Kurla Yard)");
          setNearestKmPost("Km 15/10 (Mast #15/14)");
        } else {
          setLocationAddress(`Dadar - Matunga Junction (Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)})`);
          setTrackSection("DR – GC (Dadar North)");
          setNearestKmPost("Km 10/18 (Mast #10/24)");
        }
      },
      (error) => {
        console.warn("GPS error:", error);
        setIsFetchingGps(false);
        // Fallback default GPS
        setCoordinates({ lat: 19.0178, lng: 72.8478 });
        setGpsAccuracy(12.5);
        setGpsLocked(true);
        setLocationAddress("Dadar Station Yard (Track Km 10/14, Mast #10/22)");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle Media File Upload (Images and Short Videos)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    Array.from(files).forEach((file: File) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isImage && !isVideo) {
        setFormFeedbackError(t.alertValidMedia);
        return;
      }
      setFormFeedbackError(null);

      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const dataUrl = uploadEvent.target?.result as string;
          const newAttachment: WorkerMediaAttachment = {
            id: "media-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            name: file.name,
            type: "image",
            url: dataUrl,
            size: `${sizeMb} MB`,
            file,
          };
          setMediaAttachments((prev) => [newAttachment, ...prev]);
        };
        reader.onerror = () => {
          const fileUrl = URL.createObjectURL(file);
          const newAttachment: WorkerMediaAttachment = {
            id: "media-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            name: file.name,
            type: "image",
            url: fileUrl,
            size: `${sizeMb} MB`,
            file,
          };
          setMediaAttachments((prev) => [newAttachment, ...prev]);
        };
        reader.readAsDataURL(file);
      } else {
        const fileUrl = URL.createObjectURL(file);
        const newAttachment: WorkerMediaAttachment = {
          id: "media-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: "video",
          url: fileUrl,
          size: `${sizeMb} MB`,
          file,
        };
        setMediaAttachments((prev) => [newAttachment, ...prev]);
      }
    });

    setIsUploading(false);
  };

  const handleRemoveMedia = (id: string) => {
    setMediaAttachments((prev) => prev.filter((m) => m.id !== id));
  };

  // Quick preset samples for media
  const handleAddSampleImage = () => {
    const sampleImages = [
      {
        name: "rail_head_crack_km11.jpg",
        url: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=500&auto=format&fit=crop&q=80",
        size: "2.8 MB",
      },
      {
        name: "ohe_cantilever_flash.jpg",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=500&auto=format&fit=crop&q=80",
        size: "3.4 MB",
      },
      {
        name: "point_machine_dust.jpg",
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80",
        size: "1.9 MB",
      },
    ];
    const picked = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setMediaAttachments((prev) => [
      {
        id: "sample-" + Date.now(),
        name: picked.name,
        type: "image",
        url: picked.url,
        size: picked.size,
      },
      ...prev,
    ]);
  };

  const handleAddSampleVideo = () => {
    const sampleVideos = [
      {
        name: "pantograph_sparking_clip.mp4",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        size: "4.6 MB",
      },
      {
        name: "track_vibration_gauge.mp4",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        size: "3.8 MB",
      },
    ];
    const picked = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
    setMediaAttachments((prev) => [
      {
        id: "sample-vid-" + Date.now(),
        name: picked.name,
        type: "video",
        url: picked.url,
        size: picked.size,
      },
      ...prev,
    ]);
  };

  // Dynamic Track Landmark Handler
  const handleLocationAddressChange = (val: string) => {
    setLocationAddress(val);
    const lower = val.toLowerCase();
    if (lower.includes("thane") || lower.includes("tna") || lower.includes("kalva")) {
      setTrackSection("TNA – KLV (Thane - Kalva)");
      setNearestKmPost("Km 34/04 (Mast #34/10)");
    } else if (lower.includes("kalyan") || lower.includes("kyn") || lower.includes("diva")) {
      setTrackSection("DIVA – KYN (Diva - Kalyan)");
      setNearestKmPost("Km 53/16 (Mast #53/22)");
    } else if (lower.includes("mulund") || lower.includes("bhandup") || lower.includes("bnd")) {
      setTrackSection("BND – MLND (Bhandup - Mulund)");
      setNearestKmPost("Km 27/08 (Mast #27/12)");
    } else if (lower.includes("ghatkopar") || lower.includes("vikhroli") || lower.includes("gc")) {
      setTrackSection("GC – VK (Ghatkopar - Vikhroli)");
      setNearestKmPost("Km 18/22 (Mast #18/30)");
    } else if (lower.includes("kurla") || lower.includes("vidyavihar") || lower.includes("cla")) {
      setTrackSection("CLA – VVH (Kurla - Vidyavihar)");
      setNearestKmPost("Km 15/10 (Mast #15/14)");
    } else if (lower.includes("byculla") || lower.includes("csmt") || lower.includes("cstm")) {
      setTrackSection("CSTM – BY (CSTM - Byculla)");
      setNearestKmPost("Km 4/12 (Mast #4/18)");
    } else if (lower.includes("dadar") || lower.includes("matunga") || lower.includes("dr")) {
      setTrackSection("DR – MT (Dadar - Matunga)");
      setNearestKmPost("Km 10/18 (Mast #10/24)");
    }
  };

  const handleSelectSectionPreset = (stationName: string, km: string, lat: number, lng: number) => {
    setLocationAddress(`${stationName} Section (${km})`);
    setTrackSection(stationName);
    setNearestKmPost(km);
    setCoordinates({ lat, lng });
  };

  // Submit Issue Report - Sent strictly to assigned supervisor only (NOT to COA)
  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setFormFeedbackError(t.alertEnterDesc);
      return;
    }

    setFormFeedbackError(null);

    const ticketNo = `CR-WRK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIssue: WorkerReportedIssue = {
      id: "wrk-" + Date.now(),
      ticketNo,
      department: selectedDept,
      assignedSupervisor,
      location: {
        address: locationAddress,
        coordinates,
        trackSection,
        nearestKmPost,
        lineType,
      },
      description,
      voiceTranscript: voiceInterimText || undefined,
      estimatedFixTimeMinutes: Number(estimatedFixMinutes) || 30,
      media: mediaAttachments,
      priority: "Medium",
      status: "Reported to Supervisor",
      reportedBy: {
        name: user.name,
        empId: user.empId,
        phone: "+91 97692 31204",
      },
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    // Store in supervisor queue and worker log (strictly to supervisor, NOT forwarded to COA)
    setReportedIssues([newIssue, ...reportedIssues]);
    setSubmittedSuccessTicket(ticketNo);

    const derivedStation = (() => {
      const text = `${trackSection} ${locationAddress}`.toLowerCase();
      if (text.includes("thane") || text.includes("kalva")) return "Thane";
      if (text.includes("kalyan") || text.includes("diva")) return "Kalyan";
      if (text.includes("kurla") || text.includes("vidyavihar")) return "Kurla";
      if (text.includes("ghatkopar") || text.includes("vikhroli")) return "Ghatkopar";
      if (text.includes("mulund") || text.includes("bhandup")) return "Mulund";
      if (text.includes("byculla") || text.includes("csmt") || text.includes("cstm")) return "Byculla";
      if (text.includes("dadar") || text.includes("matunga")) return "Dadar";
      return locationAddress.split(/[\s\-–,]/)[0] || "Dadar";
    })();

    const authToken = localStorage.getItem("railpravah_token");
    fetch("/api/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": user.userRole || "worker",
        "x-user-id": user.id || "worker",
        "x-user-empid": user.empId || "WRK-001",
        ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        department: selectedDept,
        station: derivedStation,
        trackSection,
        lineType,
        nearestKmPost,
        priority: "Medium",
        title: description.length > 50 ? description.substring(0, 50) + "..." : description,
        description,
        estimatedFixTimeMinutes: Number(estimatedFixMinutes) || 30,
        coordinates,
        media: mediaAttachments.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          url: m.url,
          size: m.size,
        })),
        photoUrl: mediaAttachments.find((m) => m.type === "image" || m.url)?.url || mediaAttachments[0]?.url || undefined,
        technicalNotes: `Submitted from field: ${locationAddress}. Section: ${trackSection}. GPS: ${coordinates.lat}, ${coordinates.lng}`,
        reportedBy: {
          name: user.name,
          empId: user.empId,
          role: user.role,
          department: selectedDept,
        },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.issue?.ticketNo) {
          setSubmittedSuccessTicket(data.issue.ticketNo);
          setReportedIssues((prev) =>
            prev.map((it) => (it.id === newIssue.id ? { ...it, ticketNo: data.issue.ticketNo, id: data.issue.id } : it))
          );
        }
      })
      .catch((err) => console.error("Error creating hierarchical issue on backend:", err));

    // Notify parent state handler if available
    handleReportNotice?.(newIssue);

    // Reset Form fields
    setDescription("");
    setMediaAttachments([]);
  };

  return (
    <div id="worker-dashboard-container" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Hierarchy Chain Navigation Bar */}
      {onNavigate && (
        <HierarchyTabBar
          currentScreen="worker-dashboard"
          onNavigate={onNavigate}
          currentUser={user}
          onSwitchUserRole={onSwitchUserRole}
        />
      )}

      {/* Screen Header Banner (Uniform with Supervisor, Zonal Head, Dept Head, COA) */}
      <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 overflow-hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#ffdcc3] text-[#904d00] text-[11px] font-mono font-bold rounded-md uppercase shrink-0">
              {t.divisionBadge}
            </span>
            <span className="text-xs text-[#777587] font-mono shrink-0">Division: Mumbai Central Line (CR)</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              {t.terminalOnline}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#191c1e] mt-1 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#904d00] shrink-0" />
            <span className="truncate">{t.dashboardTitle}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
          {/* Quick Actions: SOS & Language */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Emergency SOS Button */}
            <button
              id="emergency-sos-btn"
              type="button"
              onClick={() => setIsSosModalOpen(true)}
              className="px-3 py-2 bg-[#ba1a1a] hover:bg-[#93000a] active:scale-95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer animate-pulse shrink-0"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t.emergencySos}</span>
            </button>

            {/* Language Toggle (English / हिन्दी) */}
            <div className="flex items-center bg-[#f2f4f6] border border-[#c7c4d8]/60 rounded-lg p-0.5 shrink-0">
              <button
                id="lang-toggle-en"
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-white text-[#191c1e] shadow-xs"
                    : "text-[#777587] hover:text-[#191c1e]"
                }`}
              >
                English
              </button>
              <button
                id="lang-toggle-hi"
                type="button"
                onClick={() => setLanguage("hi")}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  language === "hi"
                    ? "bg-white text-[#191c1e] shadow-xs"
                    : "text-[#777587] hover:text-[#191c1e]"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* User Profile Info Card */}
          <div className="flex items-center gap-2.5 bg-[#f8f9fa] p-2.5 sm:p-3 rounded-xl border border-[#eceef0] min-w-0 max-w-full">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#c7c4d8] object-cover shrink-0"
            />
            <div className="text-xs min-w-0">
              <div
                className="font-bold text-[#191c1e] truncate max-w-[150px] sm:max-w-[200px]"
                title={user.name}
              >
                {user.name}
              </div>
              <div
                className="text-[11px] text-[#777587] font-mono truncate max-w-[150px] sm:max-w-[200px]"
                title={user.role}
              >
                {user.role}
              </div>
              <div className="text-[10px] text-[#904d00] font-semibold font-mono whitespace-nowrap">
                Emp ID: {user.empId}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation (Uniform pattern with other roles - No bottom border line) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button
          id="tab-report-issue"
          type="button"
          onClick={() => {
            setActiveTab("report");
            setSubmittedSuccessTicket(null);
          }}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "report"
              ? "bg-[#904d00] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Wrench className={`w-4 h-4 ${activeTab === "report" ? "text-white" : "text-[#904d00]"}`} />
          <span>{t.tabReport}</span>
        </button>

        <button
          id="tab-my-issues"
          type="button"
          onClick={() => setActiveTab("my-issues")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "my-issues"
              ? "bg-[#904d00] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <FileCheck className={`w-4 h-4 ${activeTab === "my-issues" ? "text-white" : "text-[#777587]"}`} />
          <span>{t.tabMyIssues}</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "my-issues" ? "bg-white/20 text-white" : "bg-[#ffdcc3] text-[#904d00]"
          }`}>
            {reportedIssues.length}
          </span>
        </button>

        <button
          id="tab-complaint-status"
          type="button"
          onClick={() => setActiveTab("complaint-status")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "complaint-status"
              ? "bg-[#904d00] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <CheckCheck className={`w-4 h-4 ${activeTab === "complaint-status" ? "text-white" : "text-[#777587]"}`} />
          <span>{t.tabComplaintStatus}</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "complaint-status" ? "bg-white/20 text-white" : "bg-[#dcfce7] text-[#166534]"
          }`}>
            {t.badgeStatusMonitor}
          </span>
        </button>

        <button
          id="tab-work-orders"
          type="button"
          onClick={() => setActiveTab("work-orders")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "work-orders"
              ? "bg-[#904d00] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === "work-orders" ? "text-white" : "text-[#777587]"}`} />
          <span>{t.tabCalendar}</span>
        </button>

        <button
          id="tab-contacts"
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "contacts"
              ? "bg-[#904d00] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Phone className={`w-4 h-4 ${activeTab === "contacts" ? "text-white" : "text-[#777587]"}`} />
          <span>{t.tabContacts || "CONTACTS"}</span>
        </button>
      </div>

      {/* TAB 1: WORKER ISSUE REPORTING FORM */}
      {activeTab === "report" && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Success Submission Alert */}
            {submittedSuccessTicket && (
              <div className="p-4 bg-[#dcfce7] border border-[#166534]/30 rounded-xl flex items-start justify-between gap-3 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[#166534]">
                      {t.ticketSuccessTitle} ({submittedSuccessTicket})
                    </h4>
                    <p className="text-xs text-[#166534]/90 mt-0.5">
                      {t.ticketSuccessDesc} <strong>{assignedSupervisor.name}</strong> ({assignedSupervisor.designation}) {t.ticketInspectionAction}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSubmittedSuccessTicket(null)}
                  className="p-1 text-[#166534] hover:bg-[#166534]/10 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmitIssue}
              className="bg-white border border-[#c7c4d8] rounded-xl p-5 sm:p-6 shadow-xs space-y-6"
            >
              {/* Form Feedback Error Banner */}
              {formFeedbackError && (
                <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-xs font-semibold flex items-center justify-between gap-2 border border-[#ba1a1a]/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formFeedbackError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormFeedbackError(null)}
                    className="p-1 hover:bg-[#ba1a1a]/10 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Form Title & Instruction */}
              <div className="border-b border-[#eceef0] pb-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                    <span>{t.formTitle}</span>
                    <span className="text-[10px] bg-[#ffdcc3] text-[#904d00] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                      {t.supervisorDispatchOnly}
                    </span>
                  </h2>
                </div>
              </div>

              {/* 1. LOCATION SECTION (Button for GPS + Map Pin-Drop) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#3525cd]" />
                    <span>{t.sec1Title}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Fetch GPS Location Button */}
                    <button
                      id="fetch-gps-btn"
                      type="button"
                      onClick={handleFetchGpsLocation}
                      disabled={isFetchingGps}
                      className="px-3 py-1.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isFetchingGps ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <NavIcon className="w-3.5 h-3.5" />
                      )}
                      <span>{isFetchingGps ? t.acquiringGps : t.fetchGps}</span>
                    </button>

                    {/* Map Pin Drop Button */}
                    <button
                      id="open-map-pin-btn"
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className="px-3 py-1.5 bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] border border-[#c7c4d8] text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Map className="w-3.5 h-3.5 text-[#3525cd]" />
                      <span>{t.mapPinDrop}</span>
                    </button>
                  </div>
                </div>

                {/* GPS Info Card */}
                <div className="bg-[#f7f9fb] border border-[#c7c4d8] rounded-lg p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#191c1e]">{t.trackLandmark}</span>
                      <input
                        type="text"
                        value={locationAddress}
                        onChange={(e) => handleLocationAddressChange(e.target.value)}
                        placeholder={t.landmarkPlaceholder}
                        className="bg-white border border-[#c7c4d8] rounded px-2.5 py-1 text-xs text-[#191c1e] w-64 sm:w-80 font-sans focus:outline-none focus:border-[#3525cd]"
                      />
                    </div>
                    {gpsLocked && (
                      <span className="px-2 py-0.5 bg-[#dcfce7] text-[#166534] font-mono text-[11px] font-bold rounded flex items-center gap-1">
                        <Radio className="w-3 h-3 text-[#166534]" />
                        {t.gpsLocked} (±{gpsAccuracy}m)
                      </span>
                    )}
                  </div>

                  {/* Section Quick Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-[#777587] font-mono uppercase">Quick Presets:</span>
                    {MUMBAI_CENTRAL_STATIONS[language].map((st) => (
                      <button
                        key={st.code}
                        type="button"
                        onClick={() => handleSelectSectionPreset(st.name, st.km, st.lat, st.lng)}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-all cursor-pointer ${
                          trackSection.includes(st.name) || locationAddress.includes(st.name)
                            ? "bg-[#3525cd] text-white border-[#3525cd]"
                            : "bg-white text-[#464555] border-[#c7c4d8] hover:bg-[#e2dfff] hover:text-[#3525cd]"
                        }`}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-[#eceef0] text-[11px]">
                    <div>
                      <span className="text-[#777587] block font-mono">Track Section</span>
                      <input
                        type="text"
                        value={trackSection}
                        onChange={(e) => setTrackSection(e.target.value)}
                        placeholder="e.g. TNA – KLV (Thane - Kalva)"
                        className="bg-white border border-[#c7c4d8] rounded px-2 py-1 text-[11px] font-mono font-bold text-[#3525cd] w-full mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[#777587] block font-mono">{t.trackLine}</span>
                      <select
                        value={lineType}
                        onChange={(e) => setLineType(e.target.value as any)}
                        className="bg-white border border-[#c7c4d8] rounded px-2 py-1 font-bold text-[#3525cd] text-[11px] w-full mt-0.5"
                      >
                        <option value="Down Fast">{t.lineDownFast}</option>
                        <option value="Up Fast">{t.lineUpFast}</option>
                        <option value="Down Slow">{t.lineDownSlow}</option>
                        <option value="Up Slow">{t.lineUpSlow}</option>
                        <option value="Yard / Siding">{t.lineYardSiding}</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[#777587] block font-mono">{t.kmPostMast}</span>
                      <input
                        type="text"
                        value={nearestKmPost}
                        onChange={(e) => setNearestKmPost(e.target.value)}
                        className="bg-white border border-[#c7c4d8] rounded px-2 py-1 text-[11px] font-mono font-bold text-[#191c1e] w-full mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DEPARTMENT DROPDOWN & DYNAMIC SUPERVISOR DISPLAY */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department Dropdown: Options "Track", "Electrical", "Signal", "Other" */}
                  <div>
                    <label
                      htmlFor="worker-department-select"
                      className="block text-xs font-bold uppercase tracking-wider text-[#191c1e] mb-1.5 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#3525cd]" />
                        <span>{t.sec2Title}</span>
                      </span>
                      <span className="text-[11px] font-normal text-[#777587]">{t.selectCategory}</span>
                    </label>
                    <select
                      id="worker-department-select"
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value as WorkerDepartment)}
                      className="w-full bg-[#f7f9fb] border-2 border-[#3525cd]/40 focus:border-[#3525cd] rounded-lg p-2.5 text-xs font-bold text-[#191c1e] shadow-2xs transition-all cursor-pointer focus:outline-none"
                    >
                      <option value="Track">{t.deptTrack}</option>
                      <option value="Electrical">{t.deptElectrical}</option>
                      <option value="Signal">{t.deptSignal}</option>
                      <option value="Other">{t.deptOther}</option>
                    </select>
                  </div>

                  {/* Estimated Time Required to Fix */}
                  <div>
                    <label
                      htmlFor="estimated-time-input"
                      className="block text-xs font-bold uppercase tracking-wider text-[#191c1e] mb-1.5 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#3525cd]" />
                        <span>{t.sec4Title}</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#3525cd] font-bold">
                        {estimatedFixMinutes >= 60
                          ? `${(estimatedFixMinutes / 60).toFixed(1)} ${t.hrs}`
                          : `${estimatedFixMinutes} ${t.mins}`}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          id="estimated-time-input"
                          type="number"
                          min={5}
                          max={480}
                          step={5}
                          value={estimatedFixMinutes}
                          onChange={(e) => setEstimatedFixMinutes(Math.max(5, parseInt(e.target.value) || 15))}
                          placeholder="e.g. 45"
                          className="w-full bg-[#f7f9fb] border border-[#c7c4d8] rounded-lg p-2.5 text-xs font-mono font-bold text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#777587]">
                          {t.min}
                        </span>
                      </div>
                      {/* Quick preset buttons */}
                      <div className="flex items-center gap-1">
                        {[15, 30, 45, 60, 120].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setEstimatedFixMinutes(mins)}
                            className={`px-2 py-1 text-[10px] font-mono font-bold rounded cursor-pointer transition-all ${
                              estimatedFixMinutes === mins
                                ? "bg-[#3525cd] text-white"
                                : "bg-[#f2f4f6] text-[#464555] hover:bg-[#e6e8ea]"
                            }`}
                          >
                            +{mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC SUPERVISOR DISPLAY (Automatically fetched & displayed below dropdown) */}
                <div
                  id="assigned-supervisor-card"
                  className="bg-gradient-to-r from-[#eef2ff] to-[#f5f3ff] border border-[#c7d2fe] rounded-xl p-3.5 transition-all shadow-2xs animate-fadeIn"
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3525cd] text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                        {assignedSupervisor.name.split(" ")[0][0]}
                        {assignedSupervisor.name.split(" ")[1]?.[0] || "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#3525cd]">
                            {t.assignedSup} ({getLocalizedDept(selectedDept, language)})
                          </span>
                          <span className="px-2 py-0.5 bg-[#dcfce7] text-[#166534] text-[10px] font-bold rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
                            {getLocalizedStatus(assignedSupervisor.status, language)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#191c1e] mt-0.5">{assignedSupervisor.name}</h3>
                        <p className="text-xs text-[#464555]">{assignedSupervisor.designation}</p>
                        <p className="text-[11px] text-[#777587] font-mono mt-0.5">{assignedSupervisor.depot}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${assignedSupervisor.phone.replace(/\s+/g, "")}`}
                        className="px-3 py-1.5 bg-white border border-[#c7d2fe] text-[#3525cd] hover:bg-[#3525cd] hover:text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{assignedSupervisor.phone}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ISSUE DESCRIPTION (TEXT + VOICE SPEECH-TO-TEXT) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label
                    htmlFor="issue-description-input"
                    className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1.5"
                  >
                    <Wrench className="w-4 h-4 text-[#3525cd]" />
                    <span>{t.sec3Title}</span>
                  </label>

                  {/* Speech-to-Text Mic Button */}
                  <button
                    id="mic-voice-record-btn"
                    type="button"
                    onClick={handleToggleVoice}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 shadow-2xs transition-all cursor-pointer ${
                      isListening
                        ? "bg-[#ba1a1a] text-white animate-pulse ring-2 ring-[#ba1a1a]/40"
                        : "bg-[#e2dfff] text-[#3525cd] hover:bg-[#3525cd] hover:text-white"
                    }`}
                    title="Click to speak and convert speech to text"
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 animate-bounce" />
                        <span>{t.listeningStop}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>{t.dictateVoice}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Voice speech status indicator */}
                {isListening && (
                  <div className="p-2.5 bg-[#ffdad6]/60 border border-[#ba1a1a]/30 rounded-lg flex items-center justify-between text-xs text-[#ba1a1a] animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-ping"></span>
                      <span className="font-semibold">
                        {t.micActiveMsg}
                      </span>
                    </div>
                    {voiceInterimText && (
                      <span className="font-mono italic text-[11px] text-[#464555]">
                        "{voiceInterimText}"
                      </span>
                    )}
                  </div>
                )}

                {speechError && (
                  <div className="p-2.5 bg-[#fff8e1] border border-[#ffe082] rounded-lg text-xs text-[#856404] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{speechError}</span>
                  </div>
                )}

                {/* Text Area */}
                <div className="relative">
                  <textarea
                    id="issue-description-input"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.descPlaceholder}
                    className="w-full bg-[#f7f9fb] border border-[#c7c4d8] rounded-xl p-3 text-xs text-[#191c1e] placeholder:text-[#777587] focus:outline-none focus:border-[#3525cd] focus:bg-white focus:ring-1 focus:ring-[#3525cd] transition-all font-sans"
                  />
                  {description && (
                    <button
                      type="button"
                      onClick={() => setDescription("")}
                      className="absolute right-3 top-3 text-[#777587] hover:text-[#ba1a1a] p-1"
                      title={t.clearDesc}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick 1-Click Railway Issue Dictation Tags */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-[#777587] font-mono">{t.quickTags}</span>
                  {[
                    t.tag1,
                    t.tag2,
                    t.tag3,
                    t.tag4,
                    t.tag5,
                    t.tag6,
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setDescription((prev) => (prev ? `${prev.trim()}. ${tag}.` : `${tag}.`))}
                      className="px-2 py-0.5 bg-[#f2f4f6] hover:bg-[#e2dfff] text-[#464555] hover:text-[#3525cd] text-[10px] font-medium rounded-full border border-[#c7c4d8]/60 transition-all cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. MEDIA UPLOAD (Accepts Images & Short Videos) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#3525cd]" />
                    <span>{t.sec5Title}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      id="add-sample-photo-btn"
                      type="button"
                      onClick={handleAddSampleImage}
                      className="text-[11px] text-[#3525cd] font-semibold hover:underline flex items-center gap-1 bg-[#eef2ff] px-2 py-1 rounded border border-[#c7d2fe]"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>{t.addSamplePhoto}</span>
                    </button>
                    <button
                      id="add-sample-video-btn"
                      type="button"
                      onClick={handleAddSampleVideo}
                      className="text-[11px] text-[#904d00] font-semibold hover:underline flex items-center gap-1 bg-[#fff4eb] px-2 py-1 rounded border border-[#ffdcc3]"
                    >
                      <Film className="w-3 h-3" />
                      <span>{t.addSampleVideo}</span>
                    </button>
                  </div>
                </div>

                {/* Upload Drag & Drop Area */}
                <div className="border-2 border-dashed border-[#c7c4d8] hover:border-[#3525cd] rounded-xl p-4 sm:p-5 text-center bg-[#f7f9fb] transition-all relative">
                  <input
                    id="media-file-input"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <div className="flex items-center gap-2 text-[#3525cd]">
                      <ImageIcon className="w-6 h-6" />
                      <Film className="w-6 h-6 text-[#904d00]" />
                    </div>
                    <p className="text-xs font-bold text-[#191c1e]">
                      {t.dropzoneTitle}
                    </p>
                    <p className="text-[11px] text-[#777587]">
                      {t.dropzoneSubtitle}
                    </p>
                  </div>
                </div>

                {/* Uploaded Media Previews */}
                {mediaAttachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {mediaAttachments.map((item) => (
                      <div
                        key={item.id}
                        className="relative group bg-white border border-[#c7c4d8] rounded-lg overflow-hidden shadow-2xs flex flex-col"
                      >
                        <div className="h-24 bg-[#191c1e] relative overflow-hidden flex items-center justify-center">
                          {item.type === "image" ? (
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-white">
                              <Film className="w-8 h-8 text-[#ffdcc3] mb-1" />
                              <span className="text-[10px] font-mono">{t.videoClip}</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setPreviewMediaModal(item)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-2 text-[11px] flex items-center justify-between">
                          <div className="truncate pr-1">
                            <p className="font-semibold text-[#191c1e] truncate">{item.name}</p>
                            <span className="text-[#777587] font-mono text-[10px]">{item.size}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(item.id)}
                            className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1 rounded cursor-pointer"
                            title={t.removeFile}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#eceef0] flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-[#777587] min-w-0 max-w-full">
                  <p className="break-words">
                    {t.transmittingAs} <strong>{user.name}</strong> ({user.empId})
                  </p>
                  <p className="text-[11px] text-[#904d00] font-semibold truncate">
                    {t.directDispatchTo} {assignedSupervisor.name}
                  </p>
                </div>

                <button
                  id="submit-worker-issue-btn"
                  type="submit"
                  className="px-6 py-2.5 bg-[#904d00] hover:bg-[#723c00] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.transmitBtn}</span>
                </button>
              </div>
            </form>
        </div>
      )}

      {/* TAB 2: MY REPORTED ISSUES & LIVE TRACKER */}
      {activeTab === "my-issues" && (
        <div className="bg-white border border-[#c7c4d8] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#eceef0] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#191c1e]">{t.logTitle}</h2>
            </div>
            <button
              onClick={() => setActiveTab("report")}
              className="px-3.5 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded-lg shadow-2xs hover:bg-[#4f46e5] flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t.reportNewIssueBtn}</span>
            </button>
          </div>

          <div className="space-y-3">
            {reportedIssues.length === 0 ? (
              <div className="text-center py-10 px-4 bg-[#f8f9fa] rounded-xl border border-dashed border-[#c7c4d8] text-[#777587]">
                <p className="text-sm font-semibold">{t.noComplaintsLogged}</p>
                <p className="text-xs mt-1 text-[#a09eaf]">{t.noComplaintsLoggedDesc}</p>
              </div>
            ) : (
              reportedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-[#f7f9fb] border border-[#c7c4d8] rounded-xl p-4 hover:border-[#3525cd] transition-all space-y-3"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-[#3525cd]">{issue.ticketNo}</span>
                        <span className="px-2 py-0.5 bg-[#e2dfff] text-[#3525cd] text-[10px] font-bold rounded-full">
                          {getLocalizedDept(issue.department, language)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingHandoverSubmission(issue)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#fef3c7] hover:bg-[#fde68a] text-[#92400e] text-[10px] font-bold rounded-full border border-[#f59e0b]/40 cursor-pointer shadow-2xs transition-colors"
                          title="Click to view details submitted to Supervisor"
                        >
                          <Lock className="w-2.5 h-2.5 text-[#d97706]" />
                          <span>Matter Escalated • View Details &rarr;</span>
                        </button>
                        <span className="px-2 py-0.5 bg-[#dcfce7] text-[#166534] text-[10px] font-bold rounded-full">
                          {getLocalizedStatus(issue.status, language)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#191c1e] mt-1">{issue.location.address}</h3>
                      <p className="text-xs text-[#464555] font-mono">
                        {issue.location.trackSection} • {issue.location.lineType} • {issue.location.nearestKmPost}
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[#777587] font-mono block">{issue.createdAt}</span>
                      <span className="font-bold text-[#191c1e] mt-0.5 block">
                        {t.estTime} {issue.estimatedFixTimeMinutes} {t.mins}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#191c1e] bg-white p-2.5 rounded-lg border border-[#c7c4d8]/60">
                    {issue.description}
                  </p>

                  {/* Supervisor & Media Details */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1 border-t border-[#eceef0]">
                    <div className="flex items-center gap-2 text-[#464555]">
                      <UserCheck className="w-3.5 h-3.5 text-[#3525cd]" />
                      <span>
                        {t.assignedSupervisorLabel} <strong>{issue.assignedSupervisor.name}</strong> ({issue.assignedSupervisor.phone})
                      </span>
                    </div>

                    {issue.media && issue.media.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#777587] font-mono">{t.attachedEvidence}</span>
                        {issue.media.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setPreviewMediaModal(m)}
                            className="px-2 py-0.5 bg-white border border-[#c7c4d8] hover:border-[#3525cd] rounded text-[10px] font-mono text-[#3525cd] flex items-center gap-1 cursor-pointer"
                          >
                            {m.type === "image" ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                            <span>{m.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2.5: COMPLAINT STATUS & LIVE TRACKING */}
      {activeTab === "complaint-status" && (
        <div className="bg-white border border-[#c7c4d8] rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-[#904d00]" />
                <span>{t.statusMonitorTitle}</span>
              </h2>
            </div>
            <span className="px-2.5 py-1 bg-[#dcfce7] text-[#166534] font-mono text-[11px] font-bold rounded-lg border border-[#86efac]">
              {t.liveStatusSync}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#eceef0]">
              <span className="text-[11px] text-[#777587] font-semibold block">{t.metricTotalComplaints}</span>
              <span className="text-lg font-black text-[#191c1e]">{reportedIssues.length}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <span className="text-[11px] text-amber-800 font-semibold block">{t.metricUnderReview}</span>
              <span className="text-lg font-black text-amber-900">
                {reportedIssues.filter(i => i.status !== "Resolved").length}
              </span>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
              <span className="text-[11px] text-blue-800 font-semibold block">{t.metricPendingBlock}</span>
              <span className="text-lg font-black text-blue-900">
                {reportedIssues.filter(i => i.status === "Block Queued" || i.status === "Endorsed by Supervisor").length}
              </span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-semibold block">{t.metricResolvedSignedOff}</span>
              <span className="text-lg font-black text-emerald-900">
                {reportedIssues.filter(i => i.status === "Resolved").length}
              </span>
            </div>
          </div>

          {/* Issue Status Cards */}
          <div className="space-y-4">
            {reportedIssues.length === 0 ? (
              <div className="text-center py-10 px-4 bg-[#f8f9fa] rounded-xl border border-dashed border-[#c7c4d8] text-[#777587]">
                <p className="text-sm font-semibold">{t.noComplaintsLogged}</p>
                <p className="text-xs mt-1 text-[#a09eaf]">{t.noComplaintsLoggedDesc}</p>
              </div>
            ) : (
              reportedIssues.map((issue) => {
                const isResolved = issue.status === "Resolved";
                return (
                  <div
                    key={`status-${issue.id}`}
                    className={`border rounded-xl p-4 sm:p-5 space-y-4 text-xs transition-all ${
                      isResolved ? "bg-white border-emerald-300" : "bg-[#fcfdfe] border-[#c7c4d8]"
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded">
                            {issue.ticketNo}
                          </span>
                          <span className="font-bold text-[#191c1e]">{issue.location.address}</span>
                          <span className="text-[11px] text-[#777587] font-mono">
                            {issue.location.trackSection} • {issue.location.lineType} • {issue.location.nearestKmPost}
                          </span>
                        </div>
                        <p className="text-xs text-[#464555] font-medium pt-1">
                          {issue.description}
                        </p>

                        {/* Defect Field Photos */}
                        {issue.media && issue.media.length > 0 && (
                          <div className="pt-2">
                            <ComplaintMediaGallery
                              media={issue.media}
                              ticketNo={issue.ticketNo}
                              station={issue.location.address}
                              title="Attached Defect Photos"
                              compact={true}
                            />
                          </div>
                        )}
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        {!isResolved && (
                          <button
                            type="button"
                            onClick={() => setViewingHandoverSubmission(issue)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fef3c7] hover:bg-[#fde68a] text-[#92400e] border border-[#f59e0b]/40 cursor-pointer shadow-2xs transition-colors"
                            title="Click to view details submitted to Supervisor"
                          >
                            <Lock className="w-3 h-3 text-[#d97706]" />
                            <span>Matter Escalated • View Details &rarr;</span>
                          </button>
                        )}
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            isResolved
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {getLocalizedStatus(issue.status, language)}
                        </span>
                        <span className="text-[10px] text-[#777587] font-mono block mt-0.5">
                          {t.loggedLabel} {issue.createdAt}
                        </span>
                      </div>
                    </div>

                    {/* Multi-tier Stage Stepper */}
                    <div className="p-3 bg-[#f8f9fa] border border-[#eceef0] rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-[#777587] uppercase tracking-wider block">
                        {t.hierarchyPathwayTitle}
                      </span>

                      {(() => {
                        const isSupervisorDone = isResolved || ((issue.status as string) !== "Reported to Supervisor" && (issue.status as string) !== "Under Supervisor Review" && (issue.status as string) !== "Reported");
                        const isZonalOrDept = (issue.status as string)?.includes("Zonal") || (issue.status as string)?.includes("Department") || (issue.status as string)?.includes("COA");
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            {/* Step 1 */}
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{t.step1FieldReport}</span>
                              </div>
                              <span className="text-[10px] text-emerald-700 block mt-0.5">{t.step1SubmittedWorker}</span>
                            </div>

                            {/* Step 2 */}
                            <div className={`p-2 rounded-lg border ${
                              isSupervisorDone
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-amber-50 border-amber-200 text-amber-900"
                            }`}>
                              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                {isSupervisorDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Activity className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                )}
                                <span>{t.step2SupervisorReview}</span>
                              </div>
                              <span className="text-[10px] block mt-0.5">
                                {isSupervisorDone ? t.step2VerifiedSse : t.step2InTechReview}
                              </span>
                            </div>

                            {/* Step 3 */}
                            <div className={`p-2 rounded-lg border ${
                              isResolved
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : isZonalOrDept
                                ? "bg-blue-50 border-blue-200 text-blue-900"
                                : "bg-white border-[#eceef0] text-[#777587]"
                            }`}>
                              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                {isResolved ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : isZonalOrDept ? (
                                  <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                ) : (
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#777587]" />
                                )}
                                <span>{t.step3ZonalCte}</span>
                              </div>
                              <span className="text-[10px] block mt-0.5">
                                {isResolved
                                  ? t.step3PossessionApproved
                                  : isZonalOrDept
                                  ? (issue.status || "In Technical Review")
                                  : t.step3CorridorClearance}
                              </span>
                            </div>

                            {/* Step 4 */}
                            <div className={`p-2 rounded-lg border ${
                              isResolved
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-white border-[#eceef0] text-[#777587]"
                            }`}>
                              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                <CheckCircle2 className={`w-3.5 h-3.5 ${isResolved ? "text-emerald-600" : "text-[#777587]"}`} />
                                <span>{t.step4ResolutionSignoff}</span>
                              </div>
                              <span className="text-[10px] block mt-0.5">
                                {isResolved ? t.step4SignedOffClosed : t.step4AwaitingSignoff}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Custody and Action Info */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#eceef0]">
                      <div className="flex items-center gap-2 text-[#464555]">
                        <UserCheck className="w-3.5 h-3.5 text-[#3525cd]" />
                        <span>
                          {t.assignedSupervisorLabel} <strong>{issue.assignedSupervisor.name}</strong> ({issue.assignedSupervisor.designation})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${issue.assignedSupervisor.phone}`}
                          className="px-2.5 py-1 bg-[#eef2ff] hover:bg-[#e0e7ff] text-[#3525cd] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{t.callSupervisorBtn}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNED MAINTENANCE TASKS & WORKER CALENDAR */}
      {activeTab === "work-orders" && (
        <WorkerTaskCalendar
          user={user}
          language={language}
          onLanguageChange={setLanguage}
          calendarBlocks={calendarBlocks}
        />
      )}

      {/* TAB 4: SUPERVISORY DIRECTORY / CONTACTS */}
      {activeTab === "contacts" && (
        <div className="bg-white border border-[#c7c4d8] rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-[#eceef0] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#3525cd]" />
                <span>{t.directoryTitle}</span>
              </h2>
              <p className="text-xs text-[#777587] mt-0.5">
                Official contact directory of Central Division Senior Section Engineers & Technical Supervisors.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-[#eef2ff] text-[#3525cd] font-mono text-[11px] font-bold rounded-lg border border-[#c7d2fe]">
              4 Superintending Desks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(DEPARTMENT_SUPERVISOR_MAP).map(([deptKey, sup]) => {
              const isSelected = deptKey === selectedDept;
              return (
                <div
                  key={deptKey}
                  onClick={() => setSelectedDept(deptKey as WorkerDepartment)}
                  className={`p-4 rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#eef2ff] border-[#3525cd] ring-1 ring-[#3525cd]/30"
                      : "bg-[#f7f9fb] border-[#c7c4d8]/60 hover:bg-[#f2f4f6]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#191c1e] text-sm">
                      {getLocalizedDept(deptKey, language)} {t.deptWord}
                    </span>
                    {isSelected ? (
                      <span className="text-[10px] font-bold text-[#3525cd] uppercase font-mono bg-white px-2 py-0.5 rounded border border-[#3525cd]/30">
                        {t.selected}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#006e1c] font-mono bg-emerald-50 px-2 py-0.5 rounded">
                        {t.activeStatus}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-[#3525cd] text-sm mt-1">{sup.name}</p>
                  <p className="text-xs text-[#464555]">{sup.designation}</p>
                  <p className="text-[11px] text-[#777587] font-mono mt-0.5">{sup.depot}</p>
                  <div className="mt-3 pt-2.5 border-t border-[#c7c4d8]/40 flex items-center justify-between">
                    <a
                      href={`tel:${sup.phone.replace(/\s+/g, "")}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 bg-white border border-[#3525cd]/40 text-[#3525cd] hover:bg-[#3525cd] hover:text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{sup.phone}</span>
                    </a>
                    <span className="text-[11px] text-[#777587]">Tap card to select for reports</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: INTERACTIVE MAP PIN-DROP */}
      {isMapModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-[#c7c4d8] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#3525cd]" />
                <h3 className="text-base font-bold text-[#191c1e]">
                  {t.mapModalTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="p-1 text-[#777587] hover:text-[#191c1e] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#464555]">
              {t.mapModalSubtitle}
            </p>

            {/* Simulated Interactive Central Line Track Schematic */}
            <div className="bg-[#191c1e] rounded-xl p-4 text-white space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/70 border-b border-white/10 pb-2">
                <span>{t.csmtTerminus}</span>
                <span>{t.kalyanJunction}</span>
              </div>

              {/* Stations Pin Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {MUMBAI_CENTRAL_STATIONS[language].map((station) => (
                  <button
                    key={station.code}
                    type="button"
                    onClick={() => {
                      setLocationAddress(`${station.name} (${station.km})`);
                      setTrackSection(station.name);
                      setNearestKmPost(station.km);
                      setCoordinates({ lat: station.lat, lng: station.lng });
                      setIsMapModalOpen(false);
                    }}
                    className="p-2.5 rounded-lg bg-white/10 hover:bg-[#3525cd] border border-white/15 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-white">
                        {station.name}
                      </span>
                      <MapPin className="w-3.5 h-3.5 text-[#ffdcc3]" />
                    </div>
                    <span className="text-[10px] font-mono text-white/60 block mt-0.5">{station.km}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="px-4 py-2 bg-[#f2f4f6] text-[#191c1e] text-xs font-bold rounded-lg hover:bg-[#e6e8ea] cursor-pointer"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MEDIA PREVIEW MODAL */}
      {previewMediaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl space-y-3 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#eceef0] pb-2">
              <span className="text-xs font-mono font-bold text-[#191c1e]">
                {previewMediaModal.name} ({previewMediaModal.size})
              </span>
              <button
                onClick={() => setPreviewMediaModal(null)}
                className="p-1 text-[#777587] hover:text-[#191c1e] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center max-h-[60vh]">
              {previewMediaModal.type === "image" ? (
                <img
                  src={previewMediaModal.url}
                  alt={previewMediaModal.name}
                  className="max-h-[55vh] object-contain"
                />
              ) : (
                <div className="p-8 text-center text-white space-y-2">
                  <Film className="w-12 h-12 text-[#ffdcc3] mx-auto" />
                  <p className="text-xs font-bold">{t.videoEvidenceTitle}</p>
                  <p className="text-[11px] text-white/60 font-mono">{t.videoEvidenceFormat}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewMediaModal(null)}
                className="px-4 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] cursor-pointer"
              >
                {t.closePreviewBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EMERGENCY SOS BROADCAST */}
      {isSosModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#ba1a1a] space-y-4 animate-scaleUp text-center">
            <div className="w-14 h-14 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-[#ba1a1a]">{t.sosTitle}</h3>
            <p className="text-xs text-[#464555]">
              {t.sosDesc}
            </p>

            {sosSent ? (
              <div className="p-4 bg-[#dcfce7] border border-[#166534] rounded-xl text-xs text-[#166534] font-bold">
                {t.sosSuccess}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSosModalOpen(false)}
                  className="px-4 py-2 bg-[#f2f4f6] text-[#464555] text-xs font-bold rounded-lg hover:bg-[#e6e8ea] cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setSosSent(true)}
                  className="px-6 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md cursor-pointer animate-pulse"
                >
                  {t.confirmSosBtn}
                </button>
              </div>
            )}

            {sosSent && (
              <button
                type="button"
                onClick={() => {
                  setIsSosModalOpen(false);
                  setSosSent(false);
                }}
                className="mt-2 text-xs text-[#3525cd] underline cursor-pointer"
              >
                {t.dismissBtn}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: WORKER SUBMISSION & ESCALATION DETAILS TO SUPERVISOR */}
      {viewingHandoverSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#c7c4d8] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 bg-[#f8f9fa] border-b border-[#eceef0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Lock className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded">
                      {viewingHandoverSubmission.ticketNo}
                    </span>
                    <span className="text-xs font-bold text-[#191c1e]">
                      {viewingHandoverSubmission.location.address}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#191c1e] mt-0.5">
                    Field Defect Submission Details (Transmitted to Section Supervisor)
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingHandoverSubmission(null)}
                className="p-1.5 text-[#777587] hover:text-[#191c1e] hover:bg-[#eceef0] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Handover Notice */}
              <div className="p-3 bg-[#fef3c7] border border-[#fde68a] rounded-xl text-[#92400e] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#d97706] shrink-0" />
                  <span>
                    <strong>Matter Escalated:</strong> In custody of Section Supervisor <strong>{viewingHandoverSubmission.assignedSupervisor.name}</strong>. Field report is locked & tamper-proof.
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold bg-amber-200 text-[#78350f] px-2 py-0.5 rounded">
                  Read Only
                </span>
              </div>

              {/* Chain of Custody */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#eceef0] space-y-1">
                  <span className="text-[10px] font-bold text-[#777587] uppercase font-mono block">
                    Reported By (Field Worker)
                  </span>
                  <div className="font-bold text-xs text-[#191c1e]">{user.name}</div>
                  <div className="text-[11px] text-[#464555]">{user.role} • Gang #04</div>
                  <div className="text-[10px] text-[#777587] font-mono">Emp ID: {user.empId}</div>
                </div>

                <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#eceef0] space-y-1">
                  <span className="text-[10px] font-bold text-[#3525cd] uppercase font-mono block">
                    Assigned Section Supervisor
                  </span>
                  <div className="font-bold text-xs text-[#191c1e]">{viewingHandoverSubmission.assignedSupervisor.name}</div>
                  <div className="text-[11px] text-[#464555]">{viewingHandoverSubmission.assignedSupervisor.phone}</div>
                  <div className="text-[10px] text-[#777587] font-mono">Senior Section Engineer (SSE / {viewingHandoverSubmission.department})</div>
                </div>
              </div>

              {/* Defect Location & Scope */}
              <div className="border border-[#c7c4d8] rounded-xl p-4 space-y-3 bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-[#f8f9fa] p-2 rounded-lg border border-[#eceef0]">
                    <span className="text-[10px] text-[#777587] block">Station</span>
                    <span className="font-bold text-[#191c1e]">{viewingHandoverSubmission.location.address}</span>
                  </div>
                  <div className="bg-[#f8f9fa] p-2 rounded-lg border border-[#eceef0]">
                    <span className="text-[10px] text-[#777587] block">Track Section</span>
                    <span className="font-bold text-[#191c1e]">{viewingHandoverSubmission.location.trackSection}</span>
                  </div>
                  <div className="bg-[#f8f9fa] p-2 rounded-lg border border-[#eceef0]">
                    <span className="text-[10px] text-[#777587] block">Line & Km Post</span>
                    <span className="font-bold text-[#191c1e]">
                      {viewingHandoverSubmission.location.lineType} • {viewingHandoverSubmission.location.nearestKmPost}
                    </span>
                  </div>
                  <div className="bg-[#f8f9fa] p-2 rounded-lg border border-[#eceef0]">
                    <span className="text-[10px] text-[#777587] block">Est. Fix Time</span>
                    <span className="font-bold text-[#191c1e]">{viewingHandoverSubmission.estimatedFixTimeMinutes} Mins</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#777587] uppercase font-mono">
                    Defect Description
                  </span>
                  <p className="p-3 bg-[#f8f9fa] rounded-lg border border-[#eceef0] text-xs text-[#191c1e] leading-relaxed">
                    {viewingHandoverSubmission.description}
                  </p>
                </div>

                {/* Media gallery */}
                {viewingHandoverSubmission.media && viewingHandoverSubmission.media.length > 0 && (
                  <div className="pt-2">
                    <ComplaintMediaGallery
                      media={viewingHandoverSubmission.media}
                      ticketNo={viewingHandoverSubmission.ticketNo}
                      station={viewingHandoverSubmission.location.address}
                      title="Uploaded Field Photographs & Evidence"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-[#f8f9fa] border-t border-[#eceef0] flex items-center justify-between">
              <span className="text-[10px] text-[#777587] font-mono">
                Logged Date: {viewingHandoverSubmission.createdAt}
              </span>
              <button
                type="button"
                onClick={() => setViewingHandoverSubmission(null)}
                className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] cursor-pointer transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
