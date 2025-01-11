import type { FormViewData } from "../../env"
import styles from "./styles/ViewCard.module.css"

export default function ViewCard({view, setView} : {
  view: FormViewData | null,
  setView: React.Dispatch<React.SetStateAction<FormViewData | null>>
}) {
  console.log(view)
  return (
    <section style={(view) ? {display: "block"} : {display: "none"}} className={styles.viewCard}>
      <button onClick={() => setView(null)}>X</button>
      <h1>{view?.firstName} {view?.lastName}</h1>
      <div><strong>Application Status:</strong> {view?.appStatus}</div>
      <div><strong>Submited at:</strong> {view?.createdAt}</div>
      <div><strong>Email:</strong> {view?.email}</div>
      <div><strong>UIN:</strong> {view?.uin}</div>
      <div><strong>Gender:</strong> {view?.gender}</div>
      <div><strong>Year:</strong> {view?.year}</div>
      <div><strong>Availability:</strong> {view?.availability}</div>
      <div><strong>More availability:</strong> {view?.moreAvailability}</div>
      <div><strong>Dietary Restriction:</strong> {view?.dietaryRestriction}</div>
      <div><strong>T-shirt size:</strong> {view?.shirtSize}</div>
      <div><strong>Hackathon plan:</strong> {view?.hackathonPlan}</div>
      <div>
        <strong>Pre workshops:</strong>
        <ul>
          {view?.preWorkshops?.map((preW, id) => <li key={id}>{preW}</li>)}
        </ul>
      </div>
      <div>
        <strong>Workshops:</strong>
        <ul>
          {view?.workshops?.map((workS, id) => <li key={id}>{workS}</li>)}
        </ul>
      </div>
      <div><strong>Job type:</strong> {view?.jobType}</div>
      <div><strong>Resume link:</strong> {view?.resumeLink}</div>
      <div><strong>Other Questions:</strong> {view?.otherQuestion}</div>
    </section>
  )
}