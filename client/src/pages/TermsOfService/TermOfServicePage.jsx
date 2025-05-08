// client/src/pages/TermsOfServicePage/TermsOfServicePage.jsx
import React from 'react';
// You can reuse the Privacy Policy CSS if the layout is identical,
// or create a new one if needed. Let's assume reuse for simplicity.
import '../PrivacyPolicy/PrivacyPolicyPage.css'; // Reusing Privacy Policy CSS

const TermsOfServicePage = () => {
  const lastUpdated = "April 26, 2025"; // Update this date as needed
  const companyName = "LMS Platform"; // Replace with your platform name
  const contactEmail = "support@yourlmsplatform.com"; // Replace with your support/contact email

  return (
    // Reuse the container class from Privacy Policy CSS
    <div className="privacy-policy-container page-container">
      {/* Use specific title class if needed, or reuse */}
      <h1 className="privacy-policy-title">Terms of Service</h1>
      <p className="last-updated">Last Updated: {lastUpdated}</p>

      <section className="privacy-section">
        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing or using our {companyName} service (the "Service"), you agree
          to be bound by these Terms of Service ("Terms"). If you disagree with
          any part of the terms, then you may not access the Service.
        </p>
         <p>
          **IMPORTANT:** This is placeholder text. These Terms constitute a legally
          binding agreement. You MUST consult with a legal professional to draft
          Terms of Service that are appropriate for your specific service, users,
          and location (Bhubaneswar, Odisha, India).
        </p>
      </section>

      <section className="privacy-section">
        <h2>2. User Accounts</h2>
        <p>
          [Placeholder: Describe requirements for account registration (e.g., age),
          user responsibilities for account security (password confidentiality),
          and conditions for account termination (e.g., violation of terms).]
        </p>
      </section>

      <section className="privacy-section">
        <h2>3. Use of the Service</h2>
        <p>
          [Placeholder: Describe the license granted to users to use the platform.
          Outline permitted uses and explicitly list prohibited conduct (e.g.,
          illegal activities, harassment, infringing intellectual property,
          disrupting the service, unauthorized access, commercial use without
          permission).]
        </p>
      </section>

      <section className="privacy-section">
        <h2>4. Content</h2>
        <p>
          [Placeholder: Define ownership of content provided by the platform vs.
          content uploaded or created by users (User Content). If users can upload
          content, describe the license they grant you to use that content for
          operating the service. Outline responsibilities regarding User Content
          (user is responsible, you may moderate/remove content violating terms).]
        </p>
      </section>

      <section className="privacy-section">
        <h2>5. Payments, Subscriptions, and Refunds</h2>
        <p>
          [Placeholder: If applicable, describe terms related to payments for courses
          or subscriptions. Detail pricing, payment methods, billing cycles, renewal
          terms, and your refund policy (be very clear about conditions for refunds).]
        </p>
      </section>

      <section className="privacy-section">
        <h2>6. Intellectual Property</h2>
        <p>
          [Placeholder: State that the Service and its original content (excluding User
          Content), features, and functionality are owned by {companyName} and
          protected by copyright, trademark, and other laws. Specify restrictions
          on using your intellectual property.]
        </p>
      </section>

      <section className="privacy-section">
        <h2>7. Disclaimers</h2>
        <p>
          [Placeholder: Include necessary legal disclaimers. Examples: Service is provided
          "AS IS" and "AS AVAILABLE". Disclaimer of warranties (express or implied).
          Disclaimer regarding accuracy or reliability of content. Disclaimer regarding
          uninterrupted or error-free service.]
        </p>
      </section>

      <section className="privacy-section">
        <h2>8. Limitation of Liability</h2>
        <p>
          [Placeholder: Include a clause limiting your liability for damages arising
          from the use of the service, to the maximum extent permitted by applicable law.
          Consult a legal professional for appropriate wording.]
        </p>
      </section>

      <section className="privacy-section">
        <h2>9. Governing Law</h2>
        <p>
          [Placeholder: Specify the governing law and jurisdiction for any disputes
          arising out of these Terms (e.g., "These Terms shall be governed and construed
          in accordance with the laws of India, without regard to its conflict of law
          provisions. You agree to submit to the personal jurisdiction of the courts
          located in Bhubaneswar, Odisha, India." - **VERIFY WITH LEGAL COUNSEL**).]
        </p>
      </section>

      <section className="privacy-section">
        <h2>10. Changes To Terms</h2>
        <p>
           [Placeholder: Reserve the right to modify these Terms at any time. Explain how
           users will be notified of changes (e.g., posting on the site, updating the date)
           and that continued use after changes constitutes acceptance.]
        </p>
      </section>

       <section className="privacy-section">
        <h2>11. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
         <p>
           [Placeholder: Your Company Name/Your Name] <br />
           [Your Physical Address, Bhubaneswar, Odisha, India]
        </p>
       </section>

    </div>
  );
};

export default TermsOfServicePage;