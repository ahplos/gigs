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
    HelperText,
    HelperTextItem,
    ValidatedOptions,
} from '@patternfly/react-core';

import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';

import {
    inputComps,
    inputCompsDefaultValue
} from '../utilities/inputComps';

const createFormGroup = (formGroup, formGroupId, gigDefFormState, setGigDefFormState, errorState, setErrorState) => {
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
                 errorState={errorState}
                 setErrorState={setErrorState}
                 props={component.attributes}
                 index={index}/>
        )
    });

    let helperIcon = errorState[formGroup.var] ? <ExclamationCircleIcon/> : <></>;
    let helperVariant = errorState[formGroup.var] ? ValidatedOptions.error : ValidatedOptions.default;
    let helperText = (
        <FormHelperText>
            <HelperText>
                <HelperTextItem icon={helperIcon} variant={helperVariant}>
                    {formGroup.helperText}
                </HelperTextItem>
            </HelperText>
        </FormHelperText>
    )

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

    const [errorState, setErrorState] = React.useState({});

    let formName = 'generic-form';
    let formSpecGroups = formSpec?.map( (formGroup, index) => {
        let formGroupId = `${formName}-${index}`;
        return createFormGroup(formGroup, formGroupId, gigDefFormState, setGigDefFormState, errorState, setErrorState);
    }) ?? [];

    const showForm = (formType == GigFormType.WAITING_FOR_INPUT) ||
        (formType == GigFormType.START) ||
        (formType == GigFormType.PREVIEW && formSpec)
    if (showForm) {
        return (
            <Form id={formName} name={formName} onSubmit={ (e) => {
                    e.preventDefault();
                    const target = e.target as HTMLFormElement;
                    target.reportValidity() && submissionAction(gigDefFormState);
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