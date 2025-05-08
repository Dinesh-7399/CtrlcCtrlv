import React, { useState, useEffect } from 'react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select'; // Assuming you have this
import './AdminSettings.css'; // We'll create this CSS file
import { FaSave, FaPalette, FaMoneyBillWave, FaEnvelope, FaGlobe } from 'react-icons/fa'; // Icons

const AdminSettings = () => {
    // --- State for Settings ---
    // Initialize with default/placeholder values
    // TODO: Fetch current settings from backend in a useEffect later
    const [siteName, setSiteName] = useState('My LMS Platform');
    const [supportEmail, setSupportEmail] = useState('support@example.com');
    const [logoUrl, setLogoUrl] = useState('/logo.png'); // Path to default logo
    const [primaryColor, setPrimaryColor] = useState('#0056d2'); // Default theme color
    const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_test_...'); // Placeholder - DO NOT COMMIT REAL KEYS
    const [razorpayKeySecret, setRazorpayKeySecret] = useState('********'); // Masked - DO NOT COMMIT REAL KEYS
    const [paymentMode, setPaymentMode] = useState('test'); // 'test' or 'live'

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' }); // For success/error feedback

    // --- Placeholder Save Handler ---
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage({ type: '', text: '' }); // Clear previous message

        const settingsData = {
            siteName,
            supportEmail,
            logoUrl,
            primaryColor,
            razorpayKeyId: (razorpayKeyId === 'rzp_test_...' || razorpayKeyId === 'rzp_live_...') ? razorpayKeyId : 'key_not_shown', // Avoid sending placeholder/masked
            razorpayKeySecret: 'secret_not_sent_from_frontend', // NEVER send secret from frontend
            paymentMode,
        };

        console.log("TODO: Send settingsData to backend API endpoint", settingsData);
        alert("TODO: Implement backend API call to save settings.");

        // Simulate API call
        setTimeout(() => {
            // Assume success for now
            setSaveMessage({ type: 'success', text: 'Settings saved successfully! (Simulated)' });
            // If saving secret, update masked value
            if (settingsData.razorpayKeyId !== 'key_not_shown') { // Only mask if a potentially real key was typed
                 setRazorpayKeySecret('********'); // Re-mask secret if it was changed
            }
            setIsSaving(false);

            // Optional: Clear success message after few seconds
             setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);

        }, 1000);
    };
    // --- End Placeholder Save Handler ---


    return (
        <div className="admin-page-container admin-settings-page">
            <h1 className="admin-page-title">Platform Settings</h1>

            <form onSubmit={handleSubmit} className="settings-form">

                {/* --- General Settings --- */}
                <fieldset className="settings-section">
                    <legend><FaGlobe /> General Settings</legend>
                    <Input
                        label="Platform Name"
                        id="siteName"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        required
                    />
                     <Input
                        label="Support Email"
                        id="supportEmail"
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        required
                    />
                </fieldset>

                 {/* --- Appearance Settings --- */}
                <fieldset className="settings-section">
                    <legend><FaPalette /> Appearance</legend>
                    <Input
                        label="Logo URL"
                        id="logoUrl"
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                    />
                     <Input
                        label="Primary Theme Color"
                        id="primaryColor"
                        type="color" // Basic color picker
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="color-input"
                    />
                    <p className='input-hint'>Affects buttons, links, active states. Ensure good contrast.</p>

                </fieldset>

                 {/* --- Payment Gateway Settings --- */}
                <fieldset className="settings-section">
                     <legend><FaMoneyBillWave /> Payment Gateway (Razorpay)</legend>
                      <p className="settings-note">
                        Manage your Razorpay API keys. Get keys from your <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener noreferrer">Razorpay Dashboard</a>.
                        Use Test keys for development. Never commit real Secret Keys to your code.
                     </p>
                     <Select
                        label="Mode"
                        id="paymentMode"
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        options={[
                            { value: 'test', label: 'Test Mode' },
                            { value: 'live', label: 'Live Mode' },
                        ]}
                        required
                     />
                     <Input
                        label="Razorpay Key ID"
                        id="razorpayKeyId"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                        placeholder={paymentMode === 'test' ? 'rzp_test_...' : 'rzp_live_...'}
                        required
                     />
                     <Input
                        label="Razorpay Key Secret"
                        id="razorpayKeySecret"
                        type="password" // Mask input
                        value={razorpayKeySecret}
                        // Update masked value only if user types something new
                        onChange={(e) => setRazorpayKeySecret(e.target.value)}
                        placeholder="Enter new secret to update"
                        // Avoid making secret required in frontend form validation
                        // Backend should handle key validation
                     />

                </fieldset>

                 {/* Display Save Messages */}
                 {saveMessage.text && (
                    <p className={`admin-${saveMessage.type}-message settings-save-message`}>
                        {saveMessage.text}
                    </p>
                 )}

                 {/* --- Save Button --- */}
                 <div className="form-actions settings-actions">
                      <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? <Spinner size="small"/> : <FaSave />} Save Settings
                    </Button>
                 </div>

            </form>
        </div>
    );
};

export default AdminSettings;