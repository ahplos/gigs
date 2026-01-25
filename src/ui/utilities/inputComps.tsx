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
    Title,
    ValidatedOptions
}  from '@patternfly/react-core';

interface GigTitleProps {
    title: string;
    headingLevel: 'h1' |  'h2' |  'h3' |  'h4' |  'h5' |  'h6';
}

export function GigTitle({title, headingLevel}: GigTitleProps) {
    return <Title className="pf-v5-u-pb-sm" headingLevel={headingLevel}>
               {title}
           </Title>
}

interface GigInputProps {
    formGroup: any;
    gigDefFormState: Map<string, string|boolean>;
    setGigDefFormState: React.Dispatch<React.SetStateAction<Map<string, string|boolean>>>;
    props: any;
    errorState: Map<string, string|boolean>;
    setErrorState: React.Dispatch<React.SetStateAction<Map<string, string|boolean>>>;
    index: Number;
}

function GigRadio({formGroup, gigDefFormState, setGigDefFormState, errorState, setErrorState, props, index}: GigInputProps) {
    props.onChange = (e) => {
        setGigDefFormState(prevFormValues => ({
            ...prevFormValues,
            [formGroup.var]: props.label
        }));
    };

    return <Radio {...props} />
}

function GigCheckBox({formGroup, gigDefFormState, setGigDefFormState, errorState, setErrorState, props, index}: GigInputProps) {
    props.onChange = (e) => {
        setGigDefFormState(prevFormValues => ({
            ...prevFormValues,
            [formGroup.var]: !prevFormValues[formGroup.var]
        }));
    };

    props.defaultChecked = gigDefFormState[formGroup.var] == props.isChecked ||  props.defaultChecked;
    return (
        <Checkbox {...props} isChecked={gigDefFormState[formGroup.var]} defaultChecked={props.defaultChecked ?? false} />
    );
}

function GigTextInput({formGroup, gigDefFormState, setGigDefFormState, errorState, setErrorState, props, index}: GigInputProps) {
    props.onChange = (e, value) => {
        setGigDefFormState(prevFormValues => ({
            ...prevFormValues,
            [formGroup.var]: value
        }));
        setErrorState(prevErrorValues => ({
            ...prevErrorValues,
            [formGroup.var]: undefined
        }));
    };

    props.onInvalid = (e, value) => {
        e.target.validated = ValidatedOptions.error;
        setErrorState(prevErrorValues => ({
            ...prevErrorValues,
            [formGroup.var]: true
        }));
    };

    props.value = gigDefFormState[formGroup.var];
    return (
        <TextInput {...props} validated={ errorState[formGroup.var] ? ValidatedOptions.error : ValidatedOptions.default }/>
    );
}

export const inputComps = {
    Banner: Banner,
    Checkbox: GigCheckBox,
    DatePicker: DatePicker,
    Dropdown: Dropdown,
    HelperText: HelperText,
    HelperTextItem: HelperTextItem,
    FormHelperText: FormHelperText,
    FormGroup: FormGroup,
    FormSelect: FormSelect,
    FormSelectOption: FormSelectOption,
    Radio: GigRadio,
    Sidebar: Sidebar,
    SidebarContent: SidebarContent,
    SidebarPanel: SidebarPanel,
    TextArea: TextArea,
    TextInput: GigTextInput,
    TimePicker: TimePicker,
};

export const inputCompsDefaultValue = {
    Checkbox: false,
    DatePicker: null,
    Dropdown: '',
    FormSelect: '',
    Radio: '',
    TextArea: '',
    TextInput: '',
    TimePicker: '',
};