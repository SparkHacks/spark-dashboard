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
export default function AppForm({ email, registered, applicationData, isAdmin, applicationsClosed = false }: {
  email: string,
  registered: boolean,
  applicationData: FormViewData | null
  isAdmin: boolean | false
  applicationsClosed?: boolean
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
        <h1>SparkHacks 2026 Registration</h1>
        {(applicationData && applicationData.createdAt !== "") &&
          <div>
            Submitted at: {applicationData?.createdAt}
          </div>
        }
        {applicationsClosed && !registered && (
          <div style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "15px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            maxWidth: "800px",
            width: "100%",
            textAlign: "center",
            fontWeight: "bold"
          }}>
            Applications are currently closed. You can view the form below but cannot submit.
          </div>
        )}
        <form onSubmit={handleSubmit} ref={formRef} style={{ maxWidth: "800px", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>General Information</h2>
          <div>
            Email: <strong>{email}</strong>
          </div>
          <FormControl required>
            <FormLabel>First Name</FormLabel>
            <TextField name="firstName" placeholder="Enter your first name" defaultValue={applicationData && applicationData.firstName} disabled={registered || applicationsClosed} required fullWidth />
          </FormControl>
          <FormControl required>
            <FormLabel>Last Name</FormLabel>
            <TextField name="lastName" placeholder="Enter your last name" defaultValue={applicationData && applicationData.lastName} disabled={registered || applicationsClosed}  required fullWidth />
          </FormControl>
          <FormControl required>
            <FormLabel>UIN</FormLabel>
            <TextField name="uin" placeholder="Enter your 9-Digit UIN" defaultValue={applicationData && applicationData.uin} disabled={registered || applicationsClosed}  type="number" required fullWidth />
          </FormControl>
          <Radios 
            required={true}
            disabled={registered || applicationsClosed}
            label="Gender"
            name="gender"
            defaultValue={applicationData?.gender || ""}
            groupRadios={questions.gender.answer}
          />
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label="Year"
            name="year"
            defaultValue={applicationData?.year || ""}
            groupRadios={questions.year.answer}
          />

          <h2>Logistics & Background</h2>
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.pastSparkHacks.question}
            name="pastSparkHacks"
            defaultValue={applicationData?.pastSparkHacks || ""}
            groupRadios={questions.pastSparkHacks.answer}
          />
          <FormControl>
            <FormLabel>{questions.pastHackathons.question}</FormLabel>
            <TextField
              name="pastHackathons"
              defaultValue={applicationData && applicationData.pastHackathons}
              placeholder="List hackathons you've attended (Optional)"
              fullWidth
              multiline
              disabled={registered || applicationsClosed}
            />
          </FormControl>
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.pastProjects.question}
            name="pastProjects"
            defaultValue={applicationData?.pastProjects || ""}
            groupRadios={questions.pastProjects.answer}
          />
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.participationType.question}
            name="participationType"
            defaultValue={applicationData?.participationType || ""}
            groupRadios={questions.participationType.answer}
          />
          <Checkboxes
            required
            disabled={registered || applicationsClosed}
            label={questions.hearAbout.question}
            name="hearAbout"
            defaultValue={applicationData?.hearAbout || []}
            groupCheckboxes={questions.hearAbout.answer}
            other={true}
            otherName={questions.hearAbout.other}
            otherValue={applicationData?.otherHearAbout || ""}
          />

          <h2>Availability & Attendance</h2>
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label="Which day(s) are you available to attend the hackathon? Priority will be given to those who can attend both days."
            name="availability"
            defaultValue={applicationData?.availability || ""}
            groupRadios={questions.availability.answer}
          />
          <FormControl>
            <FormLabel>If you want to add more detailed availability please add it here!</FormLabel>
            <TextField name="moreAvailability" defaultValue={applicationData && applicationData.moreAvailability} placeholder="Enter your additional availability (Optional)" fullWidth multiline disabled={registered || applicationsClosed} />
          </FormControl>
          <Checkboxes
            required
            disabled={registered || applicationsClosed}
            label={<>Which of the following Pre-Hack Workshops would you find useful/interesting to attend PRIOR to SparkHacks? (Select all that apply)<br/>For more information on these workshops, view <a href="https://www.sparkhacks.org/">https://www.sparkhacks.org/</a>.</>}
            name="preWorkshops"
            defaultValue={applicationData?.preWorkshops || []}
            groupCheckboxes={questions.preWorkshops.answer}
          />

          <h2>Interest & Goals</h2>
          <FormControl>
            <FormLabel>{questions.whyInterested.question}</FormLabel>
            <TextField
              name="whyInterested"
              defaultValue={applicationData && applicationData.whyInterested}
              placeholder="Tell us why you're interested (Optional)"
              fullWidth
              multiline
              rows={3}
              disabled={registered || applicationsClosed}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{questions.teamRole.question}</FormLabel>
            <TextField
              name="teamRole"
              defaultValue={applicationData && applicationData.teamRole}
              placeholder="Describe your role and what you'll bring (Optional)"
              fullWidth
              multiline
              rows={3}
              disabled={registered || applicationsClosed}
            />
          </FormControl>
          <Checkboxes
            required
            disabled={registered || applicationsClosed}
            label={questions.projectInterest.question}
            name="projectInterest"
            defaultValue={applicationData?.projectInterest || []}
            groupCheckboxes={questions.projectInterest.answer}
          />
          <Checkboxes
            required
            disabled={registered || applicationsClosed}
            label={questions.mainGoals.question}
            name="mainGoals"
            defaultValue={applicationData?.mainGoals || []}
            groupCheckboxes={questions.mainGoals.answer}
          />

          <h2>Skills & Experience</h2>
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.skillGit.question}
            name="skillGit"
            defaultValue={applicationData?.skillGit || ""}
            groupRadios={questions.skillGit.answer}
            row={true}
          />
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.skillFigma.question}
            name="skillFigma"
            defaultValue={applicationData?.skillFigma || ""}
            groupRadios={questions.skillFigma.answer}
            row={true}
          />
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.skillReact.question}
            name="skillReact"
            defaultValue={applicationData?.skillReact || ""}
            groupRadios={questions.skillReact.answer}
            row={true}
          />
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.skillPython.question}
            name="skillPython"
            defaultValue={applicationData?.skillPython || ""}
            groupRadios={questions.skillPython.answer}
            row={true}
          />
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.skillDatabase.question}
            name="skillDatabase"
            defaultValue={applicationData?.skillDatabase || ""}
            groupRadios={questions.skillDatabase.answer}
            row={true}
          />
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.skillCICD.question}
            name="skillCICD"
            defaultValue={applicationData?.skillCICD || ""}
            groupRadios={questions.skillCICD.answer}
            row={true}
          />
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
            label={questions.skillAPIs.question}
            name="skillAPIs"
            defaultValue={applicationData?.skillAPIs || ""}
            groupRadios={questions.skillAPIs.answer}
            row={true}
          />

          <h2>Team</h2>
          <Radios
            required
            disabled={registered || applicationsClosed}
            label={<>Do you have a team? If you do not already, no worries, we have you covered! <strong>Note: team size is restricted to 3-5 people.</strong></>}
            name="teamPlan"
            defaultValue={applicationData?.teamPlan || ""}
            groupRadios={questions.teamPlan.answer}
          />

          <h2>Food & Merch</h2>
          <Checkboxes
            required
            disabled={registered || applicationsClosed}
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
            disabled={registered || applicationsClosed}
            label="What is your unisex crewneck size?"
            name="crewneckSize"
            defaultValue={applicationData?.crewneckSize || ""}
            groupRadios={questions.crewneckSize.answer}
          />

          <h2>Career Opportunities</h2>
          <Radios
            required={true}
            disabled={registered || applicationsClosed}
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
            <TextField placeholder="Enter your shareable link (Optional)" defaultValue={applicationData && applicationData.resumeLink} name="resumeLink" disabled={registered || applicationsClosed} />
          </FormControl>
          <FormControl>
            <FormLabel>{questions.linkedinUrl.question}</FormLabel>
            <TextField
              name="linkedinUrl"
              defaultValue={applicationData && applicationData.linkedinUrl}
              placeholder="https://linkedin.com/in/yourprofile"
              fullWidth
              disabled={registered || applicationsClosed}
            />
          </FormControl>
          <div>
            If you have any other questions or comments, please email <a href="mailto:sparkhacks@uic.edu">sparkhacks@uic.edu</a>.
          </div>
          {!registered && !isAdmin && !applicationsClosed && <Button
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