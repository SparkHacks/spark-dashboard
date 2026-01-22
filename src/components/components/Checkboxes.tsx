import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, TextField } from "@mui/material"
import { useState } from "react"

export default function Checkboxes({required, disabled, label, name, defaultValue, groupCheckboxes, other = false, otherName = "", otherValue = ""}: {
    required: boolean,
    disabled: boolean,
    label: any,
    name: string,
    defaultValue: string[],
    groupCheckboxes: string[],
    other?: boolean,
    otherName?: string,
    otherValue?: string,
}) {
    const [otherChecked, setOtherChecked] = useState(defaultValue.includes("Other"))

    return (
        <FormControl required={required} variant="filled">
            <FormLabel>{label}</FormLabel>
            <FormGroup style={{ marginLeft: "20px" }}>
                {groupCheckboxes.map((checkboxValue, id) => {
                    return checkboxValue !== "Other" && 
                    (<FormControlLabel 
                        key={id}
                        control={<Checkbox defaultChecked={defaultValue.includes(checkboxValue)}/>}
                        label={checkboxValue}
                        name={name}
                        value={checkboxValue}
                        disabled={disabled}
                    />)
                })}
                {other && 
                    <>
                        <FormControlLabel 
                            control={<Checkbox defaultChecked={defaultValue.includes("Other")} onChange={() => setOtherChecked(!otherChecked)}/>}
                            label={"Other"}
                            name={name}
                            value={"Other"}
                            disabled={disabled}
                        />
                        <TextField 
                            name={otherName}
                            defaultValue={otherValue}
                            disabled={disabled || !otherChecked}
                        />
                    </>
                }
            </FormGroup>
        </FormControl>
    )
}