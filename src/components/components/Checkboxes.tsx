import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel } from "@mui/material"

export default function Checkboxes({required, disabled, label, name, defaultValue, groupCheckboxes}: {
    required: boolean,
    disabled: boolean,
    label: any,
    name: string,
    defaultValue: string[],
    groupCheckboxes: string[]
}) {
    console.log(defaultValue)
    return (
        <FormControl required={required} variant="filled">
            <FormLabel>{label}</FormLabel>
            <FormGroup style={{ marginLeft: "20px" }}>
                {groupCheckboxes.map((checkboxValue, id) => 
                {
                    return (<FormControlLabel 
                        key={id}
                        control={<Checkbox defaultChecked={defaultValue.includes(checkboxValue)}/>}
                        label={checkboxValue}
                        name={name}
                        value={checkboxValue}
                        disabled={disabled}
                    />)})}
            </FormGroup>
        </FormControl>
    )
}