import { CheckedState } from "@radix-ui/react-checkbox";

export const handleCheckboxChange = (
    field: { value: string[]; onChange: (value: string[]) => void },
    type: string,
    checked: CheckedState,
) => {
    const updatedValue = checked
        ? [...field.value, type]
        : field.value.filter((val: string) => val !== type);

    field.onChange(updatedValue);
};
