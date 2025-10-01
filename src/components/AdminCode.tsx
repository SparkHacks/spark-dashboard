import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { collection, doc, getCountFromServer, getDoc, query, where} from "firebase/firestore"
import { db } from "../firebase/client"
import { toast, ToastContainer } from 'react-toastify';
import "./AdminCode.css"

const createConfig = (props: any) => {
  let config: any = {};
  if (props.fps) {
      config.fps = props.fps;
  }
  if (props.qrbox) {
      config.qrbox = props.qrbox;
  }
  if (props.aspectRatio) {
      config.aspectRatio = props.aspectRatio;
  }
  if (props.disableFlip !== undefined) {
      config.disableFlip = props.disableFlip;
  }
  return config;
};

const QrcodePlugin = (props: any) => {
  useEffect(() => {
    // when component mounts
    const config = createConfig(props);
    const verbose = props.verbose === true;
    // Suceess callback is required.
    if (!(props.qrCodeSuccessCallback)) {
        throw "qrCodeSuccessCallback is required callback.";
    }
    const html5QrcodeScanner = new Html5QrcodeScanner("qrcodeRegionId", config, verbose);

    function success(...args: any[]) {
      props.qrCodeSuccessCallback(...args);
      html5QrcodeScanner.pause()
      window.setTimeout(() => {
        html5QrcodeScanner.resume()
      }, 1000)
    }

    html5QrcodeScanner.render(success, props.qrCodeErrorCallback);

    // cleanup function when component will unmount
    return () => {
        html5QrcodeScanner.clear().catch(error => {
            console.error("Failed to clear html5QrcodeScanner. ", error);
        });
    };
  }, []);

  return (
    <div>
      <div id="qrcodeRegionId"></div>
    </div>
  )
}

let timeoutId: ReturnType<typeof setTimeout>;
function debounce(cb: Function, delay: number) {
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      cb(...args);
    }, delay);
  };
}

const checkboxInputs = ["d1Snack", "d1Dinner", "d1Cookies", "d1Here", "d2Breakfast", "d2Lunch", "d2Dinner", "d2Here"]
export default function AdminCode() {
  const [userInfo, setUserInfo] = useState<any | null>(null)
  const [errMsg, setErrMsg] = useState("")
  const [summary, setSummary] = useState<any | null>("")
  const emailRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const getUser = async (code: string) => {
    try {
      if(code === emailRef.current) return
      const docRef = doc(db, "Forms", code)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        alert("doc not exist")
        return
      } 

      const userData = docSnap.data()
      emailRef.current = userData.email
      setUserInfo(userData)
      toast.info(`Scanned user ${userData.email}: ${userData.firstName} ${userData.lastName}`)
      setErrMsg("")
      checkboxInputs.forEach((input) => [...document.querySelectorAll(`[data-id="${input}"]`)].forEach((el: any) => { el.checked = userData[input] }))        
    } catch(e: any) {
      // Prevent spamming
      emailRef.current = code
      console.log(e)
      toast.error("Error scanning user", e)
      setUserInfo(null)
    }
  }

  function searchUser() {
    const email = inputRef.current?.value
    if (!email) {
      setErrMsg("Empty email")
      toast.error("Empty email")
      return
    }

    let regex = /^[a-zA-Z0-9._%+-]+@uic\.edu$/
    let regex2 = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
    if (!regex.test(email) && !regex2.test(email)) {
      toast.error("Please enter full uic.edu or gmail.com email")
      setErrMsg("Please enter full uic.edu or gmail.com email")
      return
    }

    getUser(email)
  }

  async function submitFoodData() {
    if (!userInfo) {
      toast.error("No user info")
      return
    }

    if (userInfo.appStatus !== "fullyAccepted") {
      toast.error("User is not fully accepted!")
      return
    }

    const data = [...document.querySelectorAll("#formUpdated input")].reduce((acc: any, curr: any) => (acc[curr.name] = curr.checked, acc), {})

    const oldData = [...document.querySelectorAll("#formCur input")].reduce((acc: any, curr: any) => (acc[curr.id] = curr.checked, acc), {})

    if ((data.d1Cookies === oldData.d1CookiesCur) && (data.d1Dinner === oldData.d1DinnerCur) && (data.d1Snack === oldData.d1SnackCur) && (data.d1Here === oldData.d1HereCur)
      && (data.d2Breakfast === oldData.d2BreakfastCur) && (data.d2Dinner === oldData.d2DinnerCur) && (data.d2Lunch === oldData.d2LunchCur) && (data.d2Here === oldData.d2HereCur)
    ) {
      toast.error("No change")
      return
    }

    // can get day 2's food when day 2 is checked
    if ((!oldData.d2HereCur) && (data.d2Breakfast || data.d2Lunch || data.d2Dinner)) {
      toast.error("Attempt to check day2's food but havent checkin Day 2 yet. Make sure to checkin to get merch!")
      return
    }

    if ((!data.d2Here) && (data.d2Breakfast || data.d2Lunch || data.d2Dinner)) {
      toast.error("Cannot do: check day2's food and uncheck day2's checkin")
      return
    }

    data.email = userInfo.email
    try {
      const response = await fetch("/api/auth/update-food", {
        method: "POST",
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        toast.error("Failed to update food data")
        return
      }
      toast.success("Updated Food data!")
      checkboxInputs.forEach((input) => [...document.querySelectorAll(`[data-id="${input}"]`)].forEach((el: any) => { el.checked = data[input] }))
      document.body.animate({ backgroundColor: ["white", "#8d6db5", "white"] }, 500); // Add dramatic flash so people can tell they checked in

      // update summary
      // try {
      //   const checkinData = await getNumCheckin()
      //   setSummary(checkinData)
      // }
      // catch (err) {
      //   console.error(err)
      //   toast.error("Something is wrong with getting checkin summary")
      // }
    } catch(e) {
      toast.error("Failed to update food data")
    }
  }

  const handleRefresh = async () => {
    try {
      const checkinData = await getSummaryStats()
      setSummary(checkinData)
    }
    catch (err) {
      console.error(err)
      toast.error("Something is wrong with getting checkin summary")
    }
  }

  const handleClearSearch = () => {
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    setUserInfo(null)
    emailRef.current = null
    checkboxInputs.forEach((input) => [...document.querySelectorAll(`[data-id="${input}"]`)].forEach((el: any) => { el.checked = false }))
  }

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const checkinData = await getSummaryStats()
        setSummary(checkinData)
      }
      catch (err) {
        console.error(err)
        toast.error("Something is wrong with getting checkin summary")
      }
    }
    fetchSummary()
  }, [])

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
      <div style={{display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between"}}>
        <h1>QR Scanner</h1>
        <div style={{ justifyContent: "center",  gap: "10px"}}>
          <input placeholder="Search Applicant Email" id="applicant-search" ref={inputRef} onKeyDown={(e) => {
            if (e.key === "Enter") {
              searchUser()
            } else if (e.key === "Escape") {
              handleClearSearch()
            }
          }}/>
        </div>
      </div>
      {!!errMsg && <span style={{color: "red", fontWeight: "bold", textAlign: "center"}}>Error: {errMsg}</span>}
      <QrcodePlugin
        fps={10}
        qrbox={250}
        disableFlip={false}
        qrCodeSuccessCallback={getUser}
      />
      {<div>
        <h2>Edit Applicant</h2>

        <div id="edit-applicant-container">
          <div id="applicant-info" style={{backgroundColor: userInfo?.appStatus == "fullyAccepted" ? "var(--applicant-accepted)" : "var(--applicant-rejected)"}}>
            {!userInfo ? 
              <span style={{fontStyle: "italic"}}>No applicant selected</span> : 
              <>
                <h1>{userInfo?.firstName} {userInfo?.lastName}</h1>
                <p>{userInfo?.email}</p>
                <p>{userInfo?.appStatus}</p>
                <p>Shirt Size {userInfo?.shirtSize}</p>
              </>
            }
          </div>
          <div id="form">
            <div className="form-state" id="formCur">
              <h3>Current</h3>
              <div className="form-day day1">
                <input disabled name="d1HereCur" id="d1HereCur" type="checkbox" data-id="d1Here"/>
                <label htmlFor="d1HereCur">Check-in</label>

                <input disabled name="d1SnackCur" id="d1SnackCur" type="checkbox" data-id="d1Snack"/>
                <label htmlFor="d1SnackCur">Snack</label>

                <input disabled name="d1DinnerCur" id="d1DinnerCur" type="checkbox" data-id="d1Dinner"/>
                <label htmlFor="d1DinnerCur">Dinner</label>
                
                <input disabled name="d1CookiesCur" id="d1CookiesCur" type="checkbox" data-id="d1Cookies"/>
                <label htmlFor="d1CookiesCur">Cookies</label>
              </div>
              <div className="form-day day2">
                <input disabled name="d2HereCur" id="d2HereCur" type="checkbox" data-id="d2Here"/>
                <label htmlFor="d2HereCur">Check-in</label>

                <input disabled name="d2BreakfastCur" id="d2BreakfastCur" type="checkbox" data-id="d2Breakfast"/>
                <label htmlFor="d2BreakfastCur">Breakfast</label>

                <input disabled name="d2LunchCur" id="d2LunchCur" type="checkbox" data-id="d2Lunch"/>
                <label htmlFor="d2LunchCur">Lunch</label>

                <input disabled name="d2DinnerCur" id="d2DinnerCur" type="checkbox" data-id="d2Dinner"/>
                <label htmlFor="d2DinnerCur">Dinner</label>
              </div>
            </div>

            <div className="form-state" id="formUpdated">
              <h3>Updated</h3>
              <div className="form-day day1">
                <input name='d1Here' id="d1Here"  type="checkbox" data-id="d1Here"/>
                <label htmlFor="d1Here">Check-in</label>

                <input name='d1Snack' id="d1Snack"  type="checkbox" data-id="d1Snack"/>
                <label htmlFor="d1Snack">Snack</label>

                <input name='d1Dinner' id="d1Dinner" type="checkbox" data-id="d1Dinner"/>
                <label htmlFor="d1Dinner">Dinner</label>

                <input name='d1Cookies' id="d1Cookies" type="checkbox" data-id="d1Cookies"/>
                <label htmlFor="d1Cookies">Cookies</label>
              </div>
              <div className="form-day day2">
                <input name='d2Here' id="d2Here"  type="checkbox" data-id="d2Here"/>
                <label htmlFor="d2Here">Check-in</label>

                <input name='d2Breakfast' id="d2Breakfast" type="checkbox" data-id="d2Breakfast"/>
                <label htmlFor="d2Breakfast">Breakfast</label>

                <input name='d2Lunch' id="d2Lunch" type="checkbox" data-id="d2Lunch"/>
                <label htmlFor="d2Lunch">Lunch</label>

                <input name='d2Dinner' id="d2Dinner" type="checkbox" data-id="d2Dinner"/>
                <label htmlFor="d2Dinner">Dinner</label>
              </div>
            </div>
          </div>
          {/* <h3 style={{marginBottom: "0px"}}>Old Food Data</h3> */}
          {/* <div id="formOld1" style={{display: 'flex', flexDirection: 'row', gap: '10px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              <span>Day 1:</span>
              <div>
                <input name='d1HereOld' id="d1HereOld"  type="checkbox" data-id="d1Here" disabled />
                <label htmlFor="d1HereOld">Day 1 Here?</label>
              </div>
              <div>
                <input id="d1SnackOld" disabled type="checkbox" data-id="d1Snack"/>
                <label htmlFor="d1SnackOld">Ate Snack?</label>
              </div>
              <div>
                <input id="d1DinnerOld" disabled type="checkbox" data-id="d1Dinner"/>
                <label htmlFor="d1DinnerOld">Ate Dinner?</label>
              </div>
              <div>
                <input id="d1CookiesOld" disabled type="checkbox" data-id="d1Cookies"/>
                <label htmlFor="d1CookiesOld">Ate Cookies?</label>
              </div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 0 10px 0'}}>
              <span>Day 2:</span>
              <div>
                <input name='d2HereOld' id="d2HereOld"  type="checkbox" data-id="d2Here" disabled/>
                <label htmlFor="d2HereOld">Day 2 Here?</label>
              </div>
              <div>
                <input id="d2BreakfastOld" disabled type="checkbox" data-id="d2Breakfast"/>
                <label htmlFor="d2BreakfastOld">Ate Breakfast?</label>
              </div>
              <div>
                <input id="d2LunchOld" disabled type="checkbox" data-id="d2Lunch"/>
                <label htmlFor="d2LunchOld">Ate Lunch?</label>
              </div>
              <div>
                <input id="d2DinnerOld" disabled type="checkbox" data-id="d2Dinner"/>
                <label htmlFor="d2DinnerOld">Ate Dinner?</label>
              </div>
            </div>
          </div> */}
          <button id="submit-food-data" onClick={submitFoodData} disabled={userInfo === null}>Save</button>
        </div>
      </div>}
      <section>
        <div style={{display: "flex"}}>
          <h2>Summary</h2>
          <button onClick={handleRefresh} style={{padding: "8px 16px", margin: "15px"}}>Refresh</button>
        </div>
        <div id="summary-stats">
          <h3>Day 1</h3>
          <div className="summary-item day1">Check-in<span>{summary.d1Here || 0}</span></div>
          <div className="summary-item day1">Snack<span>{summary.d1Snack || 0}</span></div>
          <div className="summary-item day1">Dinner<span>{summary.d1Dinner || 0}</span></div>
          <div className="summary-item day1">Cookies<span>{summary.d1Cookies || 0}</span></div>

          <h3>Day 2</h3>
          <div className="summary-item day2">Check-in<span>{summary.d2Here || 0}</span></div>
          <div className="summary-item day2">Breakfast<span>{summary.d2Breakfast || 0}</span></div>
          <div className="summary-item day2">Lunch<span>{summary.d2Lunch || 0}</span></div>
          <div className="summary-item day2">Dinner<span>{summary.d2Dinner || 0}</span></div>
        </div>
      </section>
      <ToastContainer />
    </div>
  )
}

const getSummaryStats = async () => {
  const d1Here = (await getCountFromServer(query(collection(db, "Forms"), where("d1Here", "==", true)))).data().count
  const d1Snack = (await getCountFromServer(query(collection(db, "Forms"), where("d1Snack", "==", true)))).data().count
  const d1Dinner = (await getCountFromServer(query(collection(db, "Forms"), where("d1Dinner", "==", true)))).data().count
  const d1Cookies = (await getCountFromServer(query(collection(db, "Forms"), where("d1Cookies", "==", true)))).data().count

  const d2Here = (await getCountFromServer(query(collection(db, "Forms"), where("d2Here", "==", true)))).data().count
  const d2Breakfast = (await getCountFromServer(query(collection(db, "Forms"), where("d2Breakfast", "==", true)))).data().count
  const d2Lunch = (await getCountFromServer(query(collection(db, "Forms"), where("d2Lunch", "==", true)))).data().count
  const d2Dinner = (await getCountFromServer(query(collection(db, "Forms"), where("d2Dinner", "==", true)))).data().count

  return {
    d1Here,
    d1Snack,
    d1Dinner,
    d1Cookies,
    d2Here,
    d2Breakfast,
    d2Lunch,
    d2Dinner
  }
}