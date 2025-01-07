import { useState } from "react"
import AdminTable from "./components/AdminTable"
import ViewCard from "./components/ViewCard"
import type { FormViewData } from "../env"

export default function AdminBoard({datas}: {
  datas: FormViewData[]
}) {

  const [view, setView] = useState<FormViewData | null>(null)

  return (
    <div style={{width: "100%", height: "100%", display: "flex"}}>
      <ViewCard view={view} setView={setView}/>
      <AdminTable datas={datas} setView={setView}/>
    </div>
  )
}