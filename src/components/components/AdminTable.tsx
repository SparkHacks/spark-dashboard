import type { DocumentData, Timestamp } from "firebase-admin/firestore"
import styles from "./styles/AdminTable.module.css"
import { useMemo, useState } from "react"
import type { FormViewData } from "../../env"
import { PAGE_SIZE } from "../AdminBoard"

export default function AdminTable({datas, setView, page, setDatas}: {
  datas: FormViewData[],
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>,
  page: number,
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
          : pageDatas.map((data, id) => <Row key={id} id={page * PAGE_SIZE + id} data={data} setView={setView} setDatas={setDatas} datas={datas}/>)
        }
      </div>
      
    </section>
  )
}

function Row({id, data, setView, setDatas, datas}: {
  id: number,
  data: FormViewData,
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>,
}) {

  const [loading, setLoading] = useState(false)
  // const time_string = time.toLocaleString()
  // console.log(time_string)


  const backgroundColor = (data.appResult === "waitlist")? "#f5e3bd"
    : (data.appResult === "declined")? "#f88378"
    : (data.appResult === "accepted")? "#afd9ae"
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

      const newDatas = [...datas]
      for (const item of newDatas) {
        if (item.email === data.email) {
          item.appResult = updateAction
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

  const handleAccept = () => {
    (data.appResult !== "accepted") && updateForm("accepted")
  }

  const handleDecline = () => {
    (data.appResult !== "declined") && updateForm("declined")
  }

  const handleWait = () => {
    (data.appResult !== "waiting") && updateForm("waiting")
  }

  const handleWaitlist = () => {
    (data.appResult !== "waitlist") && updateForm("waitlist")
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
        {data.appResult}
      </div>
      <div className={styles.cellActions}>
        <button className={styles.declineBtn} disabled={loading || data.appResult === "declined"} onClick={handleDecline}>Decline</button>
        <button className={styles.acceptBtn} disabled={loading || data.appResult === "accepted"} onClick={handleAccept}>Accept</button>
        <button className={styles.waitlistBtn} disabled={loading || data.appResult === "waitlist"} onClick={handleWaitlist}>Waitlist</button>
        <button className={styles.waitBtn} disabled={loading || data.appResult === "waiting"} onClick={handleWait}>Wait</button>
        <button className={styles.viewBtn} onClick={handleView}>View</button>
      </div>
    </div>
  )
}
