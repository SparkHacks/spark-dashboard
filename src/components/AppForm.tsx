import { Box, Button, FormControl, FormLabel, Modal, TextField } from "@mui/material"
import { useRef, useState, type FormEvent } from "react"
import Radios from "./components/Radios";
import { questions } from "../utils/questions";
import Checkboxes from "./components/Checkboxes";
import type { FormViewData } from "../env";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  maxWidth: "100%",
  height: 300,
  padding: "20px",
  backgroundColor: "white",
  outline: "none",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "8px"
  // boxShadow: 24,
};

// TODO: replace with React MUI
export default function AppForm({ email, registered, applicationData, isAdmin }: {
  email: string,
  registered: boolean,
  applicationData: FormViewData | null
  isAdmin: boolean | false
}) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  console.log(applicationData)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    setLoading(true)
    const formData = new FormData(formRef.current as HTMLFormElement)
    // for (let pair of formData.entries()) {
    //   console.log(pair[0]+ ', ' + pair[1]); 
    // }

    try {
      const response = await fetch("/api/auth/submit-form", {
        method: "POST",
        body: formData
      })
      if (response.ok) {
        setModal(true)
      } else {
        const errorText = await response.text()
        alert(`Failed to submit form: ${errorText}`)
      }
    }
    catch (err) {
      console.log(err)
      alert("Failed to submit form for some reason")
    }

    setLoading(false)
  }

  return (
    <div>
      <Modal
        open={modal}
        onClose={() => window.location.assign("/dashboard")}
      >
        <Box sx={style}>
          <img src="/sparkhacks-logo.svg" width="100" height="100"/>
          <h2>Form submitted successfully</h2>
          <div style={{marginBottom: "30px"}}>A confirmation email should sent to you shortly</div>
          <Button 
            variant="contained"
            onClick={() => window.location.assign("/dashboard")}
          >Back to Dashboard</Button>
        </Box>
      </Modal>
      {/* <Button
        variant="contained"
        disabled={loading}
        onClick={() => window.location.assign("/dashboard")}
        style={{ marginTop: "10px", marginRight: "10px" }}
      >Return to Dashboard</Button> */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 10px" }}>
        <h1><u>Admin View:</u> SparkHacks 2026 Registration</h1>
        {(applicationData && applicationData.createdAt !== "") && 
          <div>
            Submitted at: {applicationData?.createdAt}
          </div>
        }
        <form onSubmit={handleSubmit} ref={formRef} style={{ maxWidth: "800px", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>General Information</h2>
          <div>
            Email: <strong>{email}</strong>
          </div>
          <FormControl required>
            <FormLabel>First Name</FormLabel>
            <TextField name="firstName" placeholder="Enter your first name" defaultValue={applicationData && applicationData.firstName} disabled={registered} required fullWidth />
          </FormControl>
          <FormControl required>
            <FormLabel>Last Name</FormLabel>
            <TextField name="lastName" placeholder="Enter your last name" defaultValue={applicationData && applicationData.lastName} disabled={registered}  required fullWidth />
          </FormControl>
          <FormControl required>
            <FormLabel>UIN</FormLabel>
            <TextField name="uin" placeholder="Enter your 9-Digit UIN" defaultValue={applicationData && applicationData.uin} disabled={registered}  type="number" required fullWidth />
          </FormControl>
          <Radios 
            required={true}
            disabled={registered}
            label="Gender"
            name="gender"
            defaultValue={applicationData?.gender || ""}
            groupRadios={questions.gender.answer}
          />
          <Radios 
            required={true}
            disabled={registered}
            label="Year"
            name="year"
            defaultValue={applicationData?.year || ""}
            groupRadios={questions.year.answer}
          />
          <Radios
            required={true}
            disabled={registered}
            label="Which day(s) are you available to attent the hackathon? Priority will be given to those who can attend both days."
            name="availability"
            defaultValue={applicationData?.availability || ""}
            groupRadios={questions.availability.answer}
          />
          <FormControl>
            <FormLabel>If you want to add more detailed availability please add it here!</FormLabel>
            <TextField name="moreAvailability" defaultValue={applicationData && applicationData.moreAvailability} placeholder="Enter your additional availability (Optional)" fullWidth multiline disabled={registered} />
          </FormControl>

          <Checkboxes 
            required
            disabled={registered}
            label="Do you have any dietary restrictions?"
            name="dietaryRestriction"
            defaultValue={applicationData?.dietaryRestriction || []}
            groupCheckboxes={questions.dietaryRestriction.answer}
            other={true}
            otherName={questions.dietaryRestriction.other}
            otherValue={applicationData?.otherDietaryRestriction || ""}
          />
          
          <Radios 
            required
            disabled={registered}
            label="What is your unisex t-shirt size?"
            name="shirtSize"
            defaultValue={applicationData?.shirtSize || ""}
            groupRadios={questions.shirtSize.answer}
          />

          <h2>Hackathon Specific Questions</h2>
          <Radios 
            required
            disabled={registered}
            label={<>Do you have a team? If you do not already, no worries, we have you covered! <strong>Note: team size is restricted to 4-5 people.</strong></>}
            name="teamPlan"
            defaultValue={applicationData?.teamPlan || ""}
            groupRadios={questions.teamPlan.answer}
          />
          <Checkboxes 
            required
            disabled={registered}
            label={<>Which of the following Pre-Hack Workshops would you find useful/interesting to attend PRIOR to SparkHacks? These will be held from February 4th-6th, 2025. (Select all that apply)<br/>For more information on these workshops, view <a href="https://www.sparkhacks.org/">https://www.sparkhacks.org/</a>.</>}
            name="preWorkshops"
            defaultValue={applicationData?.preWorkshops || []}
            groupCheckboxes={questions.preWorkshops.answer}
          />
          <Radios 
            required={true}
            disabled={registered}
            label="If you would like to be considered for an opportunity with our company partners, select the type of job you are looking for:"
            name="jobType"
            defaultValue={applicationData?.jobType || ""}
            groupRadios={questions.jobType.answer}
            other={true}
            otherName={questions.jobType.other}
            otherValue={applicationData?.otherJobType || ""}
          />
          <FormControl>
            <FormLabel>
              If you would like to be considered for an opportunity with our company sponsors, add in a shareable link to your resume here. If your resume is on Google Docs or Google Drive, make sure you see "Anyone with the link" after clicking the "Share" button in the top right corner. 
              <br/>
              <img src={"/images/share_perms.png"} alt="Share permissions" style={{width: "500px", maxWidth: "100%"}}/>
            </FormLabel>
            <TextField placeholder="Enter your shareable link (Optional)" defaultValue={applicationData && applicationData.resumeLink} name="resumeLink" disabled={registered} />
          </FormControl>
          <div>
            If you have any other questions or comments, please email <a href="mailto:sparkhacks@uic.edu">sparkhacks@uic.edu</a>.
          </div>
          {!registered && !isAdmin && <Button
            variant="contained"
            disabled={loading}
            type="submit"
            style={{ display: "block", margin: "0 0", alignSelf: "center" }}
          >
            Submit
          </Button>}
        </form>
      </div>
    </div>
  )
}