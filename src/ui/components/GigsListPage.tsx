import * as React from 'react';

import {
  NamespaceBar,
} from '@openshift-console/dynamic-plugin-sdk';


import GigsList from './GigsList'

const GigsListPage = () => {
  return (
    <>
      <NamespaceBar />
      <GigsList/>
    </>
  );
};

export default GigsListPage;