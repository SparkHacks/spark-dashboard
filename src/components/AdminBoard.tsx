import { useEffect, useRef, useState } from "react";
import AdminTable from "./components/AdminTable";
import ViewCard from "./components/ViewCard";
import type { FormViewData } from "../env";
import { collection, doc, getCountFromServer, getDoc, getDocs, orderBy, query, where, type DocumentData } from "firebase/firestore";
import { db } from "../firebase/client";
import { FORMS_COLLECTION } from "../config/constants";
import "./AdminBoard.css";

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
  shirtSize: string[];
  availability: string[];
}

export default function AdminBoard() {
  const [datas, setDatas] = useState<FormViewData[]>([]); // All data loaded
  const [filteredDatas, setFilteredDatas] = useState<FormViewData[]>([]); // Filtered/Searched data
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
    shirtSize: [],
    availability: [],
  });

  const isHighlight = (curMode: Mode) =>
    curMode === mode ? { border: "3px solid" } : {};

  // Apply search and advanced filters to loaded data
  useEffect(() => {
    let filtered = [...datas];

    // Apply search
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

    // Apply advanced filters
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
    if (advancedFilters.shirtSize.length > 0) {
      filtered = filtered.filter((item) =>
        advancedFilters.shirtSize.includes(item.shirtSize)
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

    setFilteredDatas(filtered);
  }, [datas, searchQuery, searchType, advancedFilters]);

  const handleClearFilters = () => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    setAdvancedFilters({
      year: [],
      gender: [],
      dietaryRestriction: [],
      shirtSize: [],
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

      // Fetch summary
      const totalCount = (
        await getCountFromServer(collection(db, FORMS_COLLECTION))
      ).data().count;
      const fullyAcceptedCount = (
        await getCountFromServer(
          query(
            collection(db, FORMS_COLLECTION),
            where("appStatus", "==", "fullyAccepted")
          )
        )
      ).data().count;
      const userAcceptedCount = (
        await getCountFromServer(
          query(
            collection(db, FORMS_COLLECTION),
            where("appStatus", "==", "userAccepted")
          )
        )
      ).data().count;
      const acceptedCount = (
        await getCountFromServer(
          query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "accepted"))
        )
      ).data().count;
      const waitlistCount = (
        await getCountFromServer(
          query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "waitlist"))
        )
      ).data().count;
      const waitingCount = (
        await getCountFromServer(
          query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "waiting"))
        )
      ).data().count;
      const declinedCount = (
        await getCountFromServer(
          query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "declined"))
        )
      ).data().count;

      setSummary({
        total: totalCount,
        fullyAccepted: fullyAcceptedCount,
        userAccepted: userAcceptedCount,
        accepted: acceptedCount,
        waitlist: waitlistCount,
        waiting: waitingCount,
        declined: declinedCount,
      });

      const q =
        mode === "everything"
          ? query(collection(db, FORMS_COLLECTION), orderBy("createdAt"))
          : query(
              collection(db, FORMS_COLLECTION),
              where("appStatus", "==", mode),
              orderBy("createdAt")
            );

      const qSnap = await getDocs(q);
      const newDatas: FormViewData[] = [];
      qSnap.forEach((doc) => {
        const item = convertDocToFormViewData(doc);
        newDatas.push(item);
      });

      setDatas(newDatas);
    };

    fetchData().catch((err) => {
      console.error(err);
      alert("Something wrong with initial fetch data");
    });
  }, [mode]);

  return (
    <div
      style={{
        backgroundColor: "#F7F7F7",
        marginBottom: "10px",
        marginLeft: "10px",
        borderRadius: "10px",
      }}
    >
      <div style={{ textAlign: "left", padding: "10px 10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <h1>Applicants</h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              style={{
                height: "40px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                padding: "0 10px",
              }}
            >
              <option value="all">All Fields</option>
              <option value="email">Email</option>
              <option value="name">Name</option>
              <option value="uin">UIN</option>
            </select>
            <input
              placeholder="Search applicants..."
              style={{
                borderRadius: "30px",
                minWidth: "250px",
                minHeight: "40px",
                border: "none",
                paddingLeft: "45px",
                backgroundImage: "url(search.svg)",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "10px 10px",
              }}
              ref={searchInputRef}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                padding: "10px 15px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                backgroundColor: showAdvancedFilters ? "#e0e0e0" : "white",
                cursor: "pointer",
              }}
            >
              {showAdvancedFilters ? "Hide " : "Show "}Filters
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Advanced Filters</h3>

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
              options={["Both days", "Saturday only", "Sunday only"]}
              selected={advancedFilters.availability}
              onToggle={(v) => toggleAdvancedFilter("availability", v)}
            />

            <FilterSection
              title="Shirt Size"
              options={["XS", "S", "M", "L", "XL", "XXL"]}
              selected={advancedFilters.shirtSize}
              onToggle={(v) => toggleAdvancedFilter("shirtSize", v)}
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

        <div style={{ marginTop: "20px" }}>
          <h2>Mode: {mode}</h2>
          <div>
            <button
              className="filterButton"
              style={isHighlight("everything")}
              onClick={() => setMode("everything")}
            >
              Everything
            </button>
            <button
              className="filterButton"
              style={isHighlight("fullyAccepted")}
              onClick={() => setMode("fullyAccepted")}
            >
              Only FullyAccepted
            </button>
            <button
              className="filterButton"
              style={isHighlight("userAccepted")}
              onClick={() => setMode("userAccepted")}
            >
              Only UserAccepted
            </button>
            <button
              className="filterButton"
              style={isHighlight("accepted")}
              onClick={() => setMode("accepted")}
            >
              Only Accepted
            </button>
            <button
              className="filterButton"
              style={isHighlight("waitlist")}
              onClick={() => setMode("waitlist")}
            >
              Only Waitlist
            </button>
            <button
              className="filterButton"
              style={isHighlight("waiting")}
              onClick={() => setMode("waiting")}
            >
              Only Waiting
            </button>
            <button
              className="filterButton"
              style={isHighlight("declined")}
              onClick={() => setMode("declined")}
            >
              Only Declined
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <section
          style={{
            margin: "8px",
            padding: "8px",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
        >
          <h2>Summary</h2>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <strong>Total:</strong> {summary.total}
            </div>
            <div>
              <Dot backgroundColor="#72f784" /> <strong>fullyAccepted:</strong>{" "}
              {summary.fullyAccepted}
            </div>
            <div>
              <Dot backgroundColor="#bdc3f5" /> <strong>userAccepted:</strong>{" "}
              {summary.userAccepted}
            </div>
            <div>
              <Dot backgroundColor="#cff5bd" /> <strong>accepted:</strong>{" "}
              {summary.accepted}
            </div>
            <div>
              <Dot backgroundColor="#f5e3bd" /> <strong>waitlist:</strong>{" "}
              {summary.waitlist}
            </div>
            <div>
              <Dot backgroundColor="#f5bdbd" /> <strong>declined:</strong>{" "}
              {summary.declined}
            </div>
            <div>
              <Dot backgroundColor="white" /> <strong>waiting:</strong>{" "}
              {summary.waiting}
            </div>
          </div>
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              gap: "15px",
              alignItems: "center",
            }}
          >
            <strong>Showing:</strong> {filteredDatas.length} results
            {hasActiveFilters && (
              <span>(filtered from {datas.length} loaded)</span>
            )}
          </div>
        </section>
      )}

      <div style={{ width: "100%", display: "flex" }}>
        <ViewCard view={view} setView={setView} />
        <AdminTable
          datas={filteredDatas}
          view={view}
          setView={setView}
          setDatas={setDatas}
          setSummary={setSummary}
          summary={summary}
          allDatas={datas}
        />
      </div>

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

function Dot({ backgroundColor }: { backgroundColor: string }) {
  return (
    <div
      style={{
        backgroundColor: backgroundColor,
        width: "15px",
        height: "15px",
        display: "inline-block",
        borderRadius: 9999,
        border: "1px solid black",
      }}
    ></div>
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
    shirtSize: docData.shirtSize,
    teamPlan: docData.teamPlan,
    preWorkshops: docData.preWorkshops,
    jobType: docData.jobType,
    otherJobType: docData.otherJobType,
    resumeLink: docData.resumeLink,
    appStatus: docData.appStatus,
  };
  return result;
};
