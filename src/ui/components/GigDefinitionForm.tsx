import * as React from 'react';
import {
    ActionGroup,
    Button,
    ButtonType,
    Divider,
    EmptyState,
    EmptyStateHeader,
    EmptyStateBody,
    EmptyStateIcon,
    Form,
    FormGroup,
}  from '@patternfly/react-core';

import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

import inputComps from '../utilities/inputComps';

const createFormGroup = (formGroup, formGroupId, gigDefFormState, setGigDefFormState) => {
    formGroup.attributes.name = formGroupId;
    formGroup.attributes.id = formGroupId;
    formGroup.attributes.fieldId = formGroupId;
    let widgets = formGroup.components.map( (component, index) => {
        component.attributes ??= {};
        component.attributes.id = `${formGroup.attributes.id}-${index}`;
        component.attributes.name = formGroup.attributes.name;
        component.booleans ??= [];
        component.booleans.forEach ((boolAttr) => {
            formGroup.attributes[boolAttr] = true;
            component.attributes[boolAttr] = true;
        });

        const Tag = inputComps[component.inputType];
        return (
            <Tag formGroup={formGroup}
                 gigDefFormState={gigDefFormState}
                 setGigDefFormState={setGigDefFormState}
                 props={component.attributes}
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
    gigRun?: boolean;
    preview?: boolean;
}

const GigDefinitionForm = ({formSpec, submissionAction, gigRun, preview}: GigDefinitionFormProps) => {
    const [gigDefFormState, setGigDefFormState] = React.useState({});

    let formName = 'generic-form';
    let formSpecGroups = formSpec?.map( (formGroup, index) => {
        let formGroupId = `${formName}-${index}`;
        return createFormGroup(formGroup, formGroupId, gigDefFormState, setGigDefFormState);
    }) ?? [];

    if (formSpec || gigRun) {
        return (
            <Form id={formName} name={formName}>
                {formSpecGroups.length ? <>{formSpecGroups}<Divider/></> : <></> }
                <ActionGroup>
                    {!preview &&
                        <Button
                            type={ButtonType.submit}
                            variant='primary'
                            onClick={(e) => {
                                e.preventDefault();
                                submissionAction(gigDefFormState);
                            }}
                        >
                            {!gigRun ? 'Run': (formSpec ? 'Submit' : 'Approve')}
                        </Button>
                    }
                    {gigRun &&
                        <Button
                            type={ButtonType.submit}
                            variant='primary'
                            onClick={(e) => {
                                e.preventDefault();
                                submissionAction(gigDefFormState);
                            }}
                        >
                            {'Abort'}
                        </Button>
                    }
                </ActionGroup>
            </Form>
        );
    }
    else {
        return (
            <EmptyState>
                <EmptyStateHeader titleText='No Preview' headingLevel='h4' icon={<EmptyStateIcon icon={CubesIcon} />} />
                <EmptyStateBody>
                    No Form Spec was defined.
                </EmptyStateBody>
            </EmptyState>
        );
    }
};

export default GigDefinitionForm;