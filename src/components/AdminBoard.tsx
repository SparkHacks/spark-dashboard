import { useEffect, useRef, useState } from "react";
import AdminTable from "./components/AdminTable";
import ApplicantGraphs from "./components/ApplicantGraphs";
import type { FormViewData } from "../env";
import { collection, getDocs, orderBy, query, type DocumentData } from "firebase/firestore";
import { db } from "../firebase/client";
import { YEAR_TO_DB } from "../config/constants";
import { STATUS_COLORS } from "./constants";
import "./AdminBoard.css";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { LayoutGrid, BarChart3, Search, Filter, Columns3, FileDown, X, CheckSquare, Square } from "lucide-react";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export interface Summary {
  total: number;
  invited: number;
  accepted: number;
  waitlist: number;
  waiting: number;
  declined: number;
}

export type Mode = "everything" | "invited" | "accepted" | "waitlist" | "waiting" | "declined";

export interface AdvancedFilters {
  year: string[];
  gender: string[];
  dietaryRestriction: string[];
  crewneckSize: string[];
  availability: string[];
  pastSparkHacks: string[];
  participationType: string[];
  checkin: string[];
}

export type SortField = "email" | "name" | "createdAt" | "availability" | "appStatus" | "year" | "gender" | "teamPlan" | "pastSparkHacks" | "participationType";
export type SortDirection = "asc" | "desc" | null;

export type ColumnKey = "email" | "name" | "createdAt" | "availability" | "year" | "gender" | "teamPlan" | "pastSparkHacks" | "participationType" | "d1Here" | "d1Snack" | "d1Dinner" | "d1Cookies" | "d2Here" | "d2Breakfast" | "d2Lunch" | "d2Dinner" | "status" | "actions";

export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  sortable: boolean;
}

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "createdAt", label: "Created At", sortable: true },
  { key: "availability", label: "Availability", sortable: true },
  { key: "year", label: "Year", sortable: true },
  { key: "gender", label: "Gender", sortable: true },
  { key: "teamPlan", label: "Team", sortable: true },
  { key: "pastSparkHacks", label: "Past SH", sortable: true },
  { key: "participationType", label: "Participation", sortable: true },
  { key: "d1Here", label: "D1 Check-In", sortable: false },
  { key: "d1Snack", label: "D1 Snacks", sortable: false },
  { key: "d1Dinner", label: "D1 Dinner", sortable: false },
  { key: "d1Cookies", label: "D1 Cookies", sortable: false },
  { key: "d2Here", label: "D2 Check-In", sortable: false },
  { key: "d2Breakfast", label: "D2 Breakfast", sortable: false },
  { key: "d2Lunch", label: "D2 Lunch", sortable: false },
  { key: "d2Dinner", label: "D2 Dinner", sortable: false },
];

export const DEFAULT_COLUMN_WIDTHS: Record<ColumnKey, number> = {
  email: 200,
  name: 120,
  createdAt: 180,
  availability: 110,
  year: 90,
  gender: 90,
  teamPlan: 60,
  pastSparkHacks: 85,
  participationType: 115,
  d1Here: 80,
  d1Snack: 80,
  d1Dinner: 80,
  d1Cookies: 80,
  d2Here: 80,
  d2Breakfast: 90,
  d2Lunch: 80,
  d2Dinner: 80,
  status: 130,
  actions: 70,
};

export type ColumnWidths = Record<ColumnKey, number>;

export interface ExportColumn {
  key: keyof FormViewData;
  label: string;
  group: string;
}

export const ALL_EXPORT_COLUMNS: ExportColumn[] = [
  // Identity
  { key: "email", label: "Email", group: "Identity" },
  { key: "firstName", label: "First Name", group: "Identity" },
  { key: "lastName", label: "Last Name", group: "Identity" },
  { key: "uin", label: "UIN", group: "Identity" },
  { key: "gender", label: "Gender", group: "Identity" },
  { key: "year", label: "Year", group: "Identity" },
  { key: "appStatus", label: "Status", group: "Identity" },
  { key: "createdAt", label: "Submitted At", group: "Identity" },
  // Attendance
  { key: "availability", label: "Availability", group: "Attendance" },
  { key: "moreAvailability", label: "Availability Details", group: "Attendance" },
  { key: "teamPlan", label: "Team Plan", group: "Attendance" },
  { key: "participationType", label: "Participation Type", group: "Attendance" },
  { key: "dietaryRestriction", label: "Dietary Restrictions", group: "Attendance" },
  { key: "otherDietaryRestriction", label: "Other Dietary", group: "Attendance" },
  { key: "crewneckSize", label: "Crewneck Size", group: "Attendance" },
  { key: "preWorkshops", label: "Pre-Workshops", group: "Attendance" },
  // Background
  { key: "pastSparkHacks", label: "Past SparkHacks", group: "Background" },
  { key: "pastHackathons", label: "Past Hackathons", group: "Background" },
  { key: "pastProjects", label: "Past Projects", group: "Background" },
  { key: "hearAbout", label: "Heard About", group: "Background" },
  { key: "otherHearAbout", label: "Other Heard About", group: "Background" },
  // Goals
  { key: "whyInterested", label: "Why Interested", group: "Goals" },
  { key: "teamRole", label: "Team Role", group: "Goals" },
  { key: "projectInterest", label: "Project Interests", group: "Goals" },
  { key: "mainGoals", label: "Main Goals", group: "Goals" },
  // Skills
  { key: "skillGit", label: "Skill: Git", group: "Skills" },
  { key: "skillFigma", label: "Skill: Figma", group: "Skills" },
  { key: "skillReact", label: "Skill: React", group: "Skills" },
  { key: "skillPython", label: "Skill: Python", group: "Skills" },
  { key: "skillDatabase", label: "Skill: Database", group: "Skills" },
  { key: "skillCICD", label: "Skill: CI/CD", group: "Skills" },
  { key: "skillAPIs", label: "Skill: APIs", group: "Skills" },
  // Career
  { key: "jobType", label: "Job Type", group: "Career" },
  { key: "otherJobType", label: "Other Job Type", group: "Career" },
  { key: "resumeLink", label: "Resume Link", group: "Career" },
  { key: "linkedinUrl", label: "LinkedIn", group: "Career" },
  // Check-in
  { key: "d1Here", label: "D1 Check-In", group: "Check-in" },
  { key: "d1Snack", label: "D1 Snacks", group: "Check-in" },
  { key: "d1Dinner", label: "D1 Dinner", group: "Check-in" },
  { key: "d1Cookies", label: "D1 Cookies", group: "Check-in" },
  { key: "d2Here", label: "D2 Check-In", group: "Check-in" },
  { key: "d2Breakfast", label: "D2 Breakfast", group: "Check-in" },
  { key: "d2Lunch", label: "D2 Lunch", group: "Check-in" },
  { key: "d2Dinner", label: "D2 Dinner", group: "Check-in" },
];

const DEFAULT_EXPORT_COLUMNS: (keyof FormViewData)[] = [
  "email", "firstName", "lastName", "uin", "appStatus", "year", "gender", "availability", "crewneckSize",
];

interface RoleFlags {
  isAdmin: boolean;
  isQrScanner: boolean;
  isWebDev: boolean;
  isDirector: boolean;
}

export default function AdminBoard({ roles }: { roles: RoleFlags }) {
  const [datas, setDatas] = useState<FormViewData[]>([]);
  const [filteredDatas, setFilteredDatas] = useState<FormViewData[]>([]);
  const [view, setView] = useState<FormViewData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<
    "all" | "email" | "name" | "uin"
  >("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [mode, setMode] = useState<Mode>("everything");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    year: [],
    gender: [],
    dietaryRestriction: [],
    crewneckSize: [],
    availability: [],
    pastSparkHacks: [],
    participationType: [],
    checkin: [],
  });
  const [showNonUIC, setShowNonUIC] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(["name", "createdAt", "availability"]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({ ...DEFAULT_COLUMN_WIDTHS });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState<(keyof FormViewData)[]>(DEFAULT_EXPORT_COLUMNS);
  const [exportRowFilters, setExportRowFilters] = useState<{
    statuses: string[];
    years: string[];
    checkin: string[]; // "d1Here:yes", "d1Here:no", etc.
  }>({ statuses: [], years: [], checkin: [] });

  const exportRows = (() => {
    let rows = [...datas];
    if (exportRowFilters.statuses.length > 0) {
      rows = rows.filter((r) => exportRowFilters.statuses.includes(r.appStatus));
    }
    if (exportRowFilters.years.length > 0) {
      rows = rows.filter((r) => exportRowFilters.years.includes(r.year));
    }
    if (exportRowFilters.checkin.length > 0) {
      const checkinFields = ["d1Here", "d1Snack", "d1Dinner", "d1Cookies", "d2Here", "d2Breakfast", "d2Lunch", "d2Dinner"] as const;
      rows = rows.filter((item) =>
        exportRowFilters.checkin.every((filter) => {
          const [field, value] = filter.split(":");
          if (checkinFields.includes(field as any)) {
            return value === "yes" ? item[field as keyof typeof item] === true : item[field as keyof typeof item] !== true;
          }
          return true;
        })
      );
    }
    return rows;
  })();

  const isHighlight = (curMode: Mode) =>
    curMode === mode ? { border: "3px solid" } : {};

  const handleExportCSV = () => {
    if (exportRows.length === 0) return;
    const cols = ALL_EXPORT_COLUMNS.filter((c) => exportColumns.includes(c.key));
    const headers = cols.map((c) => `"${c.label}"`).join(",");
    const csvRows = exportRows.map((row) => {
      return cols.map(({ key }) => {
        const value = row[key];
        const str = Array.isArray(value) ? value.join("; ") : String(value ?? "");
        return `"${str.replace(/"/g, '""')}"`;
      }).join(",");
    });
    const csvString = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `applicants_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  useEffect(() => {
    let filtered = [...datas];

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        switch (searchType) {
          case "email":
            return item.email?.toLowerCase().includes(query);
          case "name":
            return (
              item.firstName?.toLowerCase().includes(query) ||
              item.lastName?.toLowerCase().includes(query) ||
              `${item.firstName} ${item.lastName}`.toLowerCase().includes(query)
            );
          case "uin":
            return item.uin?.toString().includes(query);
          case "all":
          default:
            return (
              item.email?.toLowerCase().includes(query) ||
              item.firstName?.toLowerCase().includes(query) ||
              item.lastName?.toLowerCase().includes(query) ||
              item.uin?.toString().includes(query)
            );
        }
      });
    }

    if (advancedFilters.year.length > 0) {
      filtered = filtered.filter((item) =>
        advancedFilters.year.includes(item.year)
      );
    }
    if (advancedFilters.gender.length > 0) {
      filtered = filtered.filter((item) =>
        advancedFilters.gender.includes(item.gender)
      );
    }
    if (advancedFilters.crewneckSize.length > 0) {
      filtered = filtered.filter((item) =>
        advancedFilters.crewneckSize.includes(item.crewneckSize)
      );
    }
    if (advancedFilters.availability.length > 0) {
      filtered = filtered.filter((item) =>
        advancedFilters.availability.includes(item.availability)
      );
    }
    if (advancedFilters.pastSparkHacks.length > 0) {
      filtered = filtered.filter((item) =>
        advancedFilters.pastSparkHacks.includes(item.pastSparkHacks)
      );
    }
    if (advancedFilters.participationType.length > 0) {
      filtered = filtered.filter((item) =>
        advancedFilters.participationType.includes(item.participationType)
      );
    }
    if (advancedFilters.dietaryRestriction.length > 0) {
      filtered = filtered.filter((item) => {
        const restrictions = Array.isArray(item.dietaryRestriction)
          ? item.dietaryRestriction
          : [item.dietaryRestriction];
        return advancedFilters.dietaryRestriction.some((filter) =>
          restrictions.includes(filter)
        );
      });
    }
    if (advancedFilters.checkin.length > 0) {
      const checkinFields = ["d1Here", "d1Snack", "d1Dinner", "d1Cookies", "d2Here", "d2Breakfast", "d2Lunch", "d2Dinner"] as const;
      filtered = filtered.filter((item) => {
        return advancedFilters.checkin.every((filter) => {
          const [field, value] = filter.split(":");
          if (checkinFields.includes(field as any)) {
            return value === "yes" ? item[field as keyof typeof item] === true : item[field as keyof typeof item] !== true;
          }
          return true;
        });
      });
    }

    // Filter by UIC email
    if (!showNonUIC) {
      filtered = filtered.filter((item) =>
        item.email?.toLowerCase().endsWith("@uic.edu")
      );
    }

    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "email":
            aValue = a.email?.toLowerCase() || "";
            bValue = b.email?.toLowerCase() || "";
            break;
          case "name":
            aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
            bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
            break;
          case "createdAt":
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case "availability":
            aValue = a.availability?.toLowerCase() || "";
            bValue = b.availability?.toLowerCase() || "";
            break;
          case "appStatus":
            aValue = a.appStatus?.toLowerCase() || "";
            bValue = b.appStatus?.toLowerCase() || "";
            break;
          case "year":
            aValue = a.year?.toLowerCase() || "";
            bValue = b.year?.toLowerCase() || "";
            break;
          case "gender":
            aValue = a.gender?.toLowerCase() || "";
            bValue = b.gender?.toLowerCase() || "";
            break;
          case "teamPlan":
            aValue = a.teamPlan?.toLowerCase() || "";
            bValue = b.teamPlan?.toLowerCase() || "";
            break;
          case "pastSparkHacks":
            aValue = a.pastSparkHacks?.toLowerCase() || "";
            bValue = b.pastSparkHacks?.toLowerCase() || "";
            break;
          case "participationType":
            aValue = a.participationType?.toLowerCase() || "";
            bValue = b.participationType?.toLowerCase() || "";
            break;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredDatas(filtered);
  }, [datas, searchQuery, searchType, advancedFilters, sortField, sortDirection, showNonUIC]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchType, advancedFilters, sortField, sortDirection, showNonUIC]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    setAdvancedFilters({
      year: [],
      gender: [],
      dietaryRestriction: [],
      crewneckSize: [],
      availability: [],
      pastSparkHacks: [],
      participationType: [],
      checkin: [],
    });
    setSearchType("all");
    setShowNonUIC(false);
  };

  const toggleAdvancedFilter = (
    category: keyof AdvancedFilters,
    value: string
  ) => {
    setAdvancedFilters((prev) => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    Object.values(advancedFilters).some((arr) => arr.length > 0) ||
    showNonUIC;

  useEffect(() => {
    const fetchData = async () => {
      if (searchInputRef.current) {
        searchInputRef.current.value = "";
      }
      setSearchQuery("");
      setDatas([]);
      setFilteredDatas([]);

      const collectionName = YEAR_TO_DB[selectedYear as keyof typeof YEAR_TO_DB];

      const allDocsQuery = query(collection(db, collectionName), orderBy("createdAt"));
      const allDocsSnap = await getDocs(allDocsQuery);

      const allDatas: FormViewData[] = [];
      allDocsSnap.forEach((doc) => {
        // Skip the Test document
        if (doc.id === "Test") return;
        const item = convertDocToFormViewData(doc);
        allDatas.push(item);
      });

      const totalCount = allDatas.length;
      const invitedCount = allDatas.filter(d => d.appStatus === "invited").length;
      const acceptedCount = allDatas.filter(d => d.appStatus === "accepted").length;
      const waitlistCount = allDatas.filter(d => d.appStatus === "waitlist").length;
      const waitingCount = allDatas.filter(d => d.appStatus === "waiting").length;
      const declinedCount = allDatas.filter(d => d.appStatus === "declined").length;

      setSummary({
        total: totalCount,
        invited: invitedCount,
        accepted: acceptedCount,
        waitlist: waitlistCount,
        waiting: waitingCount,
        declined: declinedCount,
      });

      const newDatas = mode === "everything"
        ? allDatas
        : allDatas.filter(d => d.appStatus === mode);

      setDatas(newDatas);
    };

    fetchData().catch((err) => {
      console.error(err);
      alert("Something wrong with initial fetch data");
    });
  }, [mode, selectedYear]);

  const totalPages = Math.ceil(filteredDatas.length / ITEMS_PER_PAGE);

  const paginatedDatas = filteredDatas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


  return (
    <div
      style={{
        backgroundColor: "#F7F7F7",
        padding: "0px 10px 10px 10px",
        borderRadius: "10px",
      }}
    >
      <div style={{ textAlign: "left", padding: "10px 10px" }}>
        {/* Title Row with Year Selector and View Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h1 style={{ margin: 0 }}>Applicants</h1>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: "2px solid #ddd",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                color: "#666",
                outline: "none",
              }}
            >
              {Object.keys(YEAR_TO_DB).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "4px",
                border: "2px solid #ddd",
              }}
            >
              <button
                onClick={() => setViewMode("table")}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: viewMode === "table" ? "#8d6db5" : "transparent",
                  color: viewMode === "table" ? "white" : "#666",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: viewMode === "table" ? "600" : "400",
                  transition: "all 0.2s ease",
                }}
                title="Table View"
              >
                <LayoutGrid size={18} />
                Table
              </button>
              <button
                onClick={() => setViewMode("graph")}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: viewMode === "graph" ? "#8d6db5" : "transparent",
                  color: viewMode === "graph" ? "white" : "#666",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: viewMode === "graph" ? "600" : "400",
                  transition: "all 0.2s ease",
                }}
                title="Graph View"
              >
                <BarChart3 size={18} />
                Graph
              </button>
            </div>

            {/* Download CSV Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="download-csv-btn"
              title="Export CSV"
            >
              <FileDown size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar and Filters - Only show in table mode */}
        {viewMode === "table" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "2px solid #ddd",
                overflow: "hidden",
                minWidth: "350px",
                flex: "1 1 350px",
              }}
            >
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                style={{
                  height: "44px",
                  border: "none",
                  padding: "0px 12px",
                  backgroundColor: "transparent",
                  outline: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <option value="all">All Fields</option>
                <option value="email">Email</option>
                <option value="name">Name</option>
                <option value="uin">UIN</option>
              </select>
              <div
                style={{
                  width: "1px",
                  height: "24px",
                  backgroundColor: "#ccc",
                  margin: "0 8px",
                }}
              />
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search
                  size={18}
                  style={{
                    marginLeft: "8px",
                    color: "#666",
                  }}
                />
                <input
                  placeholder="Search Applicants"
                  style={{
                    border: "none",
                    outline: "none",
                    flex: 1,
                    height: "44px",
                    paddingLeft: "8px",
                    paddingRight: "15px",
                    fontSize: "14px",
                  }}
                  ref={searchInputRef}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "2px solid #ddd",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "8px",
                border: "2px solid #ddd",
                backgroundColor: showAdvancedFilters ? "#8d6db5" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0",
                color: showAdvancedFilters ? "white" : "#666",
              }}
              title={showAdvancedFilters ? "Hide Filters" : "Show Filters"}
            >
              <Filter size={20} />
            </button>
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "8px",
                border: "2px solid #ddd",
                backgroundColor: showColumnSelector ? "#8d6db5" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0",
                color: showColumnSelector ? "white" : "#666",
              }}
              title={showColumnSelector ? "Hide Columns" : "Select Columns"}
            >
              <Columns3 size={20} />
            </button>
          </div>
        )}

        {viewMode === "table" && showColumnSelector && (
          <div
            style={{
              marginTop: "10px",
              padding: "15px 20px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
              Select Columns to Display
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {AVAILABLE_COLUMNS.map((col) => (
                <button
                  key={col.key}
                  onClick={() => {
                    setVisibleColumns((prev) =>
                      prev.includes(col.key)
                        ? prev.filter((k) => k !== col.key)
                        : [...prev, col.key]
                    );
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: visibleColumns.includes(col.key)
                      ? "2px solid #8d6db5"
                      : "1px solid #ccc",
                    backgroundColor: visibleColumns.includes(col.key) ? "#f3e8ff" : "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: visibleColumns.includes(col.key) ? "600" : "400",
                    color: visibleColumns.includes(col.key) ? "#8d6db5" : "#666",
                    transition: "all 0.2s ease",
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
            <p style={{ margin: "10px 0 0 0", fontSize: "12px", color: "#888" }}>
              Email and Status columns are always shown.
            </p>
          </div>
        )}

        {viewMode === "table" && showAdvancedFilters && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Filters</h3>

            {/* Application Status Filter */}
            <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  marginBottom: "10px",
                  fontSize: "15px",
                  fontWeight: "600",
                }}
              >
                Application Status
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <button
                  onClick={() => setMode("everything")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border:
                      mode === "everything"
                        ? "2px solid #333"
                        : "1px solid #ccc",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: mode === "everything" ? "600" : "400",
                    transition: "all 0.2s ease",
                  }}
                >
                  Everything
                </button>
                <button
                  onClick={() => setMode("accepted")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border:
                      mode === "accepted"
                        ? "2px solid #333"
                        : "1px solid #ccc",
                    backgroundColor: STATUS_COLORS.accepted,
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: mode === "accepted" ? "600" : "400",
                    transition: "all 0.2s ease",
                  }}
                >
                  Accepted
                </button>
                <button
                  onClick={() => setMode("invited")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border:
                      mode === "invited" ? "2px solid #333" : "1px solid #ccc",
                    backgroundColor: STATUS_COLORS.invited,
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: mode === "invited" ? "600" : "400",
                    transition: "all 0.2s ease",
                  }}
                >
                  Invited
                </button>
                <button
                  onClick={() => setMode("waitlist")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border:
                      mode === "waitlist" ? "2px solid #333" : "1px solid #ccc",
                    backgroundColor: STATUS_COLORS.waitlist,
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: mode === "waitlist" ? "600" : "400",
                    transition: "all 0.2s ease",
                  }}
                >
                  Waitlisted
                </button>
                <button
                  onClick={() => setMode("waiting")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border:
                      mode === "waiting" ? "2px solid #333" : "1px solid #ccc",
                    backgroundColor: STATUS_COLORS.waiting,
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: mode === "waiting" ? "600" : "400",
                    transition: "all 0.2s ease",
                  }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setMode("declined")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border:
                      mode === "declined" ? "2px solid #333" : "1px solid #ccc",
                    backgroundColor: STATUS_COLORS.declined,
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: mode === "declined" ? "600" : "400",
                    transition: "all 0.2s ease",
                  }}
                >
                  Declined
                </button>
              </div>
            </div>

            <FilterSection
              title="Year"
              options={[
                "Freshman",
                "Sophomore",
                "Junior",
                "Senior",
                "Masters",
                "PhD",
              ]}
              selected={advancedFilters.year}
              onToggle={(v) => toggleAdvancedFilter("year", v)}
            />

            <FilterSection
              title="Past SparkHacks"
              options={["Yes", "No"]}
              selected={advancedFilters.pastSparkHacks}
              onToggle={(v) => toggleAdvancedFilter("pastSparkHacks", v)}
            />

            <FilterSection
              title="Participation Type"
              options={["Code", "No code", "Here to get involved"]}
              selected={advancedFilters.participationType}
              onToggle={(v) => toggleAdvancedFilter("participationType", v)}
            />

            <FilterSection
              title="Gender"
              options={["Male", "Female", "Non-binary", "Prefer not to say"]}
              selected={advancedFilters.gender}
              onToggle={(v) => toggleAdvancedFilter("gender", v)}
            />

            <FilterSection
              title="Availability"
              options={["Both days full duration", "Both days not full duration", "Day one only", "Day two only"]}
              selected={advancedFilters.availability}
              onToggle={(v) => toggleAdvancedFilter("availability", v)}
            />

            <FilterSection
              title="Crewneck Size"
              options={["S", "M", "L", "XL", "XXL"]}
              selected={advancedFilters.crewneckSize}
              onToggle={(v) => toggleAdvancedFilter("crewneckSize", v)}
            />

            <FilterSection
              title="Dietary Restrictions"
              options={[
                "None",
                "Vegetarian",
                "Vegan",
                "Gluten-Free",
                "Halal",
                "Kosher",
                "Lactose Intolerant",
              ]}
              selected={advancedFilters.dietaryRestriction}
              onToggle={(v) => toggleAdvancedFilter("dietaryRestriction", v)}
            />

            {/* Check-in Filters */}
            <div style={{ marginBottom: "15px" }}>
              <h4 style={{ marginBottom: "8px" }}>Check-in Status</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {([
                  { field: "d1Here", label: "D1 Check-In" },
                  { field: "d1Snack", label: "D1 Snacks" },
                  { field: "d1Dinner", label: "D1 Dinner" },
                  { field: "d1Cookies", label: "D1 Cookies" },
                  { field: "d2Here", label: "D2 Check-In" },
                  { field: "d2Breakfast", label: "D2 Breakfast" },
                  { field: "d2Lunch", label: "D2 Lunch" },
                  { field: "d2Dinner", label: "D2 Dinner" },
                ] as const).map(({ field, label }) => {
                  const yesKey = `${field}:yes`;
                  const noKey = `${field}:no`;
                  const isYes = advancedFilters.checkin.includes(yesKey);
                  const isNo = advancedFilters.checkin.includes(noKey);
                  return (
                    <div key={field} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#555" }}>{label}</span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => {
                            setAdvancedFilters((prev) => {
                              const filtered = prev.checkin.filter((v) => v !== yesKey && v !== noKey);
                              return { ...prev, checkin: isYes ? filtered : [...filtered, yesKey] };
                            });
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "5px",
                            border: isYes ? "2px solid #4CAF50" : "1px solid #ccc",
                            backgroundColor: isYes ? "#e8f5e9" : "white",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => {
                            setAdvancedFilters((prev) => {
                              const filtered = prev.checkin.filter((v) => v !== yesKey && v !== noKey);
                              return { ...prev, checkin: isNo ? filtered : [...filtered, noKey] };
                            });
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "5px",
                            border: isNo ? "2px solid #e53935" : "1px solid #ccc",
                            backgroundColor: isNo ? "#ffebee" : "white",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Show Non-UIC Checkbox */}
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <input
                  type="checkbox"
                  checked={showNonUIC}
                  onChange={(e) => setShowNonUIC(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                  }}
                />
                Show Non-UIC Emails
              </label>
            </div>
          </div>
        )}
      </div>

      {viewMode === "table" && summary && (
        <section
          style={{
            padding: "0px 8px",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <div>
              <strong>Total:</strong> {summary.total}
            </div>
            <div>
              <strong>Accepted:</strong> {summary.accepted}
            </div>
            <div>
              <strong>Invited:</strong> {summary.invited}
            </div>
            <div>
              <strong>Waitlisted:</strong> {summary.waitlist}
            </div>
            <div>
              <strong>Declined:</strong> {summary.declined}
            </div>
            <div>
              <strong>Pending:</strong> {summary.waiting}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "15px",
              alignItems: "center",
              marginTop: "10px",
            }}
          >
            <strong>Showing:</strong> {filteredDatas.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredDatas.length)} out of {filteredDatas.length}
            {hasActiveFilters && (
              <span>(filtered from {datas.length} loaded)</span>
            )}
          </div>
        </section>
      )}

      {viewMode === "table" && (
        <>
          <AdminTable
            datas={paginatedDatas}
            view={view}
            setView={setView}
            setDatas={setDatas}
            setSummary={setSummary}
            summary={summary}
            allDatas={datas}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            roles={roles}
            visibleColumns={visibleColumns}
            columnWidths={columnWidths}
            setColumnWidths={setColumnWidths}
            showColumnSelector={showColumnSelector}
            startIndex={(currentPage - 1) * ITEMS_PER_PAGE}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "15px",
              alignItems: "center",
            }}
          >
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid #ccc",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "400",
                transition: "all 0.2s ease",
              }}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid #ccc",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "400",
                transition: "all 0.2s ease",
              }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {viewMode === "graph" && <ApplicantGraphs datas={datas} />}

      {/* Export CSV Modal */}
      {showExportModal && (
        <div
          onClick={() => setShowExportModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "12px", padding: "28px",
              width: "min(680px, 95vw)", maxHeight: "85vh", display: "flex",
              flexDirection: "column", gap: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px" }}>Export CSV</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#666" }}>
                  <strong>{exportRows.length}</strong> row{exportRows.length !== 1 ? "s" : ""} will be exported
                  {(exportRowFilters.statuses.length > 0 || exportRowFilters.years.length > 0 || exportRowFilters.checkin.length > 0) && (
                    <> &mdash; <span style={{ color: "#8d6db5" }}>filters active</span></>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#666", padding: "4px" }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Row Filters */}
            <div style={{ background: "#f8f8f8", borderRadius: "8px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#333" }}>Row Filters</span>
                {(exportRowFilters.statuses.length > 0 || exportRowFilters.years.length > 0 || exportRowFilters.checkin.length > 0) && (
                  <button
                    onClick={() => setExportRowFilters({ statuses: [], years: [], checkin: [] })}
                    style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "4px", border: "1px solid #ccc", background: "white", cursor: "pointer", color: "#666" }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Status</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {(["accepted", "invited", "waitlist", "waiting", "declined"] as const).map((s) => {
                    const active = exportRowFilters.statuses.includes(s);
                    return (
                      <button key={s} onClick={() => setExportRowFilters((prev) => ({ ...prev, statuses: active ? prev.statuses.filter((x) => x !== s) : [...prev.statuses, s] }))}
                        style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "13px", cursor: "pointer", border: active ? "2px solid #555" : "1px solid #ccc", backgroundColor: STATUS_COLORS[s] || "#e8e8e8", fontWeight: active ? "700" : "400", transition: "all 0.15s" }}>
                        {s === "waiting" ? "Pending" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Year */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Year</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {["Freshman", "Sophomore", "Junior", "Senior", "Masters", "PhD"].map((y) => {
                    const active = exportRowFilters.years.includes(y);
                    return (
                      <button key={y} onClick={() => setExportRowFilters((prev) => ({ ...prev, years: active ? prev.years.filter((x) => x !== y) : [...prev.years, y] }))}
                        style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "13px", cursor: "pointer", border: active ? "2px solid #8d6db5" : "1px solid #ccc", backgroundColor: active ? "#f3e8ff" : "white", color: active ? "#8d6db5" : "#555", fontWeight: active ? "600" : "400", transition: "all 0.15s" }}>
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Check-in */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Check-in</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
                  {([
                    { field: "d1Here", label: "D1 In" }, { field: "d1Snack", label: "D1 Snack" },
                    { field: "d1Dinner", label: "D1 Din" }, { field: "d1Cookies", label: "D1 Cook" },
                    { field: "d2Here", label: "D2 In" }, { field: "d2Breakfast", label: "D2 Bfast" },
                    { field: "d2Lunch", label: "D2 Lunch" }, { field: "d2Dinner", label: "D2 Din" },
                  ] as const).map(({ field, label }) => {
                    const yesKey = `${field}:yes`;
                    const noKey = `${field}:no`;
                    const isYes = exportRowFilters.checkin.includes(yesKey);
                    const isNo = exportRowFilters.checkin.includes(noKey);
                    const toggle = (key: string, other: string) =>
                      setExportRowFilters((prev) => {
                        const next = prev.checkin.filter((v) => v !== key && v !== other);
                        return { ...prev, checkin: prev.checkin.includes(key) ? next : [...next, key] };
                      });
                    return (
                      <div key={field} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "600", color: "#666", whiteSpace: "nowrap" }}>{label}</span>
                        <div style={{ display: "flex", gap: "3px" }}>
                          <button onClick={() => toggle(yesKey, noKey)} title={`Only ${label} checked`}
                            style={{ padding: "3px 8px", borderRadius: "4px", border: isYes ? "2px solid #4CAF50" : "1px solid #ccc", background: isYes ? "#e8f5e9" : "white", cursor: "pointer", fontSize: "11px" }}>✅</button>
                          <button onClick={() => toggle(noKey, yesKey)} title={`Only ${label} not checked`}
                            style={{ padding: "3px 8px", borderRadius: "4px", border: isNo ? "2px solid #e53935" : "1px solid #ccc", background: isNo ? "#ffebee" : "white", cursor: "pointer", fontSize: "11px" }}>❌</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Select / Deselect All columns */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setExportColumns(ALL_EXPORT_COLUMNS.map((c) => c.key))}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", borderRadius: "6px", border: "1px solid #ccc",
                  background: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600",
                }}
              >
                <CheckSquare size={15} /> Select All
              </button>
              <button
                onClick={() => setExportColumns([])}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", borderRadius: "6px", border: "1px solid #ccc",
                  background: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600",
                }}
              >
                <Square size={15} /> Deselect All
              </button>
            </div>

            {/* Column groups */}
            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              {Array.from(new Set(ALL_EXPORT_COLUMNS.map((c) => c.group))).map((group) => (
                <div key={group}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {group}
                    </h4>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => {
                          const groupKeys = ALL_EXPORT_COLUMNS.filter((c) => c.group === group).map((c) => c.key);
                          setExportColumns((prev) => Array.from(new Set([...prev, ...groupKeys])));
                        }}
                        style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", border: "1px solid #ccc", background: "white", cursor: "pointer" }}
                      >
                        All
                      </button>
                      <button
                        onClick={() => {
                          const groupKeys = ALL_EXPORT_COLUMNS.filter((c) => c.group === group).map((c) => c.key);
                          setExportColumns((prev) => prev.filter((k) => !groupKeys.includes(k)));
                        }}
                        style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", border: "1px solid #ccc", background: "white", cursor: "pointer" }}
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {ALL_EXPORT_COLUMNS.filter((c) => c.group === group).map((col) => {
                      const selected = exportColumns.includes(col.key);
                      return (
                        <button
                          key={col.key}
                          onClick={() =>
                            setExportColumns((prev) =>
                              selected ? prev.filter((k) => k !== col.key) : [...prev, col.key]
                            )
                          }
                          style={{
                            padding: "5px 12px", borderRadius: "20px", fontSize: "13px", cursor: "pointer",
                            border: selected ? "2px solid #8d6db5" : "1px solid #ccc",
                            backgroundColor: selected ? "#f3e8ff" : "white",
                            color: selected ? "#8d6db5" : "#555",
                            fontWeight: selected ? "600" : "400",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {col.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "4px", borderTop: "1px solid #eee" }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: "10px 20px", borderRadius: "8px", border: "1px solid #ccc",
                  background: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExportCSV}
                disabled={exportColumns.length === 0 || exportRows.length === 0}
                style={{
                  padding: "10px 20px", borderRadius: "8px", border: "none",
                  background: exportColumns.length === 0 || exportRows.length === 0 ? "#ccc" : "#8d6db5",
                  color: "white", cursor: exportColumns.length === 0 || exportRows.length === 0 ? "not-allowed" : "pointer",
                  fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <FileDown size={16} />
                Download ({exportColumns.length} col{exportColumns.length !== 1 ? "s" : ""}, {exportRows.length} row{exportRows.length !== 1 ? "s" : ""})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <h4 style={{ marginBottom: "8px" }}>{title}</h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            style={{
              padding: "6px 12px",
              borderRadius: "5px",
              border: selected.includes(option)
                ? "2px solid #4CAF50"
                : "1px solid #ccc",
              backgroundColor: selected.includes(option) ? "#e8f5e9" : "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

const convertDocToFormViewData = (doc: DocumentData) => {
  const docData = doc.data();
  const result: FormViewData = {
    createdAt: docData.createdAt
      .toDate()
      .toLocaleString("en-US", { timeZone: "America/Chicago" }),
    email: docData.email,
    firstName: docData.firstName,
    lastName: docData.lastName,
    uin: docData.uin,
    gender: docData.gender,
    year: docData.year,
    availability: docData.availability,
    moreAvailability: docData.moreAvailability,
    dietaryRestriction: docData.dietaryRestriction,
    otherDietaryRestriction: docData.otherDietaryRestriction,
    crewneckSize: docData.crewneckSize || docData.shirtSize, // Fallback for old data
    teamPlan: docData.teamPlan,
    preWorkshops: docData.preWorkshops,
    jobType: docData.jobType,
    otherJobType: docData.otherJobType,
    resumeLink: docData.resumeLink,
    linkedinUrl: docData.linkedinUrl || "",

    // Logistics & Background
    pastSparkHacks: docData.pastSparkHacks || "",
    pastHackathons: docData.pastHackathons || "",
    pastProjects: docData.pastProjects || "",
    participationType: docData.participationType || "",
    hearAbout: docData.hearAbout || [],
    otherHearAbout: docData.otherHearAbout || "",

    // Interest & Goals
    whyInterested: docData.whyInterested || "",
    teamRole: docData.teamRole || "",
    projectInterest: docData.projectInterest || [],
    mainGoals: docData.mainGoals || [],

    // Skills
    skillGit: docData.skillGit || "",
    skillFigma: docData.skillFigma || "",
    skillReact: docData.skillReact || "",
    skillPython: docData.skillPython || "",
    skillDatabase: docData.skillDatabase || "",
    skillCICD: docData.skillCICD || "",
    skillAPIs: docData.skillAPIs || "",

    appStatus: docData.appStatus,

    // Check-in tracking
    d1Here: docData.d1Here || false,
    d1Snack: docData.d1Snack || false,
    d1Dinner: docData.d1Dinner || false,
    d1Cookies: docData.d1Cookies || false,
    d2Here: docData.d2Here || false,
    d2Breakfast: docData.d2Breakfast || false,
    d2Lunch: docData.d2Lunch || false,
    d2Dinner: docData.d2Dinner || false,
  };
  return result;
};
