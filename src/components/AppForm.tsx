import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Input, InputLabel, MenuItem, Modal, Radio, RadioGroup, Select, TextField, Typography } from "@mui/material"
import { useRef, useState, type FormEvent } from "react"


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  padding: "20px",
  backgroundColor: "white",
  outline: "none"
  // boxShadow: 24,
};

// TODO: replace with React MUI
export default function AppForm({ email }: {
  email: string,
}) {

  const formRef = useRef<HTMLFormElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)

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
          Submitted successfully
          <Button onClick={() => window.location.assign("/dashboard")}>Back to Dashboard</Button>
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
            <TextField name="firstName" placeholder="Enter your answer" required fullWidth />
          </FormControl>
          <FormControl required>
            <FormLabel>Last Name</FormLabel>
            <TextField name="lastName" placeholder="Enter your answer" required fullWidth />
          </FormControl>
          <FormControl required>
            <FormLabel>UIN</FormLabel>
            <TextField name="uin" placeholder="Enter your answer" type="number" required fullWidth />
          </FormControl>
          <FormControl required fullWidth>
            <FormLabel>Gender</FormLabel>
            <RadioGroup name="gender" style={{ marginLeft: "20px" }}>
              <FormControlLabel control={<Radio />} value="Male" label="Male" />
              <FormControlLabel control={<Radio />} value="Female" label="Female" />
              <FormControlLabel control={<Radio />} value="Non binary" label="Non binary" />
            </RadioGroup>
          </FormControl>
          <FormControl required fullWidth>
            <FormLabel>Year</FormLabel>
            <RadioGroup name="year" style={{ marginLeft: "20px" }}>
              <FormControlLabel control={<Radio />} value="Freshman" label="Freshman" />
              <FormControlLabel control={<Radio />} value="Sophomore" label="Sophomore" />
              <FormControlLabel control={<Radio />} value="Junior" label="Junior" />
              <FormControlLabel control={<Radio />} value="Senior" label="Senior" />
              <FormControlLabel control={<Radio />} value="Graduate" label="Graduate" />
            </RadioGroup>
          </FormControl>
          <FormControl required fullWidth>
            <FormLabel>Which day(s) are you available to attent the hackathon? Priority will be given to those who can attend both days. (Merch will be given day 2)</FormLabel>
            <RadioGroup name="availability" style={{ marginLeft: "20px" }}>
              <FormControlLabel control={<Radio />} value="Both Days" label="Both Days" />
              <FormControlLabel control={<Radio />} value="Only Friday February 7th @ 2:30pm - 9pm" label="Only Friday February 7th @ 2:30pm - 9pm" />
              <FormControlLabel control={<Radio />} value="Only Saturday February 8th @ 9am - 8pm" label="Only Saturday February 8th @ 9am - 8pm" />
            </RadioGroup>
          </FormControl>
          <FormControl>
            <FormLabel>If you want to add more detailed availability please add it here!</FormLabel>
            <TextField name="moreAvailability" placeholder="Enter your answer" fullWidth multiline />
          </FormControl>

          <label>Do you have any dietary restrictions?</label>
          <FormControl required fullWidth variant="filled">
            <InputLabel>Choose</InputLabel>
            <Select
              defaultValue=""
              name="dietaryRestriction"
            >
              <MenuItem value=""><em>None</em></MenuItem>
              <MenuItem value="Vegetarian">Vegetarian</MenuItem>
              <MenuItem value="Halal">Halal</MenuItem>
              <MenuItem value="Vegan">Vegan</MenuItem>
              <MenuItem value="Gluten Free">Gluten Free</MenuItem>
              <MenuItem value="Nut Allergy">Nut Allergy</MenuItem>
              <MenuItem value="N/A">N/A</MenuItem>
            </Select>
          </FormControl>
          <FormControl required fullWidth>
            <FormLabel>What is your unisex t-shirt size?</FormLabel>
            <RadioGroup name="shirtSize" style={{ marginLeft: "10px" }}>
              <FormControlLabel control={<Radio />} value="XS" label="XS" />
              <FormControlLabel control={<Radio />} value="S" label="S" />
              <FormControlLabel control={<Radio />} value="M" label="M" />
              <FormControlLabel control={<Radio />} value="L" label="L" />
              <FormControlLabel control={<Radio />} value="XL" label="XL" />
            </RadioGroup>
          </FormControl>

          <h2>Hackathon Specific Questions</h2>
          <FormControl required fullWidth>
            <FormLabel>
              How do you plan to participate at SparkHacks? Everyone will be able to attend company sessions and/or workshops.
              <strong> Note: Maximum team size is 5</strong>
            </FormLabel>
            <RadioGroup name="hackathonPlan" style={{ marginLeft: "20px" }}>
              <FormControlLabel control={<Radio />} value="I will be hacking and I have a team" label="I will be hacking and I have a team"/>
              <FormControlLabel control={<Radio />} value="I will be hacking, but I do not have a team yet" label="I will be hacking, but I do not have a team yet" />
              <FormControlLabel control={<Radio />} value="I just want to attend the workshops" label="I just want to attend the workshops" />
            </RadioGroup>
          </FormControl>
          <FormControl required fullWidth>
            <FormLabel>
              Which of the following Workshop topics would you find useful/interesting to attend PRIOR to SparkHacks?
              These will be held from 5th - 8th Feb 2024 from 5 - 6:30pm (Select all that apply)
            </FormLabel>
            <FormGroup style={{ marginLeft: "20px" }}>
              <FormControlLabel control={<Checkbox />} label="Monday: Intro to Git - Git yourself Together" name="preWorkshops" value="Monday: Intro to Git - Git yourself Together" />
              <FormControlLabel control={<Checkbox />} label="Tuesday: Intro to Web Dev (React & Tailwind CSS)" name="preWorkshops" value="Tuesday: Intro to Web Dev (React & Tailwind CSS)" />
              <FormControlLabel control={<Checkbox />} label="Wednesday: Intro to Google Firebase" name="preWorkshops" value="Wednesday: Intro to Google Firebase" />
              <FormControlLabel control={<Checkbox />} label="Thursday: Team Building Social" name="preWorkshops" value="Thursday: Team Building Social" />
            </FormGroup>
          </FormControl>
          <FormControl required fullWidth variant="filled">
            <FormLabel>
              Which of the following workshop topics would you find useful/interesting to attend DURING SparkHacks? (Select all that apply)
            </FormLabel>
            <FormGroup style={{ marginLeft: "20px" }}>
              <FormControlLabel control={<Checkbox />} label="Ideation Workshop with Discover" name="workshops" value="Ideation Workshop with Discover"/>
              <FormControlLabel control={<Checkbox />} label="Intro to AWS with Discover"  name="workshops" value="Intro to AWS with Discover" />
              <FormControlLabel control={<Checkbox />} label="Resume Review Workshop with Caterpillar"  name="workshops" value="Resume Review Workshop with Caterpillar" />
              <FormControlLabel control={<Checkbox />} label="Interviewing Tips and Tricks with Abbvie" name="workshops" value="Interviewing Tips and Tricks with Abbvie" />
              <FormControlLabel control={<Checkbox />} label="Intro to API Workshop with Caterpillar" name="workshops" value="Intro to API Workshop with Caterpillar" />
              <FormControlLabel control={<Checkbox />} label="Creating a Basic Web App Workshop with John Deere" name="workshops" value="Creating a Basic Web App Workshop with John Deere" />
            </FormGroup>
          </FormControl>
          <FormControl fullWidth>
            <FormLabel>If you'd like to be considered for an opportunity with our company partners, select the type of job you are looking for:</FormLabel>
            <RadioGroup name="jobType" style={{ marginLeft: "20px" }}>
              <FormControlLabel control={<Radio />} value="Full-time New Grad Job" label="Full-time New Grad Job" />
              <FormControlLabel control={<Radio />} value="Summer 2024 Internship" label="Summer 2024 Internship" />
              <FormControlLabel control={<Radio />} value="Fall 2024 Internship" label="Fall 2024 Internship" />
              <FormControlLabel control={<Radio />} value="I am not currently looking for a job" label="I am not currently looking for a job" />
            </RadioGroup>
          </FormControl>
          <FormControl>
            <FormLabel>
              If you’d like to be considered for an opportunity with our company partners, submit a PDF link (e.g. Google Drive) of your resume here.
            </FormLabel>
            <TextField placeholder="Enter your answer" name="resumeLink" />
          </FormControl>
          <FormControl>
            <FormLabel>
              If you have any other questions / comments please drop them here!
            </FormLabel>
            <TextField placeholder="Enter your answer" name="otherQuestion" fullWidth />
          </FormControl>
          <Button
            variant="contained"
            disabled={loading}
            type="submit"
            style={{ display: "block", margin: "0 0", alignSelf: "center" }}
          >
            Submit
          </Button>
        </form>
      </div>
    </div>
  )
}