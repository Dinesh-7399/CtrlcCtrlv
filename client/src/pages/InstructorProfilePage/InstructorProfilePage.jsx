// client/src/pages/InstructorProfilePage/InstructorProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './InstructorProfilePage.css'; // We will create this
import Button from '../../components/common/Button'; // Assuming exists
// Import Icons
import {
    FaUser, FaBriefcase, FaGraduationCap, FaProjectDiagram, FaBook,
    FaEnvelope, FaLink, FaLinkedin, FaGithub, FaTwitter, FaArrowLeft // Add relevant icons
} from 'react-icons/fa';

// --- Placeholder Data ---
// In a real app, fetch this using instructorId via API/Redux
const getMockInstructorData = (id) => {
    // Simulate API call delay and potential not found
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (id === "inst-001") { // Example valid ID
                resolve({
                    id: "inst-001",
                    name: "Dr. Evelyn Reed",
                    title: "Professor of Theoretical Physics",
                    avatarUrl:"https://th.bing.com/th/id/OIP.F3bWfzDrzRMNh8pp8BACYAHaJ4?w=133&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7", // Placeholder image
                    bio: "Dr. Reed is a leading researcher in quantum field theory with over 15 years of experience. Passionate about making complex topics accessible, she has published numerous papers and mentored dozens of graduate students. Her research focuses on string theory and its implications for cosmology.",
                    email: "e.reed@example.edu",
                    website: "https://example-research.edu/reed",
                    socialLinks: {
                        linkedin: "https://linkedin.com/in/evelynreed",
                        github: "https://github.com/evelynreed",
                        twitter: "https://twitter.com/evelynreedsci"
                    },
                    experience: [
                        { id: 'exp1', role: 'Professor', company: 'University of Advanced Studies', duration: '2015 - Present' },
                        { id: 'exp2', role: 'Postdoctoral Researcher', company: 'Institute for Fundamental Science', duration: '2012 - 2015' },
                    ],
                    education: [
                        { id: 'edu1', degree: 'Ph.D. in Physics', institution: 'Caltech', year: '2012' },
                        { id: 'edu2', degree: 'B.S. in Physics', institution: 'MIT', year: '2008' },
                    ],
                    projects: [
                        { id: 'proj1', name: 'Cosmic Microwave Background Analysis', description: 'Developing algorithms for analyzing Planck satellite data.', link: 'https://example-research.edu/cmb-project' },
                        { id: 'proj2', name: 'Quantum Entanglement Simulation', description: 'A simulation framework built in Python.', link: 'https://github.com/evelynreed/qentangle-sim' },
                    ],
                    coursesTaught: [ // Link these to actual course detail pages
                        { id: 'physics-101', title: 'Advanced Quantum Physics' },
                        { id: 'physics-201', title: 'String Theory Fundamentals' },
                    ]
                });
            } else {
                resolve(null); // Instructor not found
            }
        }, 1000); // Simulate loading
    });
};
// ------------------------

const InstructorProfilePage = () => {
    const { instructorId } = useParams();
    const navigate = useNavigate();
    const [instructor, setInstructor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInstructor = async () => {
            setLoading(true);
            setError(null);
            try {
                // Replace with actual API call: const data = await fetchInstructorApi(instructorId);
                const data = await getMockInstructorData(instructorId);
                if (data) {
                    setInstructor(data);
                } else {
                    setError(`Instructor with ID "${instructorId}" not found.`);
                }
            } catch (err) {
                console.error("Failed to fetch instructor:", err);
                setError("Failed to load instructor profile. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (instructorId) {
            fetchInstructor();
        } else {
            setError("No instructor ID provided.");
            setLoading(false);
        }
    }, [instructorId]); // Re-fetch if ID changes

    const handleGoBack = () => {
        navigate(-1); // Go back to the previous page
    };

    // --- Render Logic ---
    if (loading) {
        return <div className="profile-status">Loading Instructor Profile...{/* Add Spinner? */}</div>;
    }

    if (error || !instructor) {
        return (
            <div className="profile-status error-message">
                <h2>Error Loading Profile</h2>
                <p>{error || "Instructor data could not be loaded."}</p>
                <Button onClick={handleGoBack} variant="secondary">
                    <FaArrowLeft /> Go Back
                </Button>
            </div>
        );
    }

    // --- Main Render ---
    return (
        <div className="instructor-profile-page page-container">
            {/* Back Button */}
             <Button onClick={handleGoBack} variant="outline" size="small" className="back-button">
                 <FaArrowLeft className="button-icon"/> Back
             </Button>

            {/* Profile Header */}
            <header className="profile-header card-style">
                <img
                    src={instructor.avatarUrl || 'https://via.placeholder.com/150'}
                    alt={`${instructor.name}'s profile picture`}
                    className="profile-avatar"
                />
                <div className="profile-header-info">
                    <h1 className="profile-name">{instructor.name}</h1>
                    <p className="profile-title">{instructor.title}</p>
                    {/* Contact & Social Links */}
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

            {/* Main Content Sections */}
            <div className="profile-main-content">
                {/* About Section */}
                {instructor.bio && (
                    <section className="profile-section profile-about card-style">
                        <h2 className="section-title"><FaUser className="section-title-icon"/> About {instructor.name.split(' ')[0]}</h2>
                        <p className="bio-text">{instructor.bio}</p>
                    </section>
                )}

                {/* Experience Section */}
                {instructor.experience?.length > 0 && (
                    <section className="profile-section profile-experience card-style">
                         <h2 className="section-title"><FaBriefcase className="section-title-icon"/> Work Experience</h2>
                         <ul className="item-list experience-list">
                             {instructor.experience.map(exp => (
                                 <li key={exp.id} className="list-item experience-item">
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

                {/* Education Section */}
                 {instructor.education?.length > 0 && (
                    <section className="profile-section profile-education card-style">
                         <h2 className="section-title"><FaGraduationCap className="section-title-icon"/> Education</h2>
                         <ul className="item-list education-list">
                             {instructor.education.map(edu => (
                                 <li key={edu.id} className="list-item education-item">
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

                 {/* Projects Section */}
                 {instructor.projects?.length > 0 && (
                    <section className="profile-section profile-projects card-style">
                         <h2 className="section-title"><FaProjectDiagram className="section-title-icon"/> Featured Projects</h2>
                         <div className="item-grid projects-grid">
                             {instructor.projects.map(proj => (
                                 <a key={proj.id} href={proj.link} target="_blank" rel="noopener noreferrer" className="item-card project-card">
                                      <h3 className="item-title">{proj.name}</h3>
                                      <p className="item-description">{proj.description}</p>
                                      <span className="card-link-indicator">View Project <FaLink size="0.8em"/></span>
                                 </a>
                             ))}
                         </div>
                    </section>
                )}

                 {/* Courses Taught Section */}
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

            </div> {/* End Main Content */}
        </div> // End Container
    );
};

export default InstructorProfilePage;