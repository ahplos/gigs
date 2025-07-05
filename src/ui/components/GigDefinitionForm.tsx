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

interface GigDefinitionFormProps {
    gigDefinition: any;
    submissionAction(formState: Object): any;
}

const GigDefinitionForm = ({gigDefinition, submissionAction}: GigDefinitionFormProps) => {
    const [gigDefFormState, setGigDefFormState] = React.useState({});

    let formName = gigDefinition?.metadata?.name ?? 'generic-form';
    let formSpec = gigDefinition?.spec?.formSpec?.map( (formGroup, index) => {
        let formGroupId = `${formName}-${index}`;
        return createFormGroup(formGroup, formGroupId, gigDefFormState, setGigDefFormState);
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
                        submissionAction(gigDefFormState);
                    }}
                >
                    Launch
                </Button>
            </ActionGroup>
        </Form>
    );
};

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

export default GigDefinitionForm;