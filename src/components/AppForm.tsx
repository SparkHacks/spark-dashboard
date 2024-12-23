import { useRef, useState, type FormEvent } from "react"

// TODO: replace with React MUI
export default function AppForm() {

    const formRef = useRef<HTMLFormElement | null>(null)
    const genderOtherRef = useRef<HTMLInputElement | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(formRef.current as HTMLFormElement)
        if (formData.get("gender") === "Other") {
            formData.set("gender", genderOtherRef.current.value)
        }
        try {
            const response = await fetch("/api/auth/submit-form", {
                method: "POST",
                body: formData
            })
            if (response.ok) {
                alert("Successfully submit form")
            } else {
                alert("Failed to submit form")
            }
        }
        catch (err) {
            console.log(err)
            alert("Failed to submit form for some reason")
        }

        setLoading(false)
    }   

    return (
        <>
            <button disabled={loading} onClick={() => window.location.assign("/dashboard")}>Return to Dashboard</button>
            <form ref={formRef} onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input id="email" name="email" placeholder="Enter your UIC email" type="email" required/>
                </div>
                <div>
                    <label htmlFor="firstName">First Name:</label>
                    <input id="firstName" name="firstName" placeholder="Enter your first name" required/>
                </div>
                <div>
                    <label htmlFor="lastName">Last Name:</label>
                    <input id="lastName" name="lastName" placeholder="Enter your last name" required/>
                </div>
                <div>
                    <label htmlFor="uin">UIN:</label>
                    <input id="uin" name="uin" type="number" placeholder="Enter your uin" required/>
                </div>
                <div>
                    <label>Gender:</label>
                    <input type="radio" id="male" name="gender" value="Male"/>
                    <label htmlFor="male">Male</label>
                    <input type="radio" id="female" name="gender" value="Female"/>
                    <label htmlFor="female">Female</label>
                    <input type="radio" id="other" name="gender" value="Other"/>
                    <label htmlFor="other">Other: <input ref={genderOtherRef}/></label>
                </div>
                <button disabled={loading} type="submit">Submit</button>
            </form>
        </>
    )
}