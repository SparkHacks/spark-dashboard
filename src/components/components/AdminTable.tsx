import styles from "./styles/AdminTable.module.css";
import { useState } from "react";
import type { FormViewData } from "../../env";
import type { Summary, SortField, SortDirection } from "../AdminBoard";
import { STATUS_COLORS } from "../AdminBoard";

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
}) {
  const [globalLoading, setGlobalLoading] = useState(false);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{ marginLeft: "4px", opacity: 0.3 }}
        >
          <path d="M6 3 L9 6 L3 6 Z" fill="currentColor" />
          <path d="M6 9 L9 6 L3 6 Z" fill="currentColor" />
        </svg>
      );
    }
    if (sortDirection === "asc") {
      return (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{ marginLeft: "4px" }}
        >
          <path d="M6 3 L9 6 L3 6 Z" fill="currentColor" />
        </svg>
      );
    }
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        style={{ marginLeft: "4px" }}
      >
        <path d="M6 9 L9 6 L3 6 Z" fill="currentColor" />
      </svg>
    );
  };

  return (
    <section className={styles.adminTable}>
      <div className={styles.headerTable}>
        <div className={styles.cellId}>#</div>
        <div
          className={`${styles.cellEmail} ${styles.sortableHeader}`}
          onClick={() => onSort("email")}
        >
          Email
          <SortIcon field="email" />
        </div>
        <div
          className={`${styles.cellName} ${styles.sortableHeader}`}
          onClick={() => onSort("name")}
        >
          Name
          <SortIcon field="name" />
        </div>
        <div
          className={`${styles.cellCreatedAt} ${styles.sortableHeader}`}
          onClick={() => onSort("createdAt")}
        >
          Created At
          <SortIcon field="createdAt" />
        </div>
        <div
          className={`${styles.cellAvailability} ${styles.sortableHeader}`}
          onClick={() => onSort("availability")}
        >
          Availability
          <SortIcon field="availability" />
        </div>
        <div
          className={`${styles.cellStatus} ${styles.sortableHeader}`}
          onClick={() => onSort("appStatus")}
        >
          Status
          <SortIcon field="appStatus" />
        </div>
        <div className={styles.cellActions}></div>
      </div>

      <div className={styles.contentTable}>
        {datas.length === 0 ? (
          <div style={{ marginTop: "20px", textAlign: "center" }}>No data</div>
        ) : (
          datas.map((data, id) => (
            <Row
              key={data.email}
              id={id + 1}
              data={data}
              view={view}
              setView={setView}
              setDatas={setDatas}
              datas={allDatas}
              summary={summary}
              setSummary={setSummary}
              globalLoading={globalLoading}
              setGlobalLoading={setGlobalLoading}
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
}) {
  const backgroundColor = STATUS_COLORS[data.appStatus] || STATUS_COLORS.waiting;

  const updateForm = async (
    updateAction:
      | "waitlist"
      | "declined"
      | "accepted"
      | "waiting"
      | "fullyAccepted"
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
        | "waitlist"
        | "declined"
        | "accepted"
        | "waiting"
        | "fullyAccepted"
        | "userAccepted";
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

  return (
    <div
      className={styles.rowContainer}
      style={{
        backgroundColor: backgroundColor,
        borderRadius: "15px",
        border: isExpanded ? "3px solid black" : "none",
        marginBottom: "8px",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      <div className={styles.rowTable} style={{ fontWeight: 600 }}>
        <div className={styles.cellId}>
          <strong>{id}</strong>
        </div>
        <div className={styles.cellEmail}>{data.email}</div>
        <div className={styles.cellName}>
          {data.firstName} {data.lastName}
        </div>
        <div className={styles.cellCreatedAt}>{data.createdAt}</div>
        <div className={styles.cellAvailability}>{data.availability}</div>
        <div className={styles.cellStatus}>
          <select
            style={{
              backgroundColor: "EEE1F7",
              borderRadius: "10px",
              fontWeight: "bold"
            }}
            value={data.appStatus}
            onChange={(e) => updateForm(e.target.value as any)}
            disabled={globalLoading}
            className={styles.statusDropdown}
          >
            <option value="waiting">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="waitlist">Waitlisted</option>
            <option value="declined">Declined</option>
            <option value="userAccepted">Invited</option>
            <option value="fullyAccepted">Confirmed</option>
          </select>
        </div>
        <div className={styles.cellActions}>
          <button className={styles.viewBtn} onClick={handleView} style={{fontWeight: "bold"}}>
            {isExpanded ? "Hide" : "View"}
          </button>
        </div>
      </div>

      <div
        className={styles.expandedContent}
        style={{
          maxHeight: isExpanded ? "1000px" : "0",
          opacity: isExpanded ? 1 : 0,
          transition: "max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease",
          padding: isExpanded ? "0px 20px 20px 20px" : "0 20px", 
        }}
      >
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <strong>Application Status:</strong> {data.appStatus}
          </div>
          <div className={styles.detailItem}>
            <strong>Submitted at:</strong> {data.createdAt}
          </div>
          <div className={styles.detailItem}>
            <strong>Email:</strong> {data.email}
          </div>
          <div className={styles.detailItem}>
            <strong>UIN:</strong> {data.uin}
          </div>
          <div className={styles.detailItem}>
            <strong>Gender:</strong> {data.gender}
          </div>
          <div className={styles.detailItem}>
            <strong>Year:</strong> {data.year}
          </div>
          <div className={styles.detailItem}>
            <strong>Availability:</strong> {data.availability}
          </div>
          <div className={styles.detailItem}>
            <strong>More availability:</strong> {data.moreAvailability}
          </div>
          <div className={styles.detailItem}>
            <strong>Dietary Restriction:</strong>
            <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
              {data.dietaryRestriction?.map((diet, idx) => <li key={idx}>{diet}</li>)}
            </ul>
          </div>
          <div className={styles.detailItem}>
            <strong>Other Dietary Restriction:</strong> {data.otherDietaryRestriction}
          </div>
          <div className={styles.detailItem}>
            <strong>T-shirt size:</strong> {data.shirtSize}
          </div>
          <div className={styles.detailItem}>
            <strong>Team plan:</strong> {data.teamPlan}
          </div>
          <div className={styles.detailItem}>
            <strong>Pre workshops:</strong>
            <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
              {data.preWorkshops?.map((preW, idx) => <li key={idx}>{preW}</li>)}
            </ul>
          </div>
          <div className={styles.detailItem}>
            <strong>Job type:</strong> {data.jobType}
          </div>
          <div className={styles.detailItem}>
            <strong>Other Job type:</strong> {data.otherJobType}
          </div>
          <div className={styles.detailItem}>
            <strong>Resume link:</strong> <a href={data.resumeLink} target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>{data.resumeLink}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
