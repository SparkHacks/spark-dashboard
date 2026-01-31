import styles from "./styles/AdminTable.module.css";
import { useState, useRef, useCallback, useEffect } from "react";
import type { FormViewData } from "../../env";
import type { Summary, SortField, SortDirection, ColumnKey, ColumnWidths } from "../AdminBoard";
import { AVAILABLE_COLUMNS } from "../AdminBoard";
import { STATUS_COLORS } from "../constants";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

const shortenAvailability = (availability: string): string => {
  switch (availability) {
    case "Both days full duration": return "Both D Full";
    case "Both days not full duration": return "Both D Partial";
    case "Day one only": return "D1 Only";
    case "Day two only": return "D2 Only";
    default: return availability;
  }
};

interface RoleFlags {
  isAdmin: boolean;
  isQrScanner: boolean;
  isWebDev: boolean;
  isDirector: boolean;
}

// Fixed widths for non-resizable columns
const FIXED_CHECKBOX_WIDTH = 40;
const FIXED_ID_WIDTH = 35;
const FIXED_ACTIONS_WIDTH = 70;
const MIN_COLUMN_WIDTH = 60;

export default function AdminTable({
  datas,
  setDatas,
  view,
  setView,
  setSummary,
  summary,
  allDatas,
  sortField,
  sortDirection,
  onSort,
  roles,
  visibleColumns,
  columnWidths,
  setColumnWidths,
  showColumnSelector,
  startIndex = 0,
}: {
  datas: FormViewData[];
  setDatas: React.Dispatch<React.SetStateAction<FormViewData[]>>;
  view: FormViewData | null;
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>;
  setSummary: React.Dispatch<React.SetStateAction<Summary | null>>;
  summary: Summary | null;
  allDatas: FormViewData[];
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  roles: RoleFlags;
  visibleColumns: ColumnKey[];
  columnWidths: ColumnWidths;
  setColumnWidths: React.Dispatch<React.SetStateAction<ColumnWidths>>;
  showColumnSelector: boolean;
  startIndex?: number;
}) {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [resizing, setResizing] = useState<ColumnKey | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthsRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });

  // Build the ordered list of all resizable columns: [email, ...middle columns..., status]
  const getOrderedColumns = useCallback((): ColumnKey[] => {
    const middleColumns = AVAILABLE_COLUMNS
      .filter((col) => visibleColumns.includes(col.key))
      .map((col) => col.key);
    return ["email", ...middleColumns, "status"];
  }, [visibleColumns]);

  // Redistribute column widths when columns are added/removed to fill available space
  useEffect(() => {
    if (!tableRef.current) return;

    const tableWidth = tableRef.current.offsetWidth;
    // Padding: 10px left + 20px right on row/header = 30, plus other padding
    const containerPadding = 70;
    const availableWidth = tableWidth - FIXED_CHECKBOX_WIDTH - FIXED_ID_WIDTH - FIXED_ACTIONS_WIDTH - containerPadding;
    const orderedColumns = getOrderedColumns();

    // Calculate current total width of visible columns only
    const currentTotal = orderedColumns.reduce((sum, col) => sum + columnWidths[col], 0);

    // Always redistribute to exactly fill available space
    if (currentTotal > 0 && availableWidth > 0) {
      const scale = availableWidth / currentTotal;
      const newWidths: Partial<ColumnWidths> = {};

      let totalAssigned = 0;
      orderedColumns.forEach((col, index) => {
        if (index === orderedColumns.length - 1) {
          // Last column gets remaining space to avoid rounding errors
          newWidths[col] = Math.max(MIN_COLUMN_WIDTH, availableWidth - totalAssigned);
        } else {
          const width = Math.max(MIN_COLUMN_WIDTH, Math.round(columnWidths[col] * scale));
          newWidths[col] = width;
          totalAssigned += width;
        }
      });

      setColumnWidths(prev => ({ ...prev, ...newWidths }));
    }
  }, [visibleColumns]);

  // Handle resizing - adjusts both the dragged column and its right neighbor
  const handleMouseDown = useCallback((e: React.MouseEvent, columnKey: ColumnKey) => {
    e.preventDefault();
    e.stopPropagation();

    const orderedColumns = getOrderedColumns();
    const columnIndex = orderedColumns.indexOf(columnKey);

    // Can't resize if it's the last column (status) or not found
    if (columnIndex === -1 || columnIndex >= orderedColumns.length - 1) return;

    const leftColumn = columnKey;
    const rightColumn = orderedColumns[columnIndex + 1];

    setResizing(columnKey);
    startXRef.current = e.clientX;
    startWidthsRef.current = {
      left: columnWidths[leftColumn],
      right: columnWidths[rightColumn],
    };

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startXRef.current;

      const newLeftWidth = Math.max(MIN_COLUMN_WIDTH, startWidthsRef.current.left + diff);
      const newRightWidth = Math.max(MIN_COLUMN_WIDTH, startWidthsRef.current.right - diff);

      // Only update if both columns stay above minimum
      if (newLeftWidth >= MIN_COLUMN_WIDTH && newRightWidth >= MIN_COLUMN_WIDTH) {
        setColumnWidths(prev => ({
          ...prev,
          [leftColumn]: newLeftWidth,
          [rightColumn]: newRightWidth,
        }));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [columnWidths, setColumnWidths, getOrderedColumns]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} style={{ marginLeft: "4px", opacity: 0.3 }} />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp size={14} style={{ marginLeft: "4px" }} />;
    }
    return <ArrowDown size={14} style={{ marginLeft: "4px" }} />;
  };

  const Resizer = ({ columnKey }: { columnKey: ColumnKey }) => {
    if (!showColumnSelector) return null;

    const orderedColumns = getOrderedColumns();
    const columnIndex = orderedColumns.indexOf(columnKey);

    // Don't show resizer on the last column (status) since there's nothing to resize against
    if (columnIndex === orderedColumns.length - 1) return null;

    return (
      <div
        className={styles.resizer}
        onMouseDown={(e) => handleMouseDown(e, columnKey)}
        style={{
          opacity: resizing === columnKey ? 1 : undefined,
        }}
      />
    );
  };

  // Get ordered middle columns (between email and status)
  const orderedMiddleColumns = AVAILABLE_COLUMNS.filter((col) => visibleColumns.includes(col.key));

  // Multi-select handlers
  const allSelected = datas.length > 0 && datas.every(d => selectedEmails.has(d.email));
  const someSelected = selectedEmails.size > 0;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(datas.map(d => d.email)));
    }
  };

  const handleSelectOne = (email: string) => {
    const newSet = new Set(selectedEmails);
    if (newSet.has(email)) {
      newSet.delete(email);
    } else {
      newSet.add(email);
    }
    setSelectedEmails(newSet);
  };

  const handleBulkStatusChange = async (newStatus: "waiting" | "invited" | "accepted" | "waitlist" | "declined") => {
    if (selectedEmails.size === 0) return;

    setGlobalLoading(true);
    try {
      const emailsToUpdate = Array.from(selectedEmails);

      // Update all selected users
      for (const email of emailsToUpdate) {
        const formData = new FormData();
        formData.set("email", email);
        formData.set("updateAction", newStatus);

        const response = await fetch("/api/auth/update-form", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`Failed to update ${email}`);
        }
      }

      // Update local state
      const newDatas = [...allDatas];
      const statusChanges: Record<string, number> = {
        waiting: 0, invited: 0, accepted: 0, waitlist: 0, declined: 0
      };

      for (const item of newDatas) {
        if (selectedEmails.has(item.email)) {
          statusChanges[item.appStatus] -= 1;
          statusChanges[newStatus] += 1;
          item.appStatus = newStatus;
        }
      }

      setDatas(newDatas);

      if (summary) {
        const newSummary = { ...summary };
        newSummary.waiting += statusChanges.waiting;
        newSummary.invited += statusChanges.invited;
        newSummary.accepted += statusChanges.accepted;
        newSummary.waitlist += statusChanges.waitlist;
        newSummary.declined += statusChanges.declined;
        setSummary(newSummary);
      }

      setSelectedEmails(new Set());
      alert(`Successfully updated ${emailsToUpdate.length} applicant(s) to ${newStatus}`);
    } catch (err) {
      console.error(err);
      alert("Error updating some applicants");
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <section className={styles.adminTable} ref={tableRef}>
      {/* Bulk Action Bar */}
      {someSelected && (
        <div style={{
          padding: '15px 20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            {selectedEmails.size} Selected
          </h4>
          {(["waiting", "invited", "accepted", "waitlist", "declined"] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleBulkStatusChange(status)}
              disabled={globalLoading}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #ccc',
                borderRadius: '20px',
                backgroundColor: STATUS_COLORS[status],
                color: '#333',
                cursor: globalLoading ? 'not-allowed' : 'pointer',
                opacity: globalLoading ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {status === 'waiting' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setSelectedEmails(new Set())}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: '500',
              border: '1px solid #ccc',
              borderRadius: '20px',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginLeft: 'auto',
            }}
          >
            Clear
          </button>
        </div>
      )}

      <div className={styles.headerTable}>
        {/* Checkbox column */}
        <div style={{ width: FIXED_CHECKBOX_WIDTH, minWidth: FIXED_CHECKBOX_WIDTH, flexShrink: 0, flexGrow: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#8d6db5' }}
          />
        </div>
        {/* Fixed ID column */}
        <div style={{ width: FIXED_ID_WIDTH, minWidth: FIXED_ID_WIDTH, flexShrink: 0, flexGrow: 0 }}>#</div>

        {/* Email column - first resizable */}
        <div
          className={styles.sortableHeader}
          style={{
            width: columnWidths.email,
            minWidth: MIN_COLUMN_WIDTH,
            flexShrink: 0,
            flexGrow: 0,
            position: "relative"
          }}
          onClick={() => onSort("email")}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", paddingRight: 10 }}>Email</span>
          <SortIcon field="email" />
          <Resizer columnKey="email" />
        </div>

        {/* Middle columns */}
        {orderedMiddleColumns.map((col) => (
          <div
            key={col.key}
            className={col.sortable ? styles.sortableHeader : ""}
            style={{
              width: columnWidths[col.key],
              minWidth: MIN_COLUMN_WIDTH,
              flexShrink: 0,
              flexGrow: 0,
              position: "relative",
            }}
            onClick={() => col.sortable && onSort(col.key as SortField)}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", paddingRight: 10 }}>{col.label}</span>
            {col.sortable && <SortIcon field={col.key as SortField} />}
            <Resizer columnKey={col.key} />
          </div>
        ))}

        {/* Status column - second to last, no resizer since nothing to resize against */}
        <div
          className={styles.sortableHeader}
          style={{
            width: columnWidths.status,
            minWidth: MIN_COLUMN_WIDTH,
            flexShrink: 0,
            flexGrow: 0,
            position: "relative"
          }}
          onClick={() => onSort("appStatus")}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", paddingRight: 10 }}>Status</span>
          <SortIcon field="appStatus" />
        </div>

        {/* Actions column - fixed, last, no resizer */}
        <div style={{ width: FIXED_ACTIONS_WIDTH, minWidth: FIXED_ACTIONS_WIDTH, flexShrink: 0, flexGrow: 0 }}></div>
      </div>

      <div className={styles.contentTable}>
        {datas.length === 0 ? (
          <div style={{ marginTop: "20px", textAlign: "center" }}>No data</div>
        ) : (
          datas.map((data, idx) => (
            <Row
              key={data.email}
              id={startIndex + idx + 1}
              data={data}
              view={view}
              setView={setView}
              setDatas={setDatas}
              datas={allDatas}
              summary={summary}
              setSummary={setSummary}
              globalLoading={globalLoading}
              setGlobalLoading={setGlobalLoading}
              roles={roles}
              columnWidths={columnWidths}
              orderedMiddleColumns={orderedMiddleColumns}
              isSelected={selectedEmails.has(data.email)}
              onSelect={() => handleSelectOne(data.email)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function Row({
  id,
  data,
  view,
  setView,
  setDatas,
  datas,
  summary,
  setSummary,
  globalLoading,
  setGlobalLoading,
  roles,
  columnWidths,
  orderedMiddleColumns,
  isSelected,
  onSelect,
}: {
  id: number;
  data: FormViewData;
  view: FormViewData | null;
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>;
  datas: FormViewData[];
  setDatas: React.Dispatch<React.SetStateAction<FormViewData[]>>;
  setSummary: React.Dispatch<React.SetStateAction<Summary | null>>;
  summary: Summary | null;
  globalLoading: boolean;
  setGlobalLoading: React.Dispatch<React.SetStateAction<boolean>>;
  roles: RoleFlags;
  columnWidths: ColumnWidths;
  orderedMiddleColumns: { key: ColumnKey; label: string; sortable: boolean }[];
  isSelected: boolean;
  onSelect: () => void;
}) {

  const getEffectiveRole = () => {
    if (roles.isAdmin) return 'admin';
    if (roles.isDirector) return 'director';
    if (roles.isWebDev) return 'webDev';
    if (roles.isQrScanner) return 'qrScanner';
    return 'none';
  };

  const effectiveRole = getEffectiveRole();
  const canChangeStatus = effectiveRole === 'admin' || effectiveRole === 'director';

  const backgroundColor = STATUS_COLORS[data.appStatus] || STATUS_COLORS.waiting;

  const updateForm = async (
    updateAction:
      | "waiting"
      | "invited"
      | "accepted"
      | "waitlist"
      | "declined"
  ) => {
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("updateAction", updateAction);
    setGlobalLoading(true);

    try {
      const res = await fetch("/api/auth/update-form", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        alert(`Error: ${errorMsg}`);
        return;
      }

      const newDatas = [...datas];
      let oldStatus = updateAction as
        | "waiting"
        | "invited"
        | "accepted"
        | "waitlist"
        | "declined";
      for (const item of newDatas) {
        if (item.email === data.email) {
          oldStatus = item.appStatus;
          item.appStatus = updateAction;
          break;
        }
      }
      setDatas(newDatas);

      if (summary) {
        const newSummary = { ...summary };
        newSummary[oldStatus] -= 1;
        newSummary[updateAction] += 1;
        console.log(
          `${new Date().toLocaleString("en-US", {
            timeZone: "America/Chicago",
          })} ${data.email}: ${oldStatus} -> ${updateAction}`
        );
        setSummary(newSummary);
      }
    } catch (err) {
      console.error(err);
      alert("Error: something is wrong with updating data");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleView = () => {
    if (!view || view.email !== data.email) {
      setView(data);
    } else {
      setView(null);
    }
  };

  const isExpanded = view?.email === data.email;

  const getCellContent = (key: ColumnKey) => {
    switch (key) {
      case "name": return `${data.firstName} ${data.lastName}`;
      case "createdAt": return data.createdAt;
      case "availability": return shortenAvailability(data.availability);
      case "year": return data.year;
      case "gender": return data.gender;
      case "teamPlan": return data.teamPlan === "I have a team" ? "Yes" : "No";
      case "pastSparkHacks": return data.pastSparkHacks;
      case "participationType": return data.participationType;
      default: return "";
    }
  };

  return (
    <div
      className={styles.rowContainer}
      style={{
        backgroundColor: backgroundColor,
        borderRadius: "8px",
        border: isExpanded ? "2px solid #8d6db5" : "none",
        marginBottom: "10px",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      <div className={styles.rowTable} style={{ fontWeight: 600, backgroundColor: backgroundColor }}>
        {/* Checkbox column */}
        <div style={{ width: FIXED_CHECKBOX_WIDTH, minWidth: FIXED_CHECKBOX_WIDTH, flexShrink: 0, flexGrow: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#8d6db5' }}
          />
        </div>
        {/* Fixed ID column */}
        <div style={{ width: FIXED_ID_WIDTH, minWidth: FIXED_ID_WIDTH, flexShrink: 0, flexGrow: 0 }}>
          <strong>{id}</strong>
        </div>

        {/* Email column */}
        <div style={{
          width: columnWidths.email,
          minWidth: MIN_COLUMN_WIDTH,
          flexShrink: 0,
          flexGrow: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {data.email}
        </div>

        {/* Middle columns */}
        {orderedMiddleColumns.map((col) => (
          <div
            key={col.key}
            style={{
              width: columnWidths[col.key],
              minWidth: MIN_COLUMN_WIDTH,
              flexShrink: 0,
              flexGrow: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "left",
            }}
          >
            {getCellContent(col.key)}
          </div>
        ))}

        {/* Status column */}
        <div style={{
          width: columnWidths.status,
          minWidth: MIN_COLUMN_WIDTH,
          flexShrink: 0,
          flexGrow: 0,
          overflow: "hidden"
        }}>
          <select
            style={{
              backgroundColor: "EEE1F7",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: canChangeStatus ? "pointer" : "not-allowed",
              opacity: canChangeStatus ? 1 : 0.6
            }}
            value={data.appStatus}
            onChange={(e) => updateForm(e.target.value as any)}
            disabled={globalLoading || !canChangeStatus}
            className={styles.statusDropdown}
          >
            <option value="waiting">Pending</option>
            <option value="invited">Invited</option>
            <option value="accepted">Accepted</option>
            <option value="waitlist">Waitlisted</option>
            <option value="declined">Declined</option>
          </select>
        </div>

        {/* Actions column - fixed */}
        <div style={{
          width: FIXED_ACTIONS_WIDTH,
          minWidth: FIXED_ACTIONS_WIDTH,
          flexShrink: 0,
          flexGrow: 0,
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <button className={styles.viewBtn} onClick={handleView} style={{fontWeight: "bold"}}>
            {isExpanded ? "Hide" : "View"}
          </button>
        </div>
      </div>

      <div
        className={styles.expandedContent}
        style={{
          maxHeight: isExpanded ? "2000px" : "0",
          opacity: isExpanded ? 1 : 0,
          transition: "max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease",
          padding: isExpanded ? "0px 20px 12px 20px" : "0 20px",
        }}
      >
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <strong>UIN:</strong> {data.uin}
          </div>
          <div className={styles.detailItem}>
            <strong>Gender:</strong> {data.gender}
          </div>
          <div className={styles.detailItem}>
            <strong>Year:</strong> {data.year}
          </div>

          <div style={{ gridColumn: "1 / -1", borderTop: "2px dotted #ccc", margin: "6px 0 4px 0" }}></div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1", fontSize: "16px", marginBottom: "2px" }}>
            <strong>Background</strong>
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <span><strong>Past SparkHacks:</strong> {data.pastSparkHacks}</span>
            <span><strong>Past Projects:</strong> {data.pastProjects}</span>
            <span><strong>Participation:</strong> {data.participationType}</span>
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
            <strong>Past Hackathons:</strong> {data.pastHackathons || "N/A"}
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
            <strong>Heard from:</strong> {data.hearAbout?.join(", ")} {data.otherHearAbout && `(${data.otherHearAbout})`}
          </div>

          <div style={{ gridColumn: "1 / -1", borderTop: "2px dotted #ccc", margin: "6px 0 4px 0" }}></div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1", fontSize: "16px", marginBottom: "2px" }}>
            <strong>Interest & Goals</strong>
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
            <strong>Why interested:</strong> {data.whyInterested || "N/A"}
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
            <strong>Team role:</strong> {data.teamRole || "N/A"}
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <span><strong>Project interests:</strong> {data.projectInterest?.join(", ")}</span>
            <span><strong>Main goals:</strong> {data.mainGoals?.join(", ")}</span>
          </div>

          <div style={{ gridColumn: "1 / -1", borderTop: "2px dotted #ccc", margin: "6px 0 4px 0" }}></div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1", fontSize: "16px", marginBottom: "2px" }}>
            <strong>Skills (1-5)</strong>
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <span><strong>Git:</strong> {data.skillGit}</span>
            <span><strong>Figma:</strong> {data.skillFigma}</span>
            <span><strong>React:</strong> {data.skillReact}</span>
            <span><strong>Python:</strong> {data.skillPython}</span>
            <span><strong>Database:</strong> {data.skillDatabase}</span>
            <span><strong>CI/CD:</strong> {data.skillCICD}</span>
            <span><strong>APIs:</strong> {data.skillAPIs}</span>
          </div>

          <div style={{ gridColumn: "1 / -1", borderTop: "2px dotted #ccc", margin: "6px 0 4px 0" }}></div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1", fontSize: "16px", marginBottom: "2px" }}>
            <strong>Attendance</strong>
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <span><strong>Availability:</strong> {data.availability}</span>
            <span><strong>Team:</strong> {data.teamPlan}</span>
            <span><strong>Diet:</strong> {data.dietaryRestriction?.join(", ")} {data.otherDietaryRestriction && `(${data.otherDietaryRestriction})`}</span>
            <span><strong>Crewneck:</strong> {data.crewneckSize}</span>
          </div>
          {data.moreAvailability && (
            <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
              <strong>Availability details:</strong> {data.moreAvailability}
            </div>
          )}
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
            <strong>Workshops:</strong> {data.preWorkshops?.join(", ")}
          </div>

          <div style={{ gridColumn: "1 / -1", borderTop: "2px dotted #ccc", margin: "6px 0 4px 0" }}></div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1", fontSize: "16px", marginBottom: "2px" }}>
            <strong>Career</strong>
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
            <strong>Job type:</strong> {data.jobType} {data.otherJobType && `(${data.otherJobType})`}
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
            <strong>Resume:</strong> {data.resumeLink ? <a href={data.resumeLink} target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>{data.resumeLink}</a> : "N/A"}
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
            <strong>LinkedIn:</strong> {data.linkedinUrl ? <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>{data.linkedinUrl}</a> : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
