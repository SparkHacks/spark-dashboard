import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc} from "firebase/firestore"
import { db } from "../firebase/client"
import { toast, ToastContainer } from 'react-toastify';

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
      toast.success(`Scanned user: ${userData.firstName} ${userData.lastName}`)
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
    const value = inputRef.current?.value
    if (!value) {
      toast.error("Empty email")
      return
    }
    getUser(value)
  }

  async function submitFoodData() {
    if (!userInfo) {
      toast.error("No user info")
      return
    }
    const data = [...document.querySelectorAll("#form input")].reduce((acc: any, curr: any) => (acc[curr.name] = curr.checked, acc), {})

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
    } catch(e) {
      toast.error("Failed to update food data")
    }
  }

  return (
    <div>
      <QrcodePlugin
        fps={10}
        qrbox={250}
        disableFlip={false}
        qrCodeSuccessCallback={getUser}
      />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '20px'}}>
        <span>Manually Search User</span>
        <div>
          <input type='text' placeholder='Enter email' ref={inputRef} />
          <button onClick={searchUser}>Submit</button>
        </div>
      </div>
      {<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '10px'}}>
        <span>Name: {userInfo?.firstName} {userInfo?.lastName}</span>
        <span>Status: {userInfo?.appStatus}</span>
        <span>Email: {userInfo?.email}</span>
        <span>Current Food Data</span>
        <div id='form' style={{display: 'flex', flexDirection: 'row', gap: '10px'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <span>Day 1:</span>
            <div>
              <input name='d1Here' id="d1Here"  type="checkbox" data-id="d1Here"/>
              <label htmlFor="d1Here">Day 1 Here?</label>
            </div>
            <div>
              <input name='d1Snack' id="d1Snack"  type="checkbox" data-id="d1Snack"/>
              <label htmlFor="d1Snack">Ate Snack?</label>
            </div>
            <div>
              <input name='d1Dinner' id="d1Dinner" type="checkbox" data-id="d1Dinner"/>
              <label htmlFor="d1Dinner">Ate Dinner?</label>
            </div>
            <div>
              <input name='d1Cookies' id="d1Cookies" type="checkbox" data-id="d1Cookies"/>
              <label htmlFor="d1Cookies">Ate Cookies?</label>
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <span>Day 2:</span>
            <div>
              <input name='d2Here' id="d2Here"  type="checkbox" data-id="d2Here"/>
              <label htmlFor="d2Here">Day 2 Here?</label>
            </div>
            <div>
              <input name='d2Breakfast' id="d2Breakfast" type="checkbox" data-id="d2Breakfast"/>
              <label htmlFor="d2Breakfast">Ate Breakfast?</label>
            </div>
            <div>
              <input name='d2Lunch' id="d2Lunch" type="checkbox" data-id="d2Lunch"/>
              <label htmlFor="d2Lunch">Ate Lunch?</label>
            </div>
            <div>
              <input name='d2Dinner' id="d2Dinner" type="checkbox" data-id="d2Dinner"/>
              <label htmlFor="d2Dinner">Ate Dinner?</label>
            </div>
          </div>
        </div>
        <span>Old Food Data</span>
        <div style={{display: 'flex', flexDirection: 'row', gap: '10px'}}>
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
        </div>
        <button onClick={submitFoodData} style={{marginTop: "20px", width: "250px", height: "40px", marginBottom: "20px"}} disabled={userInfo === null}>Submit!</button>
      </div>}
      <ToastContainer />
    </div>
  )
}