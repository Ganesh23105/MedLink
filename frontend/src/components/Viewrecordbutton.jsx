import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { FileText } from 'lucide-react';

export const ViewRecordsButton = ({ patient }) => {
  const navigate = useNavigate();

  const handleViewRecords = () => {
    if (patient && patient._id) {
      navigate('/patient-records', { state: { patient } });
    } else {
      alert('Patient information is incomplete');
    }
  };

  return (
    <Button
      onClick={handleViewRecords}
      className="flex items-center gap-2 w-full"
    >
      <FileText size={18} />
      View Records
    </Button>
  );
};

export default ViewRecordsButton;
