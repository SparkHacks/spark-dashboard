import { useEffect, useRef, useState } from "react";
import AdminTable from "./components/AdminTable";
import type { FormViewData } from "../env";
import { collection, getDocs, orderBy, query, type DocumentData } from "firebase/firestore";
import { db } from "../firebase/client";
import { YEAR_TO_DB } from "../config/constants";
import "./AdminBoard.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
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
}

export const STATUS_COLORS: Record<string, string> = {
  accepted: "#cef5be",
  waitlist: "#f4e3be",
  waiting: "#ffffff",
  declined: "#f4bdbd",
  userAccepted: "#bee2f5",
  fullyAccepted: "#bfc3f4",
};

export type SortField = "email" | "name" | "createdAt" | "availability" | "appStatus";
export type SortDirection = "asc" | "desc" | null;

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
  });
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");


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
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredDatas(filtered);
    setCurrentPage(1);
  }, [datas, searchQuery, searchType, advancedFilters, sortField, sortDirection]);

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
    });
    setSearchType("all");
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
    Object.values(advancedFilters).some((arr) => arr.length > 0);

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
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                color: "#666",
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
                border: "1px solid #ddd",
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
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
                borderRadius: "30px",
                border: "1px solid #ccc",
                overflow: "hidden",
                minWidth: "350px",
                flex: "1 1 350px",
              }}
            >
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                style={{
                  height: "40px",
                  border: "none",
                  padding: "0px 10px",
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    marginLeft: "8px",
                    color: "#666",
                  }}
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  placeholder="Search Applicants"
                  style={{
                    border: "none",
                    outline: "none",
                    flex: 1,
                    height: "40px",
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
                  padding: "10px 15px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "1px solid #ccc",
                backgroundColor: showAdvancedFilters ? "#e0e0e0" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0",
              }}
              title={showAdvancedFilters ? "Hide Filters" : "Show Filters"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
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
                "Graduate",
              ]}
              selected={advancedFilters.year}
              onToggle={(v) => toggleAdvancedFilter("year", v)}
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
            <strong>Showing:</strong> {paginatedDatas.length} results
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

      {viewMode === "graph" && (
        <div style={{ padding: "0px 0px 20px 0px" }}>
          {/* Row 1: Applicants Over Time and Status Distribution */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {/* Row 1, Col 1: Applicants Over Time */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>
                Applicants Over Time
              </h3>
              <ApplicantsOverTimeChart datas={datas} />
            </div>

            {/* Row 1, Col 2: Status Distribution */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>
                Status Distribution
              </h3>
              <StatusDistributionChart datas={datas} />
            </div>
          </div>

          {/* Row 2: Gender and Year Distribution */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Row 2, Col 1: Gender Distribution */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>
                Gender Distribution
              </h3>
              <GenderDistributionChart datas={datas} />
            </div>

            {/* Row 2, Col 2: Year Distribution */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>
                Year Distribution
              </h3>
              <YearDistributionChart datas={datas} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicantsOverTimeChart({ datas }: { datas: FormViewData[] }) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const dateGroups = datas.reduce((acc, data) => {
    const dateObj = new Date(data.createdAt);
    dateObj.setHours(0, 0, 0, 0);
    const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (!acc[dateKey]) {
      acc[dateKey] = {
        dateObj: new Date(dateKey),
        count: 0,
      };
    }
    acc[dateKey].count += 1;
    return acc;
  }, {} as Record<string, { dateObj: Date; count: number }>);

  const dates = Object.keys(dateGroups).map(d => new Date(d));
  const dataEarliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
  const dataLatestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

  useEffect(() => {
    if (dates.length > 0) {
      setStartDate(dataEarliestDate.toISOString().split('T')[0]);
      setEndDate(dataLatestDate.toISOString().split('T')[0]);
    }
  }, [datas.length]);

  if (datas.length === 0) {
    return (
      <div
        style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
      >
        No data available
      </div>
    );
  }

  const earliestDate = startDate ? new Date(startDate) : dataEarliestDate;
  const latestDate = endDate ? new Date(endDate) : dataLatestDate;

  const allDays: Array<{ dateObj: Date; count: number }> = [];
  const currentDate = new Date(earliestDate);

  while (currentDate <= latestDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    allDays.push({
      dateObj: new Date(currentDate),
      count: dateGroups[dateKey]?.count || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  let cumulative = 0;
  const cumulativeData = allDays.map((item) => {
    cumulative += item.count;
    const dateLabel = item.dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return {
      date: dateLabel,
      count: item.count,
      cumulative,
      timestamp: item.dateObj.getTime(),
    };
  });

  const chartData = {
    labels: cumulativeData.map((item) => item.date),
    datasets: [
      {
        label: "Total Applicants",
        data: cumulativeData.map((item) => item.cumulative),
        borderColor: "#8d6db5",
        backgroundColor: "rgba(141, 109, 181, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#8d6db5",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#8d6db5",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "#666",
        },
        title: {
          display: true,
          text: "Total Applicants",
          color: "#666",
          font: {
            size: 12,
            weight: "normal" as const,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#666",
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <div>
      {/* Date Range Selector */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            htmlFor="start-date"
            style={{ fontSize: "14px", fontWeight: "500", color: "#666" }}
          >
            Start Date:
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate || dataLatestDate.toISOString().split('T')[0]}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "14px",
              cursor: "pointer",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            htmlFor="end-date"
            style={{ fontSize: "14px", fontWeight: "500", color: "#666" }}
          >
            End Date:
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || dataEarliestDate.toISOString().split('T')[0]}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "14px",
              cursor: "pointer",
            }}
          />
        </div>
        <button
          onClick={() => {
            setStartDate(dataEarliestDate.toISOString().split('T')[0]);
            setEndDate(dataLatestDate.toISOString().split('T')[0]);
          }}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: "14px",
            color: "#666",
          }}
        >
          Reset to Full Range
        </button>
      </div>

      {/* Chart */}
      <div style={{ height: "400px", position: "relative" }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

function StatusDistributionChart({ datas }: { datas: FormViewData[] }) {
  const statusCounts = datas.reduce((acc, data) => {
    const status = data.appStatus || "waiting";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusOrder = [
    { key: "fullyAccepted", label: "Confirmed" },
    { key: "userAccepted", label: "Invited" },
    { key: "accepted", label: "Accepted" },
    { key: "waitlist", label: "Waitlisted" },
    { key: "waiting", label: "Pending" },
    { key: "declined", label: "Declined" },
  ];

  const orderedStatuses = statusOrder.filter(s => statusCounts[s.key] > 0);

  if (orderedStatuses.length === 0) {
    return (
      <div
        style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
      >
        No data available
      </div>
    );
  }

  const chartData = {
    labels: orderedStatuses.map(s => s.label),
    datasets: [
      {
        data: orderedStatuses.map(s => statusCounts[s.key]),
        backgroundColor: orderedStatuses.map(s => STATUS_COLORS[s.key]),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          color: "#666",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#8d6db5",
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: "350px", position: "relative" }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}

function GenderDistributionChart({ datas }: { datas: FormViewData[] }) {
  // Count gender distribution
  const genderCounts = datas.reduce((acc, data) => {
    const gender = data.gender || "Unknown";
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(genderCounts).length === 0) {
    return (
      <div
        style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
      >
        No data available
      </div>
    );
  }

  const chartData = {
    labels: Object.keys(genderCounts),
    datasets: [
      {
        data: Object.values(genderCounts),
        backgroundColor: [
          "#8d6db5",
          "#a98dc9",
          "#c5addd",
          "#e1cef1",
          "#f0e5f9",
        ],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          color: "#666",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#8d6db5",
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: "350px", position: "relative" }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}

function YearDistributionChart({ datas }: { datas: FormViewData[] }) {
  const yearCounts = datas.reduce((acc, data) => {
    const year = data.year || "Unknown";
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(yearCounts).length === 0) {
    return (
      <div
        style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
      >
        No data available
      </div>
    );
  }

  const chartData = {
    labels: Object.keys(yearCounts),
    datasets: [
      {
        data: Object.values(yearCounts),
        backgroundColor: [
          "#8d6db5",
          "#a98dc9",
          "#c5addd",
          "#e1cef1",
          "#f0e5f9",
        ],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          color: "#666",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#8d6db5",
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: "350px", position: "relative" }}>
      <Pie data={chartData} options={options} />
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
