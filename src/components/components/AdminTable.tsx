import type { DocumentData, Timestamp } from "firebase-admin/firestore"
import styles from "./styles/AdminTable.module.css"
import { useState } from "react"
import type { FormViewData } from "../../env"

export default function AdminTable({datas, setView}: {
  datas: FormViewData[],
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>,
}) {
  return (
    <section className={styles.adminTable}>
      <div className={styles.headerTable} >
        <div className={styles.cellId}>#</div>
        <div className={styles.cellEmail}>Email</div>
        <div className={styles.cellName}>Name</div>
        <div className={styles.cellCreatedAt}>Created At</div>
        <div className={styles.cellAvailability}>Availability</div>
        <div className={styles.cellStatus}>Status</div>
        <div className={styles.cellActions}></div>
      </div>
      <div className={styles.contentTable}>
        {datas?.map((data, id) => <Row key={id} id={id} data={data} setView={setView}/>)}
      </div>
    </section>
  )
}

function Row({id, data, setView}: {
  id: number,
  data: FormViewData,
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>,
}) {
  const [appResult, setAppResult] = useState(data.appResult)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  // const time_string = time.toLocaleString()
  // console.log(time_string)


  const backgroundColor = (appResult === "waitlist")? "#f5e3bd"
    : (appResult === "declined")? "#f88378"
    : (appResult === "accepted")? "#afd9ae"
    : ""

  const updateForm = async (updateAction: "waitlist" | "declined" | "accepted" | "waiting") => {
    const formData = new FormData()
    formData.set("email", data.email)
    formData.set("updateAction", updateAction)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/update-form", {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        const errorMsg = await res.text()
        alert(`Error: ${errorMsg}`)
        return
      }

      setAppResult(updateAction)
    }
    catch (err) {
      console.error(err)
      alert("Error: something is wrong with waitlist data")
    }
    finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    (appResult !== "accepted") && updateForm("accepted")
  }

  const handleDecline = () => {
    (appResult !== "declined") && updateForm("declined")
  }

  const handleWait = () => {
    (appResult !== "waiting") && updateForm("waiting")
  }

  const handleWaitlist = () => {
    (appResult !== "waitlist") && updateForm("waitlist")
  }

  const handleView = () => {
    setView(data)
  }

  return (
    <div className={styles.rowTable} style={{backgroundColor: backgroundColor}}>
      <div className={styles.cellId}><strong>{id}</strong></div>
      <div className={styles.cellEmail}>{data.email}</div>
      <div className={styles.cellName}>{data.firstName} {data.lastName}</div>
      <div className={styles.cellCreatedAt}>{data.createdAt}</div>
      <div className={styles.cellAvailability}>{data.availability}</div>
      <div className={styles.cellStatus}>
        {appResult}
      </div>
      <div className={styles.cellActions}>
        <button className={styles.declineBtn} disabled={loading || appResult === "declined"} onClick={handleDecline}>Decline</button>
        <button className={styles.acceptBtn} disabled={loading || appResult === "accepted"} onClick={handleAccept}>Accept</button>
        <button className={styles.waitlistBtn} disabled={loading || appResult === "waitlist"} onClick={handleWaitlist}>Waitlist</button>
        <button className={styles.waitBtn} disabled={loading || appResult === "waiting"} onClick={handleWait}>Wait</button>
        <button className={styles.viewBtn} onClick={handleView}>View</button>
      </div>
    </div>
  )
}
