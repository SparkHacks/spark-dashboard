import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, TextField } from "@mui/material"

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
    return (
        <FormControl required={required} variant="filled">
            <FormLabel>{label}</FormLabel>
            <FormGroup style={{ marginLeft: "20px" }}>
                {groupCheckboxes.map((checkboxValue, id) => {
                    return (<FormControlLabel 
                        key={id}
                        control={<Checkbox defaultChecked={defaultValue.includes(checkboxValue)}/>}
                        label={checkboxValue}
                        name={name}
                        value={checkboxValue}
                        disabled={disabled}
                    />)
                })}
                {other && 
                    <TextField 
                        name={otherName}
                        defaultValue={otherValue}
                        disabled={disabled}
                    />
                }
            </FormGroup>
        </FormControl>
    )
}