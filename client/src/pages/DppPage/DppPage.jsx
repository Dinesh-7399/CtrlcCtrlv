// client/src/pages/DppPage/DppPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import './DppPage.css';
import { FaPencilAlt, FaArrowLeft, FaSpinner, FaExclamationTriangle, FaFileUpload, FaTrash, FaCheckCircle } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';

// --- Redux Imports ---
import { useSelector, useDispatch } from 'react-redux';
import { selectLessonById, selectDppForLesson, fetchCourseDetails } from '../../features/courses/CoursesSlice.js'; // Added fetchCourseDetails
import {
  submitDppSolution,
  selectDppSubmissionStatus,
  selectDppSubmissionError,
  selectDppSuccessMessage,
  clearDppState,
  // selectLastSubmittedDppFile, // If you want to display info about last submission
} from '../../features/dpp/dppSlice';
import Spinner from '../../components/common/Spinner'; // Import Spinner

const DppPage = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // --- Get Data from Redux ---
    const lesson = useSelector((state) => selectLessonById(state, courseId, lessonId));
    const dppData = useSelector((state) => selectDppForLesson(state, courseId, lessonId));
    // Redux state for DPP submission
    const submissionStatus = useSelector(selectDppSubmissionStatus);
    const submissionError = useSelector(selectDppSubmissionError);
    const successMessage = useSelector(selectDppSuccessMessage);
    // const lastSubmission = useSelector(selectLastSubmittedDppFile); // Example if needed

    // --- File Upload State ---
    const [uploadedFile, setUploadedFile] = useState(null);
    const [localUploadError, setLocalUploadError] = useState(''); // For dropzone specific errors

    // Effect to fetch course details (which should include DPPs) if not available
    useEffect(() => {
        // If lesson or dppData is missing, it implies the parent course data might not be fully loaded
        if (courseId && (!lesson || !dppData)) {
            dispatch(fetchCourseDetails(courseId)); // This should populate lessons and their DPPs
        }
    }, [dispatch, courseId, lessonId, lesson, dppData]);


    // Clear submission status on unmount
    useEffect(() => {
        return () => {
            dispatch(clearDppState());
        };
    }, [dispatch]);
    
    // Clear form on successful submission
    useEffect(() => {
        if (submissionStatus === 'succeeded') {
            setUploadedFile(null);
            // Optionally clear localUploadError too
            setLocalUploadError('');
            // Success message is handled by Redux selector
        }
    }, [submissionStatus]);


    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setLocalUploadError('');
        setUploadedFile(null);
        if (submissionStatus !== 'idle' && submissionStatus !== 'failed') {
            dispatch(clearDppState()); // Clear previous submission attempt state if new file is dropped
        }

        if (rejectedFiles && rejectedFiles.length > 0) {
            console.error("Rejected files:", rejectedFiles);
            setLocalUploadError(`File rejected: ${rejectedFiles[0].errors[0].message}. Max size 5MB?`);
            return;
        }
        if (acceptedFiles && acceptedFiles.length > 0) {
            setUploadedFile(acceptedFiles[0]);
        }
    }, [dispatch, submissionStatus]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt', '.js', '.jsx', '.py', '.java', '.c', '.cpp', '.html', '.css'],
            'application/zip': ['.zip'],
            'application/vnd.rar': ['.rar']
        },
        maxSize: 5 * 1024 * 1024,
        multiple: false
    });

    const handleGoBackToLesson = () => navigate(`/learn/${courseId}/${lessonId}`);

    const handleSubmitSolution = () => {
        if (!uploadedFile) {
            setLocalUploadError("Please upload a file first."); // Use local error for this direct validation
            return;
        }
        if (!dppData || !dppData.id) {
            setLocalUploadError("DPP information is missing. Cannot submit.");
            return;
        }
        dispatch(clearDppState()); // Clear previous errors/success before new submission
        dispatch(submitDppSolution({
            courseId,
            lessonId,
            dppId: dppData.id,
            file: uploadedFile,
            // comments: "Optional user comments here" // Add a textarea if you want comments
        }));
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setLocalUploadError('');
        // If a submission was in progress or failed, reset its state
        if (submissionStatus !== 'idle' && submissionStatus !== 'succeeded') {
            dispatch(clearDppState());
        }
    };

    // --- Render Logic ---
    // Use CoursesSlice loading status if DPP data comes from there
    const isLoadingCourseData = useSelector(state => state.courses.isLoadingDetails); // Or a more specific one if available

    if (isLoadingCourseData && (!lesson || !dppData)) {
        return (
            <div className="dpp-status page-container">
                <Spinner label="Loading DPP details..." size="large"/>
            </div>
        );
    }

    if (!lesson || !dppData) {
        const message = !lesson
            ? `Lesson context (ID: "${lessonId}") could not be loaded.`
            : `DPP data for Lesson ID "${lessonId}" in Course "${courseId}" not found.`;
        return (
             <div className="dpp-status dpp-error page-container">
                 <FaExclamationTriangle size={40} style={{ marginBottom: 'var(--spacing-md)' }}/>
                 <h1>DPP Data Error</h1>
                 <p>{message}</p>
                 <Button onClick={handleGoBackToLesson} variant="secondary">
                     <FaArrowLeft className="button-icon"/> Back to Lesson
                 </Button>
             </div>
         );
    }

    const isSubmitting = submissionStatus === 'uploadingFile' || submissionStatus === 'submittingMetadata';

    return (
        <div className="dpp-page-container page-container">
            <Button onClick={handleGoBackToLesson} variant="outline" size="small" className="back-button">
                <FaArrowLeft className="button-icon"/> Back to Lesson
            </Button>

            <h1 className="dpp-page-title">
                <FaPencilAlt className="title-icon" />
                {dppData.title || `DPP for ${lesson.title}`}
            </h1>
            <p className="dpp-due-date">Due Date: {new Date(dppData.dueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <section className="dpp-problem-section card">
                <h2>Problem Statement</h2>
                <div className="dpp-description">
                    {dppData.description || "No problem description provided."}
                </div>
            </section>

            <section className="dpp-submission-section card">
                <h2>Submit Your Solution</h2>

                {/* Display API submission errors from Redux */}
                {submissionStatus === 'failed' && submissionError && (
                    <p className="upload-error-message form-level-error">
                        <FaExclamationTriangle /> {typeof submissionError === 'string' ? submissionError : "Submission failed. Please try again."}
                    </p>
                )}
                {/* Display local dropzone/validation errors */}
                {localUploadError && !submissionError && (
                    <p className="upload-error-message form-level-error">
                        <FaExclamationTriangle /> {localUploadError}
                    </p>
                )}
                {/* Display success message from Redux */}
                {submissionStatus === 'succeeded' && successMessage && (
                    <p className="upload-success-message form-level-success">
                       <FaCheckCircle /> {successMessage}
                    </p>
                )}

                {/* Hide dropzone if submission was successful, otherwise show */}
                {submissionStatus !== 'succeeded' && (
                    <>
                        <div
                            {...getRootProps()}
                            className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''} ${uploadedFile ? 'has-file' : ''} ${isSubmitting ? 'disabled' : ''}`}
                        >
                            <input {...getInputProps()} disabled={isSubmitting} />
                            <div className="dropzone-content">
                                <FaFileUpload className="dropzone-icon" />
                                {uploadedFile ? (
                                    <p>File ready: {uploadedFile.name}</p>
                                ) : isDragActive ? (
                                    <p>Drop the file here ...</p>
                                ) : (
                                    <p>Drag 'n' drop solution file here, or click to select (Max 5MB)</p>
                                )}
                            </div>
                        </div>

                        {uploadedFile && (
                            <div className="uploaded-file-info">
                                <p>
                                    Selected: <strong>{uploadedFile.name}</strong> ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                                <Button onClick={handleRemoveFile} variant="danger-outline" size="small" disabled={isSubmitting}>
                                   <FaTrash/> Remove
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* Submit/Retake Button Logic */}
                {submissionStatus === 'succeeded' ? (
                    <Button
                        onClick={() => dispatch(clearDppState())} // Allow submitting another file
                        variant="secondary-outline"
                        className="submit-solution-button"
                    >
                        Submit Another Solution
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmitSolution}
                        variant="primary"
                        disabled={!uploadedFile || isSubmitting}
                        className="submit-solution-button"
                    >
                        {isSubmitting ? <Spinner size="small" /> : null}
                        {submissionStatus === 'uploadingFile' ? 'Uploading...' : submissionStatus === 'submittingMetadata' ? 'Submitting...' : 'Submit Solution'}
                    </Button>
                )}
                 <p className="submit-note"><em>(Ensure your solution file is clearly named.)</em></p>
            </section>
        </div>
    );
};

export default DppPage;