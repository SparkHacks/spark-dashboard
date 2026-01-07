import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { collection, doc, getCountFromServer, getDoc, query, where} from "firebase/firestore"
import { db } from "../firebase/client"
import { FORMS_COLLECTION } from "../config/constants"
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
      const docRef = doc(db, FORMS_COLLECTION, code)
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

    const data = [...document.querySelectorAll("#form input")].reduce((acc: any, curr: any) => (acc[curr.name] = curr.checked, acc), {})

    const oldData = [...document.querySelectorAll("#formOld1 input")].reduce((acc: any, curr: any) => (acc[curr.id] = curr.checked, acc), {})

    if ((data.d1Cookies === oldData.d1CookiesOld) && (data.d1Dinner === oldData.d1DinnerOld) && (data.d1Snack === oldData.d1SnackOld) && (data.d1Here === oldData.d1HereOld)
      && (data.d2Breakfast === oldData.d2BreakfastOld) && (data.d2Dinner === oldData.d2DinnerOld) && (data.d2Lunch === oldData.d2LunchOld) && (data.d2Here === oldData.d2HereOld)
    ) {
      toast.error("No change")
      return
    }

    // can get day 2's food when day 2 is checked
    if ((!oldData.d2HereOld) && (data.d2Breakfast || data.d2Lunch || data.d2Dinner)) {
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
    <div style={{maxWidth: '700px', width: '100%', padding: '0 15px', boxSizing: 'border-box'}}>
      <QrcodePlugin
        fps={10}
        qrbox={typeof window !== 'undefined' && window.innerWidth < 768 ? 200 : 250}
        disableFlip={false}
        qrCodeSuccessCallback={getUser}
      />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '20px'}}>
        <h3 style={{marginBottom: "0px"}}>Manually Search User</h3>
        <div style={{display: 'flex', gap: '8px', width: '100%', maxWidth: '500px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <input
            type='text'
            placeholder='Enter email'
            ref={inputRef}
            style={{
              padding: '10px 14px',
              fontSize: '14px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s',
              width: '100%',
              maxWidth: '250px',
              minWidth: '200px',
              flex: '1 1 auto'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8d6db5'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          <button
            onClick={searchUser}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: '#8d6db5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              flex: '0 0 auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a5da0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8d6db5'}
          >
            Submit
          </button>
          <button
            onClick={handleClearSearch}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              flex: '0 0 auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
          >
            Clear
          </button>
        </div>
        {!!errMsg && <span style={{color: "red", fontWeight: "bold", textAlign: "center"}}>Error: {errMsg}</span>}
      </div>
      {<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '10px'}}>
        
        <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
          <span><strong>Name: </strong>{userInfo?.firstName} {userInfo?.lastName}</span>
          <span><strong>Status </strong> <span style={{color: userInfo?.appStatus == "fullyAccepted" ? "green" : "red"}}> {userInfo?.appStatus}</span></span>
          <span><strong>Email: </strong>{userInfo?.email}</span>
          <span><strong>Shirt Size: </strong> {userInfo?.shirtSize}</span>
        </div>
        
        <h3 style={{marginBottom: "0px"}}>User Check-In</h3>
        <div id='form' style={{display: 'flex', flexDirection: 'row', gap: '20px', width: '100%', maxWidth: '500px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px', minWidth: '180px'}}>
            <span style={{fontWeight: '700', fontSize: '16px', marginBottom: '4px'}}>Day 1:</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input name='d1Here' id="d1Here" type="checkbox" data-id="d1Here" style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8d6db5'}}/>
              <label htmlFor="d1Here" style={{cursor: 'pointer', fontSize: '14px'}}>Check-In</label>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input name='d1Snack' id="d1Snack" type="checkbox" data-id="d1Snack" style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8d6db5'}}/>
              <label htmlFor="d1Snack" style={{cursor: 'pointer', fontSize: '14px'}}>Snacks</label>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input name='d1Dinner' id="d1Dinner" type="checkbox" data-id="d1Dinner" style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8d6db5'}}/>
              <label htmlFor="d1Dinner" style={{cursor: 'pointer', fontSize: '14px'}}>Dinner</label>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input name='d1Cookies' id="d1Cookies" type="checkbox" data-id="d1Cookies" style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8d6db5'}}/>
              <label htmlFor="d1Cookies" style={{cursor: 'pointer', fontSize: '14px'}}>Cookies</label>
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px', minWidth: '180px'}}>
            <span style={{fontWeight: '700', fontSize: '16px', marginBottom: '4px'}}>Day 2:</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input name='d2Here' id="d2Here" type="checkbox" data-id="d2Here" style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8d6db5'}}/>
              <label htmlFor="d2Here" style={{cursor: 'pointer', fontSize: '14px'}}>Check-In</label>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input name='d2Breakfast' id="d2Breakfast" type="checkbox" data-id="d2Breakfast" style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8d6db5'}}/>
              <label htmlFor="d2Breakfast" style={{cursor: 'pointer', fontSize: '14px'}}>Breakfast</label>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input name='d2Lunch' id="d2Lunch" type="checkbox" data-id="d2Lunch" style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8d6db5'}}/>
              <label htmlFor="d2Lunch" style={{cursor: 'pointer', fontSize: '14px'}}>Lunch</label>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input name='d2Dinner' id="d2Dinner" type="checkbox" data-id="d2Dinner" style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8d6db5'}}/>
              <label htmlFor="d2Dinner" style={{cursor: 'pointer', fontSize: '14px'}}>Dinner</label>
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
        <button
          onClick={submitFoodData}
          disabled={userInfo === null}
          style={{
            marginTop: "20px",
            width: "100%",
            maxWidth: "250px",
            height: "45px",
            marginBottom: "20px",
            fontSize: '16px',
            fontWeight: '700',
            backgroundColor: userInfo === null ? '#cccccc' : '#8d6db5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: userInfo === null ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (userInfo !== null) e.currentTarget.style.backgroundColor = '#7a5da0'
          }}
          onMouseLeave={(e) => {
            if (userInfo !== null) e.currentTarget.style.backgroundColor = '#8d6db5'
          }}
        >
          Submit!
        </button>
      </div>}
      <ToastContainer />
    </div>
  )
}

const getSummaryStats = async () => {
  const d1Here = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("d1Here", "==", true)))).data().count
  const d1Snack = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("d1Snack", "==", true)))).data().count
  const d1Dinner = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("d1Dinner", "==", true)))).data().count
  const d1Cookies = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("d1Cookies", "==", true)))).data().count

  const d2Here = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("d2Here", "==", true)))).data().count
  const d2Breakfast = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("d2Breakfast", "==", true)))).data().count
  const d2Lunch = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("d2Lunch", "==", true)))).data().count
  const d2Dinner = (await getCountFromServer(query(collection(db, FORMS_COLLECTION), where("d2Dinner", "==", true)))).data().count

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