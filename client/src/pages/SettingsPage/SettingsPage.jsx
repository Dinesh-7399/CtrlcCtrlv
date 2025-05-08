// client/src/pages/SettingsPage.jsx
// (Your JSX code as provided in the previous message)
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import "./SettingsPage.css";
import {
  FaUserEdit,
  FaLock,
  FaBell,
  FaEnvelope,
  FaUserGraduate,
  FaSave,
  FaTrashAlt,
  FaSpinner,
} from "react-icons/fa";

const SettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    newCourses: true,
    lessonUpdates: false,
    discussionReplies: true,
  });
  const [isNotifSaving, setIsNotifSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      // Fetch notifications if available: setNotifications(user.notificationPreferences || {...});
    }
  }, [user]);

  const handleNameChange = (e) => setName(e.target.value);
  const handleProfileSubmit = async (e) => {
    /* ... submit logic ... */
  };
  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  const handlePasswordSubmit = async (e) => {
    /* ... submit logic ... */
  };
  const handleNotificationChange = async (e) => {
    /* ... submit logic ... */
  };
  const handleDeleteAccount = () => {
    /* ... delete logic ... */
  };

  if (authLoading) return <div className="settings-status">Loading...</div>;
  if (!user) return <div className="settings-status">Please log in.</div>;

  return (
    <div className="settings-page-container">
      <h1 className="settings-page-title">Settings & Profile</h1>

      {/* Profile Section */}
      <section className="settings-section profile-section card-style">
        <h2 className="settings-section-title">
          <FaUserEdit className="section-title-icon" /> Profile Information
        </h2>
        <div className="profile-layout">
          <div className="profile-info-col">
            <div className="profile-picture-area">
              <img
                src={
                  user.avatarUrl ||
                  `https://avatars.githubusercontent.com/u/85052811?v=4`
                }
                alt="Profile"
                className="profile-picture"
              />
              <Button
                type="button"
                variant="outline"
                size="small"
                className="upload-button"
                disabled
              >
                Change Picture
              </Button>
            </div>
            <div className="info-group read-only-info">
              <span className="info-label">
                <FaEnvelope /> Email:
              </span>
              <span className="info-value email-value">{email}</span>
            </div>
            <div className="info-group read-only-info">
              <span className="info-label">
                <FaUserGraduate /> Role:
              </span>
              <span className="info-value">{user.role || "Student"}</span>
            </div>
          </div>
          <div className="profile-form-col">
            <form onSubmit={handleProfileSubmit} className="settings-form">
              <Input
                label="Full Name"
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                required
                autoComplete="name"
              />
              {profileMessage.text && (
                <p
                  className={`form-message ${profileMessage.type}`}
                  aria-live="polite"
                >
                  {profileMessage.text}
                </p>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={isProfileSaving}
              >
                {isProfileSaving ? (
                  <FaSpinner className="spinner" />
                ) : (
                  <FaSave className="button-icon" />
                )}{" "}
                {isProfileSaving ? "Saving..." : "Save Profile Changes"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="settings-section security-section card-style">
        <h2 className="settings-section-title">
          <FaLock className="section-title-icon" /> Account Security
        </h2>
        <form
          onSubmit={handlePasswordSubmit}
          className="settings-form password-form"
        >
          <h3>Change Password</h3>
          <Input
            label="Current Password"
            id="currentPassword"
            name="currentPassword"
            type="password"
            placeholder="Enter current password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            required
            autoComplete="current-password"
          />
          <Input
            label="New Password"
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="Enter new password (min. 6 chars)"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            required
            minLength="6"
            autoComplete="new-password"
          />
          <Input
            label="Confirm New Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            required
            autoComplete="new-password"
          />
          {passwordMessage.text && (
            <p
              className={`form-message ${passwordMessage.type}`}
              aria-live="polite"
            >
              {passwordMessage.text}
            </p>
          )}
          <Button type="submit" variant="primary" disabled={isPasswordSaving}>
            {isPasswordSaving ? <FaSpinner className="spinner" /> : null}{" "}
            {isPasswordSaving ? "Changing..." : "Change Password"}
          </Button>
        </form>
        <div className="delete-account-area">
          <h3>Delete Account</h3>
          <p>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <Button variant="danger" onClick={handleDeleteAccount}>
            {" "}
            <FaTrashAlt className="button-icon" /> Delete My Account{" "}
          </Button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="settings-section notifications-section card-style">
        <h2 className="settings-section-title">
          <FaBell className="section-title-icon" /> Notification Preferences{" "}
          {isNotifSaving && <FaSpinner className="spinner title-spinner" />}
        </h2>
        <div className="notification-options">
          <p>Receive email notifications for:</p>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="notif-new-courses"
              name="newCourses"
              checked={notifications.newCourses}
              onChange={handleNotificationChange}
            />
            <label htmlFor="notif-new-courses">New Course Announcements</label>
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="notif-lesson-updates"
              name="lessonUpdates"
              checked={notifications.lessonUpdates}
              onChange={handleNotificationChange}
            />
            <label htmlFor="notif-lesson-updates">
              Lesson Updates & Reminders
            </label>
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="notif-discussion-replies"
              name="discussionReplies"
              checked={notifications.discussionReplies}
              onChange={handleNotificationChange}
            />
            <label htmlFor="notif-discussion-replies">Discussion Replies</label>
          </div>
          <p className="prefs-saved-note">
            Preferences are saved automatically.
          </p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
