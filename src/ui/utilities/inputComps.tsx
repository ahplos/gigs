import * as React from 'react';
import {
    Banner,
    Checkbox,
    DatePicker,
    Dropdown,
    HelperText,
    HelperTextItem,
    FormHelperText,
    FormGroup,
    FormSelect,
    FormSelectOption,
    Radio,
    Sidebar,
    SidebarContent,
    SidebarPanel,
    TextArea,
    TextInput,
    TimePicker,
    Tooltip,
}  from '@patternfly/react-core';

interface TekRadioProps {
    formGroup: any;
    gigDefFormState: Map<string, string|boolean>;
    setGigDefFormState: React.Dispatch<React.SetStateAction<Map<string, string|boolean>>>;
    props: any;
    index: Number;
}

function TekRadio({formGroup, gigDefFormState, setGigDefFormState, props, index}: TekRadioProps) {
    props.onChange = (e) => {
        setGigDefFormState(prevFormValues => ({
            ...prevFormValues,
            [formGroup.var]: props.label
        }));
    };

    return <Radio {...props} />
}

function TekCheckBox({formGroup, gigDefFormState, setGigDefFormState, props, index}: TekRadioProps) {
    props.onChange = (e) => {
        setGigDefFormState(prevFormValues => ({
            ...prevFormValues,
            [formGroup.var]: !prevFormValues[formGroup.var]
        }));
    };

    return (
        <Checkbox {...props} isChecked={gigDefFormState[formGroup.var]} defaultChecked={props.defaultChecked ?? false} />
    );
}

function TekTextInput({formGroup, gigDefFormState, setGigDefFormState, props, index}: TekRadioProps) {
    props.onChange = (e) => {
        setGigDefFormState(prevFormValues => ({
            ...prevFormValues,
            [formGroup.var]: e.target.value
        }));
    };

    return (
        <TextInput {...props} />
    );
}

const inputComps = {
    Banner: Banner,
    Checkbox: TekCheckBox,
    DatePicker: DatePicker,
    Dropdown: Dropdown,
    HelperText: HelperText,
    HelperTextItem: HelperTextItem,
    FormHelperText: FormHelperText,
    FormGroup: FormGroup,
    FormSelect: FormSelect,
    FormSelectOption: FormSelectOption,
    Radio: TekRadio,
    Sidebar: Sidebar,
    SidebarContent: SidebarContent,
    SidebarPanel: SidebarPanel,
    TextArea: TextArea,
    TextInput: TekTextInput,
    TimePicker: TimePicker,
    Tooltip: Tooltip,
};

export default inputComps;