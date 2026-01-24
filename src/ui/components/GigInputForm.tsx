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
    FormHelperText,
    HelperText
} from '@patternfly/react-core';

import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

import {
    inputComps,
    inputCompsDefaultValue
} from '../utilities/inputComps';

const createFormGroup = (formGroup, formGroupId, gigDefFormState, setGigDefFormState) => {
    formGroup.attributes ??= {};
    formGroup.attributes.name = formGroupId;
    formGroup.attributes.id = formGroupId;
    formGroup.attributes.fieldId = formGroupId;
    formGroup.booleans ??= [];
    formGroup.booleans.forEach ((boolAttr) => {
        formGroup.attributes[boolAttr] = true;
    });
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

    let helperText = <FormHelperText><HelperText>{formGroup.helperText}</HelperText></FormHelperText>;

    return (
        <FormGroup {...formGroup.attributes}>
            {widgets}
            {formGroup.helperText && helperText}
        </FormGroup>
    );
};

export const GigFormType = {
    WAITING_FOR_INPUT: 'WAITING_FOR_INPUT',
    START: 'START',
    PREVIEW: 'PREVIEW',
}

export type GigFormType = typeof GigFormType[keyof typeof GigFormType];

interface GigModuleFormProps {
    formSpec: Array<object>;
    submissionAction(formState: Object): any;
    formType: GigFormType;
}

export const GigInputForm = ({formSpec, submissionAction, formType}: GigModuleFormProps) => {
    let formState: any = {};
    formSpec?.forEach( (formGroup: any) => {
        formState[formGroup.var] = formGroup.defaultValue?.[formGroup.var] ?? inputCompsDefaultValue[formGroup.components[0].inputType];
    });
    const [gigDefFormState, setGigDefFormState] = React.useState(formState);

    let formName = 'generic-form';
    let formSpecGroups = formSpec?.map( (formGroup, index) => {
        let formGroupId = `${formName}-${index}`;
        return createFormGroup(formGroup, formGroupId, gigDefFormState, setGigDefFormState);
    }) ?? [];

    const showForm = (formType == GigFormType.WAITING_FOR_INPUT) ||
        (formType == GigFormType.START) ||
        (formType == GigFormType.PREVIEW && formSpec)
    if (showForm) {
        return (
            <Form id={formName} name={formName} onSubmit={ (e) => {
                    e.preventDefault();
                    const target = e.target as HTMLFormElement;
                    target.checkValidity() && submissionAction(gigDefFormState);
                }}
            >
                {formSpecGroups.length ? <>{formSpecGroups}<Divider/></> : <></> }
                <ActionGroup>
                    {!(formType == GigFormType.PREVIEW) &&
                        <Button type={ButtonType.submit} variant='primary' >
                            {(formType == GigFormType.WAITING_FOR_INPUT) ? (formSpec ? 'Submit' : 'Approve') : 'Start'}
                        </Button>
                    }
                    {(formType == GigFormType.WAITING_FOR_INPUT) &&
                        <Button
                            type={ButtonType.submit}
                            variant='primary'
                            onClick={(e) => {
                                e.preventDefault();
                                gigDefFormState['__ABORT_ABORT_ABORT'] = '__ABORT_ABORT_ABORT'
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
        const titleText = 'Nothing to Show';
        const subText = (formType == GigFormType.PREVIEW) ? 'No Form Spec was defined.' : 'No input is required at this time.'
        return (
            <EmptyState>
                <EmptyStateHeader titleText={titleText} headingLevel='h4' icon={<EmptyStateIcon icon={CubesIcon} />} />
                <EmptyStateBody>
                    {subText}
                </EmptyStateBody>
            </EmptyState>
        );
    }
};