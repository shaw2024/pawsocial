import React from 'react';
import './TermsModal.css';

function TermsModal({ onClose, type }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        {type === 'terms' ? (
          <>
            <h2>Terms & Conditions</h2>
            <div className="modal-body">
              <h3>1. Acceptance of Terms</h3>
              <p>By accessing and using PawSocial, you accept and agree to be bound by the terms and provision of this agreement.</p>

              <h3>2. Use License</h3>
              <p>Permission is granted to temporarily download one copy of the materials (information or software) on PawSocial for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul>
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on the site</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>

              <h3>3. User Content</h3>
              <p>You retain all rights to any content you submit, post or display on or through PawSocial. By uploading dog profiles or images, you grant PawSocial a non-exclusive, worldwide, royalty-free license to use such content.</p>

              <h3>4. Prohibited Activities</h3>
              <p>You agree not to:</p>
              <ul>
                <li>Upload inappropriate, offensive, or illegal content</li>
                <li>Harass, threaten, or harm other users</li>
                <li>Spam or engage in fraudulent activities</li>
                <li>Violate any laws or regulations</li>
              </ul>

              <h3>5. Disclaimer</h3>
              <p>The materials on PawSocial are provided on an 'as is' basis. PawSocial makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

              <h3>6. Limitations</h3>
              <p>In no event shall PawSocial or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on PawSocial.</p>
            </div>
          </>
        ) : (
          <>
            <h2>Privacy Policy</h2>
            <div className="modal-body">
              <h3>1. Introduction</h3>
              <p>PawSocial ("we", "us", or "our") operates the PawSocial application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our application.</p>

              <h3>2. Information Collection and Use</h3>
              <p>We collect several different types of information for various purposes to provide and improve our application:</p>
              <ul>
                <li><strong>Account Information:</strong> Email address and account preferences</li>
                <li><strong>Dog Profile Data:</strong> Dog names, breeds, ages, locations, and photos</li>
                <li><strong>User Content:</strong> Comments and likes you post on the platform</li>
              </ul>

              <h3>3. Data Security</h3>
              <p>The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.</p>

              <h3>4. Changes to This Privacy Policy</h3>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>

              <h3>5. Contact Us</h3>
              <p>If you have any questions about this Privacy Policy, please contact us at support@pawsocial.com</p>

              <h3>6. Cookie Policy</h3>
              <p>We use cookies and similar technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences.</p>

              <h3>7. Third-Party Services</h3>
              <p>Our application uses third-party services that may collect information. These services have their own privacy policies that you should review.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TermsModal;
