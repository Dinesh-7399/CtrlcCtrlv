// client/src/pages/admin/AdminCourseEdit/AdminCourseEdit.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import {
  fetchAdminCourseForEdit,
  updateAdminCourse,
  fetchCategoriesForForm,
  fetchInstructorsForForm,
  selectCurrentEditingCourseData,
  selectAdminCourseEditPageStatus,
  selectAdminCourseEditPageError,
  selectAdminCourseEditPageSuccessMessage,
  selectCategoriesForForm,
  selectInstructorsForForm,
  selectIsLoadingCategoriesForForm,
  selectIsLoadingInstructorsForForm,
  clearEditCourseStatus,
  clearEditPageSuccessMessage,
} from '../../../features/admin/adminCoursesSlice.js'; // Adjust path

// Common Components
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Card from '../../../components/common/Card'; // Assuming Card is a simple wrapper
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Select from '../../../components/common/Select';

import { FaSave, FaTimes, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './AdminCourseEdit.css'; // Your custom CSS
import { ContentStatus, Difficulty, LessonType } from '@prisma/client'; // For dropdown options

const generateClientId = () => `client_${Math.random().toString(36).substr(2, 9)}`;

const AdminCourseEdit = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const courseForEdit = useSelector(selectCurrentEditingCourseData);
  const pageStatus = useSelector(selectAdminCourseEditPageStatus); // 'idle', 'loadingInitial', 'editing', 'saving', 'succeeded', 'failed'
  const pageError = useSelector(selectAdminCourseEditPageError);
  const successMessage = useSelector(selectAdminCourseEditPageSuccessMessage);

  const categories = useSelector(selectCategoriesForForm);
  const instructors = useSelector(selectInstructorsForForm);
  const isLoadingCategories = useSelector(selectIsLoadingCategoriesForForm);
  const isLoadingInstructors = useSelector(selectIsLoadingInstructorsForForm);

  // --- Local Form State ---
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [difficulty, setDifficulty] = useState(Difficulty.ALL_LEVELS);
  const [language, setLanguage] = useState('English');
  const [status, setStatus] = useState(ContentStatus.DRAFT);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  const [modulesData, setModulesData] = useState([]); // For managing modules and lessons locally

  // --- Fetch initial data ---
  useEffect(() => {
    if (courseId) {
      dispatch(fetchAdminCourseForEdit(courseId));
    }
    dispatch(fetchCategoriesForForm());
    dispatch(fetchInstructorsForForm());

    return () => { // Cleanup on unmount
      dispatch(clearEditCourseStatus());
    };
  }, [dispatch, courseId]);

  // --- Populate form when courseForEdit data is loaded ---
  useEffect(() => {
    if (courseForEdit && pageStatus !== 'loadingInitial') {
      setTitle(courseForEdit.title || '');
      setSlug(courseForEdit.slug || '');
      setDescription(courseForEdit.description || '');
      setPrice(courseForEdit.price || 0);
      setCategoryId(courseForEdit.categoryId?.toString() || '');
      setInstructorId(courseForEdit.instructorId?.toString() || '');
      setDifficulty(courseForEdit.difficulty || Difficulty.ALL_LEVELS);
      setLanguage(courseForEdit.language || 'English');
      setStatus(courseForEdit.status || ContentStatus.DRAFT);
      setThumbnailUrl(courseForEdit.thumbnailUrl || '');
      setIsFeatured(courseForEdit.isFeatured || false);

      // Deep copy modules and lessons, adding clientIds if they don't exist (for new ones during edit)
      setModulesData(
        (courseForEdit.modules || []).map(mod => ({
          ...mod,
          clientId: mod.id || generateClientId(), // Use existing ID or generate client ID
          lessons: (mod.lessons || []).map(les => ({
            ...les,
            clientId: les.id || generateClientId(), // Use existing ID or generate client ID
            // Ensure all lesson fields are present for the form
            type: les.type || LessonType.TEXT,
            content: les.content || '',
            videoUrl: les.videoUrl || '',
            videoDuration: les.videoDuration || 0,
            isFreePreview: typeof les.isFreePreview === 'boolean' ? les.isFreePreview : false,
          })),
        }))
      );
    }
  }, [courseForEdit, pageStatus]);

  // --- Success/Error Message Handling & Redirect ---
   useEffect(() => {
    if (pageStatus === 'succeeded' && successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearEditPageSuccessMessage());
        // navigate('/admin/courses'); // Optionally redirect or let user stay
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pageStatus, successMessage, dispatch, navigate]);


  // --- Module Handlers (similar to AdminCourseCreate) ---
  const handleAddModule = () => {
    setModulesData([
      ...modulesData,
      { clientId: generateClientId(), title: '', order: modulesData.length, lessons: [], isNew: true }, // Mark as new
    ]);
  };
  const handleModuleChange = (moduleClientId, field, value) => { /* ... */ }; // See AdminCourseCreate
  const handleRemoveModule = (moduleClientId) => { /* ... */ };
  const moveModule = (index, direction) => { /* ... */ };

  // --- Lesson Handlers (similar to AdminCourseCreate) ---
  const handleAddLesson = (moduleClientId) => { /* ... */ };
  const handleLessonChange = (moduleClientId, lessonClientId, field, value) => { /* ... */ };
  const handleRemoveLesson = (moduleClientId, lessonClientId) => { /* ... */ };
  const moveLesson = (moduleClientId, lessonIndex, direction) => { /* ... */ };

    // --- Re-implementing Module/Lesson handlers for brevity in this example ---
    // (In a real app, you might abstract these into a custom hook if used in both Create and Edit)
    const reImplementModuleLessonHandlers = () => {
        // Module Handlers
        // handleAddModule is above
        const newHandleModuleChange = (moduleClientId, field, value) => {
            setModulesData(prevModules => prevModules.map(mod =>
                mod.clientId === moduleClientId ? { ...mod, [field]: value } : mod
            ));
        };
        const newHandleRemoveModule = (moduleClientId) => {
            setModulesData(prevModules => prevModules.filter(mod => mod.clientId !== moduleClientId)
                .map((mod, index) => ({ ...mod, order: index })) // Re-order after removal
            );
        };
        const newMoveModule = (index, direction) => {
            const newModules = [...modulesData];
            const modToMove = newModules[index];
            if (direction === 'up' && index > 0) {
                newModules.splice(index, 1);
                newModules.splice(index - 1, 0, modToMove);
            } else if (direction === 'down' && index < newModules.length - 1) {
                newModules.splice(index, 1);
                newModules.splice(index + 1, 0, modToMove);
            }
            setModulesData(newModules.map((m, i) => ({ ...m, order: i })));
        };

        // Lesson Handlers
        const newHandleAddLesson = (moduleClientId) => {
            setModulesData(prevModules => prevModules.map(mod => {
                if (mod.clientId === moduleClientId) {
                    const newLesson = {
                        clientId: generateClientId(), title: '', order: mod.lessons.length,
                        type: LessonType.TEXT, content: '', videoUrl: '', videoDuration: 0, isFreePreview: false, isNew: true
                    };
                    return { ...mod, lessons: [...mod.lessons, newLesson] };
                }
                return mod;
            }));
        };
        const newHandleLessonChange = (moduleClientId, lessonClientId, field, value) => {
            setModulesData(prevModules => prevModules.map(mod => {
                if (mod.clientId === moduleClientId) {
                    return {
                        ...mod,
                        lessons: mod.lessons.map(lesson =>
                            lesson.clientId === lessonClientId ? { ...lesson, [field]: value } : lesson
                        )
                    };
                }
                return mod;
            }));
        };
        const newHandleRemoveLesson = (moduleClientId, lessonClientId) => {
            setModulesData(prevModules => prevModules.map(mod => {
                if (mod.clientId === moduleClientId) {
                    return {
                        ...mod,
                        lessons: mod.lessons.filter(lesson => lesson.clientId !== lessonClientId)
                                     .map((l, index) => ({ ...l, order: index })) // Re-order
                    };
                }
                return mod;
            }));
        };
        const newMoveLesson = (moduleClientId, lessonIndex, direction) => {
            setModulesData(prevModules => prevModules.map(mod => {
                if (mod.clientId === moduleClientId) {
                    const newLessons = [...mod.lessons];
                    const lessonToMove = newLessons[lessonIndex];
                    if (direction === 'up' && lessonIndex > 0) {
                        newLessons.splice(lessonIndex, 1);
                        newLessons.splice(lessonIndex - 1, 0, lessonToMove);
                    } else if (direction === 'down' && lessonIndex < newLessons.length - 1) {
                        newLessons.splice(lessonIndex, 1);
                        newLessons.splice(lessonIndex + 1, 0, lessonToMove);
                    }
                    return { ...mod, lessons: newLessons.map((l, i) => ({ ...l, order: i })) };
                }
                return mod;
            }));
        };
        // Assign to component scope
        Object.assign(window, { newHandleModuleChange, newHandleRemoveModule, newMoveModule, newHandleAddLesson, newHandleLessonChange, newHandleRemoveLesson, newMoveLesson });
    };
    reImplementModuleLessonHandlers(); // Call to make them available, replace with actual assignments above


  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearEditCourseStatus()); // Clear previous errors/success

    const courseDataPayload = {
      title: title.trim(),
      slug: slug.trim() || undefined, // Let backend handle slug if empty or based on title change
      description: description.trim(),
      price: parseFloat(price) || 0,
      categoryId: categoryId ? parseInt(categoryId) : null,
      instructorId: instructorId ? parseInt(instructorId) : null, // Admin can change instructor
      difficulty,
      language: language.trim(),
      status,
      thumbnailUrl: thumbnailUrl.trim() || null,
      isFeatured,
      // For modules and lessons, the backend needs to handle diffing:
      // - Identify new modules/lessons (those with client_id and no db id)
      // - Identify updated modules/lessons (those with db id)
      // - Identify deleted modules/lessons (present in original courseForEdit.modules but not in modulesData)
      modules: modulesData.map(mod => ({
        id: typeof mod.id === 'number' ? mod.id : undefined, // Send existing DB ID if it's not new
        title: mod.title.trim(),
        order: mod.order,
        lessons: mod.lessons.map(lesson => ({
          id: typeof lesson.id === 'number' ? lesson.id : undefined, // Send existing DB ID
          title: lesson.title.trim(),
          order: lesson.order,
          type: lesson.type,
          content: lesson.type === LessonType.TEXT ? lesson.content : null,
          videoUrl: lesson.type === LessonType.VIDEO ? lesson.videoUrl : null,
          videoDuration: lesson.type === LessonType.VIDEO ? (parseInt(lesson.videoDuration) || 0) : null,
          isFreePreview: lesson.isFreePreview,
        })),
      })),
    };
    console.log("Submitting Updated Course Data:", courseDataPayload);
    dispatch(updateAdminCourse({ courseId, courseData: courseDataPayload }));
  };


  // --- Render Logic ---
  if (pageStatus === 'loadingInitial' || isLoadingCategories || isLoadingInstructors) {
    return <div className="admin-page-container page-loading-spinner"><Spinner label="Loading course data..." /></div>;
  }

  if (pageStatus === 'failed' && !courseForEdit) { // Error fetching initial course
    return (
      <div className="admin-page-container admin-form-error-fullpage">
        <FaExclamationTriangle className="error-icon-fullpage" />
        <h2>Error Loading Course</h2>
        <p>{typeof pageError === 'string' ? pageError : JSON.stringify(pageError)}</p>
        <Link to="/admin/courses" className="button-link">Back to Course List</Link>
      </div>
    );
  }
  if (!courseForEdit && courseId) { // Course ID exists, but not found after loading attempt
      return (
          <div className="admin-page-container admin-form-error-fullpage">
              <FaExclamationTriangle className="error-icon-fullpage" />
              <h2>Course Not Found</h2>
              <p>The course with ID "{courseId}" could not be found.</p>
              <Link to="/admin/courses" className="button-link">Back to Course List</Link>
          </div>
      );
  }


  return (
    <div className="admin-page-container admin-course-edit-page"> {/* Changed class name */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Edit Course: {courseForEdit?.title || 'Loading...'}</h1>
        <Link to="/admin/courses">
          <Button variant="outline" size="medium"><FaTimes className="button-icon"/> Cancel</Button>
        </Link>
      </div>

      {pageStatus === 'failed' && pageError && ( /* For save errors */
        <div className="admin-form-error form-level-error">
          <h4>Failed to Save Course:</h4>
          {typeof pageError === 'string' ? <p>{pageError}</p> :
            Array.isArray(pageError) ? (
              <ul>{pageError.map((err, i) => <li key={i}>{err.field ? `${err.field}: ` : ''}{err.message}</li>)}</ul>
            ) : <p>An unexpected error occurred.</p>
          }
        </div>
      )}
      {pageStatus === 'succeeded' && successMessage && (
        <p className="admin-form-success form-level-success"><FaCheckCircle /> {successMessage}</p>
      )}

      <form onSubmit={handleSubmit} className="course-edit-form"> {/* Changed class name */}
        <Card className="form-section-card"> {/* Wrap sections in Cards */}
          <h3 className="section-title">Basic Information</h3>
          <Input label="Course Title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Slug (leave empty to auto-generate from title if title changes)" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Textarea label="Course Description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          <div className="form-row">
            <Input label="Price (INR)" id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" />
            <Input label="Language" id="language" value={language} onChange={(e) => setLanguage(e.target.value)} />
          </div>
          <div className="form-row">
            <Select label="Category" id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              options={[{ value: '', label: 'Select Category' }, ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))]}
            />
            <Select label="Instructor" id="instructorId" value={instructorId} onChange={(e) => setInstructorId(e.target.value)} required
              options={[{ value: '', label: 'Select Instructor' }, ...instructors.map(inst => ({ value: inst.id.toString(), label: inst.name }))]}
            />
          </div>
          <div className="form-row">
            <Select label="Difficulty" id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
              options={Object.values(Difficulty).map(d => ({ value: d, label: d.replace('_', ' ') }))}
            />
            <Select label="Status" id="status" value={status} onChange={(e) => setStatus(e.target.value)}
              options={Object.values(ContentStatus).map(s => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))}
            />
          </div>
          <Input label="Thumbnail Image URL (optional)" id="thumbnailUrl" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
          <div className="form-group form-group-checkbox">
            <input type="checkbox" id="isFeatured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            <label htmlFor="isFeatured">Feature this course?</label>
          </div>
        </Card>

        <Card className="form-section-card">
          <div className="section-header-action">
            <h3 className="section-title">Course Content: Modules & Lessons</h3>
            <Button type="button" onClick={handleAddModule} variant="secondary-outline" size="small"><FaPlus /> Add Module</Button>
          </div>
          {modulesData.length === 0 && <p className="empty-section-message">No modules added yet. Click "Add Module" to start.</p>}
          {modulesData.map((module, moduleIndex) => (
            <div key={module.clientId} className="module-section">
              <div className="module-header">
                <h4 className="module-title-display">Module {module.order + 1}</h4> {/* Use order for display */}
                <div className="module-actions">
                    <Button type="button" onClick={() => window.newMoveModule(moduleIndex, 'up')} disabled={moduleIndex === 0} variant="icon-subtle" title="Move Module Up"><FaArrowUp /></Button>
                    <Button type="button" onClick={() => window.newMoveModule(moduleIndex, 'down')} disabled={moduleIndex === modulesData.length - 1} variant="icon-subtle" title="Move Module Down"><FaArrowDown /></Button>
                    <Button type="button" onClick={() => window.newHandleRemoveModule(module.clientId)} variant="danger-outline" size="small"><FaTrash /> Remove Module</Button>
                </div>
              </div>
              <Input
                label={`Module Title`}
                value={module.title}
                onChange={(e) => window.newHandleModuleChange(module.clientId, 'title', e.target.value)}
                required
                className="module-title-input"
              />
              <div className="lessons-section">
                <div className="section-header-action lessons-header">
                    <h5 className="lessons-title-display">Lessons</h5>
                    <Button type="button" onClick={() => window.newHandleAddLesson(module.clientId)} variant="secondary-outline" size="x-small">
                        <FaPlus /> Add Lesson
                    </Button>
                </div>
                {module.lessons.length === 0 && <p className="empty-section-message small-text">No lessons in this module yet.</p>}
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.clientId} className="lesson-item">
                    <p className="lesson-item-title-display">Lesson {lesson.order + 1}</p> {/* Use order for display */}
                    <Input
                      label={`Lesson Title`}
                      value={lesson.title}
                      onChange={(e) => window.newHandleLessonChange(module.clientId, lesson.clientId, 'title', e.target.value)}
                      required
                    />
                    <Select
                      label="Lesson Type"
                      value={lesson.type}
                      onChange={(e) => window.newHandleLessonChange(module.clientId, lesson.clientId, 'type', e.target.value)}
                      options={Object.values(LessonType).map(lt => ({ value: lt, label: lt.replace('_', ' ') }))}
                    />
                    {lesson.type === LessonType.TEXT && (
                      <Textarea
                        label="Content (Text/Markdown)"
                        value={lesson.content}
                        onChange={(e) => window.newHandleLessonChange(module.clientId, lesson.clientId, 'content', e.target.value)}
                        rows={5}
                      />
                    )}
                    {lesson.type === LessonType.VIDEO && (
                      <>
                        <Input
                          label="Video URL"
                          type="url"
                          value={lesson.videoUrl}
                          onChange={(e) => window.newHandleLessonChange(module.clientId, lesson.clientId, 'videoUrl', e.target.value)}
                        />
                        <Input
                          label="Video Duration (seconds)"
                          type="number"
                          min="0"
                          value={lesson.videoDuration}
                          onChange={(e) => window.newHandleLessonChange(module.clientId, lesson.clientId, 'videoDuration', e.target.value)}
                        />
                      </>
                    )}
                     {/* Add fields for Quiz ID, DPP ID if LessonType is QUIZ or DPP */}
                    <div className="lesson-item-controls">
                        <div className="form-group-checkbox lesson-preview-checkbox">
                            <input type="checkbox" id={`lesson-${lesson.clientId}-preview`} checked={lesson.isFreePreview} onChange={(e) => window.newHandleLessonChange(module.clientId, lesson.clientId, 'isFreePreview', e.target.checked)} />
                            <label htmlFor={`lesson-${lesson.clientId}-preview`}>Free Preview?</label>
                        </div>
                        <div className="lesson-order-actions">
                            <Button type="button" onClick={() => window.newMoveLesson(module.clientId, lessonIndex, 'up')} disabled={lessonIndex === 0} variant="icon-subtle" title="Move Lesson Up"><FaArrowUp /></Button>
                            <Button type="button" onClick={() => window.newMoveLesson(module.clientId, lessonIndex, 'down')} disabled={lessonIndex === module.lessons.length - 1} variant="icon-subtle" title="Move Lesson Down"><FaArrowDown /></Button>
                            <Button type="button" onClick={() => window.newHandleRemoveLesson(module.clientId, lesson.clientId)} variant="danger-icon" size="small" title="Remove Lesson"><FaTrash /></Button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <div className="form-actions">
          <Button type="submit" variant="primary" size="large" disabled={pageStatus === 'saving'}>
            {pageStatus === 'saving' ? <Spinner size="small" /> : <FaSave />} Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminCourseEdit;
