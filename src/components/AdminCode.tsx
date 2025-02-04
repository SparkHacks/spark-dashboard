import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, startAfter, where, type DocumentData } from "firebase/firestore"
import { db } from "../firebase/client"
import type { FunctionResponse } from 'firebase/vertexai';
import type { FormViewData } from '../env';
import { convertDocToFormViewData } from './AdminBoard';
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
    html5QrcodeScanner.render(props.qrCodeSuccessCallback, props.qrCodeErrorCallback);

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

export default function AdminCode() {
  const [userInfo, setUserInfo] = useState<FormViewData | null>(null)
  const emailRef = useRef<string | null>(null)
  const getUser = async (code: string) => {
    try {
      if(code === emailRef.current) return
      const docSnap = await getDoc(doc(db, "Forms", code))
      
      if (!docSnap.exists()) {
        alert("doc not exist")
        return
      } 

      const userData = convertDocToFormViewData(docSnap)
      emailRef.current = userData.email
      setUserInfo(userData)
      toast.success(`Scanned user: ${userData.firstName} ${userData.lastName}`)
    } catch(e: any) {
      // Prevent spamming
      emailRef.current = code
      console.log(e)
      toast.error("Error scanning user", e)
      setUserInfo(null)
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
      {userInfo && <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '10px'}}>
        <span>Name: {userInfo.firstName} {userInfo.lastName}</span>
        <span>Status: {userInfo.appStatus}</span>
        <span>Email: {userInfo.email}</span>
        <span>Current Food Data</span>
        <div style={{display: 'flex', flexDirection: 'row', gap: '10px'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <span>Day 1:</span>
            <div className=''>
              <label htmlFor="d1Snack">Ate Snack?</label>
              <input id="d1Snack" type="checkbox"/>
            </div>
            <div>
              <label htmlFor="d1Dinner">Ate Dinner?</label>
              <input id="d1Dinner" type="checkbox"/>
            </div>
            <div>
              <label htmlFor="d1Cookies">Ate Cookies?</label>
              <input id="d1Cookies" type="checkbox"/>
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <span>Day 2:</span>
            <div>
              <label htmlFor="d2Breakfast">Ate Breakfast?</label>
              <input id="d2Breakfast" type="checkbox"/>
            </div>
            <div>
              <label htmlFor="d2Lunch">Ate Lunch?</label>
              <input id="d2Lunch" type="checkbox"/>
            </div>
            <div>
              <label htmlFor="d2Dinner">Ate Dinner?</label>
              <input id="d2Dinner" type="checkbox"/>
            </div>
          </div>
        </div>
        <input type="button" value="Submit"/>
        <span>Old Food Data</span>
        <div style={{display: 'flex', flexDirection: 'row', gap: '10px'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <span>Day 1:</span>
            <div>
              <label htmlFor="d1SnackOld">Ate Snack?</label>
              <input id="d1SnackOld" disabled type="checkbox"/>
            </div>
            <div>
              <label htmlFor="d1DinnerOld">Ate Dinner?</label>
              <input id="d1DinnerOld" disabled type="checkbox"/>
            </div>
            <div>
              <label htmlFor="d1CookiesOld">Ate Cookies?</label>
              <input id="d1CookiesOld" disabled type="checkbox"/>
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <span>Day 2:</span>
            <div>
              <label htmlFor="d2BreakfastOld">Ate Breakfast?</label>
              <input id="d2BreakfastOld" disabled type="checkbox"/>
            </div>
            <div>
              <label htmlFor="d2LunchOld">Ate Lunch?</label>
              <input id="d2LunchOld" disabled type="checkbox"/>
            </div>
            <div>
              <label htmlFor="d2DinnerOld">Ate Dinner?</label>
              <input id="d2DinnerOld" disabled type="checkbox"/>
            </div>
          </div>
        </div>
      </div>}
      <ToastContainer />
    </div>
  )
}