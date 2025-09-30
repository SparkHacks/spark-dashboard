import { useEffect, useRef, useState } from "react"
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, startAfter, where, type DocumentData } from "firebase/firestore"
import { db } from "../firebase/client"



export default function StatCard ({type, total, color}: {
  type: string | "",
  total: number | 0,
  color: string | ""
}) {
    
    return (
      <div>
          <h1>{type}</h1>
          <h2>{total}</h2>
      </div>
    );

}