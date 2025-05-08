// client/src/pages/PrivacyPolicyPage/PrivacyPolicyPage.jsx
import React from 'react';
import './PrivacyPolicyPage.css'; // Import the CSS

const PrivacyPolicyPage = () => {
  const lastUpdated = "April 26, 2025"; // Update this date as needed
  const companyName = "LMS Platform"; // Replace with your platform name
  const contactEmail = "privacy@yourlmsplatform.com"; // Replace with your contact email

  return (
    // Use page-container for consistent layout if defined globally
    <div className="privacy-policy-container page-container">
      <h1 className="privacy-policy-title">Privacy Policy</h1>
      <p className="last-updated">Last Updated: {lastUpdated}</p>

      <section className="privacy-section">
        <h2>1. Introduction</h2>
        <p>
          Welcome to {companyName}. We are committed to protecting your personal
          information and your right to privacy. If you have any questions or
          concerns about this privacy notice, or our practices with regards to
          your personal information, please contact us at {contactEmail}.
        </p>
        <p>
          This privacy notice describes how we might use your information if you visit
          our website, use our mobile application, or engage with us in other
          related ways – including any sales, marketing, or events. Reading this
          privacy notice will help you understand your privacy rights and choices.
          If you do not agree with our policies and practices, please do not use
          our Services.
        </p>
        <p>
          **IMPORTANT:** This is placeholder text. You MUST replace this with your
          actual policy drafted in consultation with a legal professional familiar
          with privacy laws applicable to your users (e.g., Indian laws like the
          Digital Personal Data Protection Act, GDPR if applicable, etc.).
        </p>
      </section>

      <section className="privacy-section">
        <h2>2. What Information Do We Collect?</h2>
        <p>
          [Placeholder: Describe the types of personal information you collect.
          Be specific. Examples:
          <ul>
            <li>Personal identification information (Name, email address, phone number, etc.)</li>
            <li>Account data (Username, password, profile picture)</li>
            <li>Payment Data (Handled by payment processor - state this clearly)</li>
            <li>Course progress and performance data</li>
            <li>User-generated content (Notes, forum posts, assignment submissions)</li>
            <li>Technical Data (IP address, browser type, device information, cookies - specify cookie usage)</li>
          </ul>
          Clearly state if you collect sensitive data.]
        </p>
      </section>

      <section className="privacy-section">
        <h2>3. How Do We Use Your Information?</h2>
        <p>
          [Placeholder: Explain the purposes for which you use the collected information.
          Be specific. Examples:
          <ul>
            <li>To provide, operate, and maintain our Services</li>
            <li>To process your transactions</li>
            <li>To manage your account and provide customer support</li>
            <li>To personalize your learning experience</li>
            <li>To communicate with you (updates, marketing - specify opt-out)</li>
            <li>To improve our Services</li>
            <li>For security purposes and fraud prevention</li>
            <li>To comply with legal obligations]</li>
          </ul>
        </p>
      </section>

      <section className="privacy-section">
        <h2>4. Will Your Information Be Shared With Anyone?</h2>
        <p>
          [Placeholder: Describe if and how you share user data. Be specific.
          Examples:
          <ul>
            <li>With instructors (e.g., progress for grading/feedback, if applicable)</li>
            <li>With third-party service providers (Payment processors, hosting providers, analytics tools, email services - list types of providers)</li>
            <li>For legal reasons (Subpoenas, court orders, government requests)</li>
            <li>In case of business transfers (Mergers, acquisitions)</li>
            <li>With user consent]</li>
          </ul>
           State clearly that you do not sell personal data unless you actually do (which requires specific compliance steps).
        </p>
      </section>

       <section className="privacy-section">
        <h2>5. How Do We Keep Your Information Safe?</h2>
        <p>
          [Placeholder: Describe the security measures you implement (e.g., encryption, access controls, secure servers). Acknowledge that no system is 100% secure but you take reasonable precautions.]
        </p>
      </section>

       <section className="privacy-section">
        <h2>6. Do We Use Cookies and Other Tracking Technologies?</h2>
        <p>
          [Placeholder: Explain your use of cookies (essential, performance, functional, marketing). Provide information on how users can manage cookie preferences. Link to a separate Cookie Policy if applicable.]
        </p>
      </section>

      <section className="privacy-section">
        <h2>7. What Are Your Privacy Rights?</h2>
        <p>
          [Placeholder: Describe user rights based on applicable laws (e.g., right to access, correct, delete data, object to processing, withdraw consent). Mention how users can exercise these rights, referencing your location - Bhubaneswar, Odisha, India - and relevant Indian data protection laws.]
        </p>
      </section>

       <section className="privacy-section">
        <h2>8. Updates To This Notice</h2>
        <p>
           [Placeholder: Explain that you may update the policy and how users will be notified (e.g., updating the "Last Updated" date).]
        </p>
      </section>

       <section className="privacy-section">
        <h2>9. How Can You Contact Us About This Notice?</h2>
        <p>
          If you have questions or comments about this notice, you may email us at{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a> or contact us by post at:
        </p>
        <p>
           [Placeholder: Your Company Name/Your Name] <br />
           [Your Physical Address, Bhubaneswar, Odisha, India] <br />
           [Your Phone Number, Optional]
        </p>
       </section>

    </div>
  );
};

export default PrivacyPolicyPage;