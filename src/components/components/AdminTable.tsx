import styles from "./styles/AdminTable.module.css"
import { useMemo, useState } from "react"
import type { FormViewData } from "../../env"
import { PAGE_SIZE } from "../AdminBoard"

export default function AdminTable({datas, setDatas, view, setView, page}: {
  datas: FormViewData[],
  setDatas: React.Dispatch<React.SetStateAction<FormViewData[]>>,
  view: FormViewData | null,
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>,
  page: number
}) {

  const pageDatas = useMemo(() => datas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [page, datas])

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
        {(datas.length === 0)
          ? <div style={{marginTop: "20px", textAlign: "center"}}>No data</div>
          : pageDatas.map((data, id) => <Row key={id} id={page * PAGE_SIZE + id} data={data} view={view} setView={setView} setDatas={setDatas} datas={datas}/>)
        }
      </div>
      
    </section>
  )
}

function Row({id, data, view, setView, setDatas, datas}: {
  id: number,
  data: FormViewData,
  view: FormViewData | null,
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>,
  datas: FormViewData[]
  setDatas: React.Dispatch<React.SetStateAction<FormViewData[]>>,
}) {

  const [loading, setLoading] = useState(false)
  // const time_string = time.toLocaleString()
  // console.log(time_string)


  const backgroundColor = (data.appStatus === "waitlist")? "#f5e3bd"
    : (data.appStatus === "declined")? "#f5bdbd"
    : (data.appStatus === "accepted")? "#cff5bd"
    : (data.appStatus === "userAccepted")? "#bdc3f5" // TODO: choose better color
    : (data.appStatus === "fullyAccepted")? "#72f784" // TODO: choose better color
    : ""

  const updateForm = async (updateAction: "waitlist" | "declined" | "accepted" | "waiting" | "fullyAccepted") => {
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

      const newDatas = [...datas]
      for (const item of newDatas) {
        if (item.email === data.email) {
          item.appStatus = updateAction
          break
        }
      }
      setDatas(newDatas)

    }
    catch (err) {
      console.error(err)
      alert("Error: something is wrong with waitlist data")
    }
    finally {
      setLoading(false)
    }
  }

  const handleFullyAccept = () => {
    (data.appStatus !== "fullyAccepted") && updateForm("fullyAccepted")
  }

  const handleAccept = () => {
    (data.appStatus !== "accepted" && data.appStatus !== "fullyAccepted") && updateForm("accepted")
  }

  const handleDecline = () => {
    (data.appStatus !== "declined") && updateForm("declined")
  }

  const handleWait = () => {
    (data.appStatus !== "waiting") && updateForm("waiting")
  }

  const handleWaitlist = () => {
    (data.appStatus !== "waitlist") && updateForm("waitlist")
  }

  const handleView = () => {
    if (!view || view.email !== data.email) {
      setView(data)
    }
    else {
      setView(null)
    }
  }

  return (
    <div className={styles.rowTable} style={{backgroundColor: backgroundColor, border: (view?.email === data.email) ? "3px solid black" : "", borderRadius: "8px"}}>
      <div className={styles.cellId}><strong>{id}</strong></div>
      <div className={styles.cellEmail}>{data.email}</div>
      <div className={styles.cellName}>{data.firstName} {data.lastName}</div>
      <div className={styles.cellCreatedAt}>{data.createdAt}</div>
      <div className={styles.cellAvailability}>{data.availability}</div>
      <div className={styles.cellStatus}>
        {data.appStatus}
      </div>
      <div className={styles.cellActions}>
        <button className={styles.declineBtn} disabled={loading || data.appStatus === "declined"} onClick={handleDecline}>Decline</button>
        <button className={styles.acceptBtn} disabled={loading || data.appStatus === "accepted" || data.appStatus === "fullyAccepted" || data.appStatus === "userAccepted"} onClick={handleAccept}>Accept</button>
        <button className={styles.waitlistBtn} disabled={loading || data.appStatus === "waitlist"} onClick={handleWaitlist}>Waitlist</button>
        <button className={styles.waitBtn} disabled={loading || data.appStatus === "waiting"} onClick={handleWait}>Wait</button>
        <button className={styles.fullyAcceptBtn} disabled={loading || data.appStatus === "fullyAccepted"} onClick={handleFullyAccept}>Fully Accept</button>
        <button className={styles.viewBtn} onClick={handleView}>View</button>
      </div>
    </div>
  )
}
