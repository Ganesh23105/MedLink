import React from 'react';
import { Shield } from 'lucide-react';

const ZKPVerificationTab = () => {
  return (
    <div>
      <div>
        <div>
          <Shield />
          <h2>Zero Knowledge Proof Verification</h2>
          <p>
            Prove your health status without revealing sensitive medical data
          </p>
        </div>

        <div>
          <div>
            <h3>Available Verifications</h3>

            {[
              { title: 'COVID-19 Vaccination', status: 'Verified', icon: '💉' },
              { title: 'TB Screening', status: 'Clear', icon: '🫁' },
              { title: 'General Health Check', status: 'Current', icon: '❤️' },
              { title: 'Mental Health Assessment', status: 'Pending', icon: '🧠' }
            ].map((verification, index) => (
              <div key={index}>
                <div>
                  <span>{verification.icon}</span>
                  <div>
                    <h4>{verification.title}</h4>
                    <p>Status: {verification.status}</p>
                  </div>
                </div>

                <button>Generate Proof</button>
              </div>
            ))}
          </div>

          <div>
            <div>
              <h4>How ZKP Works</h4>
              <div>
                <div>
                  <span>•</span>
                  <span>Your health data stays encrypted and private</span>
                </div>
                <div>
                  <span>•</span>
                  <span>Only verification status is shared</span>
                </div>
                <div>
                  <span>•</span>
                  <span>Cryptographically secure and tamper-proof</span>
                </div>
                <div>
                  <span>•</span>
                  <span>Instantly verifiable by third parties</span>
                </div>
              </div>
            </div>

            <div>
              <h4>Use Cases</h4>
              <div>
                <p>• Travel verification without revealing full medical history</p>
                <p>• Employment health checks with privacy protection</p>
                <p>• Educational institution requirements</p>
                <p>• Insurance verification while maintaining confidentiality</p>
              </div>
            </div>

            <button>Learn More About ZKP</button>
          </div>
        </div>

        {/* Recent Proofs Generated */}
        <div>
          <h3>Recent Proof Generations</h3>

          {[
            {
              proof: 'COVID-19 Vaccination Proof',
              date: 'May 25, 2025',
              recipient: 'Global Airlines',
              status: 'Active'
            },
            {
              proof: 'TB Screening Proof',
              date: 'May 20, 2025',
              recipient: 'University Health Center',
              status: 'Active'
            },
            {
              proof: 'General Health Proof',
              date: 'May 18, 2025',
              recipient: 'Tech Corp HR',
              status: 'Expired'
            }
          ].map((proof, index) => (
            <div key={index}>
              <div>
                <h4>{proof.proof}</h4>
                <p>
                  Shared with {proof.recipient} on {proof.date}
                </p>
              </div>

              <span>{proof.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ZKPVerificationTab;
