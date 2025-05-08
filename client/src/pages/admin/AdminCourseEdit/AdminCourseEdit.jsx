// src/pages/admin/AdminCourseEdit/AdminCourseEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// Import Redux actions and selectors
import {
    selectCourseById,
    selectCoursesStatus,
    selectCoursesError, // Import error selector
    selectCourseModules, // Selector for modules
    updateCourse,
    fetchCourses
} from '../../../features/courses/CoursesSlice.js';
// Import category selectors and fetch action
import {
    selectAllCategories,
    selectCategoriesStatus,
    fetchCategories
} from '../../../features/categories/categoriesSlice';

// Common Components
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Select from '../../../components/common/Select';

// Icons
import { FaSave, FaTimes, FaPlus, FaPencilAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa'; // Added more icons

// CSS
import './AdminCourseEdit.css'; // Make sure this file includes grid styles

const AdminCourseEdit = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // --- State Selection ---
    const course = useSelector((state) => selectCourseById(state, courseId));
    const courseModules = useSelector((state) => selectCourseModules(state, courseId)); // Get modules
    const coursesStatus = useSelector(selectCoursesStatus);
    const coursesError = useSelector(selectCoursesError);

    // Fetch categories for dropdown
    const categories = useSelector(selectAllCategories);
    const categoriesStatus = useSelector(selectCategoriesStatus);

    // --- Local State ---
    const [formData, setFormData] = useState({
        title: '',
        // Store category ID if using dropdown, otherwise category name string
        categoryId: '', // Changed from 'category'
        price: 0,
        status: 'draft',
        thumbnail: '',
        description: ''
    });
    const [updateStatus, setUpdateStatus] = useState('idle');
    const [updateError, setUpdateError] = useState(null);

    // --- Effects ---
    // Fetch initial course and category data
    useEffect(() => {
        if (coursesStatus === 'idle') {
             dispatch(fetchCourses());
        }
        if (categoriesStatus === 'idle') {
            dispatch(fetchCategories());
        }
    }, [coursesStatus, categoriesStatus, dispatch]);

    // Populate form when course data is loaded
    useEffect(() => {
        if (coursesStatus === 'succeeded' && course) {
            setFormData({
                title: course.title || '',
                 // Use category ID if your data has it, otherwise adapt
                categoryId: course.categoryId || course.category || '', // Prefer ID if available
                price: course.price || 0,
                status: course.status || 'draft',
                thumbnail: course.thumbnail || '',
                description: course.description || '',
            });
            setUpdateStatus('idle');
            setUpdateError(null);
        }
        // Do not navigate away here if !course, handle in render
    }, [course, coursesStatus]); // Re-run if course data changes


    // --- Event Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleBasicInfoSubmit = async (e) => {
        e.preventDefault();
        setUpdateStatus('loading');
        setUpdateError(null);

        if (!formData.title) {
            setUpdateError('Course title is required.');
            setUpdateStatus('failed');
            return;
        }

        const changes = { ...formData, price: parseFloat(formData.price) || 0 };
        // If using categoryId, make sure it's sent correctly.
        // If storing category name, ensure it's trimmed etc.

        try {
            console.log("Dispatching update course:", { id: courseId, changes });
            // Assume updateCourse is synchronous for now, or use unwrap if it's a thunk
            dispatch(updateCourse({ id: courseId, changes }));
            setUpdateStatus('succeeded');
            // Remove automatic navigation, let user decide when to leave
            // setTimeout(() => navigate('/admin/courses'), 1000);
        } catch (err) {
             console.error('Failed to update course:', err);
             setUpdateError(err.message || 'Failed to save changes.');
             setUpdateStatus('failed');
        }
    };

    // --- Placeholder Handlers for Modules/Lessons ---
    const handleAddModule = () => console.log("TODO: Add Module");
    const handleEditModule = (moduleId) => console.log("TODO: Edit Module", moduleId);
    const handleDeleteModule = (moduleId) => console.log("TODO: Delete Module", moduleId);
    const handleAddLesson = (moduleId) => console.log("TODO: Add Lesson to Module", moduleId);
    const handleEditLesson = (lessonId) => console.log("TODO: Edit Lesson", lessonId);
    const handleDeleteLesson = (lessonId) => console.log("TODO: Delete Lesson", lessonId);


    // --- Render Logic ---

    // Initial Loading or Course Not Found
    if (coursesStatus === 'loading' || coursesStatus === 'idle') {
        return <div className="admin-page-container admin-centered-container"><Spinner label="Loading course data..." /></div>;
    }
    if (coursesStatus === 'succeeded' && !course) {
        return (
             <div className="admin-page-container admin-centered-container admin-error-container">
                <FaExclamationTriangle size={30} className="error-icon"/>
                <h2 className="error-title">Course Not Found</h2>
                <p className="error-message">Could not find course with ID: {courseId}</p>
                <Link to="/admin/courses"><Button variant="secondary">Back to Courses</Button></Link>
            </div>
        );
    }
    // Fetching Error
     if (coursesStatus === 'failed') {
        return (
             <div className="admin-page-container admin-centered-container admin-error-container">
                 <FaExclamationTriangle size={30} className="error-icon"/>
                <h2 className="error-title">Error Loading Data</h2>
                <p className="error-message">{coursesError || 'An unknown error occurred.'}</p>
                <Button onClick={() => dispatch(fetchCourses())} variant="secondary" className="retry-button">Retry</Button>
            </div>
        );
     }


    // --- Main Content Render ---
    return (
        <div className="admin-page-container admin-edit-form-container">
            <div className="admin-page-header">
                <h1 className="admin-page-title">Edit Course: {formData.title || ''}</h1>
                 <Link to="/admin/courses">
                    <Button variant="outline" size="medium">
                        <FaTimes className="button-icon" aria-hidden="true" /> Cancel
                    </Button>
                </Link>
            </div>

            {/* Card for Basic Information Form */}
            <Card className="admin-form-card">
                <form onSubmit={handleBasicInfoSubmit}>
                    {/* Use a grid for layout */}
                    <div className="form-grid-container">
                        {/* Column 1 */}
                        <div className="form-grid-column">
                            <Input
                                label="Course Title" id="title" name="title"
                                value={formData.title} onChange={handleChange} required
                                placeholder="e.g., Introduction to React"
                            />
                            <Select
                                label="Category" id="categoryId" name="categoryId" // Changed name to categoryId
                                value={formData.categoryId} onChange={handleChange} required
                                options={[
                                    { value: '', label: '-- Select Category --', disabled: true },
                                    // Map over fetched categories
                                    ...(categories || []).map(cat => ({ value: cat.id, label: cat.name })) // Use category ID as value
                                ]}
                                // Show loading state for categories if needed
                                disabled={categoriesStatus === 'loading'}
                            />
                             <Input
                                label="Price (INR)" id="price" name="price" type="number"
                                min="0" step="any" value={formData.price} onChange={handleChange}
                                placeholder="e.g., 499 (0 for Free)"
                            />
                            <Select
                                label="Status" id="status" name="status"
                                value={formData.status} onChange={handleChange} required
                                options={[
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'published', label: 'Published' }
                                ]}
                            />
                             <Input
                                label="Thumbnail Image URL" id="thumbnail" name="thumbnail" type="url"
                                value={formData.thumbnail} onChange={handleChange}
                                placeholder="https://example.com/image.jpg"
                            />
                            {formData.thumbnail && (
                                <div className="thumbnail-preview">
                                    <p>Preview:</p>
                                    <img src={formData.thumbnail} alt="Thumbnail preview" onError={(e) => e.target.style.display='none'}/>
                                </div>
                            )}
                        </div>

                        {/* Column 2 */}
                        <div className="form-grid-column">
                            <Textarea
                                label="Description" id="description" name="description"
                                value={formData.description} onChange={handleChange} rows={15} // Increased rows
                                placeholder="Detailed description of the course content..."
                            />
                        </div>
                    </div> {/* End form-grid-container */}

                    {/* Form Actions */}
                    <div className="form-actions">
                         <Button type="submit" variant="primary" size="large" disabled={updateStatus === 'loading'}>
                            {updateStatus === 'loading' ? <Spinner size="small" /> : <FaSave className="button-icon" />}
                            Save Basic Info
                        </Button>
                    </div>

                    {/* Display Update Status Messages */}
                    {updateStatus === 'succeeded' && <p className="status-message success">Basic info updated successfully!</p>}
                    {updateStatus === 'failed' && <p className="status-message error">Error updating info: {updateError || 'Please try again.'}</p>}
                </form>
            </Card>

            {/* --- Card for Course Content (Modules/Lessons) --- */}
            <Card className="admin-content-card">
                 <div className="content-card-header">
                     <h2>Course Content</h2>
                     <Button variant="secondary" onClick={handleAddModule}>
                         <FaPlus aria-hidden="true"/> Add Module
                     </Button>
                 </div>

                 <div className="module-list">
                    {(courseModules && courseModules.length > 0) ? courseModules.map((module) => (
                        <div key={module.id} className="module-item">
                            <div className="module-header">
                                <h3 className="module-title">{module.title || 'Untitled Module'}</h3>
                                <div className="module-actions">
                                     <Button variant="outline" size="small" onClick={() => handleAddLesson(module.id)}>
                                        <FaPlus aria-hidden="true"/> Add Lesson
                                    </Button>
                                     <Button variant="icon" size="small" title="Edit Module" onClick={() => handleEditModule(module.id)}>
                                        <FaPencilAlt/>
                                    </Button>
                                     <Button variant="icon" color="danger" size="small" title="Delete Module" onClick={() => handleDeleteModule(module.id)}>
                                        <FaTrash/>
                                    </Button>
                                </div>
                            </div>
                            <ul className="lesson-list">
                                {(module.lessons && module.lessons.length > 0) ? module.lessons.map(lesson => (
                                    <li key={lesson.id} className="lesson-item">
                                        <span className="lesson-title">{lesson.title || 'Untitled Lesson'}</span>
                                        <div className="lesson-actions">
                                            <Button variant="icon" size="small" title="Edit Lesson" onClick={() => handleEditLesson(lesson.id)}>
                                                <FaPencilAlt/>
                                            </Button>
                                            <Button variant="icon" color="danger" size="small" title="Delete Lesson" onClick={() => handleDeleteLesson(lesson.id)}>
                                                 <FaTrash/>
                                            </Button>
                                        </div>
                                    </li>
                                )) : (
                                    <li className="no-lessons">No lessons in this module yet.</li>
                                )}
                            </ul>
                        </div>
                    )) : (
                        <p className="admin-empty-message">No modules added yet. Click "Add Module" to start building the course content.</p>
                    )}
                 </div>
            </Card>

        </div> // End admin-page-container
    );
};

export default AdminCourseEdit;