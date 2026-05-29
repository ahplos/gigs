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
} from '../utilities/inputComps';

const createFormGroup = (formGroup, gigFormState, setGigFormState, selectAllFormState, setSelectAllFormState, gigFormErrors, setGigFormErrors) => {
    let formGroupKeys = ['style', 'isInline', 'label', 'labelInfo'];

    formGroup.attributes.fieldId = formGroup.var;

    const inputCompAttrs = {...formGroup.attributes};
    inputCompAttrs.name = formGroup.var;
    inputCompAttrs.id = formGroup.var;
    formGroupKeys.forEach(x => delete inputCompAttrs[x]);

    const Tag = inputComps[formGroup.inputType];
    let formGroupChildren =
        <Tag formGroup={formGroup}
             gigFormState={gigFormState}
             setGigFormState={setGigFormState}
             selectAllFormState={selectAllFormState}
             setSelectAllFormState={setSelectAllFormState}
             gigFormErrors={gigFormErrors}
             setGigFormErrors={setGigFormErrors}
             props={inputCompAttrs} />

    if (formGroup.defaultValue) {
        setGigFormState(formGroup.var, formGroup.defaultValue)
    }

    let formGroupId = `formGroup-${formGroup.var}`;
    const formGroupAttrs: any = {};
    formGroupKeys.forEach(x => formGroupAttrs[x] = formGroup.attributes[x]);
    formGroupAttrs.name = formGroupId;
    formGroupAttrs.id = formGroupId;
    formGroupAttrs.fieldId = formGroup.var;
    formGroupAttrs.isRequired = formGroup.attributes.isRequired;

    let helperIcon = gigFormErrors[formGroup.var] ? <ExclamationCircleIcon/> : <></>;
    let helperVariant = gigFormErrors[formGroup.var] ? ValidatedOptions.error : ValidatedOptions.default;

    return (
        <FormGroup name={formGroupId} id={formGroupId} {...formGroupAttrs}>
            {formGroupChildren}
            {formGroup.helperText &&
                <FormHelperText>
                    <HelperText>
                        <HelperTextItem icon={helperIcon} variant={helperVariant}>
                            {formGroup.helperText}
                        </HelperTextItem>
                    </HelperText>
                </FormHelperText>
            }
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
    formSpec: Array<Object>;
    submissionAction(formState: Object): any;
    abortAction(): any;
    formType: GigFormType;
}

export const GigInputForm = ({formSpec, submissionAction, abortAction, formType}: GigModuleFormProps) => {
    let formState: any = {};
    let selectAllState: any = {};
    const [gigFormState, setGigFormState] = React.useState(formState);
    const [selectAllFormState, setSelectAllFormState] = React.useState(selectAllState);

    const [gigFormErrors, setGigFormErrors] = React.useState({});

    let formSpecGroups = formSpec?.map( (formGroup, index) => {
        return createFormGroup(formGroup, gigFormState, setGigFormState, selectAllFormState, setSelectAllFormState, gigFormErrors, setGigFormErrors);
    }) ?? [];

    const showForm = (formType == GigFormType.WAITING_FOR_INPUT) ||
        (formType == GigFormType.START) ||
        (formType == GigFormType.PREVIEW && formSpec)
    if (showForm) {
        let formName = 'gigrun-input-form';
        let buttonLabel = (formType == GigFormType.WAITING_FOR_INPUT) ? (formSpec ? 'Submit' : 'Approve') : 'Start';
        return (
            <Form id={formName} name={formName} onSubmit={ (e) => {
                    e.preventDefault();
                    const target = e.target as HTMLFormElement;
                    target.reportValidity() && formType != GigFormType.PREVIEW && submissionAction(gigFormState);
                }}
            >
                {formSpecGroups.length ? <>{formSpecGroups}<Divider/></> : <></> }
                <ActionGroup>
                    <Button type={ButtonType.submit} variant='primary' >
                        {formType == GigFormType.PREVIEW ? 'Test' : buttonLabel}
                    </Button>
                    {(formType == GigFormType.WAITING_FOR_INPUT) &&
                        <Button
                            type={ButtonType.button}
                            variant='primary'
                            onClick={(e) => {
                                e.preventDefault();
                                abortAction();
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