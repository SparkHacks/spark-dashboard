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
import { LayoutGrid, BarChart3, Search, Filter, Columns3 } from "lucide-react";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export interface Summary {
  total: number;
  fullyAccepted: number;
  userAccepted: number;
  accepted: number;
  waitlist: number;
  waiting: number;
  declined: number;
}

export type Mode = "everything" | "fullyAccepted" | "userAccepted" | "accepted" | "waitlist" | "waiting" | "declined";

export interface AdvancedFilters {
  year: string[];
  gender: string[];
  dietaryRestriction: string[];
  crewneckSize: string[];
  availability: string[];
  pastSparkHacks: string[];
  participationType: string[];
}

export type SortField = "email" | "name" | "createdAt" | "availability" | "appStatus" | "year" | "gender" | "teamPlan" | "pastSparkHacks" | "participationType";
export type SortDirection = "asc" | "desc" | null;

export type ColumnKey = "email" | "name" | "createdAt" | "availability" | "year" | "gender" | "teamPlan" | "pastSparkHacks" | "participationType" | "status" | "actions";

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
  status: 130,
  actions: 70,
};

export type ColumnWidths = Record<ColumnKey, number>;

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


  const isHighlight = (curMode: Mode) =>
    curMode === mode ? { border: "3px solid" } : {};

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
    setCurrentPage(1);
  }, [datas, searchQuery, searchType, advancedFilters, sortField, sortDirection, showNonUIC]);

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
      const fullyAcceptedCount = allDatas.filter(d => d.appStatus === "fullyAccepted").length;
      const userAcceptedCount = allDatas.filter(d => d.appStatus === "userAccepted").length;
      const acceptedCount = allDatas.filter(d => d.appStatus === "accepted").length;
      const waitlistCount = allDatas.filter(d => d.appStatus === "waitlist").length;
      const waitingCount = allDatas.filter(d => d.appStatus === "waiting").length;
      const declinedCount = allDatas.filter(d => d.appStatus === "declined").length;

      setSummary({
        total: totalCount,
        fullyAccepted: fullyAcceptedCount,
        userAccepted: userAcceptedCount,
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
                  onClick={() => setMode("fullyAccepted")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border:
                      mode === "fullyAccepted"
                        ? "2px solid #333"
                        : "1px solid #ccc",
                    backgroundColor: STATUS_COLORS.fullyAccepted,
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: mode === "fullyAccepted" ? "600" : "400",
                    transition: "all 0.2s ease",
                  }}
                >
                  Confirmed
                </button>
                <button
                  onClick={() => setMode("userAccepted")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border:
                      mode === "userAccepted"
                        ? "2px solid #333"
                        : "1px solid #ccc",
                    backgroundColor: STATUS_COLORS.userAccepted,
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: mode === "userAccepted" ? "600" : "400",
                    transition: "all 0.2s ease",
                  }}
                >
                  Invited
                </button>
                <button
                  onClick={() => setMode("accepted")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border:
                      mode === "accepted" ? "2px solid #333" : "1px solid #ccc",
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
              <strong>Confirmed:</strong> {summary.fullyAccepted}
            </div>
            <div>
              <strong>Invited:</strong> {summary.userAccepted}
            </div>
            <div>
              <strong>Accepted:</strong> {summary.accepted}
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
                fontWeight: mode === "fullyAccepted" ? "600" : "400",
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
                fontWeight: mode === "fullyAccepted" ? "600" : "400",
                transition: "all 0.2s ease",
              }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {viewMode === "graph" && <ApplicantGraphs datas={datas} />}
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
  };
  return result;
};
