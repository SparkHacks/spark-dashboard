import styles from "./styles/AdminTable.module.css";
import { useState } from "react";
import type { FormViewData } from "../../env";
import type { Summary } from "../AdminBoard";

export default function AdminTable({
  datas,
  setDatas,
  view,
  setView,
  setSummary,
  summary,
  allDatas,
}: {
  datas: FormViewData[];
  setDatas: React.Dispatch<React.SetStateAction<FormViewData[]>>;
  view: FormViewData | null;
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>;
  setSummary: React.Dispatch<React.SetStateAction<Summary | null>>;
  summary: Summary | null;
  allDatas: FormViewData[];
}) {
  const [globalLoading, setGlobalLoading] = useState(false);

  return (
    <section className={styles.adminTable}>
      <div className={styles.headerTable}>
        <div className={styles.cellId}>#</div>
        <div className={styles.cellEmail}>Email</div>
        <div className={styles.cellName}>Name</div>
        <div className={styles.cellCreatedAt}>Created At</div>
        <div className={styles.cellAvailability}>Availability</div>
        <div className={styles.cellStatus}>Status</div>
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
  const backgroundColor =
    data.appStatus === "waitlist"
      ? "#f5e3bd"
      : data.appStatus === "declined"
      ? "#f5bdbd"
      : data.appStatus === "accepted"
      ? "#cff5bd"
      : data.appStatus === "userAccepted"
      ? "#bdc3f5"
      : data.appStatus === "fullyAccepted"
      ? "#72f784"
      : "";

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

  const handleFullyAccept = () => {
    data.appStatus !== "fullyAccepted" && updateForm("fullyAccepted");
  };

  const handleAccept = () => {
    data.appStatus !== "accepted" &&
      data.appStatus !== "fullyAccepted" &&
      updateForm("accepted");
  };

  const handleDecline = () => {
    data.appStatus !== "declined" && updateForm("declined");
  };

  const handleWait = () => {
    data.appStatus !== "waiting" && updateForm("waiting");
  };

  const handleWaitlist = () => {
    data.appStatus !== "waitlist" && updateForm("waitlist");
  };

  const handleView = () => {
    if (!view || view.email !== data.email) {
      setView(data);
    } else {
      setView(null);
    }
  };

  return (
    <div
      className={styles.rowTable}
      style={{
        backgroundColor: backgroundColor,
        border: view?.email === data.email ? "3px solid black" : "",
        borderRadius: view?.email === data.email ? "8px" : "",
      }}
    >
      <div className={styles.cellId}>
        <strong>{id}</strong>
      </div>
      <div className={styles.cellEmail}>{data.email}</div>
      <div className={styles.cellName}>
        {data.firstName} {data.lastName}
      </div>
      <div className={styles.cellCreatedAt}>{data.createdAt}</div>
      <div className={styles.cellAvailability}>{data.availability}</div>
      <div className={styles.cellStatus}>{data.appStatus}</div>
      <div className={styles.cellActions}>
        <button
          className={styles.declineBtn}
          disabled={globalLoading || data.appStatus === "declined"}
          onClick={handleDecline}
        >
          Decline
        </button>
        <button
          className={styles.acceptBtn}
          disabled={
            globalLoading ||
            data.appStatus === "accepted" ||
            data.appStatus === "fullyAccepted" ||
            data.appStatus === "userAccepted"
          }
          onClick={handleAccept}
        >
          Accept
        </button>
        <button
          className={styles.waitlistBtn}
          disabled={globalLoading || data.appStatus === "waitlist"}
          onClick={handleWaitlist}
        >
          Waitlist
        </button>
        <button
          className={styles.waitBtn}
          disabled={globalLoading || data.appStatus === "waiting"}
          onClick={handleWait}
        >
          Wait
        </button>
        <button
          className={styles.fullyAcceptBtn}
          disabled={globalLoading || data.appStatus === "fullyAccepted"}
          onClick={handleFullyAccept}
        >
          Fully Accept
        </button>
        <button className={styles.viewBtn} onClick={handleView}>
          View
        </button>
      </div>
    </div>
  );
}
