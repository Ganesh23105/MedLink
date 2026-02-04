import React from 'react';
import { Link } from 'react-router-dom';

export const ViewRecordsButton = ({ patient }) => {
  return (
    <Link
      to="/patient-records"
      state={{ patient }}
    >
      View Records
    </Link>
  );
};

export default ViewRecordsButton;
