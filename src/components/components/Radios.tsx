import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material"

export default function Radios({required, disabled, label, name, defaultValue, groupRadios}: {
    required: boolean,
    disabled: boolean,
    label: any,
    name: string,
    defaultValue: string,
    groupRadios: string[]
}) {
    return (
        <FormControl required={required}>
            <FormLabel>{label}</FormLabel>
            <RadioGroup name={name} defaultValue={defaultValue} style={{ marginLeft: "20px" }}>
              {groupRadios.map((radioValue, id) => 
                <FormControlLabel
                    key={id}
                    control={<Radio />}
                    value={radioValue}
                    label={radioValue}
                    disabled={disabled}
                />)}
            </RadioGroup>
        </FormControl>
    )
}