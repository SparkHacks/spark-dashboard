import { useEffect, useRef, useState } from "react"
import AdminTable from "./components/AdminTable"
import ViewCard from "./components/ViewCard"
import type { FormViewData } from "../env"
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, startAfter, where, type DocumentData } from "firebase/firestore"
import { db } from "../firebase/client"

export const PAGE_SIZE = 50

export interface Summary {
  total: number,
  fullyAccepted: number,
  userAccepted: number,
  accepted: number,
  waitlist: number,
  declined: number,
  waiting: number,
}

export type Mode = "everything" | "fullyAccepted" | "userAccepted" | "accepted" | "waitlist" | "waiting" | "declined"

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  borderRadius: "5px",
  cursor: "pointer",
  backgroundColor: "white",
  border: "1px solid black",
}

export default function AdminBoard() {

  const [datas, setDatas] = useState<FormViewData[]>([])
  const [page, setPage] = useState(0)
  const [numMax, setNumMax] = useState(false)
  const [afterThis, setAfterThis] = useState<any>(null)
  const [view, setView] = useState<FormViewData | null>(null)
  const [searchEmail, setSearchEmail] = useState("")
  const searchInputRef = useRef(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [mode, setMode] = useState<Mode>("everything")

  const totalPage = (summary)
    ? (mode === "everything") 
      ? getTotalPages(summary.total, PAGE_SIZE)
      : getTotalPages(summary[mode], PAGE_SIZE)
    : 0

  const isHighlight = (curMode: Mode) => (curMode === mode)? {border: "4px solid"} : {}  
  
  const handleNext = async () => {
    const newPage = page + 1
    if (searchEmail !== "") {
      return
    }
    if (numMax) {
      // console.log("no more doc")
      if (newPage  * PAGE_SIZE < datas.length) {
        setPage(newPage)
      }
    }
    else {
      if (newPage * PAGE_SIZE == datas.length) { // new limit
        const q = (mode === "everything")
          ? query(collection(db, "Forms"), orderBy("createdAt"), limit(PAGE_SIZE), startAfter(afterThis))
          : query(collection(db, "Forms"), where("appStatus", "==", mode), orderBy("createdAt"), limit(PAGE_SIZE), startAfter(afterThis))
        const qSnap = await getDocs(q)
        if (qSnap.empty) { // if the next query is empty then we reach limit
          // console.log("attempting to get new data but there is no new data.")
          setNumMax(true)
          return
        }
        // console.log(qSnap.docs)
        const newDatas: FormViewData[] = [...datas]
        qSnap.forEach((doc) => {
          const item = convertDocToFormViewData(doc)
          newDatas.push(item)
        })
        // console.log(newDatas)
        setDatas(newDatas)
        setPage(newPage)
        setAfterThis(qSnap.docs[qSnap.docs.length - 1]) // cursor for pagination
        if (qSnap.docs.length < PAGE_SIZE) { // no more documents after
          setNumMax(true)
        }
      }
      else {
        // console.log("not new data")
        setPage(newPage)
      }
    }
  }

  const handlePrevious = () => {
    if (searchEmail !== "") {
      return
    }
    if (page > 0) {
      setPage(page - 1)
    } 
  }
  const handleSearch = async () => {
    if (!searchInputRef.current) return
    try {
      let regex = /^[a-zA-Z0-9._%+-]+@uic\.edu$/
      let regex2 = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
      if (!regex.test(searchInputRef.current.value) && !regex2.test(searchInputRef.current.value)) {
        alert("Please enter full uic.edu email or gmail.com email")
        return
      }
      if (searchEmail !== searchInputRef.current.value) {
        const docSnap = await getDoc(doc(db, "Forms", searchInputRef.current.value))
        if (!docSnap.exists()) {
          alert("doc not exist")
          return
        }

        setSearchEmail(searchInputRef.current.value)
        setDatas([convertDocToFormViewData(docSnap)])
        setAfterThis(null)
        setPage(0)
        setNumMax(true)
        setView(null)
      }
    }
    catch (err) {
      console.error(err)
      alert("Something is wrong with search")
      console.error("something is wrong with search")
    }
  }

  const handleClearSearch = async () => {
    if (!searchInputRef.current) return
    try {
      searchInputRef.current.value = ""
      setSearchEmail("")
      if (searchEmail === "") return
      const q = (mode === "everything")
        ? query(collection(db, "Forms"), orderBy("createdAt"), limit(PAGE_SIZE))
        : query(collection(db, "Forms"), where("appStatus", "==", mode), orderBy("createdAt"), limit(PAGE_SIZE))
      const qSnap = await getDocs(q)
      const newDatas: FormViewData[] = []
      qSnap.forEach((doc) => {
        const item = convertDocToFormViewData(doc)
        newDatas.push(item)
      })
      setDatas(newDatas)
      setAfterThis(qSnap.docs[qSnap.docs.length - 1]) // cursor for pagination
      if (qSnap.docs.length < PAGE_SIZE) { // no more documents after
        setNumMax(true)
      }
      else {
        setNumMax(false)
      }
      setView(null)
      setPage(0)
    }
    catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {

      // reset: page -> 0, searchEmail -> "", numMax -> false
      setPage(0)
      setNumMax(false)
      if (searchInputRef.current) {
        searchInputRef.current.value = ""  
      }
      setSearchEmail("")
      setDatas([])
      setAfterThis(null)

      // fetch summary
      const totalCount = (await getCountFromServer(collection(db, "Forms"))).data().count
      const fullyAcceptedCount = (await getCountFromServer(query(collection(db, "Forms"), where("appStatus", "==", "fullyAccepted")))).data().count
      const userAcceptedCount = (await getCountFromServer(query(collection(db, "Forms"), where("appStatus", "==", "userAccepted")))).data().count
      const acceptedCount = (await getCountFromServer(query(collection(db, "Forms"), where("appStatus", "==", "accepted")))).data().count
      const waitlistCount = (await getCountFromServer(query(collection(db, "Forms"), where("appStatus", "==", "waitlist")))).data().count
      const waitingCount = (await getCountFromServer(query(collection(db, "Forms"), where("appStatus", "==", "waiting")))).data().count
      const declinedCount = (await getCountFromServer(query(collection(db, "Forms"), where("appStatus", "==", "declined")))).data().count
      setSummary({
        total: totalCount,
        fullyAccepted: fullyAcceptedCount,
        userAccepted: userAcceptedCount,
        accepted: acceptedCount,
        waitlist: waitlistCount,
        waiting: waitingCount,
        declined: declinedCount,
      })

      // fetch first PAGE_SIZE documents
      const q = (mode === "everything") 
        ? query(collection(db, "Forms"), orderBy("createdAt"), limit(PAGE_SIZE)) 
        : query(collection(db, "Forms"), where("appStatus", "==", mode), orderBy("createdAt"), limit(PAGE_SIZE))
      const qSnap = await getDocs(q)
      const newDatas: FormViewData[] = []
      qSnap.forEach((doc) => {
        const item = convertDocToFormViewData(doc)
        newDatas.push(item)
      })
      setDatas(newDatas)
      setAfterThis(qSnap.docs[qSnap.docs.length - 1]) // cursor for pagination
      if (qSnap.docs.length < PAGE_SIZE) { // no more documents after
        setNumMax(true)
      }
    }

    fetchData().catch(err => {
      console.error(err)
      alert("Something wrong with initial fetch data")
    })
  }, [mode])

  return (
    <>
      <div style={{textAlign: "center", padding: "10px 10px"}}>
        <div style={{display: "flex", justifyContent: "center", gap: "10px", paddingBottom: "10px"}}>
          <label>Search Form based on email</label>
          <input placeholder="Type a user's email" ref={searchInputRef}/>
          <button onClick={handleSearch}>Search</button>
          <button onClick={handleClearSearch}>Clear</button>
        </div>
        <div style={{marginBottom: "10px"}}>
          <h2>Mode: {mode}</h2>
          <div>
            <button style={isHighlight("everything")} onClick={() => setMode("everything")}>Everything</button>
            <button style={isHighlight("fullyAccepted")} onClick={() => setMode("fullyAccepted")}>Only FullyAccepted</button>
            <button style={isHighlight("userAccepted")} onClick={() => setMode("userAccepted")}>Only UserAccepted</button>
            <button style={isHighlight("accepted")} onClick={() => setMode("accepted")}>Only Accepted</button>
            <button style={isHighlight("waitlist")} onClick={() => setMode("waitlist")}>Only Waitlist</button>
            <button style={isHighlight("waiting")} onClick={() => setMode("waiting")}>Only Waiting</button>
            <button style={isHighlight("declined")} onClick={() => setMode("declined")}>Only Declined</button>
          </div>
        </div>
        <div style={{display: "flex", gap: "10px", justifyContent: "center", alignItems: "center"}}>
          <h2>Page: {page + 1}/{totalPage}</h2>
          <button 
            disabled={page === 0 || searchEmail !== ""}
            onClick={handlePrevious}
          >Previous</button>
          <button
            disabled={(numMax && ((page + 1) * PAGE_SIZE > datas.length)) || (searchEmail !== "")}
            onClick={handleNext}
          >Next</button>
        </div>
      </div>
      {summary &&
        <section style={{margin: "8px", padding: "8px", border: "1px solid black", borderRadius: "8px", boxSizing: "border-box"}}>
          <h2>Summary</h2>
          <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: "8px",}}>
            <div><strong>Total:</strong> {summary.total}</div>
            <div><Dot backgroundColor="#72f784"/> <strong>fullyAccepted:</strong> {summary.fullyAccepted}</div>
            <div><Dot backgroundColor="#bdc3f5"/> <strong>userAccepted:</strong> {summary.userAccepted}</div>
            <div><Dot backgroundColor="#cff5bd"/> <strong>accepted:</strong> {summary.accepted}</div>
            <div><Dot backgroundColor="#f5e3bd"/> <strong>waitlist:</strong> {summary.waitlist}</div>
            <div><Dot backgroundColor="#f5bdbd"/> <strong>declined:</strong> {summary.declined}</div>
            <div><Dot backgroundColor="white"/> <strong>waiting:</strong> {summary.waiting}</div>
          </div>
        </section>
      }
      <div style={{width: "100%", display: "flex"}}>
        <ViewCard view={view} setView={setView}/>
        <AdminTable datas={datas} view={view} setView={setView} page={page} setDatas={setDatas} setSummary={setSummary} summary={summary}/> 
      </div>
    </>
  )
}


function Dot({backgroundColor}: {
  backgroundColor: string
}) {
  return (
    <div style={{backgroundColor: backgroundColor, width: "15px", height: "15px", display: "inline-block", borderRadius: 9999, border: "1px solid black"}}></div>
  )
}

const getTotalPages = (numDocs: number, pageSize: number) => {
  if (numDocs === 0) return 0
  if (numDocs % pageSize === 0) return Math.floor(numDocs / pageSize)
  return Math.floor(numDocs / pageSize) + 1
}

// convert document data to FormViewData object
const convertDocToFormViewData = (doc: DocumentData) => {
  const docData = doc.data()
  const result: FormViewData = {
    createdAt: docData.createdAt.toDate().toLocaleString("en-US", { timeZone: "America/Chicago"}),
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
  }
  return result
}