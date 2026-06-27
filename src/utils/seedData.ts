import { Issue, UserProfile, AgentLog, Severity, IssueStatus } from '../types';

// Coordinate centers for simulated Indian neighborhoods
export const CITY_CENTERS = {
  Bengaluru: { lat: 12.9345, lng: 77.6265, name: "Koramangala" },
  Mumbai: { lat: 19.0596, lng: 72.8295, name: "Bandra West" },
  Delhi: { lat: 28.5244, lng: 77.2167, name: "Saket" },
  Gurgaon: { lat: 28.4595, lng: 77.0266, name: "Cyber City" },
  Noida: { lat: 28.5355, lng: 77.3910, name: "Sector 18" }
};

// Helpfulness calculation: (verified * 15) + (resolved * 25) + submitted * 10
export const SEED_USERS: UserProfile[] = [
  {
    uid: "user_priya_s",
    displayName: "Priya Sharma",
    photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    email: "priya.sharma@example.com",
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { reportsSubmitted: 14, reportsVerified: 32, issuesResolved: 8, upvotesGiven: 45, helpfulnessScore: 820 },
    points: 845,
    level: "Guardian",
    badges: ["First Report", "On Fire", "Sharpshooter", "Community Pillar", "Pioneer"],
    area: "Koramangala"
  },
  {
    uid: "user_aravind_k",
    displayName: "Aravind Kumar",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    email: "aravind.k@example.com",
    joinedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { reportsSubmitted: 9, reportsVerified: 21, issuesResolved: 4, upvotesGiven: 30, helpfulnessScore: 410 },
    points: 425,
    level: "Investigator",
    badges: ["First Report", "Sharpshooter", "Pioneer"],
    area: "Bandra West"
  },
  {
    uid: "user_rohan_m",
    displayName: "Rohan Mehta",
    photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    email: "rohan.mehta@example.com",
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { reportsSubmitted: 5, reportsVerified: 12, issuesResolved: 2, upvotesGiven: 18, helpfulnessScore: 230 },
    points: 245,
    level: "Reporter",
    badges: ["First Report", "Quick Responder"],
    area: "Saket"
  },
  {
    uid: "user_sneha_r",
    displayName: "Sneha Reddy",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    email: "sneha.r@example.com",
    joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { reportsSubmitted: 3, reportsVerified: 8, issuesResolved: 1, upvotesGiven: 10, helpfulnessScore: 110 },
    points: 120,
    level: "Observer",
    badges: ["First Report"],
    area: "Koramangala"
  },
  {
    uid: "user_amit_p",
    displayName: "Amit Patel",
    photoURL: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    email: "amit.patel@example.com",
    joinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { reportsSubmitted: 1, reportsVerified: 4, issuesResolved: 0, upvotesGiven: 5, helpfulnessScore: 35 },
    points: 45,
    level: "Newcomer",
    badges: ["First Report"],
    area: "Bandra West"
  }
];

export const CATEGORY_ICONS = {
  pothole: "Road",
  water_leakage: "Droplets",
  streetlight: "Lightbulb",
  garbage: "Trash2",
  graffiti: "Paintbrush",
  road_damage: "Construction",
  flooding: "CloudRain",
  encroachment: "ShieldAlert",
  other: "HelpCircle"
};

// Visual placeholder images for categories
const CATEGORY_IMAGES = {
  pothole: [
    "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1599740831119-90610f4384c1?w=800&auto=format&fit=crop&q=80"
  ],
  water_leakage: [
    "https://images.unsplash.com/photo-1542013936693-8848e57423e3?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80"
  ],
  streetlight: [
    "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=800&auto=format&fit=crop&q=80"
  ],
  garbage: [
    "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80"
  ],
  graffiti: [
    "https://images.unsplash.com/photo-1525909002-1b05a040cf42?w=800&auto=format&fit=crop&q=80"
  ],
  road_damage: [
    "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&auto=format&fit=crop&q=80"
  ],
  flooding: [
    "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80"
  ],
  encroachment: [
    "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80"
  ],
  other: [
    "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&auto=format&fit=crop&q=80"
  ]
};

// Realistic street names for our main quadrants
const STREETS = {
  Bengaluru: ["80 Feet Road", "100 Feet Road", "Koramangala 4th Block", "HSR 19th Main", "Indiranagar 12th Main", "ST Bed Area", "Sarjapur Road"],
  Mumbai: ["Carter Road", "Linking Road", "Hill Road", "Juhu Tara Road", "Colaba Causeway", "Pali Hill", "Veer Savarkar Marg"],
  Delhi: ["Saket M-Block", "Vasant Kunj Sector C", "Rajpath Avenue", "Connaught Circle", "Karol Bagh Main Market", "Ring Road Extension"],
  Gurgaon: ["MG Road", "Golf Course Road", "Sohna Road", "NH-48 Service Road", "DLF Phase 4 Main", "Sector 29 Huda Market Road", "Rapid Metro Connector"],
  Noida: ["Film City Road", "Sector 62 IT Corridor", "Greater Noida Expressway", "Sector 18 Atta Market Road", "Kalindi Kunj Main Road", "Sector 15A Flyover", "Amity Road"]
};

// Generates high-fidelity simulated issues
export function generateSeedIssues(): Issue[] {
  const issues: Issue[] = [];
  const now = Date.now();
  
  // A helper to generate coordinates within a small bounding box
  const getOffsetCoordinate = (center: {lat: number, lng: number}, radiusKm = 1.2) => {
    const r = radiusKm / 111.3; // 1 degree is roughly 111.3km
    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);
    return {
      lat: parseFloat((center.lat + x).toFixed(5)),
      lng: parseFloat((center.lng + y).toFixed(5))
    };
  };

  // List of seed configs to populate
  const configs = [
    // BENGALURU
    {
      city: "Bengaluru",
      category: "pothole",
      title: "Deep Pothole at Koramangala 4th Block Crossing",
      desc: "Massive pothole near the intersection of 80 feet road. Vehicles are swerving dangerously into oncoming traffic to avoid it.",
      status: "escalated" as IssueStatus,
      severity: "critical" as Severity,
      severityScore: 9,
      reporter: "user_priya_s",
      daysAgo: 3,
      verifications: ["user_aravind_k", "user_rohan_m", "user_sneha_r", "user_amit_p", "user_test1"],
      upvotes: ["user_aravind_k", "user_sneha_r", "user_amit_p"],
      isChronic: true
    },
    {
      city: "Bengaluru",
      category: "water_leakage",
      title: "Broken Drinking Water Pipeline",
      desc: "Drinking water flowing continuously from a burst pipeline under the pavement. Flooding the local cycling track.",
      status: "in_progress" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 8,
      reporter: "user_sneha_r",
      daysAgo: 2,
      verifications: ["user_priya_s", "user_rohan_m"],
      upvotes: ["user_priya_s"],
      isChronic: false
    },
    {
      city: "Bengaluru",
      category: "streetlight",
      title: "Entire Row of Streetlights Defunct on 100ft Road",
      desc: "More than 8 consecutive poles are completely dark. Makes the stretch unsafe for women and pedestrians at night.",
      status: "verified" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 7,
      reporter: "user_priya_s",
      daysAgo: 1,
      verifications: ["user_aravind_k", "user_rohan_m", "user_sneha_r"],
      upvotes: ["user_aravind_k", "user_sneha_r"],
      isChronic: false
    },
    {
      city: "Bengaluru",
      category: "garbage",
      title: "Illegal Trash Dumping Near Community Park Entrance",
      desc: "Commercial waste and construction debris being dumped openly. Stench is unbearable, attracting dogs and mosquitoes.",
      status: "reported" as IssueStatus,
      severity: "medium" as Severity,
      severityScore: 5,
      reporter: "user_rohan_m",
      daysAgo: 0.1,
      verifications: ["user_sneha_r"],
      upvotes: [],
      isChronic: true
    },
    {
      city: "Bengaluru",
      category: "flooding",
      title: "Waterlogging at ST Bed Area Junction",
      desc: "Even minor rains lead to 2 feet of water clogging because the storm water drain (SWD) is blocked with plastic bottles.",
      status: "resolved" as IssueStatus,
      severity: "critical" as Severity,
      severityScore: 10,
      reporter: "user_priya_s",
      daysAgo: 10,
      verifications: ["user_aravind_k", "user_sneha_r", "user_rohan_m", "user_amit_p"],
      upvotes: ["user_aravind_k", "user_sneha_r"],
      isChronic: true,
      resolvedPhoto: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&auto=format&fit=crop&q=80"
    },
    {
      city: "Bengaluru",
      category: "road_damage",
      title: "Asphalt Cracking on Sarjapur Flyover",
      desc: "Large cracks appearing on the ramp of the flyover. Concrete blocks are chipping off, presenting risk to fast-moving bikes.",
      status: "reported" as IssueStatus,
      severity: "medium" as Severity,
      severityScore: 6,
      reporter: "user_amit_p",
      daysAgo: 1.5,
      verifications: [],
      upvotes: [],
      isChronic: false
    },
    {
      city: "Bengaluru",
      category: "pothole",
      title: "Deep Crater at Jayanagar 4th Block",
      desc: "Massive pothole that was filled last week but reopened after the rain. Severe threat to two-wheelers.",
      status: "resolved" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 8,
      reporter: "user_sneha_r",
      daysAgo: 14,
      verifications: ["user_priya_s", "user_rohan_m"],
      upvotes: ["user_priya_s"],
      isChronic: true,
      resolvedPhoto: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&auto=format&fit=crop&q=80"
    },

    // MUMBAI
    {
      city: "Mumbai",
      category: "garbage",
      title: "Mega Pile of Plastic Waste on Carter Road Beach Promenade",
      desc: "Large volumes of plastic bottles, bags, and industrial trash washed ashore and piled up. Hindering citizens morning walks.",
      status: "escalated" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 8,
      reporter: "user_aravind_k",
      daysAgo: 4,
      verifications: ["user_priya_s", "user_amit_p", "user_rohan_m", "user_test2"],
      upvotes: ["user_priya_s", "user_amit_p"],
      isChronic: true
    },
    {
      city: "Mumbai",
      category: "flooding",
      title: "Severe Waterlogging on Linking Road Underpass",
      desc: "Drainage backflow has flooded the entire underpass under Carter Road link. Auto-rickshaws are stalled inside.",
      status: "in_progress" as IssueStatus,
      severity: "critical" as Severity,
      severityScore: 10,
      reporter: "user_amit_p",
      daysAgo: 0.5,
      verifications: ["user_aravind_k", "user_priya_s", "user_rohan_m"],
      upvotes: ["user_aravind_k", "user_priya_s"],
      isChronic: false
    },
    {
      city: "Mumbai",
      category: "encroachment",
      title: "Sidewalk completely blocked by commercial storage stalls",
      desc: "Local shop owners have extended their metal display counters and wooden crates over the entire public footpath, forcing kids to walk on active roads.",
      status: "verified" as IssueStatus,
      severity: "medium" as Severity,
      severityScore: 6,
      reporter: "user_aravind_k",
      daysAgo: 2,
      verifications: ["user_amit_p", "user_rohan_m"],
      upvotes: ["user_amit_p"],
      isChronic: false
    },
    {
      city: "Mumbai",
      category: "pothole",
      title: "Active Pothole Cluster near Bandra Reclamation",
      desc: "A series of 4 deep pot holes right before the entry to the Sea Link. Causing massive traffic backlogs during rush hours.",
      status: "resolved" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 8,
      reporter: "user_aravind_k",
      daysAgo: 20,
      verifications: ["user_priya_s", "user_sneha_r", "user_amit_p"],
      upvotes: ["user_priya_s"],
      isChronic: true,
      resolvedPhoto: "https://images.unsplash.com/photo-1599740831119-90610f4384c1?w=800&auto=format&fit=crop&q=80"
    },

    // DELHI
    {
      city: "Delhi",
      category: "streetlight",
      title: "Completely Dark Alley behind Saket PVR Complex",
      desc: "Three streetlight poles have been broken for 3 weeks. Very dark corridor, poses a security threat for visitors and retail workers.",
      status: "escalated" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 8,
      reporter: "user_rohan_m",
      daysAgo: 5,
      verifications: ["user_priya_s", "user_aravind_k", "user_sneha_r", "user_test3"],
      upvotes: ["user_priya_s", "user_aravind_k"],
      isChronic: false
    },
    {
      city: "Delhi",
      category: "road_damage",
      title: "Deep Trench left open by Cable Installers in Vasant Kunj",
      desc: "Private telecom workers dug a 4-foot deep trench for optical cables but left it completely uncovered without caution tape.",
      status: "in_progress" as IssueStatus,
      severity: "critical" as Severity,
      severityScore: 9,
      reporter: "user_rohan_m",
      daysAgo: 1,
      verifications: ["user_priya_s", "user_aravind_k"],
      upvotes: ["user_priya_s"],
      isChronic: false
    },
    {
      city: "Delhi",
      category: "water_leakage",
      title: "Sewer Line Overflow Near Saket Gate 2",
      desc: "Sewer blockages have led to black putrid water spilling on the walking plaza. Causing toxic smell and immediate sanitation hazard.",
      status: "reported" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 8,
      reporter: "user_rohan_m",
      daysAgo: 0.2,
      verifications: [],
      upvotes: [],
      isChronic: true
    },

    // GURGAON (Cyber City / Golf Course Road / Sector 29)
    {
      city: "Gurgaon",
      category: "pothole",
      title: "Dangerous Pothole Cluster on Golf Course Road Near DLF Crossing",
      desc: "At least 5 connected potholes have developed on the main stretch. Heavy rains made them worse. Hundreds of office commuters face risk every morning.",
      status: "escalated" as IssueStatus,
      severity: "critical" as Severity,
      severityScore: 9,
      reporter: "user_rohan_m",
      daysAgo: 2,
      verifications: ["user_priya_s", "user_aravind_k", "user_sneha_r", "user_amit_p"],
      upvotes: ["user_priya_s", "user_aravind_k"],
      isChronic: true
    },
    {
      city: "Gurgaon",
      category: "flooding",
      title: "Rapid Metro Feeder Road Flooded Under Cyber Hub Underpass",
      desc: "Water logs every monsoon season here. The MCD drain is choked. Corporate workers are wading knee-deep after 30 minutes of rain.",
      status: "in_progress" as IssueStatus,
      severity: "critical" as Severity,
      severityScore: 10,
      reporter: "user_aravind_k",
      daysAgo: 0.5,
      verifications: ["user_rohan_m", "user_priya_s"],
      upvotes: ["user_rohan_m"],
      isChronic: true
    },
    {
      city: "Gurgaon",
      category: "streetlight",
      title: "Sector 29 Nightclub Strip Left in Total Darkness",
      desc: "All 6 overhead streetlights on the main Sector 29 entertainment corridor are out. Multiple molestation complaints have been filed nearby this week.",
      status: "verified" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 8,
      reporter: "user_sneha_r",
      daysAgo: 3,
      verifications: ["user_priya_s", "user_rohan_m", "user_amit_p"],
      upvotes: ["user_priya_s", "user_rohan_m"],
      isChronic: false
    },
    {
      city: "Gurgaon",
      category: "garbage",
      title: "Construction Rubble Dumped on MG Road Service Lane",
      desc: "A contractor illegally dumped building debris on the service lane parallel to MG Road. The garbage blocks an emergency vehicle access point.",
      status: "reported" as IssueStatus,
      severity: "medium" as Severity,
      severityScore: 5,
      reporter: "user_amit_p",
      daysAgo: 0.3,
      verifications: [],
      upvotes: [],
      isChronic: false
    },
    {
      city: "Gurgaon",
      category: "encroachment",
      title: "Illegal Vehicle Parking Blocking Sohna Road Pedestrian Way",
      desc: "Dozens of cars parked on the footpath near Raheja Mall for weeks. Pedestrians including disabled citizens forced onto the main carriageway.",
      status: "reported" as IssueStatus,
      severity: "medium" as Severity,
      severityScore: 6,
      reporter: "user_priya_s",
      daysAgo: 1,
      verifications: ["user_sneha_r"],
      upvotes: [],
      isChronic: true
    },

    // NOIDA (Sector 18 / Sector 62 / Film City / Greater Noida Expressway)
    {
      city: "Noida",
      category: "road_damage",
      title: "Expressway Service Road Completely Broken Near Sector 62",
      desc: "The entire service road parallel to the NH expressway has collapsed due to waterlogging. Trucks are diverting into residential colonies, causing structural damage.",
      status: "escalated" as IssueStatus,
      severity: "critical" as Severity,
      severityScore: 9,
      reporter: "user_aravind_k",
      daysAgo: 4,
      verifications: ["user_rohan_m", "user_priya_s", "user_sneha_r", "user_amit_p"],
      upvotes: ["user_rohan_m", "user_priya_s"],
      isChronic: true
    },
    {
      city: "Noida",
      category: "water_leakage",
      title: "Burst Water Main Near Sector 18 Atta Market",
      desc: "A JJM water main pipe has burst under the road. Water flowing since 48 hours, forming a 200m river on the main market road.",
      status: "in_progress" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 8,
      reporter: "user_sneha_r",
      daysAgo: 1,
      verifications: ["user_priya_s", "user_aravind_k"],
      upvotes: ["user_priya_s"],
      isChronic: false
    },
    {
      city: "Noida",
      category: "garbage",
      title: "Film City Road Median Full of Plastic Waste",
      desc: "The central median strip between Film City crossing and Sector 16A has not been cleaned in weeks. Plastic bags are catching in windshields of passing vehicles.",
      status: "verified" as IssueStatus,
      severity: "medium" as Severity,
      severityScore: 5,
      reporter: "user_rohan_m",
      daysAgo: 2,
      verifications: ["user_priya_s", "user_amit_p", "user_sneha_r"],
      upvotes: ["user_priya_s"],
      isChronic: false
    },
    {
      city: "Noida",
      category: "pothole",
      title: "Amity Road Crossroad Crater Near Sector 125",
      desc: "A severe pothole at the Amity University junction exit has caused 3 bike accidents this week. Visible tyre rubber and shattered glass mark the spot.",
      status: "resolved" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 8,
      reporter: "user_amit_p",
      daysAgo: 12,
      verifications: ["user_priya_s", "user_rohan_m", "user_sneha_r"],
      upvotes: ["user_priya_s", "user_rohan_m"],
      isChronic: true,
      resolvedPhoto: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&auto=format&fit=crop&q=80"
    },
    {
      city: "Noida",
      category: "streetlight",
      title: "Kalindi Kunj Bridge Approach Road Dark After 9PM",
      desc: "All streetlights on the 800m approach road to Kalindi Kunj bridge are defunct since monsoon hit. Police PCR van also avoids the stretch after dark.",
      status: "reported" as IssueStatus,
      severity: "high" as Severity,
      severityScore: 7,
      reporter: "user_priya_s",
      daysAgo: 0.5,
      verifications: ["user_sneha_r"],
      upvotes: [],
      isChronic: false
    }
  ];

  // We want to generate additional issues to reach 45+ to make the system highly rich for maps
  // Let's iterate and blow them up
  let idCounter = 1000;
  
  configs.forEach(conf => {
    const center = CITY_CENTERS[conf.city as keyof typeof CITY_CENTERS];
    const coords = getOffsetCoordinate(center, 0.8);
    const date = new Date(now - conf.daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const reporterUser = SEED_USERS.find(u => u.uid === conf.reporter) || SEED_USERS[0];
    const categoryImages = CATEGORY_IMAGES[conf.category as keyof typeof CATEGORY_IMAGES] || CATEGORY_IMAGES.other;
    const imgUrl = categoryImages[idCounter % categoryImages.length];

    issues.push({
      id: `issue_${idCounter++}`,
      title: conf.title,
      description: conf.desc,
      category: conf.category,
      severity: conf.severity || "medium",
      severityScore: conf.severityScore,
      status: conf.status,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        address: `${idCounter % 50 + 2}B, Street No. ${idCounter % 10 + 1}, ${STREETS[conf.city as keyof typeof STREETS][idCounter % STREETS[conf.city as keyof typeof STREETS].length]}, ${conf.city}`,
        area: center.name,
        city: conf.city
      },
      images: [imgUrl],
      reportedBy: reporterUser.uid,
      reportedByName: reporterUser.displayName,
      reportedByAvatar: reporterUser.photoURL,
      reportedAt: date,
      verifications: conf.verifications,
      verificationCount: conf.verifications.length,
      upvotes: conf.upvotes,
      comments: [
        {
          id: `comment_s1_${idCounter}`,
          userId: "user_priya_s",
          userName: "Priya Sharma",
          userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
          content: "I live close by and this is a serious hazard. Please resolve quickly!",
          timestamp: new Date(now - (conf.daysAgo - 0.2) * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      aiAnalysis: {
        category: conf.category,
        severityScore: conf.severityScore,
        severityReasoning: `Identified significant ${conf.category.replace('_', ' ')} presenting intermediate public danger.`,
        estimatedImpactRadius: conf.severityScore * 30,
        suggestedAuthority: conf.category === "pothole" || conf.category === "road_damage" ? "Public Works Department (PWD)" :
                            conf.category === "water_leakage" || conf.category === "flooding" ? "Water Supply & Sewerage Board" :
                            conf.category === "streetlight" ? "Municipal Corporation Electrical Dept" :
                            conf.category === "garbage" ? "Solid Waste Management Division" : "Municipal Corporation General Division",
        estimatedResolutionDays: Math.max(2, 10 - conf.severityScore),
        urgencyKeywords: ["civic_danger", conf.category, "hazardous"],
        confidence: 0.82 + (idCounter % 10) / 100,
        authenticityScore: 0.94 + (idCounter % 5) / 100,
        authenticityReasoning: "EXIF metadata is clean, consistent lighting, realistic perspective and camera grain. Zero AI noise."
      },
      agentHistory: [
        {
          action: "reported",
          timestamp: date,
          details: `Issue recorded by citizen ${reporterUser.displayName}. AI pre-evaluated severity as ${conf.severityScore}/10.`,
          automated: true
        },
        ...(conf.verifications.length >= 3 ? [{
          action: "verified",
          timestamp: new Date(now - (conf.daysAgo - 0.4) * 24 * 60 * 60 * 1000).toISOString(),
          details: `System automatically upgraded status to VERIFIED after receiving ${conf.verifications.length} citizen confirmations.`,
          automated: true
        }] : []),
        ...(conf.status === "in_progress" || conf.status === "escalated" || conf.status === "resolved" ? [{
          action: "in_progress",
          timestamp: new Date(now - (conf.daysAgo - 0.6) * 24 * 60 * 60 * 1000).toISOString(),
          details: "Assigned to the local regional maintenance task force.",
          automated: false
        }] : []),
        ...(conf.status === "escalated" ? [{
          action: "escalated",
          timestamp: new Date(now - (conf.daysAgo - 0.8) * 24 * 60 * 60 * 1000).toISOString(),
          details: "🤖 Autonomous Agent escalated report: No repair work initiated within 48 hours. Legal notification generated for municipal ward commissioner.",
          automated: true
        }] : []),
        ...(conf.status === "resolved" ? [{
          action: "resolved",
          timestamp: new Date(now - (conf.daysAgo - 0.9) * 24 * 60 * 60 * 1000).toISOString(),
          details: "Citizen reported resolution confirmed. Verified photo proof uploaded and coordinates match original report within 12 meters.",
          automated: false
        }] : [])
      ],
      escalatedAt: conf.status === "escalated" ? new Date(now - (conf.daysAgo - 0.8) * 24 * 60 * 60 * 1000).toISOString() : null,
      resolvedAt: conf.status === "resolved" ? new Date(now - (conf.daysAgo - 0.9) * 24 * 60 * 60 * 1000).toISOString() : null,
      resolutionTimeHours: conf.status === "resolved" ? Math.floor(conf.daysAgo * 12) : null,
      tags: ["danger", conf.category],
      anonymous: false,
      anonymousToken: null,
      isFake: false,
      flagCount: 0,
      flags: [],
      adoptedBy: idCounter % 7 === 0 ? "Koramangala Traders Association" : null,
      adoptedDate: idCounter % 7 === 0 ? new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString() : null,
      isChronic: conf.isChronic || false,
      resolvedPhoto: conf.resolvedPhoto || null,
      exifChecked: true,
      exifWarning: false
    });
  });

  // Now, create 30 additional random reports across the cities to fully populate dashboards and maps
  const cities = ["Bengaluru", "Mumbai", "Delhi"] as const;
  const categories = ["pothole", "water_leakage", "streetlight", "garbage", "graffiti", "road_damage", "flooding", "encroachment"] as const;
  const statuses = ["reported", "verified", "in_progress", "resolved", "escalated"] as const;
  const severities = ["low", "medium", "high", "critical"] as const;

  for (let i = 0; i < 30; i++) {
    const selectedCity = cities[i % cities.length];
    const selectedCat = categories[(i + 3) % categories.length];
    const selectedStatus = statuses[i % statuses.length];
    const selectedSev = severities[i % severities.length];
    const center = CITY_CENTERS[selectedCity];
    const coords = getOffsetCoordinate(center, 1.5);
    const daysAgo = Math.random() * 40 + 0.5;
    const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const rep = SEED_USERS[i % SEED_USERS.length];
    const catImgs = CATEGORY_IMAGES[selectedCat] || CATEGORY_IMAGES.other;
    const imgUrl = catImgs[Math.floor(Math.random() * catImgs.length)];

    const severityScore = selectedSev === "low" ? Math.floor(Math.random() * 3) + 1 :
                          selectedSev === "medium" ? Math.floor(Math.random() * 3) + 4 :
                          selectedSev === "high" ? Math.floor(Math.random() * 2) + 7 : 9 + (i % 2);

    const isResolved = selectedStatus === "resolved";
    
    issues.push({
      id: `issue_${idCounter++}`,
      title: `Simulated ${selectedCat.replace('_', ' ')} near ${STREETS[selectedCity][i % STREETS[selectedCity].length]}`,
      description: `Auto-generated simulation of ${selectedCat.replace('_', ' ')} incident. Citizens have raised complaints regarding security and accessibility of the lane.`,
      category: selectedCat,
      severity: selectedSev,
      severityScore: severityScore,
      status: selectedStatus,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        address: `${i * 12 + 10}A, Cross Lane, ${STREETS[selectedCity][i % STREETS[selectedCity].length]}, ${selectedCity}`,
        area: center.name,
        city: selectedCity
      },
      images: [imgUrl],
      reportedBy: rep.uid,
      reportedByName: rep.displayName,
      reportedByAvatar: rep.photoURL,
      reportedAt: date,
      verifications: i % 4 === 0 ? ["user_priya_s", "user_aravind_k", "user_rohan_m"] : ["user_sneha_r"],
      verificationCount: i % 4 === 0 ? 3 : 1,
      upvotes: i % 3 === 0 ? ["user_priya_s", "user_aravind_k"] : [],
      comments: [],
      aiAnalysis: {
        category: selectedCat,
        severityScore: severityScore,
        severityReasoning: "Algorithmic analysis completed.",
        estimatedImpactRadius: severityScore * 25,
        suggestedAuthority: "Municipal Ward Directorate",
        estimatedResolutionDays: 5,
        urgencyKeywords: ["simulation", selectedCat],
        confidence: 0.88,
        authenticityScore: 0.97,
        authenticityReasoning: "EXIF properties indicate original camera capture from mobile sensor."
      },
      agentHistory: [
        {
          action: "reported",
          timestamp: date,
          details: "Automated simulation record created.",
          automated: true
        }
      ],
      escalatedAt: selectedStatus === "escalated" ? new Date(now - (daysAgo - 0.5) * 24 * 60 * 60 * 1000).toISOString() : null,
      resolvedAt: isResolved ? new Date(now - (daysAgo - 1) * 24 * 60 * 60 * 1000).toISOString() : null,
      resolutionTimeHours: isResolved ? Math.floor(daysAgo * 8) : null,
      tags: [selectedCat],
      anonymous: false,
      anonymousToken: null,
      isFake: false,
      flagCount: 0,
      flags: [],
      adoptedBy: null,
      adoptedDate: null,
      isChronic: i % 6 === 0,
      resolvedPhoto: isResolved ? "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&auto=format&fit=crop&q=80" : null,
      exifChecked: true,
      exifWarning: false
    });
  }

  return issues;
}

// Generate starting agent logs
export function generateSeedAgentLogs(): AgentLog[] {
  const now = Date.now();
  return [
    {
      id: "log_1",
      timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
      action: "chronic_zone_tagged",
      issueId: "issue_1000",
      issueTitle: "Deep Pothole at Koramangala 4th Block Crossing",
      details: "🤖 Detected 3+ recurring potholes in same 200m radius within 90 days. System auto-tagged zone '🔴 Chronic Zone' and upgraded priority to CRITICAL.",
      automated: true
    },
    {
      id: "log_2",
      timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
      action: "auto_escalated",
      issueId: "issue_1007",
      issueTitle: "Mega Pile of Plastic Waste on Carter Road",
      details: "🤖 High severity issue unresolved for 52 hours + 4 citizen verifications. Auto-escalated to Municipal Joint Commissioner. Warning notification dispatched.",
      automated: true
    },
    {
      id: "log_3",
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      action: "duplicate_merged",
      issueId: "issue_1003",
      issueTitle: "Illegal Trash Dumping Near Community Park Entrance",
      details: "🤖 Identified duplicate garbage dumping report submitted within 45 meters of active issue #1003. Combined upvotes and merged images into parent report.",
      automated: true
    },
    {
      id: "log_4",
      timestamp: new Date(now - 120 * 60 * 1000).toISOString(),
      action: "hotspot_detected",
      issueId: "issue_1008",
      issueTitle: "Severe Waterlogging on Linking Road Underpass",
      details: "🤖 Pattern Recognition: Identified 4 drainage-related flood incidents within 400m block in past 48 hours. Hotspot cluster 'Bandra Drain Block' created.",
      automated: true
    }
  ];
}

// Haversine formula helper
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}
