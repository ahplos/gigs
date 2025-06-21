import * as React from 'react';
import {
    ActionGroup,
    Button,
    ButtonType,
    Divider,
    Form,
    FormGroup,
}  from '@patternfly/react-core';

import inputComps from './InputComps';

interface TeknetesFormProps {
    teknetesForm: any;
    submissionAction(formState: Object): any;
}

const TeknetesForm = ({teknetesForm, submissionAction}: TeknetesFormProps) => {
    const [teknetesFormState, setTeknetesFormState] = React.useState({});

    let formName = teknetesForm?.metadata?.name ?? 'generic-form';
    let formGroups = teknetesForm?.spec?.formGroups?.map( (formGroup, index) => {
        let formGroupId = `${formName}-${index}`;
        return createFormGroup(formGroup, formGroupId, teknetesFormState, setTeknetesFormState);
    }) ?? [];

    return (
        <Form id={formName} name={formName}>
            {formGroups.length ? <>{formGroups}<Divider/></> : <></> }
            <ActionGroup>
                <Button
                    type={ButtonType.submit}
                    variant='primary'
                    onClick={(e) => {
                        e.preventDefault();
                        submissionAction(teknetesFormState);
                    }}
                >
                    Launch
                </Button>
            </ActionGroup>
        </Form>
    );
};

const createFormGroup = (formGroup, formGroupId, teknetesFormState, setTeknetesFormState) => {
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
                 teknetesFormState={teknetesFormState}
                 setTeknetesFormState={setTeknetesFormState}
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

export default TeknetesForm;