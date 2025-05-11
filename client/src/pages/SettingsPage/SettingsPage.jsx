// client/src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext"; // Ensure this path is correct
import Input from "../../components/common/Input";    // Ensure this path is correct
import Button from "../../components/common/Button";  // Ensure this path is correct
import Spinner from "../../components/common/Spinner"; // Ensure this path is correct
import "./SettingsPage.css"; // Ensure this path is correct
import {
  FaUserEdit, FaLock, FaBell, FaEnvelope, FaUserGraduate,
  FaSave, FaTrashAlt, FaSpinner as FaSpinnerIcon, FaCheckCircle, FaExclamationTriangle
} from "react-icons/fa";

import { useSelector, useDispatch } from 'react-redux';
import {
    updateUserProfile,
    changePassword,
    fetchNotifications,
    updateNotifications,
    deleteAccount,
    selectCurrentUser,         // Selector for detailed user profile from Redux
    selectProfileLoading,      // Loading state for fetching/updating profile
    selectProfileError,        // Error state for profile operations
    selectProfileMessage,      // Success/general message for profile operations (ensure this exists)
    selectPasswordChangeLoading,
    selectPasswordChangeError,
    selectPasswordChangeMessage,
    selectNotificationPrefs,   // Selector for current notification preferences from Redux
    selectNotificationPrefsLoading,
    selectNotificationPrefsError,
    selectNotificationPrefsMessage,
    selectAccountDeleteLoading,
    selectAccountDeleteError,
    selectAccountDeleteMessage,
    clearMessagesForSettings,  // Action to clear messages in Redux state
    // Potentially an action to fetch user details into Redux if not already handled:
    // fetchUserDetails // Example: if reduxCurrentUser can be initially empty after login
} from '../../features/users/UsersSlice'; // Ensure this path is correct

const SettingsPage = () => {
  const { user: userFromAuth, loading: authLoading } = useAuth();
  const dispatch = useDispatch();

  // --- Redux State Selection ---
  const reduxCurrentUser = useSelector(selectCurrentUser);
  const isProfileProcessing = useSelector(selectProfileLoading); // Loading for profile fetch or update
  const profileApiError = useSelector(selectProfileError);
  const profileSuccessMessage = useSelector(selectProfileMessage); // General message from profile ops

  const isPasswordSaving = useSelector(selectPasswordChangeLoading);
  const passwordApiError = useSelector(selectPasswordChangeError);
  const passwordSuccessMessage = useSelector(selectPasswordChangeMessage);

  const notificationPrefsFromRedux = useSelector(selectNotificationPrefs);
  const isNotifSaving = useSelector(selectNotificationPrefsLoading);
  const notifApiError = useSelector(selectNotificationPrefsError);
  const notifSuccessMessage = useSelector(selectNotificationPrefsMessage);

  const isDeletingAccount = useSelector(selectAccountDeleteLoading);
  const accountDeleteApiError = useSelector(selectAccountDeleteError); // Renamed for clarity
  const accountDeleteSuccessMessage = useSelector(selectAccountDeleteMessage);

  // --- Local Form State ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // Display only, not typically editable here without verification
  const [currentAvatar, setCurrentAvatar] = useState("");
  const [profileFormMessage, setProfileFormMessage] = useState({ type: "", text: "" });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [passwordFormMessage, setPasswordFormMessage] = useState({ type: "", text: "" });

  const [notifications, setNotifications] = useState({ // Local state for notification toggles
    newCourses: true, lessonUpdates: false, discussionReplies: true, // Default structure
  });
  const [notifFormMessage, setNotifFormMessage] = useState({ type: "", text: "" });


  // --- Effect to Initialize Form Data from Redux User ---
  useEffect(() => {
    if (userFromAuth && reduxCurrentUser) {
      setName(reduxCurrentUser.name || "");
      setEmail(reduxCurrentUser.email || ""); // For display
      setCurrentAvatar(reduxCurrentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(reduxCurrentUser.name || userFromAuth.name || 'User')}&background=random&size=128`);

      if (notificationPrefsFromRedux) {
        setNotifications(prev => ({ ...prev, ...notificationPrefsFromRedux }));
      } else if (!isNotifSaving && !notificationPrefsFromRedux) { // Fetch if not already loading and not yet set
        // Check if fetchNotifications action exists and is appropriate here
        // This assumes fetchNotifications populates the state read by selectNotificationPrefs
        dispatch(fetchNotifications());
      }
    } else if (!authLoading && !userFromAuth) {
      // Clear form if definitely logged out (though page guard should redirect)
      setName(""); setEmail(""); setCurrentAvatar("");
      setNotifications({ newCourses: true, lessonUpdates: false, discussionReplies: true });
    }
  }, [userFromAuth, reduxCurrentUser, notificationPrefsFromRedux, dispatch, authLoading, isNotifSaving]);


  // --- Effects for Displaying API Feedback from Redux ---
  useEffect(() => {
    if (profileApiError) {
      setProfileFormMessage({ type: 'error', text: typeof profileApiError === 'string' ? profileApiError : "Failed to save profile." });
    } else if (profileSuccessMessage) {
      setProfileFormMessage({ type: 'success', text: profileSuccessMessage });
      const timer = setTimeout(() => { setProfileFormMessage({ type: "", text: "" }); dispatch(clearMessagesForSettings('profile')); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profileApiError, profileSuccessMessage, dispatch]);

  useEffect(() => {
    if (passwordApiError) {
      setPasswordFormMessage({ type: 'error', text: typeof passwordApiError === 'string' ? passwordApiError : "Password change failed." });
    } else if (passwordSuccessMessage) {
      setPasswordFormMessage({ type: 'success', text: passwordSuccessMessage });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); // Clear form on success
      const timer = setTimeout(() => { setPasswordFormMessage({ type: "", text: "" }); dispatch(clearMessagesForSettings('password')); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordApiError, passwordSuccessMessage, dispatch]);

  useEffect(() => {
    if (notifApiError) {
      setNotifFormMessage({ type: 'error', text: typeof notifApiError === 'string' ? notifApiError : "Failed to update preferences." });
    } else if (notifSuccessMessage) {
      setNotifFormMessage({ type: 'success', text: notifSuccessMessage });
      const timer = setTimeout(() => { setNotifFormMessage({ type: "", text: "" }); dispatch(clearMessagesForSettings('notifications')); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notifApiError, notifSuccessMessage, dispatch]);

  useEffect(() => {
    if (accountDeleteSuccessMessage) {
      alert(accountDeleteSuccessMessage); // Or a more integrated UI message
      // Logout and redirection should be handled by AuthContext state change triggered by deleteAccount thunk
    }
    // Error message for deleteAccount shown directly in JSX based on accountDeleteApiError
  }, [accountDeleteSuccessMessage]);


  // --- Input Handlers ---
  const handleNameChange = (e) => {
    setName(e.target.value);
    if (profileFormMessage.text) setProfileFormMessage({ type: "", text: "" }); // Clear local message
    dispatch(clearMessagesForSettings('profile')); // Clear Redux message for this section
  };

  const handlePasswordInputChange = (e) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (passwordFormMessage.text) setPasswordFormMessage({ type: "", text: "" });
    dispatch(clearMessagesForSettings('password'));
  };

  const handleNotificationToggle = (e) => {
    const { name: notifKey, checked } = e.target;
    const updatedPreferences = { ...notifications, [notifKey]: checked };
    setNotifications(updatedPreferences); // Update local UI immediately
    dispatch(clearMessagesForSettings('notifications'));
    dispatch(updateNotifications(updatedPreferences))
      .unwrap()
      .catch(() => { /* Error message handled by useEffect for notifApiError */ });
  };

  // --- Submit Handlers ---
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    dispatch(clearMessagesForSettings('profile'));
    if (!name.trim()) {
      setProfileFormMessage({ type: "error", text: "Name cannot be empty." });
      return;
    }
    dispatch(updateUserProfile({ name })) // Assuming it only updates name for now
      .unwrap()
      .catch(() => { /* Error handled by useEffect for profileApiError */ });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    dispatch(clearMessagesForSettings('password'));
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordFormMessage({ type: "error", text: "Please fill in all password fields." }); return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFormMessage({ type: "error", text: "New passwords do not match." }); return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordFormMessage({ type: "error", text: "New password must be at least 6 characters." }); return;
    }
    dispatch(changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }))
      .unwrap()
      .catch(() => { /* Error handled by useEffect for passwordApiError */ });
  };

  const handleDeleteAccount = () => {
    // IMPORTANT: Replace window.prompt with a proper modal for better UX and security in a real app.
    const confirmPassword = window.prompt("DANGER: This action is irreversible. To confirm account deletion, please re-enter your password:");
    if (confirmPassword === null) return; // User cancelled
    if (!confirmPassword.trim()) {
      alert("Password confirmation cannot be empty."); return;
    }
    dispatch(clearMessagesForSettings('accountDelete'));
    dispatch(deleteAccount({ password: confirmPassword })) // Thunk might need { password: '...' }
      .unwrap()
      .catch(() => { /* Error already handled by useEffect for accountDeleteApiError */});
  };


  // --- Page Access Guards & Loading States ---
  if (authLoading) {
    return <div className="settings-status page-container"><Spinner label="Authenticating..." size="large" /></div>;
  }
  if (!userFromAuth) {
    return (
      <div className="settings-status page-container">
        <p>Please log in to view your settings.</p>
        <Link to="/login"><Button variant="primary">Login</Button></Link>
      </div>
    );
  }
  // User is authenticated (userFromAuth exists). Now check if Redux has the detailed profile.
  if (isProfileProcessing && !reduxCurrentUser) {
    // This means we are fetching the detailed user profile for the first time for the forms
    return <div className="settings-status page-container"><Spinner label="Loading profile data..." size="large" /></div>;
  }
  if (!reduxCurrentUser) {
    // This is an edge case: AuthContext has a user, but Redux store doesn't have their details.
    // This could be due to a failed fetch of user details into Redux or an initialization issue.
    console.error("SettingsPage: Authenticated user detected, but detailed profile data is missing from Redux.");
    return (
      <div className="settings-status page-container">
        <p>Could not load your detailed profile information at this time.</p>
        {/* Optionally, add a button to retry fetching reduxCurrentUser if you have such an action */}
        {/* <Button onClick={() => dispatch(fetchUserDetails())}>Retry Load</Button> */}
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  // --- Render Page Content ---
  return (
    <div className="settings-page-container page-container">
      <h1 className="settings-page-title">Settings & Profile</h1>

      {/* Profile Information Section */}
      <section className="settings-section profile-section card-style">
        <h2 className="settings-section-title">
          <FaUserEdit className="section-title-icon" /> Profile Information
        </h2>
        <div className="profile-layout">
            <div className="profile-info-col">
                <div className="profile-picture-area">
                    <img src={currentAvatar} alt={`${name}'s avatar`} className="profile-picture"/>
                    <Button type="button" variant="outline" size="small" className="upload-button" disabled>
                        Change Picture (Coming Soon)
                    </Button>
                </div>
                <div className="info-group read-only-info">
                    <span className="info-label"><FaEnvelope /> Email:</span>
                    <span className="info-value email-value">{email}</span> {/* Display only */}
                </div>
                <div className="info-group read-only-info">
                    <span className="info-label"><FaUserGraduate /> Role:</span>
                    <span className="info-value">{reduxCurrentUser.role?.toUpperCase() || "STUDENT"}</span>
                </div>
            </div>
            <div className="profile-form-col">
                <form onSubmit={handleProfileSubmit} className="settings-form">
                    <Input
                        label="Full Name" id="name" name="name" type="text" value={name}
                        onChange={handleNameChange} required autoComplete="name" disabled={isProfileProcessing}
                    />
                    {profileFormMessage.text && (
                        <p className={`form-message ${profileFormMessage.type}`} aria-live="polite">
                            {profileFormMessage.type === 'error' && <FaExclamationTriangle style={{ marginRight: '5px' }} />}
                            {profileFormMessage.type === 'success' && <FaCheckCircle style={{ marginRight: '5px' }} />}
                            {profileFormMessage.text}
                        </p>
                    )}
                    <Button type="submit" variant="primary" disabled={isProfileProcessing}>
                        {isProfileProcessing ? <FaSpinnerIcon className="spinner" /> : <FaSave className="button-icon" />}
                        {isProfileProcessing ? "Saving..." : "Save Profile Changes"}
                    </Button>
                </form>
            </div>
        </div>
      </section>

      {/* Account Security Section */}
      <section className="settings-section security-section card-style">
        <h2 className="settings-section-title">
          <FaLock className="section-title-icon" /> Account Security
        </h2>
        <form onSubmit={handlePasswordSubmit} className="settings-form password-form">
          <h3>Change Password</h3>
          <Input
            label="Current Password" id="currentPassword" name="currentPassword" type="password"
            placeholder="Enter current password" value={passwordData.currentPassword}
            onChange={handlePasswordInputChange} required autoComplete="current-password" disabled={isPasswordSaving}
          />
          <Input
            label="New Password" id="newPassword" name="newPassword" type="password"
            placeholder="Enter new password (min. 6 chars)" value={passwordData.newPassword}
            onChange={handlePasswordInputChange} required minLength="6" autoComplete="new-password" disabled={isPasswordSaving}
          />
          <Input
            label="Confirm New Password" id="confirmPassword" name="confirmPassword" type="password"
            placeholder="Confirm new password" value={passwordData.confirmPassword}
            onChange={handlePasswordInputChange} required autoComplete="new-password" disabled={isPasswordSaving}
          />
          {passwordFormMessage.text && (
            <p className={`form-message ${passwordFormMessage.type}`} aria-live="polite">
              {passwordFormMessage.type === 'error' && <FaExclamationTriangle style={{ marginRight: '5px' }} />}
              {passwordFormMessage.type === 'success' && <FaCheckCircle style={{ marginRight: '5px' }} />}
              {passwordFormMessage.text}
            </p>
          )}
          <Button type="submit" variant="primary" disabled={isPasswordSaving}>
            {isPasswordSaving ? <FaSpinnerIcon className="spinner" /> : null}
            {isPasswordSaving ? "Changing..." : "Change Password"}
          </Button>
        </form>
        <div className="delete-account-area">
          <h3>Delete Account</h3>
          <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
          <Button variant="danger" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
            {isDeletingAccount ? <FaSpinnerIcon className="spinner" /> : <FaTrashAlt className="button-icon" />}
            {isDeletingAccount ? "Deleting..." : "Delete My Account"}
          </Button>
          {accountDeleteApiError && (
            <p className="form-message error" style={{marginTop: 'var(--spacing-sm)'}} aria-live="assertive">
                <FaExclamationTriangle style={{ marginRight: '5px' }} />
                {typeof accountDeleteApiError === 'string' ? accountDeleteApiError : "Account deletion failed."}
            </p>
          )}
        </div>
      </section>

      {/* Notification Preferences Section */}
      <section className="settings-section notifications-section card-style">
        <h2 className="settings-section-title">
          <FaBell className="section-title-icon" /> Notification Preferences
          {isNotifSaving && <FaSpinnerIcon className="spinner title-spinner" />}
        </h2>
        <div className="notification-options">
          <p>Receive email notifications for:</p>
            {notifFormMessage.text && (
            <p className={`form-message ${notifFormMessage.type}`} style={{marginBottom: 'var(--spacing-sm)'}} aria-live="polite">
              {notifFormMessage.type === 'error' && <FaExclamationTriangle style={{ marginRight: '5px' }} />}
              {notifFormMessage.type === 'success' && <FaCheckCircle style={{ marginRight: '5px' }} />}
              {notifFormMessage.text}
            </p>
          )}
          {Object.keys(notifications).map((key) => (
            <div className="checkbox-group" key={key}>
              <input
                type="checkbox"
                id={`notif-${key}`}
                name={key}
                checked={!!notifications[key]} // Ensure it's boolean
                onChange={handleNotificationToggle}
                disabled={isNotifSaving}
              />
              <label htmlFor={`notif-${key}`}>
                {/* Simple way to format camelCase keys to Title Case */}
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
            </div>
          ))}
          <p className="prefs-saved-note">
            {isNotifSaving ? "Saving preferences..." : "Preferences are updated on change."}
          </p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;