import { useEffect, useRef, useState } from "react"
import AdminTable from "./components/AdminTable"
import ViewCard from "./components/ViewCard"
import type { FormViewData } from "../env"
import { collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, type DocumentData } from "firebase/firestore"
import { db } from "../firebase/client"

export const PAGE_SIZE = 25

export default function AdminBoard() {

  const [datas, setDatas] = useState<FormViewData[]>([])
  const [page, setPage] = useState(0)
  const [numMax, setNumMax] = useState(false)
  const [afterThis, setAfterThis] = useState<any>(null)
  const [view, setView] = useState<FormViewData | null>(null)
  const [searchEmail, setSearchEmail] = useState("")
  const searchInputRef = useRef(null)

  const handleNext = async () => {
    const newPage = page + 1
    console.log(newPage)
    if (searchEmail !== "") {
      return
    }
    if (numMax) {
      console.log("no more doc")
      if (newPage  * PAGE_SIZE < datas.length) {
        setPage(newPage)
      }
    }
    else {
      if (newPage * PAGE_SIZE == datas.length) { // new limit
        const q = query(collection(db, "Forms"), orderBy("createdAt"), limit(PAGE_SIZE), startAfter(afterThis))
        const qSnap = await getDocs(q)
        if (qSnap.empty) { // if the next query is empty then we reach limit
          console.log("attempting to get new data but there is no new data.")
          setNumMax(true)
          return
        }
        console.log(qSnap.docs)
        const newDatas: FormViewData[] = [...datas]
        qSnap.forEach((doc) => {
          const item = convertDocToFormViewData(doc)
          newDatas.push(item)
        })
        console.log(newDatas)
        setDatas(newDatas)
        setPage(newPage)
        setAfterThis(qSnap.docs[qSnap.docs.length - 1]) // cursor for pagination
        if (qSnap.docs.length < PAGE_SIZE) { // no more documents after
          setNumMax(true)
        }
      }
      else {
        console.log("not new data")
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
      if (!regex.test(searchInputRef.current.value)) {
        alert("Please enter full uic email")
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
      const q = query(collection(db, "Forms"), orderBy("createdAt"), limit(PAGE_SIZE))
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
      const q = query(collection(db, "Forms"), orderBy("createdAt"), limit(PAGE_SIZE))
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
  }, [])

  return (
    <>
      <div style={{textAlign: "center", padding: "10px 10px"}}>
        <div>
          <label>Search Form based on email</label>
          <input placeholder="Type a user's email" ref={searchInputRef}/>
          <button onClick={handleSearch}>Search</button>
          <button onClick={handleClearSearch}>Clear</button>
        </div>
        <button 
          disabled={page === 0 || searchEmail !== ""}
          onClick={handlePrevious}
        >Previous</button>
        <button
          disabled={(numMax && ((page + 1) * PAGE_SIZE > datas.length)) || (searchEmail !== "")}
          onClick={handleNext}
        >Next</button>
      </div>
      <div style={{width: "100%", display: "flex"}}>
        <ViewCard view={view} setView={setView}/>
        <AdminTable datas={datas} setView={setView} page={page} setDatas={setDatas}/> 
      </div>
    </>
  )
}

// convert document data to FormViewData object
const convertDocToFormViewData = (doc: DocumentData) => {
  const docData = doc.data()
  const result: FormViewData = {
    createdAt: docData.createdAt.toDate().toLocaleString(),
    email: docData.email,
    firstName: docData.firstName,
    lastName: docData.lastName,
    uin: docData.uin,
    gender: docData.gender,
    year: docData.year,
    availability: docData.availability,
    moreAvailability: docData.moreAvailability,
    dietaryRestriction: docData.dietaryRestriction,
    shirtSize: docData.shirtSize,
    hackathonPlan: docData.hackathonPlan,
    preWorkshops: docData.preWorkshops,
    workshops: docData.workshops,
    jobType: docData.jobType,
    resumeLink: docData.resumeLink,
    otherQuestion: docData.otherQuestion,
    appStatus: docData.appStatus,
    appResult: docData.appResult
  }
  return result
}