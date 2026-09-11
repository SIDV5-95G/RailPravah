// Bilingual English and Hindi (Devanagari script) localization for RailPravah Worker Portal

export type WorkerLanguage = "en" | "hi";

export interface WorkerStationOption {
  nameEn: string;
  nameHi: string;
  code: string;
  km: string;
  lat: number;
  lng: number;
}

export const CENTRAL_LINE_STATIONS: WorkerStationOption[] = [
  { nameEn: "CSMT – Byculla", nameHi: "छ.शि.म.ट. – भायखला", code: "CSTM-BY", km: "Km 4.2", lat: 18.9402, lng: 72.8356 },
  { nameEn: "Byculla – Dadar", nameHi: "भायखला – दादर", code: "BY-DR", km: "Km 8.6", lat: 18.9754, lng: 72.8312 },
  { nameEn: "Dadar – Matunga", nameHi: "दादर – माटुंगा", code: "DR-MT", km: "Km 10.8", lat: 19.0178, lng: 72.8478 },
  { nameEn: "Kurla – Vidyavihar", nameHi: "कुर्ला – विद्याविहार", code: "CLA-VVH", km: "Km 15.4", lat: 19.0657, lng: 72.8794 },
  { nameEn: "Ghatkopar – Vikhroli", nameHi: "घाटकोपर – विक्रोली", code: "GC-VK", km: "Km 18.6", lat: 19.0865, lng: 72.9082 },
  { nameEn: "Bhandup – Mulund", nameHi: "भांडुप – मुलुंड", code: "BND-MLND", km: "Km 27.2", lat: 19.1432, lng: 72.9378 },
  { nameEn: "Thane – Kalva", nameHi: "ठाणे – कलवा", code: "TNA-KLV", km: "Km 34.0", lat: 19.1860, lng: 72.9759 },
  { nameEn: "Diva – Kalyan", nameHi: "दिवा – कल्याण", code: "DIVA-KYN", km: "Km 53.8", lat: 19.2437, lng: 73.1355 },
];

export const WORKER_TEXTS = {
  en: {
    // Top banner
    dashboardTitle: "Worker Dashboard",
    divisionBadge: "MUMBAI CENTRAL DIVISION",
    terminalOnline: "FIELD TERMINAL ONLINE",
    loggedInAs: "Logged in as",
    emergencySos: "Emergency SOS",
    // Tabs
    tabReport: "Report Issue Form",
    tabMyIssues: "My Complaints",
    tabComplaintStatus: "Complaint Status & Tracking",
    badgeStatusMonitor: "Status Monitor",
    tabCalendar: "My Schedule & Calendar",
    tabContacts: "Contacts",
    // Protocol notice
    protocolTitle: "Strict Supervisor Routing Protocol:",
    protocolDesc:
      "Workers and Group Workers submit defect observations exclusively to their Section Supervisor. Central Office Operations (COA) is not contacted directly by field workers. The designated Section Supervisor will review the defect, deploy groups, and decide whether a formal COA block or caution order is warranted.",
    // Ticket success
    ticketSuccessTitle: "Issue Ticket Successfully Dispatched to Supervisor",
    ticketSuccessDesc: "Transmitted live strictly to",
    ticketInspectionAction: "for Supervisor Technical Inspection & Action. (Not forwarded to COA)",
    // Form header
    formTitle: "Field Track & Infrastructure Issue Report",
    supervisorDispatchOnly: "Supervisor Dispatch Only",
    formSubtitle:
      "Log maintenance defects with instant GPS tagging, direct section supervisor routing, voice dictation, and media evidence.",
    // Section 1: Location
    sec1Title: "1. Location Tagging (GPS & Track Section)",
    acquiringGps: "Acquiring GPS...",
    fetchGps: "Fetch Current GPS Location",
    mapPinDrop: "Map Pin-Drop",
    trackLandmark: "Track Landmark:",
    landmarkPlaceholder: "e.g. Dadar - Matunga Junction Track Section",
    gpsLocked: "GPS Locked",
    latitude: "Latitude:",
    longitude: "Longitude:",
    trackLine: "Track Line:",
    kmPostMast: "KM / Mast Post:",
    // Track line options
    lineDownFast: "Down Fast",
    lineUpFast: "Up Fast",
    lineDownSlow: "Down Slow",
    lineUpSlow: "Up Slow",
    lineYardSiding: "Yard / Siding",
    // Section 2: Department
    sec2Title: "2. Department",
    selectCategory: "Select category",
    deptTrack: "Track (Permanent Way, Rails, Sleepers & Points)",
    deptElectrical: "Electrical (OHE 25kV Catenary, Power & Substation)",
    deptSignal: "Signal (Interlocking, Track Circuits & Axle Counters)",
    deptOther: "Other (Yard, Station Operations & Safety Clearance)",
    // Section 4: Estimated time
    sec4Title: "4. Estimated Time to Fix (Minutes)",
    hrs: "hrs",
    mins: "mins",
    min: "min",
    // Supervisor Card
    assignedSup: "Assigned Supervisor",
    deptWord: "Dept",
    activeOnField: "Active on Field",
    // Section 3: Description & Voice
    sec3Title: "3. Issue Description (Text + Voice Dictation)",
    listeningStop: "Listening... (Tap to Stop)",
    dictateVoice: "Dictate with Voice (Speech-to-Text)",
    micActiveMsg: "Microphone Active: Speak clearly. Transcribing speech into description...",
    descPlaceholder:
      "Describe the defect in detail (e.g. Broken fishplate bolts on Down Slow curve #4, loose catenary dropper sparking near Mast 14/22, point machine detection contact failure)...",
    clearDesc: "Clear description",
    quickTags: "Quick Tags:",
    tag1: "Railhead Hairline Fracture",
    tag2: "Loose Fishplate & Sheared Bolts",
    tag3: "OHE Catenary Dropper Sparking",
    tag4: "Point Machine Detection Fail",
    tag5: "Track Ballast Washout",
    tag6: "Axle Counter Intermittent Drop",
    // Section 5: Media Evidence
    sec5Title: "5. Media Evidence Upload (Photos & Short Video Clips)",
    addSamplePhoto: "+ Add Sample Photo",
    addSampleVideo: "+ Add Sample Video",
    dropzoneTitle: "Click to Browse or Drag & Drop Photos / Short Videos",
    dropzoneSubtitle: "Accepts JPEG, PNG, WEBP images & MP4, MOV, WEBM video clips (Max 50MB)",
    videoClip: "Video Clip",
    removeFile: "Remove file",
    // Submit area
    transmittingAs: "Transmitting as:",
    directDispatchTo: "Direct dispatch strictly to Section Supervisor:",
    transmitBtn: "Transmit Issue Report to Section Supervisor Only",
    // Right sidebar
    directoryTitle: "Central Division Supervisory Directory",
    selected: "SELECTED",
    activeStatus: "● Active",
    guidelinesTitle: "Worker Field Guidelines",
    rule1: "Always stand in the cess or safe refuge when activating the Speech-to-Text microphone.",
    rule2: "Verify the Track Line (Up Fast / Down Slow) before sending the GPS tag.",
    rule3: "Photos with clear scale (e.g. coin or finger next to crack) accelerate block clearance.",
    // Tab 2: My Issues & Complaints
    logTitle: "My Track Complaints & Supervisor Status Tracker",
    logSubtitle:
      "Track lifecycle of complaints submitted by your crew strictly to your section supervisor for inspection and action.",
    reportNewIssueBtn: "+ Report New Complaint",
    estTime: "Est. Time:",
    assignedSupervisorLabel: "Assigned Supervisor:",
    attachedEvidence: "Attached Evidence:",
    noComplaintsLogged: "No complaints logged yet",
    noComplaintsLoggedDesc: "Defect observations or complaints reported to your supervisor will appear here with live progress.",
    // Tab 2.5: Complaint Status & Tracking
    statusMonitorTitle: "Complaint Status & Live Tracking Monitor",
    liveStatusSync: "Live Status Sync",
    metricTotalComplaints: "Total Complaints",
    metricUnderReview: "Under Supervisor Review",
    metricPendingBlock: "Pending Block Clearance",
    metricResolvedSignedOff: "Resolved & Signed Off",
    hierarchyPathwayTitle: "Hierarchy Approval & Resolution Pathway",
    step1FieldReport: "1. Field Report",
    step1SubmittedWorker: "Submitted by Worker",
    step2SupervisorReview: "2. Supervisor Review",
    step2VerifiedSse: "Verified by SSE",
    step2InTechReview: "In Technical Review",
    step3ZonalCte: "3. Zonal Head / CTE",
    step3PossessionApproved: "Possession Approved",
    step3CorridorClearance: "Corridor Clearance",
    step4ResolutionSignoff: "4. Resolution Sign-off",
    step4SignedOffClosed: "Signed Off & Closed",
    step4AwaitingSignoff: "Awaiting Final Sign-off",
    callSupervisorBtn: "Call Supervisor",
    loggedLabel: "Logged:",
    // Modals
    mapModalTitle: "Mumbai Central Line Map Pin-Drop",
    mapModalSubtitle: "Tap on any track point along the Central Line schematic to set the defect location:",
    csmtTerminus: "CSMT TERMINUS (KM 0.0)",
    kalyanJunction: "KALYAN JUNCTION (KM 54.0)",
    closeBtn: "Close",
    videoEvidenceTitle: "Video Evidence Playback",
    videoEvidenceFormat: "Format: MP4 / 1080p Field Capture",
    closePreviewBtn: "Close Preview",
    sosTitle: "EMERGENCY TRACK HAZARD ALERT",
    sosDesc:
      "Activating Red Flag SOS immediately alerts the Section Controller (DRM Mumbai) and approaching train drivers to halt traffic on current track section.",
    sosSuccess: "✓ SOS BROADCAST TRANSMITTED TO CSMT CONTROL ROOM & NEAREST STATIONS (DR, CLA, GC).",
    cancelBtn: "Cancel",
    confirmSosBtn: "Confirm Red Flag SOS",
    dismissBtn: "Dismiss",
    // Alerts
    alertEnterDesc: "Please provide an issue description (type or use voice mic).",
    alertGeoNotSupported: "Geolocation is not supported by your browser.",
    alertValidMedia: "Please upload only image or short video files (e.g. JPG, PNG, MP4, MOV).",
  },
  hi: {
    // Top banner
    dashboardTitle: "कर्मचारी डैशबोर्ड",
    divisionBadge: "मुंबई मध्य मंडल",
    terminalOnline: "फील्ड टर्मिनल सक्रिय",
    loggedInAs: "लॉग इन:",
    emergencySos: "आपातकालीन एसओएस (SOS)",
    // Tabs
    tabReport: "समस्या रिपोर्ट फॉर्म",
    tabMyIssues: "मेरी शिकायतें",
    tabComplaintStatus: "शिकायत स्थिति एवं ट्रैकिंग",
    badgeStatusMonitor: "स्थिति मॉनिटर",
    tabCalendar: "मेरी कार्य सूची एवं कैलेंडर",
    tabContacts: "पर्यवेक्षी संपर्क",
    // Protocol notice
    protocolTitle: "सख्त पर्यवेक्षक रूटिंग प्रोटोकॉल:",
    protocolDesc:
      "फील्ड अनुरक्षक और गैंग कर्मचारी ट्रैक व अवसंरचना दोषों की सूचना विशेष रूप से अपने अनुभाग पर्यवेक्षक (SSE) को भेजते हैं। केंद्रीय परिचालन प्राधिकरण (COA) से सीधे संपर्क नहीं किया जाता। नामित अनुभाग पर्यवेक्षक दोष की समीक्षा करेंगे, गैंग तैनात करेंगे और आवश्यकतानुसार ब्लॉक या कॉशन ऑर्डर की मांग करेंगे।",
    // Ticket success
    ticketSuccessTitle: "समस्या टिकट सफलतापूर्वक अनुभाग पर्यवेक्षक को प्रेषित",
    ticketSuccessDesc: "तकनीकी निरीक्षण और त्वरित कार्रवाई हेतु सीधे",
    ticketInspectionAction: "को प्रेषित किया गया। (COA को नहीं भेजा गया)",
    // Form header
    formTitle: "फील्ड ट्रैक एवं अवसंरचना समस्या रिपोर्ट",
    supervisorDispatchOnly: "केवल पर्यवेक्षक प्रेषण",
    formSubtitle:
      "त्वरित जीपीएस टैगिंग, सीधे अनुभाग पर्यवेक्षक रूटिंग, आवाज द्वारा बोलकर विवरण (वॉइस डिक्टेशन), और मीडिया साक्ष्य के साथ ट्रैक दोष दर्ज करें।",
    // Section 1: Location
    sec1Title: "१. स्थान टैगिंग (जीपीएस एवं ट्रैक सेक्शन)",
    acquiringGps: "जीपीएस खोज रहे हैं...",
    fetchGps: "वर्तमान जीपीएस स्थान प्राप्त करें",
    mapPinDrop: "नक्शे पर पिन लगाएं",
    trackLandmark: "ट्रैक लैंडमार्क:",
    landmarkPlaceholder: "उदा. दादर - माटुंगा जंक्शन ट्रैक सेक्शन",
    gpsLocked: "जीपीएस लॉक",
    latitude: "अक्षांश (Lat):",
    longitude: "देशांतर (Lng):",
    trackLine: "ट्रैक लाइन:",
    kmPostMast: "कि.मी. / मस्तूल खंभा:",
    // Track line options
    lineDownFast: "डाउन फास्ट (Down Fast)",
    lineUpFast: "अप फास्ट (Up Fast)",
    lineDownSlow: "डाउन स्लो (Down Slow)",
    lineUpSlow: "अप स्लो (Up Slow)",
    lineYardSiding: "यार्ड / साइडिंग (Yard / Siding)",
    // Section 2: Department
    sec2Title: "२. विभाग चुनें",
    selectCategory: "श्रेणी का चयन करें",
    deptTrack: "ट्रैक (स्थायी मार्ग, रेल, स्लीपर एवं पॉइंट्स)",
    deptElectrical: "विद्युत (ओएचई 25kV कैटेनरी, पावर एवं सबस्टेशन)",
    deptSignal: "सिग्नल (इंटरलॉकिंग, ट्रैक सर्किट एवं एक्सल काउंटर)",
    deptOther: "अन्य (यार्ड, स्टेशन संचालन एवं सुरक्षा निकासी)",
    // Section 4: Estimated time
    sec4Title: "४. मरम्मत हेतु अनुमानित समय (मिनट)",
    hrs: "घंटे",
    mins: "मिनट",
    min: "मिनट",
    // Supervisor Card
    assignedSup: "नामित अनुभाग पर्यवेक्षक",
    deptWord: "विभाग",
    activeOnField: "फील्ड पर सक्रिय",
    // Section 3: Description & Voice
    sec3Title: "३. समस्या का विवरण (टाइप करें अथवा बोलकर दर्ज करें)",
    listeningStop: "सुन रहे हैं... (रोकने के लिए टैप करें)",
    dictateVoice: "बोलकर दर्ज करें (वॉइस टू टेक्स्ट)",
    micActiveMsg: "माइक्रोफ़ोन सक्रिय: स्पष्ट बोलें। आपकी आवाज को विवरण में परिवर्तित किया जा रहा है...",
    descPlaceholder:
      "दोष का विस्तृत विवरण दें (जैसे: डाउन स्लो कर्व #4 पर फिशप्लेट बोल्ट टूटना, मस्तूल 14/22 के पास ओएचई कैटेनरी ड्रॉपर से चिंगारी निकलना, पॉइंट मशीन डिटेक्शन खराबी)...",
    clearDesc: "विवरण साफ़ करें",
    quickTags: "त्वरित टैग:",
    tag1: "रेलहेड हेयरलाइन फ्रैक्चर (Railhead Fracture)",
    tag2: "ढीली फिशप्लेट एवं टूटे बोल्ट (Loose Fishplate)",
    tag3: "ओएचई ड्रॉपर स्पार्किंग (OHE Sparking)",
    tag4: "पॉइंट मशीन डिटेक्शन विफलता (Point Machine Fail)",
    tag5: "ट्रैक बैलास्ट बहाव/धंसाव (Ballast Washout)",
    tag6: "एक्सल काउंटर रुक-रुक कर ड्रॉप (Axle Counter Drop)",
    // Section 5: Media Evidence
    sec5Title: "५. मीडिया साक्ष्य अपलोड (फ़ोटो एवं लघु वीडियो क्लिप)",
    addSamplePhoto: "+ नमूना फ़ोटो जोड़ें",
    addSampleVideo: "+ नमूना वीडियो जोड़ें",
    dropzoneTitle: "फ़ोटो या लघु वीडियो चुनने हेतु क्लिक करें अथवा खींचकर लाएं",
    dropzoneSubtitle: "JPEG, PNG, WEBP चित्र एवं MP4, MOV, WEBM वीडियो क्लिप समर्थित (अधिकतम 50MB)",
    videoClip: "वीडियो क्लिप",
    removeFile: "फ़ाइल हटाएं",
    // Submit area
    transmittingAs: "प्रेषक कर्मचारी:",
    directDispatchTo: "सीधा प्रेषण केवल अनुभाग पर्यवेक्षक:",
    transmitBtn: "समस्या रिपोर्ट केवल अनुभाग पर्यवेक्षक को प्रेषित करें",
    // Right sidebar
    directoryTitle: "मध्य मंडल पर्यवेक्षी निर्देशिका",
    selected: "चयनित",
    activeStatus: "● सक्रिय",
    guidelinesTitle: "फील्ड कर्मचारी सुरक्षा दिशानिर्देश",
    rule1: "वॉइस माइक्रोफ़ोन का उपयोग करते समय हमेशा सुरक्षित सेस (cess) या रिफ्यूज में खड़े रहें।",
    rule2: "जीपीएस टैग भेजने से पहले ट्रैक लाइन (अप फास्ट / डाउन स्लो) की पुष्टि अवश्य करें।",
    rule3: "दरार या दोष के पास सिक्का या वस्तु रखकर खींची गई स्पष्ट फ़ोटो से ब्लॉक स्वीकृति शीघ्र मिलती है।",
    // Tab 2: My Issues & Complaints
    logTitle: "मेरी दर्ज ट्रैक शिकायतें एवं पर्यवेक्षक स्थिति",
    logSubtitle:
      "आपकी टीम द्वारा अनुभाग पर्यवेक्षक को प्रेषित शिकायतों की वर्तमान स्थिति और तकनीकी प्रगति देखें।",
    reportNewIssueBtn: "+ नई शिकायत दर्ज करें",
    estTime: "अनुमानित समय:",
    assignedSupervisorLabel: "नामित अनुभाग पर्यवेक्षक:",
    attachedEvidence: "संलग्न साक्ष्य:",
    noComplaintsLogged: "अभी तक कोई शिकायत दर्ज नहीं की गई है",
    noComplaintsLoggedDesc: "पर्यवेक्षक को रिपोर्ट किए गए दोष या शिकायतें यहां लाइव प्रगति के साथ प्रदर्शित होंगी।",
    // Tab 2.5: Complaint Status & Tracking
    statusMonitorTitle: "शिकायत स्थिति एवं लाइव ट्रैकिंग मॉनिटर",
    liveStatusSync: "लाइव स्थिति सिंक",
    metricTotalComplaints: "कुल शिकायतें",
    metricUnderReview: "पर्यवेक्षक समीक्षाधीन",
    metricPendingBlock: "ब्लॉक मंजूरी लंबित",
    metricResolvedSignedOff: "निस्तारित एवं हस्ताक्षरित",
    hierarchyPathwayTitle: "पदानुक्रम अनुमोदन एवं निस्तारण प्रक्रिया",
    step1FieldReport: "१. फील्ड रिपोर्ट",
    step1SubmittedWorker: "कर्मचारी द्वारा प्रेषित",
    step2SupervisorReview: "२. पर्यवेक्षक समीक्षा",
    step2VerifiedSse: "एसएसई द्वारा सत्यापित",
    step2InTechReview: "तकनीकी समीक्षा जारी",
    step3ZonalCte: "३. जोनल प्रमुख / सीटीई",
    step3PossessionApproved: "पजेशन स्वीकृत",
    step3CorridorClearance: "कॉरिडोर क्लीयरेंस",
    step4ResolutionSignoff: "४. निस्तारण समापन",
    step4SignedOffClosed: "स्वीकृत एवं बंद",
    step4AwaitingSignoff: "अंतिम स्वीकृति प्रतीक्षित",
    callSupervisorBtn: "पर्यवेक्षक को कॉल करें",
    loggedLabel: "दर्ज:",
    // Modals
    mapModalTitle: "मुंबई सेंट्रल लाइन नक्शा पिन-ड्रॉप",
    mapModalSubtitle: "दोष स्थान निर्धारित करने के लिए सेंट्रल लाइन रेखाचित्र के किसी भी ट्रैक बिंदु पर टैप करें:",
    csmtTerminus: "छ.शि.म.ट. टर्मिनस (कि.मी. 0.0)",
    kalyanJunction: "कल्याण जंक्शन (कि.मी. 54.0)",
    closeBtn: "बंद करें",
    videoEvidenceTitle: "वीडियो साक्ष्य प्लेबैक",
    videoEvidenceFormat: "प्रारूप: MP4 / 1080p फील्ड रिकॉर्डिंग",
    closePreviewBtn: "पूर्वावलोकन बंद करें",
    sosTitle: "आपातकालीन ट्रैक खतरा चेतावनी (SOS)",
    sosDesc:
      "रेड फ्लैग एसओएस सक्रिय करने से सेक्शन कंट्रोलर (डीआरएम मुंबई) और आ रही ट्रेनों के लोको पायलटों को तुरंत सतर्क कर दिया जाता है ताकि वर्तमान ट्रैक सेक्शन पर यातायात रोका जा सके।",
    sosSuccess: "✓ एसओएस प्रसारण सीएसएमटी कंट्रोल रूम एवं निकटतम स्टेशनों (दादर, कुर्ला, घाटकोपर) को सफलतापूर्वक प्रेषित।",
    cancelBtn: "रद्द करें",
    confirmSosBtn: "रेड फ्लैग एसओएस की पुष्टि करें",
    dismissBtn: "समाप्त करें",
    // Alerts
    alertEnterDesc: "कृपया समस्या का विवरण दर्ज करें (टाइप करें या वॉइस माइक का उपयोग करें)।",
    alertGeoNotSupported: "आपके ब्राउज़र द्वारा जियोलोकेशन समर्थित नहीं है।",
    alertValidMedia: "कृपया केवल चित्र या लघु वीडियो फ़ाइलें अपलोड करें (उदा. JPG, PNG, MP4, MOV)।",
  },
};

export const getLocalizedStatus = (status: string, lang: WorkerLanguage): string => {
  if (lang === "en") return status;
  switch (status) {
    case "Reported to Supervisor":
      return "पर्यवेक्षक को प्रेषित (Reported)";
    case "Under Review":
      return "समीक्षाधीन (Under Review)";
    case "Action Plan Created":
      return "कार्य योजना तैयार (Action Plan)";
    case "Block Requested":
      return "ब्लॉक अनुरोधित (Block Requested)";
    case "In-Progress":
      return "प्रगति पर (In-Progress)";
    case "Resolved":
    case "Completed":
      return "निस्तारित (Resolved)";
    case "Pending Approval":
      return "स्वीकृति लंबित (Pending Approval)";
    case "Assigned":
      return "कार्य आवंटित (Assigned)";
    case "Pending Inspection":
      return "निरीक्षण लंबित (Pending Inspection)";
    case "Escalated to Zonal":
      return "जोनल को अग्रेषित (Escalated to Zonal)";
    case "Sanctioned by COA":
      return "COA द्वारा स्वीकृत (Sanctioned by COA)";
    case "Rejected":
      return "अस्वीकृत (Rejected)";
    case "Scheduled":
      return "शेड्यूल किया गया (Scheduled)";
    default:
      return status;
  }
};

export const getLocalizedDept = (dept: string, lang: WorkerLanguage): string => {
  if (lang === "en") return dept;
  switch (dept) {
    case "Track":
      return "ट्रैक (स्थायी मार्ग)";
    case "Electrical":
      return "विद्युत (TRD/OHE)";
    case "Signal":
      return "सिग्नल (S&T)";
    case "Other":
      return "अन्य विभाग";
    default:
      return dept;
  }
};

export const FALLBACK_VOICE_PHRASES: Record<WorkerLanguage, string[]> = {
  en: [
    "Track ballast washed out near Kurla Down Fast line after heavy rain. Fishplate bolt shearing observed.",
    "OHE cantilever insulator flashed over at Mast 12/18. Sparks visible during local EMU train passing.",
    "Point Machine 104A track circuit indicator showing continuous red indication at Dadar North crossover.",
  ],
  hi: [
    "कुर्ला डाउन फास्ट लाइन पर भारी बारिश के बाद ट्रैक बैलास्ट बह गया है। फिशप्लेट बोल्ट टूटे हुए दिखाई दे रहे हैं।",
    "मस्तूल 12/18 पर ओएचई कैंटिलीवर इंसुलेटर फ्लैश ओवर हो गया। लोकल ट्रेन गुजरते समय चिंगारी देखी गई।",
    "दादर उत्तर क्रॉसओवर पर पॉइंट मशीन 104A ट्रैक सर्किट लगातार लाल संकेत दिखा रहा है।",
  ],
};

export interface StationPin {
  name: string;
  code: string;
  km: string;
  lat: number;
  lng: number;
}

export const MUMBAI_CENTRAL_STATIONS: Record<WorkerLanguage, StationPin[]> = {
  en: [
    { name: "CSTM – Byculla", code: "CSTM-BY", km: "Km 4.2", lat: 18.9402, lng: 72.8356 },
    { name: "Byculla – Dadar", code: "BY-DR", km: "Km 8.6", lat: 18.9754, lng: 72.8312 },
    { name: "Dadar – Matunga", code: "DR-MT", km: "Km 10.8", lat: 19.0178, lng: 72.8478 },
    { name: "Kurla – Vidyavihar", code: "CLA-VVH", km: "Km 15.4", lat: 19.0657, lng: 72.8794 },
    { name: "Ghatkopar – Vikhroli", code: "GC-VK", km: "Km 18.6", lat: 19.0865, lng: 72.9082 },
    { name: "Bhandup – Mulund", code: "BND-MLND", km: "Km 27.2", lat: 19.1432, lng: 72.9378 },
    { name: "Thane – Kalva", code: "TNA-KLV", km: "Km 34.0", lat: 19.1860, lng: 72.9759 },
    { name: "Diva – Kalyan", code: "DIVA-KYN", km: "Km 53.8", lat: 19.2437, lng: 73.1355 },
  ],
  hi: [
    { name: "सीएसटीएम – भायखला", code: "CSTM-BY", km: "कि.मी. 4.2", lat: 18.9402, lng: 72.8356 },
    { name: "भायखला – दादर", code: "BY-DR", km: "कि.मी. 8.6", lat: 18.9754, lng: 72.8312 },
    { name: "दादर – माटुंगा", code: "DR-MT", km: "कि.मी. 10.8", lat: 19.0178, lng: 72.8478 },
    { name: "कुर्ला – विद्याविहार", code: "CLA-VVH", km: "कि.मी. 15.4", lat: 19.0657, lng: 72.8794 },
    { name: "घाटकोपर – विक्रोली", code: "GC-VK", km: "कि.मी. 18.6", lat: 19.0865, lng: 72.9082 },
    { name: "भांडुप – मुलुंड", code: "BND-MLND", km: "कि.मी. 27.2", lat: 19.1432, lng: 72.9378 },
    { name: "ठाणे – कलवा", code: "TNA-KLV", km: "कि.मी. 34.0", lat: 19.1860, lng: 72.9759 },
    { name: "दिवा – कल्याण", code: "DIVA-KYN", km: "कि.मी. 53.8", lat: 19.2437, lng: 73.1355 },
  ],
};
