import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from "@mui/material"

export default function Radios({required, disabled, label, name, defaultValue, groupRadios, other = false, otherName = "", otherValue = ""}: {
    required: boolean,
    disabled: boolean,
    label: any,
    name: string,
    defaultValue: string,
    groupRadios: string[],
    other?: boolean,
    otherName?: string,
    otherValue?: string
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
              {other && 
                <TextField 
                  name={otherName}
                  defaultValue={otherValue}
                  disabled={disabled}
                />
              }
            </RadioGroup>
        </FormControl>
    )
}