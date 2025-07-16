import * as React from 'react';
import {
    ActionGroup,
    Button,
    ButtonType,
    Divider,
    Form,
    FormGroup,
}  from '@patternfly/react-core';

import inputComps from '../utilities/inputComps';

interface GigRunFormProps {
    formName: string;
    formSpec: any;
    submissionAction(formState: Object): any;
}

const GigRunForm = ({formName, formSpec, submissionAction}: GigRunFormProps) => {
    const [gigRunFormState, setGigRunFormState] = React.useState({});

    formSpec = formSpec?.map( (formGroup, index) => {
        let formGroupId = `${formName}-${index}`;
        return createFormGroup(formGroup, formGroupId, gigRunFormState, setGigRunFormState);
    }) ?? [];

    return (
        <Form id={formName} name={formName}>
            {formSpec.length ? <>{formSpec}<Divider/></> : <></> }
            <ActionGroup>
                <Button
                    type={ButtonType.submit}
                    variant='primary'
                    onClick={(e) => {
                        e.preventDefault();
                        submissionAction(gigRunFormState);
                    }}
                >
                    Launch
                </Button>
            </ActionGroup>
        </Form>
    );
};

const createFormGroup = (formGroup, formGroupId, gigRunFormState, setGigRunFormState) => {
    formGroup.attributes.name = formGroupId;
    formGroup.attributes.id = formGroupId;
    formGroup.attributes.fieldId = formGroupId;
    let widgets = formGroup.components.map( (component, index) => {
        component.attributes ??= {};
        component.attributes.id = `${formGroup.attributes.id}-${index}`;
        component.attributes.name = formGroup.attributes.name;

        const Tag = inputComps[component.inputType];
        return (
            <Tag formGroup={formGroup}
                 gigRunFormState={gigRunFormState}
                 setGigRunFormState={setGigRunFormState}
                 props={component.attributes ?? {}}
                 index={index}/>
        )
    });

    return (
        <FormGroup {...formGroup.attributes}>
            {widgets}
        </FormGroup>
    );
};

export default GigRunForm;