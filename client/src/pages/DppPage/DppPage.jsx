// client/src/pages/DppPage/DppPage.jsx
import React, { useState, useCallback } from 'react'; // Added useCallback
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import './DppPage.css'; // We will add styles here
import { FaPencilAlt, FaArrowLeft, FaSpinner, FaExclamationTriangle, FaFileUpload, FaTrash } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone'; // Import react-dropzone

// --- Redux Imports ---
import { useSelector } from 'react-redux';
// *** Verify these filenames/paths match your actual slice files (likely lowercase) ***
import { selectLessonById, selectDppForLesson } from '../../features/courses/CoursesSlice.js';
// --- End Redux Imports ---

const DppPage = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();

    // --- Get Data from Redux ---
    const lesson = useSelector((state) => selectLessonById(state, courseId, lessonId));
    const dppData = useSelector((state) => selectDppForLesson(state, courseId, lessonId));
    // --- End Get Data from Redux ---

    // --- File Upload State ---
    // Store file object for potential preview or upload prep
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadError, setUploadError] = useState('');
    // --- End File Upload State ---

    // --- Drag and Drop Handler ---
    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setUploadError(''); // Clear previous errors
        setUploadedFile(null); // Clear previous file

        if (rejectedFiles && rejectedFiles.length > 0) {
            console.error("Rejected files:", rejectedFiles);
            setUploadError(`File rejected: ${rejectedFiles[0].errors[0].message}. Max size 5MB?`); // Basic error message
            return;
        }

        if (acceptedFiles && acceptedFiles.length > 0) {
            console.log("Accepted file:", acceptedFiles[0]);
            // Handle only the first accepted file
            setUploadedFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: { // Example: Accept common document/code files
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt', '.js', '.jsx', '.py', '.java', '.c', '.cpp', '.html', '.css'],
            'application/zip': ['.zip'],
            'application/vnd.rar': ['.rar'] // Note: RAR might not have a standard MIME type
        },
        maxSize: 5 * 1024 * 1024, // 5 MB limit example
        multiple: false // Allow only one file
    });
    // --- End Drag and Drop Handler ---

    // --- Other Handlers ---
    const handleGoBackToLesson = () => {
        navigate(`/learn/${courseId}/${lessonId}`);
    };

    const handleSubmitSolution = () => {
        if (!uploadedFile) {
            alert("Please upload a file first.");
            return;
        }
        // ** Placeholder for actual file upload logic to backend **
        console.log("Submitting file:", uploadedFile);
        alert(`Placeholder: Submitting ${uploadedFile.name}. Backend integration needed.`);
        // Reset state after "submission"
        // setUploadedFile(null);
        // setUploadError('');
        // Potentially navigate or show success message
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setUploadError('');
    }
    // --- End Other Handlers ---

    // --- Render Logic ---

    // Handle data not found from Redux
    if (!lesson || !dppData) {
        const message = !lesson
            ? `Lesson context (ID: "${lessonId}") could not be loaded.`
            : `DPP data associated with lesson ID "${lessonId}" not found in course "${courseId}". Check selector logic or JSON structure/naming.`;
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

    // Data is available
    return (
        <div className="dpp-page-container page-container">
            <Button onClick={handleGoBackToLesson} variant="outline" size="small" className="back-button">
                <FaArrowLeft className="button-icon"/> Back to Lesson
            </Button>

            <h1 className="dpp-page-title">
                <FaPencilAlt className="title-icon" />
                {/* Use DPP title or fallback to Lesson Title + DPP */}
                {dppData.title || `DPP for ${lesson.title}`}
            </h1>
            <p className="dpp-due-date">Due Date: {new Date(dppData.dueDate).toLocaleDateString()}</p>

            {/* Display DPP Problem Description */}
            <section className="dpp-problem-section card">
                <h2>Problem Statement</h2>
                {/* Assuming the description contains the long-format question */}
                <div className="dpp-description">
                    {/* Render simple text, or use Markdown parser if description is Markdown */}
                    {dppData.description || "No problem description provided."}
                </div>
            </section>

            {/* File Upload Section */}
            <section className="dpp-submission-section card">
                <h2>Submit Your Solution</h2>
                <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''} ${uploadedFile ? 'has-file' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="dropzone-content">
                        <FaFileUpload className="dropzone-icon" />
                        {
                           uploadedFile ? (
                             <p>File ready: {uploadedFile.name}</p>
                           ) : isDragActive ? (
                             <p>Drop the file here ...</p>
                           ) : (
                             <p>Drag 'n' drop your solution file here, or click to select file (Max 5MB)</p>
                           )
                        }
                    </div>
                </div>
                {/* Display upload error */}
                {uploadError && <p className="upload-error-message">{uploadError}</p>}

                {/* Display uploaded file info and remove button */}
                {uploadedFile && (
                    <div className="uploaded-file-info">
                        <p>
                            Selected: <strong>{uploadedFile.name}</strong> ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <Button onClick={handleRemoveFile} variant="danger" size="small">
                           <FaTrash/> Remove
                        </Button>
                    </div>
                )}

                {/* Submit Button */}
                 <Button
                    onClick={handleSubmitSolution}
                    variant="primary"
                    disabled={!uploadedFile} // Disable if no file is uploaded
                    className="submit-solution-button"
                >
                    Submit Solution
                </Button>
                 <p className="submit-note"><em>(Note: Submission requires backend implementation)</em></p>
            </section>
        </div>
    );
};

export default DppPage;