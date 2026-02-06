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
    selectAllFormState: Map<string, string|boolean>;
    setSelectAllFormState: React.Dispatch<React.SetStateAction<Map<string, string|boolean>>>;
    gigFormErrors: Map<string, string|boolean>;
    setGigFormErrors: React.Dispatch<React.SetStateAction<Map<string, string|boolean>>>;
    props: any;
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

    props.validated = gigFormErrors[formGroup.var] ? ValidatedOptions.error : ValidatedOptions.default;
}

function GigCheckbox({formGroup, gigFormState, setGigFormState, selectAllFormState, setSelectAllFormState, gigFormErrors, setGigFormErrors, props}: GigInputProps) {
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

function GigCheckboxGroup({formGroup, gigFormState, setGigFormState, selectAllFormState, setSelectAllFormState, gigFormErrors, setGigFormErrors, props}: GigInputProps) {
    setGigFormInputCompValidation(formGroup, gigFormErrors, setGigFormErrors, props);

    const checkboxes = [];
    props.options.forEach((option) => {
        checkboxes.push(
            <Checkbox id={formGroup.var + option}
                    label={option}
                    isChecked={gigFormState[formGroup.var]?.find(item => item == option)}
                    onChange={(e, checked) => {
                        gigFormErrors[formGroup.var] = undefined;
                        let newSelections = [...gigFormState[formGroup.var]];
                        setGigFormState(prevFormValues => ({
                            ...prevFormValues,
                            [formGroup.var]: (checked ? newSelections.concat([option]) : newSelections.filter(item => item != option))
                        }));
                    }} />
        );
    });

    React.useEffect(() => {
        if (selectAllFormState[formGroup.var] != null) {
            let newSelections;
            if (gigFormState[formGroup.var] == undefined) {
                gigFormState[formGroup.var] = [];
                newSelections = (props.defaultValue && props.options.find(item => item == props.defaultValue)) ? [props.defaultValue] : [];
            }
            else {
                newSelections = selectAllFormState[formGroup.var] ? [...props.options] : [];
            }
            delete props.defaultValue;
            setGigFormState(prevFormValues => ({
                ...prevFormValues,
                [formGroup.var]: newSelections
            }));
        }
    }, [selectAllFormState[formGroup.var]]);

    React.useEffect(() => {
        let state = gigFormState[formGroup.var]?.length == props.options.length;
        if (!state) {
            state = (gigFormState[formGroup.var] && gigFormState[formGroup.var].length > 0) ? null : false;
        }

        setSelectAllFormState(prevFormValues => ({
            ...prevFormValues,
            [formGroup.var]: state
        }));
    }, [gigFormState[formGroup.var]]);

    return (
        <Checkbox id={formGroup.var}
                  label="Select All"
                  isChecked={selectAllFormState[formGroup.var]}
                  body={checkboxes}
                  onChange={(e, checked) => {
                     setSelectAllFormState(prevFormValues => ({
                        ...prevFormValues,
                        [formGroup.var]: !prevFormValues[formGroup.var]
                     }));
                  }}
                  {...props}/>
    );
}

function GigRadioGroup({formGroup, gigFormState, setGigFormState, selectAllFormState, setSelectAllFormState, gigFormErrors, setGigFormErrors, props}: GigInputProps) {
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

function GigTextArea({formGroup, gigFormState, setGigFormState, selectAllFormState, setSelectAllFormState, gigFormErrors, setGigFormErrors, props}: GigInputProps) {
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
        <TextArea value={gigFormState[formGroup.var]} {...props} />
    );
}


function GigTextInput({formGroup, gigFormState, setGigFormState, selectAllFormState, setSelectAllFormState, gigFormErrors, setGigFormErrors, props}: GigInputProps) {
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
    Checkbox: GigCheckbox,
    CheckboxGroup: GigCheckboxGroup,
    RadioGroup: GigRadioGroup,
    Select: FormSelect,
    TextArea: GigTextArea,
    Text: GigTextInput,
};