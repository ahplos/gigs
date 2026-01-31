import * as React from 'react';
import {
    Checkbox,
    FormSelect,
    // FormSelectOption,
    Radio,
    TextArea,
    TextInput,
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
    gigFormState: Map<string, string|boolean>;
    setGigFormState: React.Dispatch<React.SetStateAction<Map<string, string|boolean>>>;
    props: any;
    gigFormErrors: Map<string, string|boolean>;
    setGigFormErrors: React.Dispatch<React.SetStateAction<Map<string, string|boolean>>>;
    index: Number;
}

function setGigFormInputCompValidation(formGroup, gigFormErrors, setGigFormErrors,  props) {
    props.onInvalid = (e) => {
        e.target.validated = ValidatedOptions.error;
        setGigFormErrors(prevErrorValues => ({
            ...prevErrorValues,
            [formGroup.var]: true
        }));
    };

    props.validated = () =>  { gigFormErrors[formGroup.var] ? ValidatedOptions.error : ValidatedOptions.default }
}

function GigRadioGroup({formGroup, gigFormState, setGigFormState, gigFormErrors, setGigFormErrors, props}: GigInputProps) {
    let gigRadioGroup: React.ReactElement[] = [];

    if (gigFormState[formGroup.var] == undefined && props.defaultValue) {
        gigFormState[formGroup.var] = props.defaultValue;
        delete props.defaultValue;
    }

    props.options.forEach( option => {
        setGigFormInputCompValidation(formGroup, gigFormErrors, setGigFormErrors, props);

        props.onChange = (e, checked) => {
            gigFormErrors[formGroup.var] = undefined;
            if (checked) {
                setGigFormState(prevFormValues => ({
                    ...prevFormValues,
                    [formGroup.var]: option
                }));
            }
        };

        props.label = option;
        gigRadioGroup.push(<Radio {...props} isChecked={ gigFormState[formGroup.var] == option } />);
    });

    return gigRadioGroup;
}

function GigCheckBox({formGroup, gigFormState, setGigFormState, gigFormErrors, setGigFormErrors, props}: GigInputProps) {
    setGigFormInputCompValidation(formGroup, gigFormErrors, setGigFormErrors, props);

    if (gigFormState[formGroup.var] == undefined) {
        props.defaultValue = props.defaultValue ?? 'false';
        gigFormState[formGroup.var] = (props.defaultValue?.match(/^true$/i) || false);
        delete props.defaultValue;
    }

    props.onChange = (e, checked) => {
        gigFormErrors[formGroup.var] = undefined;
        setGigFormState(prevFormValues => ({
            ...prevFormValues,
            [formGroup.var]: checked
        }));
    };

    return (
        <Checkbox checked={gigFormState[formGroup.var]} isChecked={ gigFormState[formGroup.var] } {...props} />
    );
}

function GigTextInput({formGroup, gigFormState, setGigFormState, gigFormErrors, setGigFormErrors, props}: GigInputProps) {
    setGigFormInputCompValidation(formGroup, gigFormErrors, setGigFormErrors, props);

    props.onChange = (e, value) => {
        gigFormErrors[formGroup.var] = undefined;
        setGigFormState(prevFormValues => ({
            ...prevFormValues,
            [formGroup.var]: value
        }));
    };

    gigFormState[formGroup.var] = (gigFormState[formGroup.var] == undefined) ? props.defaultValue ?? '' : gigFormState[formGroup.var];
    delete props.defaultValue;

    return (
        <TextInput value={gigFormState[formGroup.var]} {...props} />
    );
}

export const inputComps = {
    Checkbox: GigCheckBox,
    Select: FormSelect,
    RadioGroup: GigRadioGroup,
    TextArea: TextArea,
    Text: GigTextInput,
};