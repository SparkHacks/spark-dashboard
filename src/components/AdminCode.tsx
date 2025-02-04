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
      console.log(docSnap)
      
      if (!docSnap.exists()) {
        alert("doc not exist")
        return
      } 

      const userData = convertDocToFormViewData(docSnap)
      emailRef.current = userData.email
      setUserInfo(userData)
      toast.success(`Scanned user: ${userData.firstName} ${userData.lastName}`)
    } catch(e: any) {
      console.log(e)
      toast.error("Error scanning user", e)
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
      {userInfo && <div>
        <p>Name: {userInfo.firstName} {userInfo.lastName}</p>
        <p>Status: {userInfo.appStatus}</p>
      </div>}
      <ToastContainer />
    </div>
  )
}