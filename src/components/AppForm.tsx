import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Input, InputLabel, MenuItem, Modal, Radio, RadioGroup, Select, TextField, Typography } from "@mui/material"
import { useRef, useState, type FormEvent } from "react"
import Radios from "./components/Radios";
import { questions } from "../utils/questions";
import Checkboxes from "./components/Checkboxes";
import type { FormSubmissionData } from "../env";


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
export default function AppForm({ email, registered, applicationData }: {
  email: string,
  registered: boolean,
  applicationData: FormSubmissionData | null
}) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  console.log(applicationData)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    setLoading(true)
    const formData = new FormData(formRef.current as HTMLFormElement)
    for (let pair of formData.entries()) {
      console.log(pair[0]+ ', ' + pair[1]); 
    }

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
      <Button
        variant="contained"
        disabled={loading}
        onClick={() => window.location.assign("/dashboard")}
        style={{ marginTop: "10px", marginRight: "10px" }}
      >Return to Dashboard</Button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 10px" }}>
        <h1>SparkHacks 2025 Registration</h1>
        <form onSubmit={handleSubmit} ref={formRef} style={{ maxWidth: "800px", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>General Information</h2>
          <div>
            Email: <strong>{email}</strong>
          </div>
          <FormControl required>
            <FormLabel>First Name</FormLabel>
            <TextField name="firstName" placeholder="Enter your answer" defaultValue={applicationData && applicationData.firstName} disabled={registered} required fullWidth />
          </FormControl>
          <FormControl required>
            <FormLabel>Last Name</FormLabel>
            <TextField name="lastName" placeholder="Enter your answer" defaultValue={applicationData && applicationData.lastName} disabled={registered}  required fullWidth />
          </FormControl>
          <FormControl required>
            <FormLabel>UIN</FormLabel>
            <TextField name="uin" placeholder="Enter your answer" defaultValue={applicationData && applicationData.uin} disabled={registered}  type="number" required fullWidth />
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
            label="Which day(s) are you available to attent the hackathon? Priority will be given to those who can attend both days. (Merch will be given day 2)"
            name="availability"
            defaultValue={applicationData?.availability || ""}
            groupRadios={questions.availability.answer}
          />
          <FormControl>
            <FormLabel>If you want to add more detailed availability please add it here!</FormLabel>
            <TextField name="moreAvailability" defaultValue={applicationData && applicationData.moreAvailability} placeholder="Enter your answer" fullWidth multiline disabled={registered} />
          </FormControl>

          <label>Do you have any dietary restrictions?</label>
          <FormControl required fullWidth variant="filled">
            <InputLabel>Choose</InputLabel>
            <Select
              name="dietaryRestriction"
              defaultValue={applicationData?.dietaryRestriction || ""}
              disabled={registered}
            >
              <MenuItem value="">Choose</MenuItem>
              <MenuItem value="Vegetarian">Vegetarian</MenuItem>
              <MenuItem value="Halal">Halal</MenuItem>
              <MenuItem value="Vegan">Vegan</MenuItem>
              <MenuItem value="Gluten Free">Gluten Free</MenuItem>
              <MenuItem value="Nut Allergy">Nut Allergy</MenuItem>
              <MenuItem value="N/A">N/A</MenuItem>
            </Select>
          </FormControl>
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
            label={<>How do you plan to participate at SparkHacks? Everyone will be able to attend company sessions and/or workshops. <strong>Note: Maximum team size is 5</strong></>}
            name="hackathonPlan"
            defaultValue={applicationData?.hackathonPlan || ""}
            groupRadios={questions.hackathonPlan.answer}
          />
          <Checkboxes 
            required
            disabled={registered}
            label="Which of the following Workshop topics would you find useful/interesting to attend PRIOR to SparkHacks? These will be held from 5th - 8th Feb 2024 from 5 - 6:30pm (Select all that apply)"
            name="preWorkshops"
            defaultValue={applicationData?.preWorkshops || []}
            groupCheckboxes={questions.preWorkshops.answer}
          />
          <Checkboxes 
            required
            disabled={registered}
            label="Which of the following workshop topics would you find useful/interesting to attend DURING SparkHacks? (Select all that apply)"
            name="workshops"
            defaultValue={applicationData?.workshops || []}
            groupCheckboxes={questions.workshops.answer}
          />
          <Radios 
            required={false}
            disabled={registered}
            label="If you'd like to be considered for an opportunity with our company partners, select the type of job you are looking for:"
            name="jobType"
            defaultValue={applicationData?.jobType || ""}
            groupRadios={questions.jobType.answer}
          />
          <FormControl>
            <FormLabel>
              If you’d like to be considered for an opportunity with our company partners, submit a PDF link (e.g. Google Drive) of your resume here.
            </FormLabel>
            <TextField placeholder="Enter your answer" defaultValue={applicationData && applicationData.resumeLink} name="resumeLink" disabled={registered} />
          </FormControl>
          <FormControl>
            <FormLabel>
              If you have any other questions / comments please drop them here!
            </FormLabel>
            <TextField placeholder="Enter your answer" defaultValue={applicationData && applicationData.otherQuestion} name="otherQuestion" fullWidth disabled={registered} />
          </FormControl>
          {!registered && <Button
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