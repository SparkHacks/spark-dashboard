import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { collection, doc, getCountFromServer, getDoc, query, where} from "firebase/firestore"
import { db } from "../firebase/client"
import { FORMS_COLLECTION } from "../config/constants"
import { toast, ToastContainer } from 'react-toastify';
import { RefreshCw } from 'lucide-react';
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

interface ApplicantResult {
  email: string
  firstName: string
  lastName: string
  uin: string
}

interface CheckboxButtonProps {
  name: string
  id: string
  label: string
  count?: number
  checked: boolean
  onChange: (checked: boolean) => void
}

const CheckboxButton = ({ name, id, label, count, checked, onChange }: CheckboxButtonProps) => {
  return (
    <div style={{ position: 'relative' }}>
      <input
        name={name}
        id={id}
        type="checkbox"
        data-id={id}
        checked={checked}
        onChange={() => {}}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '600',
          border: '2px solid #8d6db5',
          borderRadius: '8px',
          backgroundColor: checked ? '#e8dff5' : 'white',
          color: '#8d6db5',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        {label}
        {count !== undefined && (
          <span style={{
            fontSize: '12px',
            opacity: 0.8
          }}>
            ({count})
          </span>
        )}
      </button>
    </div>
  )
}

const defaultCheckboxState = {
  d1Here: false,
  d1Snack: false,
  d1Dinner: false,
  d1Cookies: false,
  d2Here: false,
  d2Breakfast: false,
  d2Lunch: false,
  d2Dinner: false,
}

export default function AdminCode() {
  const [userInfo, setUserInfo] = useState<any | null>(null)
  const [errMsg, setErrMsg] = useState("")
  const [summary, setSummary] = useState<any | null>("")
  const [autocompleteResults, setAutocompleteResults] = useState<ApplicantResult[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [allApplicants, setAllApplicants] = useState<ApplicantResult[]>([])
  const [checkboxes, setCheckboxes] = useState(defaultCheckboxState)
  const emailRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<HTMLDivElement | null>(null)
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
      setCheckboxes({
        d1Here: userData.d1Here || false,
        d1Snack: userData.d1Snack || false,
        d1Dinner: userData.d1Dinner || false,
        d1Cookies: userData.d1Cookies || false,
        d2Here: userData.d2Here || false,
        d2Breakfast: userData.d2Breakfast || false,
        d2Lunch: userData.d2Lunch || false,
        d2Dinner: userData.d2Dinner || false,
      })        
    } catch(e: any) {
      // Prevent spamming
      emailRef.current = code
      console.log(e)
      toast.error("Error scanning user", e)
      setUserInfo(null)
    }
  }

  function searchUser() {
    const input = inputRef.current?.value
    if (!input) {
      setErrMsg("Empty input")
      toast.error("Empty input")
      return
    }

    let email = input.trim()

    // If no @ symbol, assume it's a UIN and append @uic.edu
    if (!email.includes('@')) {
      email = email + '@uic.edu'
    }

    let regex = /^[a-zA-Z0-9._%+-]+@uic\.edu$/
    let regex2 = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
    if (!regex.test(email) && !regex2.test(email)) {
      toast.error("Please enter UIN or full uic.edu/gmail.com email")
      setErrMsg("Please enter UIN or full uic.edu/gmail.com email")
      return
    }

    getUser(email)
  }

  async function submitFoodData(updatedCheckboxes: typeof defaultCheckboxState) {
    if (!userInfo) {
      toast.error("No user info")
      return
    }

    if (userInfo.appStatus !== "accepted") {
      toast.error("User is not accepted!")
      return
    }

    const data = { ...updatedCheckboxes, email: userInfo.email }
    try {
      const response = await fetch("/api/auth/update-food", {
        method: "POST",
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        toast.error("Failed to update food data")
        return
      }
      toast.success("Updated!")
      document.body.animate({ backgroundColor: ["white", "#8d6db5", "white"] }, 500); // Add dramatic flash so people can tell they checked in

      // update summary
      try {
        const checkinData = await getSummaryStats()
        setSummary(checkinData)
      }
      catch (err) {
        console.error(err)
        toast.error("Something is wrong with getting checkin summary")
      }
    } catch(e) {
      toast.error("Failed to update food data")
    }
  }

  const handleCheckboxChange = (field: keyof typeof defaultCheckboxState, value: boolean) => {
    const updated = { ...checkboxes, [field]: value }
    setCheckboxes(updated)
    submitFoodData(updated)
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
    setCheckboxes(defaultCheckboxState)
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

    // Fetch all accepted applicants for autocomplete
    const fetchApplicants = async () => {
      try {
        const { getDocs, query: fsQuery, collection: fsCollection, where: fsWhere } = await import('firebase/firestore')
        console.log('Fetching applicants from:', FORMS_COLLECTION)
        const q = fsQuery(fsCollection(db, FORMS_COLLECTION), fsWhere('appStatus', '==', 'accepted'))
        const snapshot = await getDocs(q)
        const applicants: ApplicantResult[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          applicants.push({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            uin: data.uin
          })
        })
        console.log('Loaded applicants:', applicants.length)
        setAllApplicants(applicants)
      } catch (err) {
        console.error('Error fetching applicants:', err)
      }
    }
    fetchApplicants()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim()
    console.log('Input changed, value:', value, 'Total applicants:', allApplicants.length)

    if (value === '') {
      setShowAutocomplete(false)
      setAutocompleteResults([])
      return
    }

    const filtered = allApplicants.filter((applicant) => {
      const uinWithoutDomain = applicant.email.split('@')[0].toLowerCase()
      const fullName = `${applicant.firstName} ${applicant.lastName}`.toLowerCase()
      const uinString = String(applicant.uin).toLowerCase()
      return (
        uinWithoutDomain.startsWith(value) ||
        uinString.startsWith(value) ||
        fullName.includes(value)
      )
    })

    console.log('Filtered results:', filtered.length, 'Show autocomplete:', true)
    setAutocompleteResults(filtered)
    setShowAutocomplete(true) // Always show when typing
  }

  const handleSelectApplicant = (applicant: ApplicantResult) => {
    if (inputRef.current) {
      inputRef.current.value = applicant.email.split('@')[0]
    }
    setShowAutocomplete(false)
    getUser(applicant.email)
  }

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
            placeholder='Enter UIN or email'
            ref={inputRef}
            onChange={handleInputChange}
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

        {/* Autocomplete results box */}
        {showAutocomplete && (
          <div
            ref={autocompleteRef}
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'white',
              border: '2px solid #8d6db5',
              borderRadius: '8px',
              marginTop: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            {autocompleteResults.length > 0 ? (
              autocompleteResults.map((applicant, index) => (
                <div
                  key={applicant.email}
                  onClick={() => handleSelectApplicant(applicant)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < autocompleteResults.length - 1 ? '1px solid #e0e0e0' : 'none',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f3ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{fontWeight: '600', fontSize: '15px', marginBottom: '4px'}}>
                    {applicant.firstName} {applicant.lastName}
                  </div>
                  <div style={{fontSize: '13px', color: '#666'}}>
                    {applicant.email.split('@')[0]} • UIN: {applicant.uin}
                  </div>
                </div>
              ))
            ) : (
              <div style={{padding: '12px 16px', textAlign: 'center', color: '#999'}}>
                No results found
              </div>
            )}
          </div>
        )}
      </div>
      {<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '10px'}}>
        
        <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
          <span><strong>Name: </strong>{userInfo?.firstName} {userInfo?.lastName}</span>
          <span><strong>Status </strong> <span style={{color: userInfo?.appStatus == "accepted" ? "green" : "red"}}> {userInfo?.appStatus}</span></span>
          <span><strong>Email: </strong>{userInfo?.email}</span>
          <span><strong>Shirt Size: </strong>{userInfo?.crewneckSize}</span>
        </div>
        
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
          <h3 style={{margin: "0px"}}>User Check-In</h3>
          <button
            onClick={handleRefresh}
            style={{
              padding: '4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#8d6db5';
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#666';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Refresh counts"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div id='form' style={{display: 'flex', flexDirection: 'row', gap: '20px', width: '100%', maxWidth: '500px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px', minWidth: '180px'}}>
            <span style={{fontWeight: '700', fontSize: '16px', marginBottom: '4px'}}>Day 1:</span>
            <CheckboxButton name="d1Here" id="d1Here" label="Check-In" count={summary?.d1Here} checked={checkboxes.d1Here} onChange={(v) => handleCheckboxChange('d1Here', v)} />
            <CheckboxButton name="d1Snack" id="d1Snack" label="Snacks" count={summary?.d1Snack} checked={checkboxes.d1Snack} onChange={(v) => handleCheckboxChange('d1Snack', v)} />
            <CheckboxButton name="d1Dinner" id="d1Dinner" label="Dinner" count={summary?.d1Dinner} checked={checkboxes.d1Dinner} onChange={(v) => handleCheckboxChange('d1Dinner', v)} />
            <CheckboxButton name="d1Cookies" id="d1Cookies" label="Cookies" count={summary?.d1Cookies} checked={checkboxes.d1Cookies} onChange={(v) => handleCheckboxChange('d1Cookies', v)} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px', minWidth: '180px'}}>
            <span style={{fontWeight: '700', fontSize: '16px', marginBottom: '4px'}}>Day 2:</span>
            <CheckboxButton name="d2Here" id="d2Here" label="Check-In" count={summary?.d2Here} checked={checkboxes.d2Here} onChange={(v) => handleCheckboxChange('d2Here', v)} />
            <CheckboxButton name="d2Breakfast" id="d2Breakfast" label="Breakfast" count={summary?.d2Breakfast} checked={checkboxes.d2Breakfast} onChange={(v) => handleCheckboxChange('d2Breakfast', v)} />
            <CheckboxButton name="d2Lunch" id="d2Lunch" label="Lunch" count={summary?.d2Lunch} checked={checkboxes.d2Lunch} onChange={(v) => handleCheckboxChange('d2Lunch', v)} />
            <CheckboxButton name="d2Dinner" id="d2Dinner" label="Dinner" count={summary?.d2Dinner} checked={checkboxes.d2Dinner} onChange={(v) => handleCheckboxChange('d2Dinner', v)} />
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