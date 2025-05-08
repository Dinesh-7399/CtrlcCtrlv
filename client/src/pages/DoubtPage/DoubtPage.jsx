import React from 'react';
// Import motion and create a motion version of Link
import { motion } from 'framer-motion';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import './DoubtPage.css'; // Import the regular CSS file

// Create a motion component based on React Router's Link
const MotionLink = motion(RouterLink);

// --- Placeholder Data ---
const courseId = 'physics-101'; // Example: Should come from URL params or props
const isClassLive = false;
const nextClassTime = 'Tomorrow, April 30th at 2:00 PM IST';
// ------------------------

// Animation variants for the arrow
const arrowVariants = {
    rest: { x: 0 }, // Initial state
    hovered: {        // State when parent link is hovered
        x: 6,          // Move 6px to the right
        transition: {
            duration: 0.2,
            ease: "easeInOut"
        }
    }
};


function DoubtPage() {
    // In a real app, get courseId via useParams()
    // const { courseId } = useParams();
    // Fetch isClassLive, nextClassTime etc.

    return (
        <div className="doubt-page-container">
            {/* Page Header */}
            <h1 className="page-title">Doubt Resolution</h1>
            <p className="page-description">
                Have questions about the course material? Choose how you'd like to get help below.
            </p>

            {/* Options Grid */}
            <div className="options-container">

                {/* Option 1: Chat Support Card - Use MotionLink */}
                <MotionLink
                    // *** CHANGED: Use relative path ***
                    to="./chat"
                    className="card-link"
                    initial="rest"    // Set initial animation state
                    whileHover="hovered" // Set state name for hover
                    animate="rest"      // Ensure it animates back to rest
                >
                    <div className="option-card chat-card">
                        <h2 className="card-title">Chat Support</h2>
                        <p className="card-description">
                            Connect with our AI Assistant for quick answers, or request to chat with an available instructor.
                        </p>
                        {/* Use span for text, motion.span for animated arrow */}
                        <span className="card-action">
                            Start Chat
                            <motion.span
                                style={{ display: 'inline-block', marginLeft: 'var(--spacing-xs)' }}
                                variants={arrowVariants} // Apply variants
                            >
                                &rarr;
                            </motion.span>
                        </span>
                    </div>
                </MotionLink>

                {/* Option 2: Live Doubt Class Card - Use MotionLink */}
                <MotionLink
                     // *** CHANGED: Use relative path ***
                    to="./live"
                    className="card-link"
                    initial="rest"
                    whileHover="hovered"
                    animate="rest"
                 >
                    <div className="option-card live-card">
                        <h2 className="card-title">Live Doubt Class</h2>
                        <div className="schedule-info">
                            {isClassLive ? (
                                <p className={`status live-now`}>
                                    <span className="live-indicator"></span> Currently Live!
                                </p>
                            ) : (
                                <p className="status">
                                    Next session: {nextClassTime}
                                </p>
                            )}
                        </div>
                        <p className="card-description">
                            Join the scheduled interactive session with your instructor for live Q&A and in-depth discussion.
                        </p>
                        {/* Use span for text, motion.span for animated arrow */}
                        <span className="card-action">
                            Join Session
                            <motion.span
                                style={{ display: 'inline-block', marginLeft: 'var(--spacing-xs)' }}
                                variants={arrowVariants} // Apply variants
                            >
                                &rarr;
                            </motion.span>
                        </span>
                    </div>
                </MotionLink>

            </div> {/* End Options Container */}

            {/* --- Where Child Routes Will Render --- */}
            <div className="doubt-child-content">
                 <Outlet /> {/* This renders the matched child route (Chat or Live) */}
            </div>
            {/* ------------------------------------- */}

        </div> /* End Doubt Page Container */
    );
}

export default DoubtPage;