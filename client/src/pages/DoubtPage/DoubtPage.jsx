// client/src/pages/DoubtPage/DoubtPage.jsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link as RouterLink, Outlet, useParams } from 'react-router-dom';
import './DoubtPage.css'; // Import the regular CSS file
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCurrentLiveSession,
  selectCurrentLiveSession,
  selectLiveSessionLoadingStatus,
  selectLiveSessionError,
  clearLiveSessionState // To clear state on unmount or course change
} from '../../features/liveSession/liveSessionSlice'; // Adjust path as needed
import Spinner from '../../components/common/Spinner'; // For loading state
import { FaExclamationTriangle } from 'react-icons/fa'; // For error state

const MotionLink = motion(RouterLink);

const arrowVariants = {
    rest: { x: 0 },
    hovered: {
        x: 6,
        transition: {
            duration: 0.2,
            ease: "easeInOut"
        }
    }
};

function DoubtPage() {
    const { courseId } = useParams(); // Get courseId from URL
    const dispatch = useDispatch();

    const currentLiveSession = useSelector(selectCurrentLiveSession);
    const liveSessionLoadingStatus = useSelector(selectLiveSessionLoadingStatus);
    const liveSessionError = useSelector(selectLiveSessionError);

    useEffect(() => {
        if (courseId) {
            // Assuming courseId can serve as sessionId for fetching the primary live doubt session status
            dispatch(fetchCurrentLiveSession(courseId));
        }
        // Cleanup when the component unmounts or courseId changes
        return () => {
            dispatch(clearLiveSessionState());
        };
    }, [dispatch, courseId]);

    // Derive live status and next class time from Redux state
    const isClassLive = currentLiveSession?.status === 'live';
    let nextClassTimeDisplay = 'Not scheduled';
    if (currentLiveSession?.status === 'upcoming' && currentLiveSession.startTime) {
        nextClassTimeDisplay = new Date(currentLiveSession.startTime).toLocaleString('en-IN', {
            weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
        });
    } else if (currentLiveSession?.status === 'live') {
        nextClassTimeDisplay = 'Session is LIVE!';
    }


    return (
        <div className="doubt-page-container">
            <h1 className="page-title">Doubt Resolution</h1>
            <p className="page-description">
                Have questions about the course material? Choose how you'd like to get help below.
            </p>

            <div className="options-container">
                {/* Option 1: Chat Support Card */}
                <MotionLink
                    to="./chat" // Relative path to child route
                    className="card-link"
                    initial="rest"
                    whileHover="hovered"
                    animate="rest"
                >
                    <div className="option-card chat-card">
                        <h2 className="card-title">Chat Support</h2>
                        <p className="card-description">
                            Connect with our AI Assistant for quick answers, or request to chat with an available instructor.
                        </p>
                        <span className="card-action">
                            Start Chat
                            <motion.span
                                style={{ display: 'inline-block', marginLeft: 'var(--spacing-xs)' }}
                                variants={arrowVariants}
                            >
                                &rarr;
                            </motion.span>
                        </span>
                    </div>
                </MotionLink>

                {/* Option 2: Live Doubt Class Card */}
                <MotionLink
                    to="./live" // Relative path to child route
                    className="card-link"
                    initial="rest"
                    whileHover="hovered"
                    animate="rest"
                 >
                    <div className="option-card live-card">
                        <h2 className="card-title">Live Doubt Class</h2>
                        <div className="schedule-info">
                            {liveSessionLoadingStatus === 'loading' && (
                                <p className="status"><Spinner size="inline" /> Checking live status...</p>
                            )}
                            {liveSessionLoadingStatus === 'failed' && (
                                <p className="status error">
                                    <FaExclamationTriangle style={{ marginRight: 'var(--spacing-xs)'}} /> Could not load session status.
                                </p>
                            )}
                            {liveSessionLoadingStatus === 'succeeded' && (
                                isClassLive ? (
                                    <p className="status live-now">
                                        <span className="live-indicator"></span> Currently Live!
                                    </p>
                                ) : (
                                    <p className="status">
                                        Next session: {nextClassTimeDisplay}
                                    </p>
                                )
                            )}
                        </div>
                        <p className="card-description">
                            Join the scheduled interactive session with your instructor for live Q&A and in-depth discussion.
                        </p>
                        <span className="card-action">
                            Join Session
                            <motion.span
                                style={{ display: 'inline-block', marginLeft: 'var(--spacing-xs)' }}
                                variants={arrowVariants}
                            >
                                &rarr;
                            </motion.span>
                        </span>
                    </div>
                </MotionLink>
            </div>

            <div className="doubt-child-content">
                 <Outlet />
            </div>
        </div>
    );
}

export default DoubtPage;