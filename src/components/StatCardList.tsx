import { useEffect, useRef, useState } from "react"
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, startAfter, where, type DocumentData } from "firebase/firestore"
import { db } from "../firebase/client"
import { FORMS_COLLECTION } from "../config/constants"
import StartCard from "./StatCard"

export interface Summary {
  total: number,
  fullyAccepted: number,
  userAccepted: number,
  accepted: number,
  waitlist: number,
  declined: number,
  waiting: number,
}

export default function StatCardList() {
    const [summary, setSummary] = useState<Summary | null>(null)

    useEffect(() => {
        const fetchData = async () => {
          // fetch summary
          const totalCount = (await getCountFromServer(collection(db, FORMS_COLLECTION))).data().count
          const fullyAcceptedCount = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "fullyAccepted")))).data().count
          const userAcceptedCount = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "userAccepted")))).data().count
          const acceptedCount = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "accepted")))).data().count
          const waitlistCount = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "waitlist")))).data().count
          const waitingCount = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "waiting")))).data().count
          const declinedCount = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("appStatus", "==", "declined")))).data().count
          setSummary({
            total: totalCount,
            fullyAccepted: fullyAcceptedCount,
            userAccepted: userAcceptedCount,
            accepted: acceptedCount,
            waitlist: waitlistCount,
            waiting: waitingCount,
            declined: declinedCount,
          })
        }
    
        fetchData().catch(err => {
          console.error(err)
          alert("Something wrong with initial fetch data")
        })
      })

      

    return <div>
        {summary &&
        <section style={{border:"1px solid black"}}>
          <h2>Summary</h2>
          <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: "8px",}}>
            <div><strong>Total:</strong> {summary.total}</div>
            <div><strong>fullyAccepted:</strong> {summary.fullyAccepted}</div>
            <div> <strong>userAccepted:</strong> {summary.userAccepted}</div>
            <div> <strong>accepted:</strong> {summary.accepted}</div>
            <div><strong>waitlist:</strong> {summary.waitlist}</div>
            <div> <strong>declined:</strong> {summary.declined}</div>
            <div><strong>waiting:</strong> {summary.waiting}</div>
          </div>
        </section>
      }</div>;

}