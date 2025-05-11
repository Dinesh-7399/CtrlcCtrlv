// client/src/pages/InstructorProfilePage/InstructorProfilePage.jsx
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // Import Redux hooks
import './InstructorProfilePage.css';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner'; // Import Spinner
import {
    FaUser, FaBriefcase, FaGraduationCap, FaProjectDiagram, FaBook,
    FaEnvelope, FaLink, FaLinkedin, FaGithub, FaTwitter, FaArrowLeft, FaExclamationTriangle
} from 'react-icons/fa';

// Import actions and selectors from usersSlice
import {
    fetchPublicUserProfile,
    selectViewedUserProfile,
    selectPublicProfileLoading,
    selectPublicProfileError,
    clearViewedUserProfile // Action to clear state on unmount
} from '../../features/users/UsersSlice.js'; // Adjust path as necessary

const InstructorProfilePage = () => {
    const { instructorId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Get instructor data, loading status, and error from Redux store
    const instructor = useSelector(selectViewedUserProfile);
    const isLoading = useSelector(selectPublicProfileLoading);
    const error = useSelector(selectPublicProfileError);

    useEffect(() => {
        if (instructorId) {
            dispatch(fetchPublicUserProfile(instructorId));
        }
        // Cleanup function to clear the viewed profile when the component unmounts or instructorId changes
        return () => {
            dispatch(clearViewedUserProfile());
        };
    }, [dispatch, instructorId]);

    const handleGoBack = () => {
        navigate(-1); // Go back to the previous page
    };

    if (isLoading) {
        return (
            <div className="profile-status page-container"> {/* Added page-container */}
                <Spinner size="large" label="Loading Instructor Profile..." />
            </div>
        );
    }

    if (error || !instructor) {
        return (
            <div className="profile-status error-message page-container"> {/* Added page-container */}
                <FaExclamationTriangle size={40} style={{ marginBottom: 'var(--spacing-md)'}}/>
                <h2>Error Loading Profile</h2>
                <p>{error || `Instructor with ID "${instructorId}" not found.`}</p>
                <Button onClick={handleGoBack} variant="secondary">
                    <FaArrowLeft /> Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="instructor-profile-page page-container">
            <Button onClick={handleGoBack} variant="outline" size="small" className="back-button">
                <FaArrowLeft className="button-icon"/> Back
            </Button>

            <header className="profile-header card-style">
                <img
                    src={instructor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name || 'N A')}&background=random&size=150`}
                    alt={`${instructor.name}'s profile picture`}
                    className="profile-avatar"
                />
                <div className="profile-header-info">
                    <h1 className="profile-name">{instructor.name}</h1>
                    <p className="profile-title">{instructor.title || 'Instructor'}</p>
                    <div className="profile-contact">
                        {instructor.email && (
                            <a href={`mailto:${instructor.email}`} title="Email" className="contact-link">
                                <FaEnvelope /><span>Email</span>
                            </a>
                        )}
                         {instructor.website && (
                            <a href={instructor.website} target="_blank" rel="noopener noreferrer" title="Website" className="contact-link">
                                <FaLink /><span>Website</span>
                            </a>
                        )}
                        {instructor.socialLinks?.linkedin && (
                            <a href={instructor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="contact-link social-link">
                                <FaLinkedin />
                            </a>
                        )}
                        {instructor.socialLinks?.github && (
                            <a href={instructor.socialLinks.github} target="_blank" rel="noopener noreferrer" title="GitHub" className="contact-link social-link">
                                <FaGithub />
                            </a>
                        )}
                        {instructor.socialLinks?.twitter && (
                            <a href={instructor.socialLinks.twitter} target="_blank" rel="noopener noreferrer" title="Twitter" className="contact-link social-link">
                                <FaTwitter />
                            </a>
                        )}
                    </div>
                </div>
            </header>

            <div className="profile-main-content">
                {instructor.bio && (
                    <section className="profile-section profile-about card-style">
                        <h2 className="section-title"><FaUser className="section-title-icon"/> About {instructor.name?.split(' ')[0]}</h2>
                        <p className="bio-text">{instructor.bio}</p>
                    </section>
                )}

                {instructor.experience?.length > 0 && (
                    <section className="profile-section profile-experience card-style">
                         <h2 className="section-title"><FaBriefcase className="section-title-icon"/> Work Experience</h2>
                         <ul className="item-list experience-list">
                             {instructor.experience.map(exp => (
                                 <li key={exp.id || exp.role + exp.company} className="list-item experience-item"> {/* Added fallback key */}
                                     <FaBriefcase className="list-item-icon" />
                                     <div>
                                         <h3 className="item-title">{exp.role}</h3>
                                         <p className="item-subtitle">{exp.company}</p>
                                         <p className="item-duration">{exp.duration}</p>
                                     </div>
                                 </li>
                             ))}
                         </ul>
                    </section>
                )}

                 {instructor.education?.length > 0 && (
                    <section className="profile-section profile-education card-style">
                         <h2 className="section-title"><FaGraduationCap className="section-title-icon"/> Education</h2>
                         <ul className="item-list education-list">
                             {instructor.education.map(edu => (
                                 <li key={edu.id || edu.degree + edu.institution} className="list-item education-item"> {/* Added fallback key */}
                                      <FaGraduationCap className="list-item-icon" />
                                      <div>
                                         <h3 className="item-title">{edu.degree}</h3>
                                         <p className="item-subtitle">{edu.institution}</p>
                                         <p className="item-duration">{edu.year}</p>
                                      </div>
                                 </li>
                             ))}
                         </ul>
                    </section>
                )}

                 {instructor.projects?.length > 0 && (
                    <section className="profile-section profile-projects card-style">
                         <h2 className="section-title"><FaProjectDiagram className="section-title-icon"/> Featured Projects</h2>
                         <div className="item-grid projects-grid">
                             {instructor.projects.map(proj => (
                                 <a key={proj.id || proj.name} href={proj.link} target="_blank" rel="noopener noreferrer" className="item-card project-card"> {/* Added fallback key */}
                                      <h3 className="item-title">{proj.name}</h3>
                                      <p className="item-description">{proj.description}</p>
                                      <span className="card-link-indicator">View Project <FaLink size="0.8em"/></span>
                                 </a>
                             ))}
                         </div>
                    </section>
                )}

                 {instructor.coursesTaught?.length > 0 && (
                    <section className="profile-section profile-courses card-style">
                         <h2 className="section-title"><FaBook className="section-title-icon"/> Courses Taught</h2>
                         <div className="item-grid courses-grid">
                             {instructor.coursesTaught.map(course => (
                                 <Link key={course.id} to={`/courses/${course.id}`} className="item-card course-card">
                                      <h3 className="item-title">{course.title}</h3>
                                      <span className="card-link-indicator">View Course &rarr;</span>
                                 </Link>
                             ))}
                         </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default InstructorProfilePage;