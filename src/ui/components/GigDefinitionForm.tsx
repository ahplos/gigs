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

const createFormGroup = (formGroup, formGroupId, gigDefFormState, setGigDefFormState) => {
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
                 gigDefFormState={gigDefFormState}
                 setGigDefFormState={setGigDefFormState}
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

interface GigDefinitionFormProps {
    formSpec: Array<object>;
    submissionAction(formState: Object): any;
}

const GigDefinitionForm = ({formSpec, submissionAction}: GigDefinitionFormProps) => {
    const [gigDefFormState, setGigDefFormState] = React.useState({});

    let formName = 'generic-form';
    let formSpecGroups = formSpec?.map( (formGroup, index) => {
        let formGroupId = `${formName}-${index}`;
        return createFormGroup(formGroup, formGroupId, gigDefFormState, setGigDefFormState);
    }) ?? [];

    return (
        <Form id={formName} name={formName}>
            {formSpecGroups.length ? <>{formSpecGroups}<Divider/></> : <></> }
            <ActionGroup>
                <Button
                    type={ButtonType.submit}
                    variant='primary'
                    onClick={(e) => {
                        e.preventDefault();
                        submissionAction(gigDefFormState);
                    }}
                >
                    Launch
                </Button>
            </ActionGroup>
        </Form>
    );
};

export default GigDefinitionForm;