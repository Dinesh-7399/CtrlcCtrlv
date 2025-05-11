// client/src/pages/admin/AdminSettings/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Spinner from '../../../components/common/Spinner';
import './AdminSettings.css';
import { FaSave, FaPalette, FaMoneyBillWave, FaEnvelope, FaGlobe, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

import {
  fetchAdminSettings,
  updateAdminSettings,
  selectAdminPlatformSettings,
  selectAdminSettingsIsLoading,
  selectAdminSettingsIsSaving,
  selectAdminSettingsError,
  selectAdminSettingsSuccessMessage,
  clearAdminSettingsMessages,
} from '../../../features/admin/adminSettingsSlice.js'; // Adjust path

const AdminSettings = () => {
  const dispatch = useDispatch();
  const settingsFromStore = useSelector(selectAdminPlatformSettings);
  const isLoading = useSelector(selectAdminSettingsIsLoading);
  const isSaving = useSelector(selectAdminSettingsIsSaving);
  const error = useSelector(selectAdminSettingsError);
  const successMessage = useSelector(selectAdminSettingsSuccessMessage);

  // Local form state, initialized from Redux store or defaults
  const [siteName, setSiteName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0056d2');
  // For Razorpay, Key ID can be displayed (if fetched), Secret is write-only
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [newRazorpayKeySecret, setNewRazorpayKeySecret] = useState(''); // Only for inputting a new secret
  const [paymentMode, setPaymentMode] = useState('test');

  useEffect(() => {
    dispatch(fetchAdminSettings());
    return () => { // Cleanup messages on unmount
        dispatch(clearAdminSettingsMessages());
    }
  }, [dispatch]);

  useEffect(() => {
    if (settingsFromStore) {
      setSiteName(settingsFromStore.SITE_NAME || '');
      setSupportEmail(settingsFromStore.SUPPORT_EMAIL || '');
      setLogoUrl(settingsFromStore.LOGO_URL || '');
      setPrimaryColor(settingsFromStore.PRIMARY_COLOR || '#0056d2');
      setRazorpayKeyId(settingsFromStore.RAZORPAY_KEY_ID_TEST || ''); // Assuming test key for display
      setPaymentMode(settingsFromStore.RAZORPAY_PAYMENT_MODE || 'test');
      // DO NOT set newRazorpayKeySecret from store, it's write-only
    }
  }, [settingsFromStore]);

  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearAdminSettingsMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);


  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAdminSettingsMessages()); // Clear previous messages

    const settingsToUpdate = {
      SITE_NAME: siteName,
      SUPPORT_EMAIL: supportEmail,
      LOGO_URL: logoUrl,
      PRIMARY_COLOR: primaryColor,
      RAZORPAY_PAYMENT_MODE: paymentMode,
      // Only include Razorpay keys if they are not empty or placeholder
      // Backend should handle validation and not store placeholder values for secrets.
    };
    if (razorpayKeyId.trim() !== '' && !razorpayKeyId.startsWith('rzp_test_...') && !razorpayKeyId.startsWith('rzp_live_...')) {
        settingsToUpdate.RAZORPAY_KEY_ID_TEST = razorpayKeyId; // Or a combined key like RAZORPAY_KEY_ID
    } else if (razorpayKeyId.trim() === '') {
        settingsToUpdate.RAZORPAY_KEY_ID_TEST = ''; // Allow clearing
    }


    if (newRazorpayKeySecret.trim() !== '') {
      // IMPORTANT: This sends the new secret. The backend must handle it securely.
      // The key name in backend's KNOWN_SETTINGS should match.
      settingsToUpdate.RAZORPAY_KEY_SECRET_TEST = newRazorpayKeySecret;
    }

    dispatch(updateAdminSettings(settingsToUpdate))
        .unwrap()
        .then(() => {
            if (newRazorpayKeySecret.trim() !== '') {
                setNewRazorpayKeySecret(''); // Clear secret field after successful save
            }
        })
        .catch(err => {
            // Error is already set in Redux state
            console.error("Settings update failed:", err);
        });
  };

  if (isLoading && !settingsFromStore.SITE_NAME) { // Show loader only on initial fetch
    return <div className="admin-page-container page-loading-spinner"><Spinner label="Loading settings..." /></div>;
  }

  return (
    <div className="admin-page-container admin-settings-page">
      <h1 className="admin-page-title">Platform Settings</h1>

      <form onSubmit={handleSubmit} className="settings-form">
        {error && (
          <div className="admin-form-error form-level-error">
            <h4>Save Failed:</h4>
            {typeof error === 'string' ? <p>{error}</p> :
              Array.isArray(error) ? (
                <ul>{error.map((err, i) => <li key={i}>{err.field ? `${err.field}: ` : ''}{err.message}</li>)}</ul>
              ) : <p>An unexpected error occurred.</p>
            }
          </div>
        )}
        {successMessage && (
          <p className="admin-form-success form-level-success"><FaCheckCircle /> {successMessage}</p>
        )}

        <fieldset className="settings-section">
          <legend><FaGlobe /> General Settings</legend>
          <Input label="Platform Name" id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
          <Input label="Support Email" id="supportEmail" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required />
        </fieldset>

        <fieldset className="settings-section">
          <legend><FaPalette /> Appearance</legend>
          <Input label="Logo URL" id="logoUrl" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
          <div className="form-group color-picker-group">
            <label htmlFor="primaryColor">Primary Theme Color</label>
            <div className="color-input-wrapper">
                <input id="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="color-input-native"/>
                <Input id="primaryColorText" type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="color-input-text" pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" title="Enter a valid hex color e.g. #0056d2"/>
            </div>
            <p className='input-hint'>Affects buttons, links, active states. Ensure good contrast.</p>
          </div>
        </fieldset>

        <fieldset className="settings-section">
          <legend><FaMoneyBillWave /> Payment Gateway (Razorpay)</legend>
          <p className="settings-note">
            Manage your Razorpay API keys. Get keys from your <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener noreferrer" className="external-link">Razorpay Dashboard</a>.
            <br/><strong>Key ID</strong> will be stored and displayed (if fetched). <strong>Key Secret</strong> is write-only; enter a new secret only if you need to change it. The current secret is never shown.
          </p>
          <Select
            label="Mode" id="paymentMode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
            options={[{ value: 'test', label: 'Test Mode' }, { value: 'live', label: 'Live Mode' }]}
            required
          />
          <Input
            label="Razorpay Key ID (Test/Live based on Mode)" id="razorpayKeyId" value={razorpayKeyId}
            onChange={(e) => setRazorpayKeyId(e.target.value)}
            placeholder={paymentMode === 'test' ? 'rzp_test_YourKeyID' : 'rzp_live_YourKeyID'}
          />
          <Input
            label="Razorpay Key Secret (Enter new to update)" id="newRazorpayKeySecret" type="password"
            value={newRazorpayKeySecret} onChange={(e) => setNewRazorpayKeySecret(e.target.value)}
            placeholder="Leave blank to keep current secret"
          />
        </fieldset>

        <div className="form-actions settings-actions">
          <Button type="submit" variant="primary" size="large" disabled={isSaving || isLoading}>
            {isSaving ? <Spinner size="small" /> : <FaSave />} Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
