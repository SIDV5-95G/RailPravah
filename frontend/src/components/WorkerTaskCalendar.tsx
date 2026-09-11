import React, { useState, useMemo } from "react";
import { UserProfile, CalendarBlock } from "../types";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  UserCheck,
  Phone,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Wrench,
  Compass,
  FileText,
  Printer,
  X,
  Languages,
  Check,
  Navigation as NavIcon,
  Info,
  Flame,
  Radio,
  ExternalLink,
  ArrowLeft,
  CalendarDays,
  ListOrdered,
} from "lucide-react";

export type LanguageType = "en" | "hi";

export interface MaintenanceTaskScheduleItem {
  id: string;
  blockCode: string;
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // e.g. "01:30 - 04:30 AM"
  shiftTypeEn: string;
  shiftTypeHi: string;
  departmentEn: string;
  departmentHi: string;
  departmentCode: "Track" | "TRD" | "S&T" | "General";
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  locationEn: {
    sectionName: string;
    lineType: string;
    kmPost: string;
    nearestStation: string;
    depot: string;
    accessGate: string;
    lat: number;
    lng: number;
  };
  locationHi: {
    sectionName: string;
    lineType: string;
    kmPost: string;
    nearestStation: string;
    depot: string;
    accessGate: string;
    lat: number;
    lng: number;
  };
  supervisorEn: {
    name: string;
    designation: string;
    phone: string;
    depot: string;
  };
  supervisorHi: {
    name: string;
    designation: string;
    phone: string;
    depot: string;
  };
  gangEn: {
    gangNo: string;
    maintainersCount: number;
    machineOperators: number;
    lookoutMen: number;
  };
  gangHi: {
    gangNo: string;
    maintainersCount: number;
    machineOperators: number;
    lookoutMen: number;
  };
  status: "In-Progress" | "Sanctioned" | "Upcoming" | "Completed";
  statusTextEn: string;
  statusTextHi: string;
  cautionOrderEn?: string;
  cautionOrderHi?: string;
  powerCutRequired: boolean;
  powerStatusEn?: string;
  powerStatusHi?: string;
  toolsEn: string[];
  toolsHi: string[];
  safetyBriefEn: string[];
  safetyBriefHi: string[];
}

export const INITIAL_MAINTENANCE_SCHEDULE: MaintenanceTaskScheduleItem[] = [];

interface WorkerTaskCalendarProps {
  user: UserProfile;
  language?: LanguageType;
  onLanguageChange?: (lang: LanguageType) => void;
  calendarBlocks?: CalendarBlock[];
}

export const WorkerTaskCalendar: React.FC<WorkerTaskCalendarProps> = ({
  user,
  language,
  onLanguageChange,
  calendarBlocks,
}) => {
  // Language Selection: 'en' for English, 'hi' for Hindi
  const [lang, setLang] = useState<LanguageType>(language || "en");

  // Synchronize when external language prop changes
  React.useEffect(() => {
    if (language && language !== lang) {
      setLang(language);
    }
  }, [language]);

  const handleSetLang = (newLang: LanguageType) => {
    setLang(newLang);
    onLanguageChange?.(newLang);
  };

  // View mode toggle: "month" for full interactive month grid (as in COA), "day" for detailed daily timeline
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "day">("month");

  // Selected date (Defaults to Today: "2026-09-02")
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-02");

  // Calendar Month Navigation (Current display month / year)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-indexed)

  // Selected Task Filter (All, Today, Upcoming, Completed)
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Active Task Card Expand / Select
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  // Duty Pass Modal State
  const [isDutySlipModalOpen, setIsDutySlipModalOpen] = useState<boolean>(false);
  const [isPassPrinted, setIsPassPrinted] = useState<boolean>(false);
  const [acknowledgedTasks, setAcknowledgedTasks] = useState<{ [id: string]: boolean }>({});
  const [arrivedTasks, setArrivedTasks] = useState<{ [id: string]: boolean }>({});

  // Safety Checklist Interactive State
  const [checkedSafetyItems, setCheckedSafetyItems] = useState<{ [key: string]: boolean }>({});

  // Tools Checklist Interactive State
  const [checkedToolItems, setCheckedToolItems] = useState<{ [key: string]: boolean }>({});

  // English & Hindi localized dictionaries
  const t = {
    en: {
      screenTitle: "Worker Maintenance Schedule & Daily Work Slots",
      screenSubtitle:
        "Field crew shift roster, exact track GPS locations, sanctioned time windows, and safety instructions for Mumbai Central Line.",
      langLabel: "Language / भाषा:",
      viewRoster: "View Crew Roster",
      todayBtn: "Today",
      dutyPassBtn: "View Official Duty Pass",
      monthViewTab: "Month View (माह दृश्य)",
      dayTimelineTab: "Day Timeline (दैनिक समयरेखा)",
      backToMonthBtn: "← Back to Month Calendar",
      openDayTimelineBtn: "Open Full Day Timeline & Work Order",
      selectedDateWorksHeading: "Scheduled Maintenance Work on Selected Date",
      deptFilter: "Filter Department:",
      allDepts: "All Departments",
      trackDept: "Track Engineering",
      trdDept: "TRD Electrical",
      stDept: "Signal & Telecom",
      allStatus: "All Status",
      upcoming: "Upcoming",
      inProgress: "In-Progress",
      completed: "Completed",
      dailyScheduleTitle: "Daily Schedule & Shift Work Slots",
      forDate: "For Date:",
      noTasksForDay: "No maintenance shifts scheduled for this date.",
      selectAnotherDate: "Select another highlighted date on the calendar to view assignments.",
      slotTimeLabel: "Work Window / Time Slot",
      locationHeading: "Location & Track Infrastructure Details",
      section: "Section / Corridor:",
      line: "Track Line Type:",
      kmPost: "KM Post & Mast:",
      station: "Nearest Station:",
      depot: "Assigned Depot:",
      accessGate: "Site Access Gate:",
      gpsCoords: "GPS Coordinates:",
      openInMap: "View Track Schematic",
      supervisorHeading: "Supervisor & Group Assignment",
      supervisorInCharge: "Section Supervisor in Charge:",
      callSupervisor: "Call Supervisor",
      gangAssigned: "Assigned Crew:",
      crewCount: "Workers",
      operatorsCount: "Machine Operators",
      lookoutCount: "Safety Lookout Men",
      safetyHeading: "Safety Protocols & Caution Orders",
      powerCutStatus: "25kV AC Power Status:",
      powerRequired: "OHE Power Cut Required",
      noPowerCut: "No OHE Power Cut (Track Live)",
      cautionNotice: "Active Caution Order / Speed Restriction:",
      requiredTools: "Assigned Tools & Equipment Roster",
      safetyBriefing: "Mandatory Safety Protocols (Check before start)",
      acknowledgeShift: "Acknowledge Shift",
      acknowledged: "Shift Acknowledged",
      markArrival: "Report On-Site Arrival",
      arrivalReported: "Arrival Logged (GPS Verified)",
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      daysFull: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      liveShift: "LIVE SHIFT ACTIVE",
      dutySlipTitle: "CENTRAL RAILWAY - MUMBAI DIVISION",
      dutySlipSubtitle: "DAILY FIELD MAINTENANCE DUTY PASS & PERMIT TO WORK",
      crewLeader: "Crew Leader / Group:",
      issuedBy: "Sanctioned by:",
      printPass: "Print Duty Pass",
      closePass: "Close Pass",
    },
    hi: {
      screenTitle: "कर्मचारी रखरखाव अनुसूची एवं दैनिक कार्य स्लॉट",
      screenSubtitle:
        "मुंबई सेंट्रल लाइन हेतु फील्ड क्रू शिफ्ट रोस्टर, सटीक ट्रैक जीपीएस स्थान, स्वीकृत कार्य समय स्लॉट और सुरक्षा दिशानिर्देश।",
      langLabel: "भाषा / Language:",
      viewRoster: "क्रू रोस्टर देखें",
      todayBtn: "आज (Today)",
      dutyPassBtn: "आधिकारिक ड्यूटी पास देखें",
      monthViewTab: "माह दृश्य (कैलेंडर)",
      dayTimelineTab: "दैनिक समयरेखा",
      backToMonthBtn: "← वापस माह कैलेंडर पर जाएं",
      openDayTimelineBtn: "दैनिक समयरेखा एवं विस्तृत कार्य आदेश खोलें",
      selectedDateWorksHeading: "चयनित तिथि के निर्धारित रखरखाव कार्य",
      deptFilter: "विभाग चुनें:",
      allDepts: "सभी विभाग (All)",
      trackDept: "ट्रैक इंजीनियरिंग",
      trdDept: "टीआरडी विद्युत (TRD)",
      stDept: "सिग्नल एवं दूरसंचार",
      allStatus: "सभी स्थिति",
      upcoming: "आगामी",
      inProgress: "प्रगति पर",
      completed: "संपन्न",
      dailyScheduleTitle: "दैनिक कार्य अनुसूची एवं शिफ्ट स्लॉट",
      forDate: "तारीख के लिए:",
      noTasksForDay: "इस तिथि के लिए कोई रखरखाव शिफ्ट निर्धारित नहीं है।",
      selectAnotherDate: "कार्य देखने के लिए कैलेंडर पर हाइलाइट की गई अन्य तिथि चुनें।",
      slotTimeLabel: "कार्य समय अवधि / स्लॉट",
      locationHeading: "स्थान एवं ट्रैक संरचना विवरण",
      section: "सेक्शन / कॉरिडोर:",
      line: "ट्रैक लाइन प्रकार:",
      kmPost: "कि.मी. पोस्ट एवं मस्तूल:",
      station: "निकटतम स्टेशन:",
      depot: "आवंटित डिपो:",
      accessGate: "साइट प्रवेश द्वार:",
      gpsCoords: "जीपीएस निर्देशांक:",
      openInMap: "ट्रैक मानचित्र देखें",
      supervisorHeading: "पर्यवेक्षक एवं ग्रुप विवरण",
      supervisorInCharge: "प्रभारी अनुभाग पर्यवेक्षक:",
      callSupervisor: "पर्यवेक्षक को कॉल करें",
      gangAssigned: "आवंटित कार्यदल:",
      crewCount: "फील्ड ट्रैक मेंटेनर",
      operatorsCount: "मशीन ऑपरेटर",
      lookoutCount: "सुरक्षा लुकआउट मैन",
      safetyHeading: "सुरक्षा नियम एवं कॉशन ऑर्डर",
      powerCutStatus: "25kV एसी विद्युत आपूर्ति स्थिति:",
      powerRequired: "ओएचई पावर कट आवश्यक",
      noPowerCut: "पावर कट नहीं (ट्रैक चालू)",
      cautionNotice: "लागू कॉशन ऑर्डर / गति प्रतिबंध:",
      requiredTools: "आवंटित औज़ार एवं उपकरण सूची",
      safetyBriefing: "अनिवार्य सुरक्षा नियम (शुरू करने से पहले जांचें)",
      acknowledgeShift: "ड्यूटी स्वीकार करें",
      acknowledged: "ड्यूटी स्वीकृत ✓",
      markArrival: "साइट पर आगमन दर्ज करें",
      arrivalReported: "साइट आगमन दर्ज (GPS सत्यापित) ✓",
      months: [
        "जनवरी",
        "फ़रवरी",
        "मार्च",
        "अप्रैल",
        "मई",
        "जून",
        "जुलाई",
        "अगस्त",
        "सितंबर",
        "अक्टूबर",
        "नवंबर",
        "दिसंबर",
      ],
      daysShort: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
      daysFull: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
      liveShift: "सक्रिय शिफ्ट (LIVE)",
      dutySlipTitle: "मध्य रेल - मुंबई मंडल (CENTRAL RAILWAY)",
      dutySlipSubtitle: "दैनिक फील्ड रखरखाव ड्यूटी पास एवं कार्य अनुमति पत्र",
      crewLeader: "दल प्रमुख / गैंग:",
      issuedBy: "स्वीकृति अधिकारी:",
      printPass: "ड्यूटी पास प्रिंट करें",
      closePass: "बंद करें",
    },
  };

  const currentT = t[lang];

  // Merge INITIAL_MAINTENANCE_SCHEDULE with any passed calendarBlocks for rich multi-day schedule
  const allScheduleItems = useMemo<MaintenanceTaskScheduleItem[]>(() => {
    const existingIds = new Set(INITIAL_MAINTENANCE_SCHEDULE.map((s) => s.id));
    const merged: MaintenanceTaskScheduleItem[] = [...INITIAL_MAINTENANCE_SCHEDULE];

    if (calendarBlocks && calendarBlocks.length > 0) {
      calendarBlocks.forEach((b) => {
        if (!existingIds.has(b.id)) {
          const deptLower = (b.department || "").toLowerCase();
          let deptCode: "Track" | "TRD" | "S&T" | "General" = "General";
          if (deptLower.includes("track") || deptLower.includes("engineering")) deptCode = "Track";
          else if (deptLower.includes("traction") || deptLower.includes("trd") || deptLower.includes("electrical")) deptCode = "TRD";
          else if (deptLower.includes("signal") || deptLower.includes("telecom") || deptLower.includes("s&t")) deptCode = "S&T";

          const isEmergency = b.priority === "Emergency" || b.status === "emergency";
          const statusVal: "In-Progress" | "Sanctioned" | "Upcoming" | "Completed" =
            isEmergency ? "In-Progress" :
            b.status === "approved" ? "Sanctioned" :
            b.status === "pending" ? "Upcoming" : "Sanctioned";

          merged.push({
            id: b.id,
            blockCode: b.clusterId ? `BLK-CR-${b.clusterId}` : `BLK-CR-SANCTIONED-${b.id}`,
            date: b.date,
            timeSlot: `${b.startTime} - ${b.endTime}`,
            shiftTypeEn: `${b.department} Maintenance Window (${b.startTime} - ${b.endTime})`,
            shiftTypeHi: `${b.department} रखरखाव कार्य समय (${b.startTime} - ${b.endTime})`,
            departmentEn: b.department,
            departmentHi: b.department,
            departmentCode: deptCode,
            titleEn: b.title,
            titleHi: b.title,
            descriptionEn: b.description || "Sanctioned Central Railway corridor maintenance block.",
            descriptionHi: b.description || "मध्य रेल स्वीकृत कॉरिडोर रखरखाव ब्लॉक।",
            locationEn: {
              sectionName: b.station,
              lineType: "Sanctioned Corridor Line",
              kmPost: "Designated Block Section Limits",
              nearestStation: b.station.split("–")[0].trim() || b.station,
              depot: "Central Railway Division Depot",
              accessGate: "Section Gate #1",
              lat: 19.076,
              lng: 72.8777,
            },
            locationHi: {
              sectionName: b.station,
              lineType: "स्वीकृत कॉरिडोर लाइन",
              kmPost: "निर्धारित ब्लॉक सीमा",
              nearestStation: b.station.split("–")[0].trim() || b.station,
              depot: "मध्य रेल मंडल डिपो",
              accessGate: "सेक्शन गेट #1",
              lat: 19.076,
              lng: 72.8777,
            },
            supervisorEn: {
              name: "Central Railway SSE Duty Controller",
              designation: "Senior Section Engineer (Central Division)",
              phone: "+91 97692 31100",
              depot: "Mumbai CSMT Operations Control",
            },
            supervisorHi: {
              name: "मध्य रेल एसएसई ड्यूटी नियंत्रक",
              designation: "वरिष्ठ खंड अभियंता (मुंबई मंडल)",
              phone: "+91 97692 31100",
              depot: "मुंबई सीएसएमटी परिचालन नियंत्रण",
            },
            gangEn: {
              gangNo: `Group #${b.clusterId || "12"} (${deptCode})`,
              maintainersCount: 6,
              machineOperators: 1,
              lookoutMen: 2,
            },
            gangHi: {
              gangNo: `ग्रुप #${b.clusterId || "12"} (${deptCode})`,
              maintainersCount: 6,
              machineOperators: 1,
              lookoutMen: 2,
            },
            status: statusVal,
            statusTextEn: isEmergency ? "Emergency Block Priority" : "Sanctioned Division Block",
            statusTextHi: isEmergency ? "आपातकालीन ब्लॉक प्राथमिकता" : "स्वीकृत मंडल ब्लॉक",
            cautionOrderEn: b.trainsAffected && b.trainsAffected > 0 ? `Speed restriction 30 km/h applied (${b.trainsAffected} mail/suburban services regulated)` : "Standard track caution advisory active.",
            cautionOrderHi: b.trainsAffected && b.trainsAffected > 0 ? `गति प्रतिबंध 30 किमी/घंटा लागू (${b.trainsAffected} ट्रेनें विनियमित)` : "मानक ट्रैक कॉशन एडवाइजरी सक्रिय।",
            powerCutRequired: deptCode === "TRD" || deptLower.includes("catenary") || deptLower.includes("ohe"),
            powerStatusEn: deptCode === "TRD" || deptLower.includes("ohe") ? "25kV OHE Power Cut Isolated & Earthed" : "Track Live with Lookouts",
            powerStatusHi: deptCode === "TRD" || deptLower.includes("ohe") ? "25kV ओएचई पावर कट आइसोलेटेड व अर्थेड" : "लुकआउट के साथ ट्रैक चालू",
            toolsEn: ["Track Gauges & Spanners", "Safety Caution Red Banners", "Safety Helmets & Torches", "Walkie-Talkie Set"],
            toolsHi: ["ट्रैक गेज एवं स्पैनर", "सुरक्षा कॉशन लाल बैनर", "सुरक्षा हेलमेट एवं टॉर्च", "वॉकी-टॉकी सेट"],
            safetyBriefEn: ["Maintain active whistle contact with lookout man.", "Confirm OHE discharge rod clamping before ladder erection.", "Secure caution flag 500m ahead of work site."],
            safetyBriefHi: ["लुकआउट मैन के साथ निरंतर सीटी संपर्क बनाए रखें।", "सीढ़ी लगाने से पहले ओएचई डिस्चार्ज रॉड क्लैंपिंग की पुष्टि करें।", "कार्य स्थल से 500 मीटर पहले कॉशन झंडा सुरक्षित रूप से लगाएं।"],
          });
        }
      });
    }

    return merged;
  }, [calendarBlocks]);

  // Filter tasks based on selected date & filters
  const tasksForSelectedDate = useMemo(() => {
    return allScheduleItems.filter((task) => {
      const matchDate = task.date === selectedDate;
      const matchDept = departmentFilter === "ALL" || task.departmentCode === departmentFilter;
      const matchStatus = statusFilter === "ALL" || task.status === statusFilter;
      return matchDate && matchDept && matchStatus;
    });
  }, [allScheduleItems, selectedDate, departmentFilter, statusFilter]);

  // Selected task object for deep inspector
  const activeTask =
    tasksForSelectedDate.find((t) => t.id === selectedTaskId) ||
    tasksForSelectedDate[0] ||
    allScheduleItems.find((t) => t.id === selectedTaskId) ||
    allScheduleItems[0];

  // Helper: Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper: Get first day of week in month (0 = Sun, 1 = Mon)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8); // September 2026
    setSelectedDate("2026-09-02");
    setSelectedTaskId("task-001");
  };

  // Get tasks for any date string with active filters applied
  const getTasksForDateString = (dateStr: string) => {
    return allScheduleItems.filter((t) => {
      if (t.date !== dateStr) return false;
      if (departmentFilter !== "ALL" && t.departmentCode !== departmentFilter) return false;
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      return true;
    });
  };

  // Format date helper
  const formatSelectedDateHeading = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = currentT.daysFull[dateObj.getDay()];
    const monthName = currentT.months[m - 1];
    return `${dayName}, ${d} ${monthName} ${y}`;
  };

  // Quick 7-day strip centered around Today / Selected Date
  const quickDays = useMemo(() => {
    const list = [
      { date: "2026-09-01", dayNum: "01", dayNameEn: "Tue", dayNameHi: "मंगल" },
      { date: "2026-09-02", dayNum: "02", dayNameEn: "Wed", dayNameHi: "बुध", isToday: true },
      { date: "2026-09-03", dayNum: "03", dayNameEn: "Thu", dayNameHi: "गुरु" },
      { date: "2026-09-04", dayNum: "04", dayNameEn: "Fri", dayNameHi: "शुक्र" },
      { date: "2026-09-05", dayNum: "05", dayNameEn: "Sat", dayNameHi: "शनि" },
      { date: "2026-09-06", dayNum: "06", dayNameEn: "Sun", dayNameHi: "रवि" },
      { date: "2026-09-07", dayNum: "07", dayNameEn: "Mon", dayNameHi: "सोम" },
    ];
    return list.map((item) => ({
      ...item,
      tasks: allScheduleItems.filter((t) => t.date === item.date).length,
    }));
  }, [allScheduleItems]);

  return (
    <div id="worker-task-calendar-container" className="space-y-6">
      {/* Top Banner: Bilingual Toggle & Header */}
      <div className="bg-white border border-[#c7c4d8] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#3525cd]/10 border border-[#3525cd]/20 flex items-center justify-center text-[#3525cd] shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[#191c1e] tracking-tight">
                {currentT.screenTitle}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#e2dfff] text-[#3525cd]">
                GROUP #12 ROSTER
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: View Switcher, English / Hindi Switcher & Duty Pass Button */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {/* Calendar View Mode Switcher: Month View vs Day Timeline */}
          <div className="flex items-center bg-[#f2f4f6] p-1 rounded-xl border border-[#c7c4d8]/60 shadow-2xs">
            <button
              id="worker-cal-month-view-btn"
              type="button"
              onClick={() => setCalendarViewMode("month")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                calendarViewMode === "month"
                  ? "bg-[#3525cd] text-white shadow-xs"
                  : "text-[#464555] hover:text-[#191c1e] hover:bg-white/60"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{currentT.monthViewTab}</span>
            </button>
            <button
              id="worker-cal-day-view-btn"
              type="button"
              onClick={() => setCalendarViewMode("day")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                calendarViewMode === "day"
                  ? "bg-[#3525cd] text-white shadow-xs"
                  : "text-[#464555] hover:text-[#191c1e] hover:bg-white/60"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{currentT.dayTimelineTab}</span>
            </button>
          </div>

          {/* Dual Language Switcher */}
          <div className="flex items-center bg-[#f2f4f6] p-1 rounded-xl border border-[#c7c4d8]/60 shadow-2xs">
            <span className="text-[11px] font-bold text-[#777587] px-2 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-[#3525cd]" />
              <span className="hidden sm:inline">{currentT.langLabel}</span>
            </span>
            <button
              id="lang-toggle-en-btn"
              type="button"
              onClick={() => handleSetLang("en")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                lang === "en"
                  ? "bg-[#3525cd] text-white shadow-xs"
                  : "text-[#464555] hover:text-[#191c1e] hover:bg-white/60"
              }`}
            >
              English
            </button>
            <button
              id="lang-toggle-hi-btn"
              type="button"
              onClick={() => handleSetLang("hi")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                lang === "hi"
                  ? "bg-[#3525cd] text-white shadow-xs"
                  : "text-[#464555] hover:text-[#191c1e] hover:bg-white/60"
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>

          {/* Quick Official Duty Pass Button */}
          <button
            id="open-duty-pass-modal-btn"
            type="button"
            onClick={() => setIsDutySlipModalOpen(true)}
            className="px-3.5 py-2 bg-[#191c1e] hover:bg-[#2d2f39] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#ffdcc3]" />
            <span>{currentT.dutyPassBtn}</span>
          </button>
        </div>
      </div>

      {/* Quick 7-Day Week Strip for 1-Click Navigation */}
      <div className="bg-white border border-[#c7c4d8] rounded-xl p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-[#3525cd]" />
            <span>
              {lang === "hi" ? "त्वरित कार्य दिवस चयन" : "Quick Day Shift Selector"}
            </span>
          </span>
          <button
            type="button"
            onClick={handleJumpToToday}
            className="text-xs text-[#3525cd] hover:underline font-bold font-mono cursor-pointer"
          >
            ★ {currentT.todayBtn} (02 Sep 2026)
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {quickDays.map((d) => {
            const isSelected = selectedDate === d.date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  setSelectedDate(d.date);
                  const firstTask = allScheduleItems.find((t) => t.date === d.date);
                  if (firstTask) setSelectedTaskId(firstTask.id);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-[#3525cd] text-white border-[#3525cd] shadow-sm"
                    : d.isToday
                    ? "bg-[#e2dfff]/40 border-[#3525cd]/50 text-[#191c1e] hover:border-[#3525cd]"
                    : "bg-[#f7f9fb] border-[#c7c4d8] text-[#464555] hover:bg-white hover:border-[#3525cd]"
                }`}
              >
                {d.isToday && (
                  <span
                    className={`absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono uppercase ${
                      isSelected ? "bg-[#ffdcc3] text-[#904d00]" : "bg-[#3525cd] text-white"
                    }`}
                  >
                    {currentT.todayBtn}
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold block ${
                    isSelected ? "text-white/80" : "text-[#777587]"
                  }`}
                >
                  {lang === "hi" ? d.dayNameHi : d.dayNameEn}
                </span>
                <span className="text-base font-bold block mt-0.5">{d.dayNum} Sep</span>
                <span
                  className={`text-[10px] font-mono mt-1 inline-block px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : d.tasks > 0
                      ? "bg-[#10b981]/15 text-[#047857]"
                      : "bg-[#eceef0] text-[#777587]"
                  }`}
                >
                  {d.tasks > 0
                    ? `${d.tasks} ${lang === "hi" ? "ब्लॉक" : "Shifts"}`
                    : lang === "hi"
                    ? "विश्राम"
                    : "Off"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: FULL MONTH CALENDAR VIEW (WORK SHOWN DIRECTLY ON CALENDAR AS IN COA) */}
      {calendarViewMode === "month" && (
        <div id="worker-month-calendar-view" className="space-y-6">
          {/* Month Calendar Full-Width Container */}
          <div className="bg-white border border-[#c7c4d8] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            {/* Top Toolbar: Month & Year Navigator, Jump to Today, Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eceef0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3525cd]/10 border border-[#3525cd]/20 flex items-center justify-center text-[#3525cd]">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#191c1e] flex items-center gap-2">
                    <span>
                      {currentT.months[currentMonth]} {currentYear}
                    </span>
                    <span className="text-xs font-mono font-bold bg-[#e2dfff] text-[#3525cd] px-2 py-0.5 rounded-md">
                      {lang === "hi" ? "कार्य अनुसूची ग्रिड" : "Maintenance Work Grid"}
                    </span>
                  </h3>
                  <p className="text-xs text-[#777587]">
                    {lang === "hi"
                      ? "कैलेंडर पर प्रत्येक कार्य ब्लॉक सीधे प्रदर्शित है। विस्तृत विवरण के लिए किसी भी कार्य या तिथि पर क्लिक करें।"
                      : "Scheduled work slots displayed directly on each calendar date cell. Click any work or date to inspect."}
                  </p>
                </div>
              </div>

              {/* Month Navigation Buttons & Today Jump */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 text-[#464555] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-xl border border-[#c7c4d8]/60 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang === "hi" ? "पिछला माह" : "Prev"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-3 py-2 text-xs font-bold text-[#3525cd] bg-[#e2dfff] hover:bg-[#d0cbff] rounded-xl font-mono transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>★ {currentT.todayBtn}</span>
                  <span className="hidden sm:inline">(02 Sep 2026)</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 text-[#464555] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-xl border border-[#c7c4d8]/60 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Next Month"
                >
                  <span className="hidden sm:inline">{lang === "hi" ? "अगला माह" : "Next"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Bar: Department Filter & Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc] border border-[#eceef0] p-3 rounded-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#191c1e] flex items-center gap-1 font-mono">
                  <Layers className="w-3.5 h-3.5 text-[#3525cd]" />
                  <span>{currentT.deptFilter}</span>
                </span>
                {[
                  { id: "ALL", labelEn: "All Depts", labelHi: "सभी विभाग" },
                  { id: "Track", labelEn: "Track / P-Way", labelHi: "ट्रैक / पी-वे" },
                  { id: "TRD", labelEn: "TRD Electrical", labelHi: "टीआरडी विद्युत" },
                  { id: "S&T", labelEn: "Signal & Telecom", labelHi: "सिग्नल एवं दूर" },
                ].map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setDepartmentFilter(dept.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      departmentFilter === dept.id
                        ? "bg-[#3525cd] text-white shadow-2xs"
                        : "bg-white text-[#464555] hover:bg-[#e2dfff]/40 border border-[#c7c4d8]/50"
                    }`}
                  >
                    {lang === "hi" ? dept.labelHi : dept.labelEn}
                  </button>
                ))}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: "ALL", labelEn: "All Status", labelHi: "सभी स्थिति" },
                  { id: "In-Progress", labelEn: "Live Active", labelHi: "सक्रिय कार्य" },
                  { id: "Sanctioned", labelEn: "Sanctioned", labelHi: "स्वीकृत" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      statusFilter === st.id
                        ? "bg-[#191c1e] text-white shadow-2xs"
                        : "bg-white text-[#777587] hover:bg-[#eceef0] border border-[#c7c4d8]/50"
                    }`}
                  >
                    {lang === "hi" ? st.labelHi : st.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Days of Week Header (Sun to Sat in English & Hindi) */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#777587] uppercase font-mono pb-1 border-b border-[#eceef0]">
              {currentT.daysShort.map((day, idx) => (
                <div key={idx} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Month Calendar Grid: SHOWING WORK DIRECTLY ON EACH CALENDAR CELL (AS IN COA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {/* Empty leading offset cells */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[110px] md:min-h-[130px] rounded-xl bg-[#f8fafc]/40 border border-dashed border-[#eceef0] hidden lg:block"
                />
              ))}

              {/* Active Day Cells with Scheduled Work Shown on Calendar */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNumber = idx + 1;
                const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(
                  dayNumber
                ).padStart(2, "0")}`;
                const isSelected = selectedDate === formattedDate;
                const isToday = formattedDate === "2026-09-02";
                const dayTasks = getTasksForDateString(formattedDate);
                const hasTasks = dayTasks.length > 0;

                return (
                  <div
                    key={formattedDate}
                    onClick={() => {
                      setSelectedDate(formattedDate);
                      if (dayTasks.length > 0) {
                        setSelectedTaskId(dayTasks[0].id);
                      }
                    }}
                    className={`min-h-[115px] md:min-h-[130px] p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-[#f5f3ff] border-[#3525cd] ring-2 ring-[#3525cd]/40 shadow-sm"
                        : isToday
                        ? "bg-[#e2dfff]/25 border-[#3525cd]/60 text-[#191c1e]"
                        : hasTasks
                        ? "bg-white border-[#c7c4d8] hover:border-[#3525cd]/70 hover:shadow-2xs"
                        : "bg-[#fcfdfd] border-[#eceef0] opacity-85 hover:opacity-100"
                    }`}
                  >
                    {/* Top Row: Date Number and Scheduled Work Count */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-bold font-mono px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? "bg-[#3525cd] text-white"
                            : isToday
                            ? "bg-[#3525cd]/20 text-[#3525cd]"
                            : "text-[#191c1e]"
                        }`}
                      >
                        {String(dayNumber).padStart(2, "0")}
                      </span>

                      {hasTasks && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? "bg-[#3525cd]/20 text-[#3525cd]"
                              : "bg-[#10b981]/15 text-[#047857]"
                          }`}
                        >
                          {dayTasks.length} {lang === "hi" ? "कार्य" : "works"}
                        </span>
                      )}
                    </div>

                    {/* Scheduled Work Items Rendered Directly on Calendar Cell */}
                    <div className="space-y-1.5 my-1.5 overflow-hidden">
                      {hasTasks ? (
                        dayTasks.slice(0, 2).map((task) => {
                          const isLive = task.status === "In-Progress";
                          const isTrack = task.departmentCode === "Track";
                          const isTrd = task.departmentCode === "TRD";
                          const isTaskActive = activeTask.id === task.id;

                          return (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(formattedDate);
                                setSelectedTaskId(task.id);
                              }}
                              className={`p-1.5 rounded-lg text-[10px] font-semibold transition-all border text-left cursor-pointer ${
                                isTaskActive
                                  ? "bg-[#3525cd] text-white border-[#3525cd] shadow-xs"
                                  : isLive
                                  ? "bg-[#dcfce7] text-[#166534] border-[#166534]/30 animate-pulse"
                                  : isTrack
                                  ? "bg-[#e2dfff] text-[#3525cd] border-[#3525cd]/25 hover:bg-[#d0cbff]"
                                  : isTrd
                                  ? "bg-[#ffdcc3] text-[#904d00] border-[#904d00]/25 hover:bg-[#fed1af]"
                                  : "bg-[#e0f2fe] text-[#0369a1] border-[#0284c7]/25 hover:bg-[#bae6fd]"
                              }`}
                              title={`${task.timeSlot} — ${lang === "hi" ? task.titleHi : task.titleEn}`}
                            >
                              <div className="flex items-center justify-between gap-1 leading-none mb-0.5">
                                <span className="font-mono font-bold text-[9px] opacity-90">
                                  {task.timeSlot.split(" - ")[0]}
                                </span>
                                <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-black/10">
                                  {task.departmentCode}
                                </span>
                              </div>
                              <div className="truncate font-medium leading-tight text-[10px]">
                                {lang === "hi" ? task.titleHi : task.titleEn}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-2 text-center text-[10px] font-mono text-[#c7c4d8]">
                          {lang === "hi" ? "कोई कार्य नहीं" : "No Block"}
                        </div>
                      )}

                      {dayTasks.length > 2 && (
                        <div className="text-[9px] font-mono text-[#777587] font-bold px-1 text-center bg-[#f2f4f6] rounded py-0.5">
                          +{dayTasks.length - 2} {lang === "hi" ? "और कार्य..." : "more works..."}
                        </div>
                      )}
                    </div>

                    {/* Footer: Station / Corridor Location Tag */}
                    <div className="text-[9px] font-mono text-[#777587] truncate border-t border-[#eceef0]/60 pt-0.5">
                      {hasTasks
                        ? lang === "hi"
                          ? dayTasks[0].locationHi.nearestStation
                          : dayTasks[0].locationEn.nearestStation
                        : "—"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend Bar */}
            <div className="pt-3 border-t border-[#eceef0] flex items-center justify-between flex-wrap gap-3 text-xs font-mono text-[#464555]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10b981] animate-pulse"></span>
                <span>{lang === "hi" ? "सक्रिय कार्य (Live Active)" : "Live Active Shift"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#e2dfff] border border-[#3525cd]/40"></span>
                <span>{lang === "hi" ? "ट्रैक इंजीनियरिंग (Track)" : "Track / P-Way Block"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#ffdcc3] border border-[#904d00]/40"></span>
                <span>{lang === "hi" ? "टीआरडी विद्युत (TRD Catenary)" : "TRD Electrical 25kV"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#e0f2fe] border border-[#0284c7]/40"></span>
                <span>{lang === "hi" ? "सिग्नल एवं दूर (S&T)" : "Signal & Telecom"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#3525cd]"></span>
                <span>{lang === "hi" ? "चयनित कार्य (Selected)" : "Selected Shift"}</span>
              </div>
            </div>
          </div>

          {/* Selected Date Maintenance Work Summary & Quick Action Card (Below Month Grid) */}
          <div className="bg-white border border-[#c7c4d8] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#eceef0] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3525cd] block">
                  {lang === "hi" ? "चयनित कार्य दिवस विवरण" : "SELECTED DATE WORK DETAILS"}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-[#191c1e] mt-0.5">
                  {formatSelectedDateHeading(selectedDate)}
                </h4>
                <p className="text-xs text-[#777587]">
                  {tasksForSelectedDate.length > 0
                    ? `${tasksForSelectedDate.length} ${
                        lang === "hi"
                          ? "रखरखाव कार्य/ब्लॉक निर्धारित हैं"
                          : "sanctioned maintenance shift(s) scheduled for this date"
                      }`
                    : currentT.noTasksForDay}
                </p>
              </div>

              {tasksForSelectedDate.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCalendarViewMode("day")}
                  className="px-4 py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentT.openDayTimelineBtn}</span>
                </button>
              )}
            </div>

            {/* List of Tasks for Selected Date */}
            {tasksForSelectedDate.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-[#f8fafc] rounded-xl border border-dashed border-[#c7c4d8]">
                <div className="w-10 h-10 rounded-full bg-[#e2dfff] text-[#3525cd] flex items-center justify-center mx-auto">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-bold text-[#191c1e]">{currentT.noTasksForDay}</h5>
                <p className="text-xs text-[#777587] max-w-md mx-auto">{currentT.selectAnotherDate}</p>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-3.5 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] cursor-pointer"
                >
                  {lang === "hi" ? "आज की अनुसूची देखें (02 Sep)" : "View Today's Shifts (02 Sep)"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasksForSelectedDate.map((task) => {
                  const isTaskActive = activeTask.id === task.id;
                  const isLive = task.status === "In-Progress";

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border-2 transition-all space-y-3 ${
                        isTaskActive
                          ? "border-[#3525cd] bg-[#f8f9fe] shadow-2xs"
                          : "border-[#c7c4d8] bg-white hover:border-[#3525cd]/50"
                      }`}
                    >
                      {/* Card Header with Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-[#3525cd] text-white px-2 py-0.5 rounded-md">
                              {task.blockCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                task.departmentCode === "Track"
                                  ? "bg-[#e2dfff] text-[#3525cd]"
                                  : task.departmentCode === "TRD"
                                  ? "bg-[#ffdcc3] text-[#904d00]"
                                  : "bg-[#e0f2fe] text-[#0369a1]"
                              }`}
                            >
                              {lang === "hi" ? task.departmentHi : task.departmentEn}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isLive
                                  ? "bg-[#dcfce7] text-[#166534] animate-pulse"
                                  : task.status === "Completed"
                                  ? "bg-[#f2f4f6] text-[#464555]"
                                  : "bg-[#fef9c3] text-[#a16207]"
                              }`}
                            >
                              {lang === "hi" ? task.statusTextHi : task.statusTextEn}
                            </span>
                          </div>

                          <h5 className="text-sm font-bold text-[#191c1e] mt-1.5">
                            {lang === "hi" ? task.titleHi : task.titleEn}
                          </h5>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-xs font-bold text-[#3525cd] bg-[#e2dfff]/50 px-2 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{task.timeSlot}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-[#464555] line-clamp-2">
                        {lang === "hi" ? task.descriptionHi : task.descriptionEn}
                      </p>

                      {/* Location & Supervisor Summary */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-[#eceef0]">
                        <div>
                          <span className="text-[#777587] block font-mono">
                            {lang === "hi" ? "स्थान / स्टेशन:" : "Section & Station:"}
                          </span>
                          <span className="font-bold text-[#191c1e]">
                            {lang === "hi"
                              ? task.locationHi.nearestStation
                              : task.locationEn.nearestStation}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#777587] block font-mono">
                            {lang === "hi" ? "प्रभारी पर्यवेक्षक:" : "Supervisor:"}
                          </span>
                          <span className="font-bold text-[#191c1e]">
                            {lang === "hi" ? task.supervisorHi.name : task.supervisorEn.name}
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#eceef0]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            setCalendarViewMode("day");
                          }}
                          className="text-xs font-bold text-[#3525cd] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "hi" ? "दैनिक समयरेखा खोलें →" : "Open Day Timeline →"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            setIsDutySlipModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-[#191c1e] bg-[#f2f4f6] hover:bg-[#e2dfff]/50 rounded-lg flex items-center gap-1 cursor-pointer font-mono"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#3525cd]" />
                          <span>{lang === "hi" ? "ड्यूटी पास" : "Duty Pass"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DETAILED DAY TIMELINE & WORK ORDER INSPECTOR (MATCHES COA DAY TIMELINE) */}
      {calendarViewMode === "day" && (
        <div id="worker-day-timeline-view" className="space-y-6">
          {/* Day View Top Header & Return to Month View Button */}
          <div className="bg-white border border-[#c7c4d8] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCalendarViewMode("month")}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#3525cd] bg-[#e2dfff] hover:bg-[#d0cbff] rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{currentT.backToMonthBtn}</span>
              </button>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777587] block">
                  {lang === "hi" ? "दैनिक कार्य समयरेखा दृश्य" : "DAILY TIMELINE & WORK ORDER VIEW"}
                </span>
                <h3 className="text-base font-bold text-[#191c1e]">
                  {formatSelectedDateHeading(selectedDate)}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-[#f2f4f6] text-[#464555] px-2.5 py-1 rounded-lg border border-[#c7c4d8]/50">
                {tasksForSelectedDate.length} {lang === "hi" ? "कार्य निर्धारित" : "tasks scheduled"}
              </span>
            </div>
          </div>

          {/* Main 2-Column Layout: Left = Interactive Month Calendar, Right = Daily Schedule & Work Slot Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Interactive Calendar Grid & Filter Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Month Calendar Card */}
          <div className="bg-white border border-[#c7c4d8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            {/* Month Header with Prev/Next Controls */}
            <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#3525cd]" />
                <h3 className="text-base font-bold text-[#191c1e]">
                  {currentT.months[currentMonth]} {currentYear}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 text-[#464555] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-lg transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 text-xs font-bold text-[#3525cd] bg-[#e2dfff] hover:bg-[#d0cbff] rounded-lg font-mono transition-colors cursor-pointer"
                >
                  {currentT.todayBtn}
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 text-[#464555] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-lg transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#777587] uppercase font-mono pb-1">
              {currentT.daysShort.map((day, idx) => (
                <div key={idx} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {/* Empty leading offset cells */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-11 sm:h-12 rounded-lg bg-transparent"></div>
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNumber = idx + 1;
                const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(
                  dayNumber
                ).padStart(2, "0")}`;
                const isSelected = selectedDate === formattedDate;
                const isToday = formattedDate === "2026-09-02";
                const dayTasks = getTasksForDateString(formattedDate);
                const hasTasks = dayTasks.length > 0;

                return (
                  <button
                    key={formattedDate}
                    type="button"
                    onClick={() => {
                      setSelectedDate(formattedDate);
                      if (dayTasks.length > 0) {
                        setSelectedTaskId(dayTasks[0].id);
                      }
                    }}
                    className={`h-11 sm:h-12 p-1 rounded-xl flex flex-col items-center justify-between border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-[#3525cd] text-white border-[#3525cd] shadow-md font-bold"
                        : isToday
                        ? "bg-[#e2dfff]/50 text-[#191c1e] border-[#3525cd] font-bold"
                        : hasTasks
                        ? "bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#191c1e] border-[#c7c4d8]/80 font-semibold"
                        : "bg-white text-[#777587] hover:bg-[#f7f9fb] border-transparent"
                    }`}
                  >
                    <span className="text-xs leading-none mt-0.5">{dayNumber}</span>
                    {hasTasks && (
                      <div className="flex items-center gap-0.5 mb-0.5">
                        {dayTasks.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? "bg-[#ffdcc3]"
                                : t.status === "In-Progress"
                                ? "bg-[#10b981] animate-pulse"
                                : t.departmentCode === "Track"
                                ? "bg-[#3525cd]"
                                : t.departmentCode === "TRD"
                                ? "bg-[#904d00]"
                                : "bg-[#6366f1]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="pt-3 border-t border-[#eceef0] flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-[#464555]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                <span>{lang === "hi" ? "सक्रिय कार्य" : "Live Active"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3525cd]"></span>
                <span>{lang === "hi" ? "ट्रैक ब्लॉक" : "Track Block"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#904d00]"></span>
                <span>{lang === "hi" ? "टीआरडी विद्युत" : "TRD Power"}</span>
              </div>
            </div>
          </div>

          {/* Department Filter Card */}
          <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#3525cd]" />
                <span>{currentT.deptFilter}</span>
              </span>
              <span className="text-[11px] font-mono text-[#777587]">
                {tasksForSelectedDate.length} {lang === "hi" ? "कार्य मिले" : "tasks on date"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "ALL", labelEn: "All Depts", labelHi: "सभी विभाग" },
                { id: "Track", labelEn: "Track / P-Way", labelHi: "ट्रैक / पी-वे" },
                { id: "TRD", labelEn: "TRD Electrical", labelHi: "टीआरडी विद्युत" },
                { id: "S&T", labelEn: "Signal & Telecom", labelHi: "सिग्नल एवं दूर" },
              ].map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setDepartmentFilter(dept.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                    departmentFilter === dept.id
                      ? "bg-[#3525cd] text-white shadow-2xs"
                      : "bg-[#f2f4f6] text-[#464555] hover:bg-[#e6e8ea]"
                  }`}
                >
                  <span>{lang === "hi" ? dept.labelHi : dept.labelEn}</span>
                  {departmentFilter === dept.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Daily Schedule, Time Slots, & Deep Location Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Header of Selected Day */}
          <div className="bg-gradient-to-r from-[#191c1e] to-[#2d2f39] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffdcc3] block">
                {currentT.forDate}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {formatSelectedDateHeading(selectedDate)}
              </h3>
              <p className="text-xs text-white/70 mt-0.5">
                {tasksForSelectedDate.length > 0
                  ? `${tasksForSelectedDate.length} ${
                      lang === "hi"
                        ? "रखरखाव कार्य/ब्लॉक निर्धारित हैं"
                        : "sanctioned maintenance shift(s) scheduled"
                    }`
                  : currentT.noTasksForDay}
              </p>
            </div>

            {tasksForSelectedDate.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#ffdcc3] text-[#904d00]">
                  GROUP #12
                </span>
              </div>
            )}
          </div>

          {/* List of Shifts for the Day */}
          {tasksForSelectedDate.length === 0 ? (
            <div className="bg-white border border-[#c7c4d8] rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f2f4f6] text-[#777587] flex items-center justify-center mx-auto">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#191c1e]">{currentT.noTasksForDay}</h4>
              <p className="text-xs text-[#777587] max-w-md mx-auto">{currentT.selectAnotherDate}</p>
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] cursor-pointer"
              >
                {lang === "hi" ? "आज की अनुसूची देखें (02 Sep)" : "View Today's Shifts (02 Sep)"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasksForSelectedDate.map((task) => {
                const isSelected = activeTask.id === task.id;
                const isAcknowledged = acknowledgedTasks[task.id];
                const isArrived = arrivedTasks[task.id];

                return (
                  <div
                    key={task.id}
                    className={`bg-white border-2 rounded-2xl transition-all shadow-xs overflow-hidden ${
                      isSelected
                        ? "border-[#3525cd] ring-2 ring-[#3525cd]/20"
                        : "border-[#c7c4d8] hover:border-[#3525cd]/60"
                    }`}
                  >
                    {/* Shift Card Header */}
                    <div
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-4 sm:p-5 bg-gradient-to-b from-[#f8fafc] to-white border-b border-[#eceef0] cursor-pointer"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-[#3525cd] text-white px-2.5 py-0.5 rounded-md">
                              {task.blockCode}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                task.departmentCode === "Track"
                                  ? "bg-[#e2dfff] text-[#3525cd]"
                                  : task.departmentCode === "TRD"
                                  ? "bg-[#ffdcc3] text-[#904d00]"
                                  : "bg-[#dcfce7] text-[#166534]"
                              }`}
                            >
                              {lang === "hi" ? task.departmentHi : task.departmentEn}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                task.status === "In-Progress"
                                  ? "bg-[#dcfce7] text-[#166534] animate-pulse"
                                  : task.status === "Completed"
                                  ? "bg-[#f2f4f6] text-[#464555]"
                                  : "bg-[#fef9c3] text-[#a16207]"
                              }`}
                            >
                              {lang === "hi" ? task.statusTextHi : task.statusTextEn}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-[#191c1e] mt-2">
                            {lang === "hi" ? task.titleHi : task.titleEn}
                          </h4>
                          <p className="text-xs text-[#464555] mt-1">
                            {lang === "hi" ? task.descriptionHi : task.descriptionEn}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs font-bold text-[#3525cd] bg-[#e2dfff]/40 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{task.timeSlot}</span>
                          </div>
                          <span className="text-[11px] font-mono text-[#777587] block mt-1">
                            {lang === "hi" ? task.shiftTypeHi : task.shiftTypeEn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deep Inspector: Location & Coordinates, Supervisor, Caution Order, Tools & Safety */}
                    <div className="p-4 sm:p-5 space-y-5">
                      {/* 1. EXACT LOCATION OF WORK TIME SLOT */}
                      <div className="bg-[#f7f9fb] border border-[#c7c4d8] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#eceef0] pb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#ba1a1a]" />
                            <h5 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider font-mono">
                              {currentT.locationHeading}
                            </h5>
                          </div>
                          <span className="text-[11px] font-mono text-[#3525cd] font-bold">
                            {task.locationEn.nearestStation}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <span className="text-[11px] text-[#777587] block">{currentT.section}</span>
                            <span className="font-bold text-[#191c1e] block">
                              {lang === "hi"
                                ? task.locationHi.sectionName
                                : task.locationEn.sectionName}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] text-[#777587] block">{currentT.line}</span>
                            <span className="font-bold text-[#3525cd] block">
                              {lang === "hi" ? task.locationHi.lineType : task.locationEn.lineType}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] text-[#777587] block">{currentT.kmPost}</span>
                            <span className="font-mono font-semibold text-[#191c1e] block">
                              {lang === "hi" ? task.locationHi.kmPost : task.locationEn.kmPost}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] text-[#777587] block">{currentT.accessGate}</span>
                            <span className="font-semibold text-[#191c1e] block">
                              {lang === "hi" ? task.locationHi.accessGate : task.locationEn.accessGate}
                            </span>
                          </div>
                        </div>

                        {/* GPS Coordinates Bar */}
                        <div className="bg-white p-2.5 rounded-lg border border-[#c7c4d8]/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2 font-mono text-[#464555]">
                            <Compass className="w-3.5 h-3.5 text-[#3525cd]" />
                            <span>
                              {currentT.gpsCoords} Lat: <strong>{task.locationEn.lat.toFixed(4)}°N</strong>, Lng:{" "}
                              <strong>{task.locationEn.lng.toFixed(4)}°E</strong>
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-[#dcfce7] text-[#166534] text-[10px] font-mono font-bold rounded">
                            GPS SATELLITE LOCK ACTIVE
                          </span>
                        </div>
                      </div>

                      {/* 2. SUPERVISOR & CREW DETAILS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Supervisor Card */}
                        <div className="bg-[#f7f9fb] border border-[#c7c4d8] rounded-xl p-3.5 space-y-2 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#777587] font-mono block">
                            {currentT.supervisorInCharge}
                          </span>
                          <div className="flex items-center justify-between">
                            <div>
                              <strong className="text-[#191c1e] block text-sm">
                                {lang === "hi" ? task.supervisorHi.name : task.supervisorEn.name}
                              </strong>
                              <span className="text-[11px] text-[#464555] block">
                                {lang === "hi"
                                  ? task.supervisorHi.designation
                                  : task.supervisorEn.designation}
                              </span>
                            </div>
                            <a
                              href={`tel:${task.supervisorEn.phone}`}
                              className="px-2.5 py-1.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-2xs"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{currentT.callSupervisor}</span>
                            </a>
                          </div>
                        </div>

                        {/* Group Allocation Card */}
                        <div className="bg-[#f7f9fb] border border-[#c7c4d8] rounded-xl p-3.5 space-y-2 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#777587] font-mono block">
                            {currentT.gangAssigned}
                          </span>
                          <strong className="text-[#191c1e] block text-sm">
                            {lang === "hi" ? task.gangHi.gangNo : task.gangEn.gangNo}
                          </strong>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-[#464555]">
                            <span>
                              👷 <strong>{task.gangEn.maintainersCount}</strong> {currentT.crewCount}
                            </span>
                            <span>
                              🚜 <strong>{task.gangEn.machineOperators}</strong> {currentT.operatorsCount}
                            </span>
                            <span>
                              🚩 <strong>{task.gangEn.lookoutMen}</strong> {currentT.lookoutCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 3. SAFETY PROTOCOLS, CAUTION ORDER & OHE POWER STATUS */}
                      <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#fef3c7] pb-2">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-[#92400e]" />
                            <h5 className="text-xs font-bold text-[#92400e] uppercase tracking-wider font-mono">
                              {currentT.safetyHeading}
                            </h5>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              task.powerCutRequired
                                ? "bg-[#ffdad6] text-[#ba1a1a]"
                                : "bg-[#dcfce7] text-[#166534]"
                            }`}
                          >
                            {task.powerCutRequired ? currentT.powerRequired : currentT.noPowerCut}
                          </span>
                        </div>

                        {/* Power Status & Caution Order */}
                        <div className="space-y-2 text-xs text-[#92400e]">
                          <p>
                            <strong>{currentT.powerCutStatus}</strong>{" "}
                            {lang === "hi" ? task.powerStatusHi : task.powerStatusEn}
                          </p>
                          <p>
                            <strong>{currentT.cautionNotice}</strong>{" "}
                            {lang === "hi" ? task.cautionOrderHi : task.cautionOrderEn}
                          </p>
                        </div>

                        {/* Checkable Safety Briefing */}
                        <div className="bg-white p-3 rounded-lg border border-[#fef3c7] space-y-2">
                          <span className="text-[11px] font-bold text-[#191c1e] block">
                            {currentT.safetyBriefing}
                          </span>
                          <div className="space-y-1.5">
                            {(lang === "hi" ? task.safetyBriefHi : task.safetyBriefEn).map(
                              (brief, bIdx) => {
                                const key = `${task.id}-${bIdx}`;
                                const isChecked = checkedSafetyItems[key];
                                return (
                                  <label
                                    key={bIdx}
                                    className="flex items-start gap-2 text-xs text-[#464555] cursor-pointer hover:text-[#191c1e]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!!isChecked}
                                      onChange={(e) =>
                                        setCheckedSafetyItems({
                                          ...checkedSafetyItems,
                                          [key]: e.target.checked,
                                        })
                                      }
                                      className="rounded border-[#c7c4d8] text-[#3525cd] mt-0.5 focus:ring-[#3525cd]"
                                    />
                                    <span className={isChecked ? "line-through text-[#777587]" : ""}>
                                      {brief}
                                    </span>
                                  </label>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 4. REQUIRED TOOLS & EQUIPMENT */}
                      <div className="bg-[#f7f9fb] border border-[#c7c4d8] rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-[#3525cd]" />
                          <h5 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider font-mono">
                            {currentT.requiredTools}
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(lang === "hi" ? task.toolsHi : task.toolsEn).map((tool, tIdx) => {
                            const toolKey = `${task.id}-tool-${tIdx}`;
                            const isChecked = checkedToolItems[toolKey];
                            return (
                              <label
                                key={tIdx}
                                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#c7c4d8]/60 text-xs text-[#191c1e] cursor-pointer hover:border-[#3525cd]"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!isChecked}
                                  onChange={(e) =>
                                    setCheckedToolItems({
                                      ...checkedToolItems,
                                      [toolKey]: e.target.checked,
                                    })
                                  }
                                  className="rounded border-[#c7c4d8] text-[#3525cd] focus:ring-[#3525cd]"
                                />
                                <span className={isChecked ? "line-through text-[#777587]" : ""}>
                                  {tool}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Bar: Acknowledge Shift & On-Site Arrival */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#eceef0]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setAcknowledgedTasks({
                                ...acknowledgedTasks,
                                [task.id]: !isAcknowledged,
                              })
                            }
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                              isAcknowledged
                                ? "bg-[#dcfce7] text-[#166534] border border-[#166534]/30"
                                : "bg-[#3525cd] text-white hover:bg-[#4f46e5]"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isAcknowledged ? currentT.acknowledged : currentT.acknowledgeShift}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setArrivedTasks({
                                ...arrivedTasks,
                                [task.id]: !isArrived,
                              })
                            }
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                              isArrived
                                ? "bg-[#e2dfff] text-[#3525cd] border border-[#3525cd]/30"
                                : "bg-[#f2f4f6] text-[#464555] hover:bg-[#e6e8ea] border border-[#c7c4d8]"
                            }`}
                          >
                            <NavIcon className="w-4 h-4 text-[#3525cd]" />
                            <span>
                              {isArrived ? currentT.arrivalReported : currentT.markArrival}
                            </span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            setIsDutySlipModalOpen(true);
                          }}
                          className="px-3.5 py-2 text-xs font-bold text-[#3525cd] hover:bg-[#e2dfff]/40 rounded-xl flex items-center gap-1 cursor-pointer font-mono"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{lang === "hi" ? "ड्यूटी पर्ची देखें" : "View Duty Slip"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* MODAL: OFFICIAL CENTRAL RAILWAY DAILY DUTY PASS (BILINGUAL) */}
      {isDutySlipModalOpen && activeTask && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-[#c7c4d8] space-y-4 animate-scaleUp my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3525cd]" />
                <h3 className="text-base font-bold text-[#191c1e]">
                  {lang === "hi"
                    ? "मध्य रेल दैनिक कार्य एवं ब्लॉक ड्यूटी पास"
                    : "Central Railway Daily Field Duty Pass"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDutySlipModalOpen(false)}
                className="p-1 text-[#777587] hover:text-[#191c1e] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Duty Pass Sheet */}
            <div className="bg-[#fcfdfd] border-2 border-[#191c1e] rounded-xl p-5 space-y-4 font-mono text-xs text-[#191c1e]">
              {/* Header Crest */}
              <div className="text-center border-b-2 border-[#191c1e] pb-3 space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider">{currentT.dutySlipTitle}</h4>
                <p className="text-[11px] font-semibold text-[#464555]">{currentT.dutySlipSubtitle}</p>
                <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-[#3525cd] pt-1">
                  <span>SANCTION PERMIT: {activeTask.blockCode}</span>
                  <span>DATE: {activeTask.date}</span>
                  <span>TIME: {activeTask.timeSlot}</span>
                </div>
              </div>

              {/* Duty Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#777587] uppercase block">
                    {lang === "hi" ? "कार्य का नाम" : "Work Designation"}
                  </span>
                  <strong className="block text-[#191c1e]">
                    {lang === "hi" ? activeTask.titleHi : activeTask.titleEn}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-[#777587] uppercase block">
                    {lang === "hi" ? "ट्रैक सेक्शन एवं लाइन" : "Track Section & Line"}
                  </span>
                  <strong className="block text-[#3525cd]">
                    {lang === "hi"
                      ? `${activeTask.locationHi.sectionName} (${activeTask.locationHi.lineType})`
                      : `${activeTask.locationEn.sectionName} (${activeTask.locationEn.lineType})`}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-[#777587] uppercase block">
                    {lang === "hi" ? "कि.मी. पोस्ट / मस्तूल" : "Kilometer Post / Mast"}
                  </span>
                  <span className="block font-bold">
                    {lang === "hi" ? activeTask.locationHi.kmPost : activeTask.locationEn.kmPost}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#777587] uppercase block">
                    {lang === "hi" ? "कार्यदल / मेंटेनर्स" : "Crew Group / Maintainers"}
                  </span>
                  <span className="block font-bold">
                    {lang === "hi" ? activeTask.gangHi.gangNo : activeTask.gangEn.gangNo} (
                    {activeTask.gangEn.maintainersCount} Maintainers)
                  </span>
                </div>
              </div>

              {/* Safety & OHE Certification */}
              <div className="bg-[#f2f4f6] p-3 rounded-lg border border-[#c7c4d8] space-y-1.5 text-[11px]">
                <span className="font-bold text-[#191c1e] block">
                  {lang === "hi"
                    ? "सुरक्षा एवं ओएचई पावर कट प्रमाणीकरण:"
                    : "Safety & Traction Certification:"}
                </span>
                <p className="text-[#464555]">
                  • 25kV OHE Status:{" "}
                  <strong>
                    {lang === "hi" ? activeTask.powerStatusHi : activeTask.powerStatusEn}
                  </strong>
                </p>
                <p className="text-[#464555]">
                  • Caution Order:{" "}
                  <strong>
                    {lang === "hi" ? activeTask.cautionOrderHi : activeTask.cautionOrderEn}
                  </strong>
                </p>
              </div>

              {/* Signatures Footer */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#c7c4d8] text-center text-[11px]">
                <div className="space-y-1">
                  <div className="h-8 flex items-end justify-center font-serif italic text-xs text-[#3525cd]">
                    {activeTask.supervisorEn.name}
                  </div>
                  <span className="border-t border-[#777587] block pt-1 font-bold">
                    {lang === "hi" ? "अनुभाग पर्यवेक्षक (एसएसई)" : "Section Supervisor (SSE)"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="h-8 flex items-end justify-center font-serif italic text-xs text-[#166534]">
                    {user.name} ({user.empId})
                  </div>
                  <span className="border-t border-[#777587] block pt-1 font-bold">
                    {lang === "hi" ? "ट्रैक मेंटेनर / गैंग लीडर" : "Worker / Crew Lead"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] font-mono text-[#777587]">
                CR-WRK-PASS-{activeTask.blockCode}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDutySlipModalOpen(false)}
                  className="px-4 py-2 bg-[#f2f4f6] text-[#464555] text-xs font-bold rounded-lg hover:bg-[#e6e8ea] cursor-pointer"
                >
                  {currentT.closePass}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPassPrinted(true);
                    setTimeout(() => setIsPassPrinted(false), 4000);
                  }}
                  className="px-4 py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    {isPassPrinted
                      ? lang === "hi"
                        ? "पास प्रिंट भेजा गया ✓"
                        : "Pass Dispatched ✓"
                      : currentT.printPass}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
