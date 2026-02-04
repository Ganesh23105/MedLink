import React, { useState } from 'react';
import { useMediChain } from '../context/BlockChainContext';
import {
  uploadEncryptedFile,
  fetchAndDecryptFile,
  createDownloadableUrl,
  downloadFile
} from './ipfsUtils';

const IPFSMedicalReportManager = () => {
  const { account, uploadReport, medicalReports, loading } = useMediChain();
  const [selectedFile, setSelectedFile] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [viewingReport, setViewingReport] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleKeyChange = (e) => {
    setEncryptionKey(e.target.value);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!encryptionKey) {
      setError('Please enter an encryption key');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const metadata = {
        patientAddress: account,
        reportType: selectedFile.type,
        fileName: selectedFile.name,
        timestamp: Date.now()
      };

      const ipfsHash = await uploadEncryptedFile(
        selectedFile,
        encryptionKey,
        metadata
      );

      await uploadReport(ipfsHash);

      setSuccess(`Medical report uploaded successfully! IPFS Hash: ${ipfsHash}`);
      setSelectedFile(null);
      document.getElementById('file-upload').value = '';
    } catch (error) {
      console.error('Error uploading medical report:', error);
      setError(`Upload failed: ${error.message}`);
    }
  };

  const handleViewReport = async (ipfsHash) => {
    if (!encryptionKey) {
      setError('Please enter the encryption key to view this report');
      return;
    }

    try {
      setError('');
      setViewingReport(ipfsHash);

      const decryptedData = await fetchAndDecryptFile(ipfsHash, encryptionKey);

      try {
        const jsonData = JSON.parse(decryptedData);
        setDecryptedContent({ type: 'json', data: jsonData });
      } catch {
        const fileType = determineFileType(decryptedData);

        if (fileType === 'text') {
          setDecryptedContent({ type: 'text', data: decryptedData });
        } else {
          const blobUrl = createDownloadableUrl(
            decryptedData,
            'application/octet-stream'
          );
          setDecryptedContent({
            type: 'binary',
            data: blobUrl,
            originalData: decryptedData
          });
        }
      }
    } catch (error) {
      console.error('Error viewing medical report:', error);
      setError(`Failed to decrypt report: ${error.message}`);
      setDecryptedContent(null);
    }
  };

  const determineFileType = (data) => {
    const printableChars = data.replace(/[^\x20-\x7E]/g, '');
    return printableChars.length > data.length * 0.8 ? 'text' : 'binary';
  };

  const handleDownload = () => {
    if (!decryptedContent || !viewingReport) return;

    try {
      if (decryptedContent.type === 'binary') {
        downloadFile(
          decryptedContent.data,
          `decrypted-report-${Date.now()}`
        );
      } else {
        const content =
          decryptedContent.type === 'json'
            ? JSON.stringify(decryptedContent.data, null, 2)
            : decryptedContent.data;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, `decrypted-report-${Date.now()}.txt`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setError(`Download failed: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Medical Report Manager</h2>

      <div>
        <label>Encryption Key (Keep this secure!)</label>
        <input
          type="password"
          value={encryptionKey}
          onChange={handleKeyChange}
          placeholder="Enter your encryption key"
        />
        <p>
          This key will be used to encrypt/decrypt your medical reports. Do not
          lose it!
        </p>
      </div>

      <div>
        <h3>Upload Medical Report</h3>
        <input id="file-upload" type="file" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          disabled={loading || !selectedFile}
        >
          {loading ? 'Uploading...' : 'Upload Encrypted Report'}
        </button>
      </div>

      {error && <div>{error}</div>}
      {success && <div>{success}</div>}

      <div>
        <h3>Your Medical Reports</h3>
        {medicalReports && medicalReports.length > 0 ? (
          <ul>
            {medicalReports.map((report, index) => (
              <li key={index}>
                <div>
                  <p>Report #{index + 1}</p>
                  <p>{report}</p>
                </div>
                <button onClick={() => handleViewReport(report)}>
                  View
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No medical reports found.</p>
        )}
      </div>

      {viewingReport && decryptedContent && (
        <div>
          <h3>Viewing Report</h3>
          <p>IPFS Hash: {viewingReport}</p>

          <div>
            {decryptedContent.type === 'json' && (
              <pre>
                {JSON.stringify(decryptedContent.data, null, 2)}
              </pre>
            )}

            {decryptedContent.type === 'text' && (
              <div>{decryptedContent.data}</div>
            )}

            {decryptedContent.type === 'binary' && (
              <div>
                <p>Binary file content (not displayable)</p>
                <button onClick={handleDownload}>
                  Download File
                </button>
              </div>
            )}
          </div>

          <button onClick={handleDownload}>
            Download Report
          </button>
        </div>
      )}
    </div>
  );
};

export default IPFSMedicalReportManager;
