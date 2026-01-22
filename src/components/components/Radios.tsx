import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from "@mui/material"
import { useState } from "react"

export default function Radios({ required, disabled, label, name, defaultValue, groupRadios, other = false, otherName = "", otherValue = "", row = false }: {
  required: boolean,
  disabled: boolean,
  label: any,
  name: string,
  defaultValue: string,
  groupRadios: string[],
  other?: boolean,
  otherName?: string,
  otherValue?: string,
  row?: boolean
}) {

  const [otherChecked, setOtherChecked] = useState(defaultValue === "Other" || (other && !groupRadios.includes(defaultValue) && defaultValue !== ""))

  return (
    <FormControl required={required}>
      <FormLabel>{label}</FormLabel>
      <RadioGroup name={name} defaultValue={defaultValue} style={{ marginLeft: "20px" }} row={row}>
        {groupRadios.map((radioValue, id) =>
          radioValue !== "Other" &&
          <FormControlLabel
            key={id}
            control={<Radio onChange={() => setOtherChecked(false)}/>}
            value={radioValue}
            label={radioValue}
            disabled={disabled}
          />)}
        {other &&
          <>
            <FormControlLabel
              control={<Radio defaultChecked={defaultValue.includes("Other")} onChange={() => setOtherChecked(true)} />}
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
          </>}
      </RadioGroup>
    </FormControl>
  )
}