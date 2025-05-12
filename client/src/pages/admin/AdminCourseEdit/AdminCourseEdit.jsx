// client/src/pages/admin/AdminCourseEdit/AdminCourseEdit.jsx
import React, { useState, useEffect } from 'react';
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
} from '../../../features/admin/adminCoursesSlice.js';

import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Select from '../../../components/common/Select';
import './AdminCourseEdit.css';
import { FaSave, FaTimes, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// Frontend equivalent of Prisma enums
const ContentStatusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];
const DifficultyOptions = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'ALL_LEVELS', label: 'All Levels' },
];
const LessonTypeOptions = [
  { value: 'TEXT', label: 'Text' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'DPP', label: 'DPP' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'EXTERNAL_LINK', label: 'External Link' },
];

const generateClientId = () => `client_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

const AdminCourseEdit = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const courseForEdit = useSelector(selectCurrentEditingCourseData);
  const pageStatus = useSelector(selectAdminCourseEditPageStatus);
  const pageError = useSelector(selectAdminCourseEditPageError);
  const successMessage = useSelector(selectAdminCourseEditPageSuccessMessage);

  const categories = useSelector(selectCategoriesForForm);
  const instructors = useSelector(selectInstructorsForForm);
  const isLoadingCategories = useSelector(selectIsLoadingCategoriesForForm);
  const isLoadingInstructors = useSelector(selectIsLoadingInstructorsForForm);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [difficulty, setDifficulty] = useState(DifficultyOptions[3].value);
  const [language, setLanguage] = useState('English');
  const [status, setStatus] = useState(ContentStatusOptions[0].value);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [modulesData, setModulesData] = useState([]);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchAdminCourseForEdit(courseId));
    }
    dispatch(fetchCategoriesForForm());
    dispatch(fetchInstructorsForForm());
    return () => {
      dispatch(clearEditCourseStatus());
    };
  }, [dispatch, courseId]);

  useEffect(() => {
    if (courseForEdit && pageStatus !== 'loadingInitial') {
      setTitle(courseForEdit.title || '');
      setSlug(courseForEdit.slug || '');
      setDescription(courseForEdit.description || '');
      setPrice(courseForEdit.price || 0);
      setCategoryId(courseForEdit.categoryId?.toString() || '');
      setInstructorId(courseForEdit.instructorId?.toString() || '');
      setDifficulty(courseForEdit.difficulty || DifficultyOptions[3].value);
      setLanguage(courseForEdit.language || 'English');
      setStatus(courseForEdit.status || ContentStatusOptions[0].value);
      setThumbnailUrl(courseForEdit.thumbnailUrl || '');
      setIsFeatured(courseForEdit.isFeatured || false);
      setModulesData(
        (courseForEdit.modules || []).map(mod => ({
          ...mod,
          clientId: mod.id || generateClientId(),
          lessons: (mod.lessons || []).map(les => ({
            ...les,
            clientId: les.id || generateClientId(),
            type: les.type || LessonTypeOptions[0].value,
            content: les.content || '',
            videoUrl: les.videoUrl || '',
            videoDuration: les.videoDuration || 0,
            isFreePreview: typeof les.isFreePreview === 'boolean' ? les.isFreePreview : false,
          })),
        }))
      );
    }
  }, [courseForEdit, pageStatus]);

  useEffect(() => {
    if (pageStatus === 'succeeded' && successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearEditPageSuccessMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pageStatus, successMessage, dispatch]);

  // --- Module and Lesson Handlers (similar to AdminCourseCreate) ---
  const handleAddModule = () => {
    setModulesData(prev => [
      ...prev,
      { clientId: generateClientId(), title: '', order: prev.length, lessons: [], isNew: true },
    ]);
  };

  const handleModuleChange = (moduleClientId, field, value) => {
    setModulesData(prev => prev.map(mod =>
        mod.clientId === moduleClientId ? { ...mod, [field]: value } : mod
    ));
  };

  const handleRemoveModule = (moduleClientId) => {
    setModulesData(prev => prev.filter(mod => mod.clientId !== moduleClientId)
                                .map((mod, index) => ({ ...mod, order: index }))
    );
  };

  const moveModule = (index, direction) => {
    setModulesData(prev => {
        const newModules = [...prev];
        const itemToMove = newModules[index];
        if (direction === 'up' && index > 0) {
            newModules.splice(index, 1);
            newModules.splice(index - 1, 0, itemToMove);
        } else if (direction === 'down' && index < newModules.length - 1) {
            newModules.splice(index, 1);
            newModules.splice(index + 1, 0, itemToMove);
        }
        return newModules.map((m, i) => ({ ...m, order: i }));
    });
  };
  
  const handleAddLesson = (moduleClientId) => {
    setModulesData(prev => prev.map(mod => {
        if (mod.clientId === moduleClientId) {
            const newLesson = {
                clientId: generateClientId(), title: '', order: mod.lessons.length,
                type: LessonTypeOptions[0].value, content: '', videoUrl: '', videoDuration: 0, isFreePreview: false, isNew: true
            };
            return { ...mod, lessons: [...mod.lessons, newLesson] };
        }
        return mod;
    }));
  };

  const handleLessonChange = (moduleClientId, lessonClientId, field, value) => {
    setModulesData(prev => prev.map(mod => {
        if (mod.clientId === moduleClientId) {
            return { ...mod, lessons: mod.lessons.map(lesson =>
                lesson.clientId === lessonClientId ? { ...lesson, [field]: value } : lesson
            )};
        }
        return mod;
    }));
  };

  const handleRemoveLesson = (moduleClientId, lessonClientId) => {
    setModulesData(prev => prev.map(mod => {
        if (mod.clientId === moduleClientId) {
            return { ...mod, lessons: mod.lessons.filter(lesson => lesson.clientId !== lessonClientId)
                                            .map((l, index) => ({ ...l, order: index })) };
        }
        return mod;
    }));
  };

  const moveLesson = (moduleClientId, lessonIndex, direction) => {
    setModulesData(prev => prev.map(mod => {
        if (mod.clientId === moduleClientId) {
            const newLessons = [...mod.lessons];
            const itemToMove = newLessons[lessonIndex];
            if (direction === 'up' && lessonIndex > 0) {
                newLessons.splice(lessonIndex, 1);
                newLessons.splice(lessonIndex - 1, 0, itemToMove);
            } else if (direction === 'down' && lessonIndex < newLessons.length - 1) {
                newLessons.splice(lessonIndex, 1);
                newLessons.splice(lessonIndex + 1, 0, itemToMove);
            }
            return { ...mod, lessons: newLessons.map((l, i) => ({ ...l, order: i })) };
        }
        return mod;
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearEditCourseStatus());

    const courseDataPayload = {
      title: title.trim(), slug: slug.trim() || undefined, description: description.trim(),
      price: parseFloat(price) || 0.0,
      categoryId: categoryId ? parseInt(categoryId) : null,
      instructorId: instructorId ? parseInt(instructorId) : null,
      difficulty, language: language.trim(), status,
      thumbnailUrl: thumbnailUrl.trim() || null, isFeatured,
      modules: modulesData.map(mod => ({
        id: typeof mod.id === 'number' ? mod.id : undefined, // Send DB ID if exists
        title: mod.title.trim(), order: mod.order,
        lessons: mod.lessons.map(lesson => ({
          id: typeof lesson.id === 'number' ? lesson.id : undefined, // Send DB ID if exists
          title: lesson.title.trim(), order: lesson.order, type: lesson.type,
          slug: lesson.slug ? lesson.slug.trim() : undefined,
          content: lesson.type === 'TEXT' ? lesson.content : null,
          videoUrl: lesson.type === 'VIDEO' ? lesson.videoUrl : null,
          videoDuration: lesson.type === 'VIDEO' ? (parseInt(lesson.videoDuration) || 0) : null,
          isFreePreview: lesson.isFreePreview,
        })),
      })),
    };
    dispatch(updateAdminCourse({ courseId, courseData: courseDataPayload }));
  };

  if ((pageStatus === 'loadingInitial' || isLoadingCategories || isLoadingInstructors) && !courseForEdit) {
    return <div className="admin-page-container page-loading-spinner"><Spinner label="Loading course data..." /></div>;
  }

  if (pageStatus === 'failed' && !courseForEdit && courseId) {
    return (
      <div className="admin-page-container admin-form-error-fullpage">
        <FaExclamationTriangle className="error-icon-fullpage" />
        <h2>Error Loading Course</h2>
        <p>{typeof pageError === 'string' ? pageError : JSON.stringify(pageError)}</p>
        <RouterLink to="/admin/courses" className="button-link">Back to Course List</RouterLink>
      </div>
    );
  }
   if (!courseForEdit && courseId && pageStatus !== 'loadingInitial' && pageStatus !== 'idle') {
      return (
          <div className="admin-page-container admin-form-error-fullpage">
              <FaExclamationTriangle className="error-icon-fullpage" />
              <h2>Course Not Found</h2>
              <p>The course with ID "{courseId}" could not be found or you do not have permission to edit it.</p>
              <RouterLink to="/admin/courses" className="button-link">Back to Course List</RouterLink>
          </div>
      );
  }
  
  return (
    <div className="admin-page-container admin-course-edit-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Edit Course: {courseForEdit?.title || 'Loading...'}</h1>
        <Link to="/admin/courses">
          <Button variant="outline" size="medium"><FaTimes className="button-icon"/> Cancel</Button>
        </Link>
      </div>

      {pageStatus === 'failed' && pageError && (
        <div className="admin-form-error form-level-error">
          <h4>Failed to Save Course:</h4>
           {typeof pageError === 'string' ? <p>{pageError}</p> :
            Array.isArray(pageError) ? (
              <ul>{pageError.map((err, i) => <li key={i}>{err.field ? `${err.field}: ` : ''}{err.message}</li>)}</ul>
            ) : <p>An unexpected error occurred.</p>}
        </div>
      )}
      {pageStatus === 'succeeded' && successMessage && (
        <p className="admin-form-success form-level-success"><FaCheckCircle /> {successMessage}</p>
      )}

      <form onSubmit={handleSubmit} className="course-edit-form">
        <Card className="form-section-card">
          <h3 className="section-title">Basic Information</h3>
          <Input label="Course Title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Slug (leave empty to auto-generate if title changes)" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
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
              options={DifficultyOptions}
            />
            <Select label="Status" id="status" value={status} onChange={(e) => setStatus(e.target.value)}
              options={ContentStatusOptions}
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
                <h4 className="module-title-display">Module {module.order + 1}</h4>
                <div className="module-actions">
                    <Button type="button" onClick={() => moveModule(moduleIndex, 'up')} disabled={moduleIndex === 0} variant="icon-subtle" title="Move Module Up"><FaArrowUp /></Button>
                    <Button type="button" onClick={() => moveModule(moduleIndex, 'down')} disabled={moduleIndex === modulesData.length - 1} variant="icon-subtle" title="Move Module Down"><FaArrowDown /></Button>
                    <Button type="button" onClick={() => handleRemoveModule(module.clientId)} variant="danger-outline" size="small"><FaTrash /> Remove Module</Button>
                </div>
              </div>
              <Input
                label={`Module Title`}
                value={module.title}
                onChange={(e) => handleModuleChange(module.clientId, 'title', e.target.value)}
                required
                className="module-title-input"
              />
              <div className="lessons-section">
                <div className="section-header-action lessons-header">
                    <h5 className="lessons-title-display">Lessons</h5>
                    <Button type="button" onClick={() => handleAddLesson(module.clientId)} variant="secondary-outline" size="x-small">
                        <FaPlus /> Add Lesson
                    </Button>
                </div>
                {module.lessons.length === 0 && <p className="empty-section-message small-text">No lessons in this module yet.</p>}
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.clientId} className="lesson-item">
                    <p className="lesson-item-title-display">Lesson {lesson.order + 1}</p>
                    <Input
                      label={`Lesson Title`}
                      value={lesson.title}
                      onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'title', e.target.value)}
                      required
                    />
                    <Input
                      label={`Lesson Slug (Optional)`}
                      value={lesson.slug || ''}
                      onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'slug', e.target.value)}
                      placeholder="auto-generated if blank"
                    />
                    <Select
                      label="Lesson Type"
                      value={lesson.type}
                      onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'type', e.target.value)}
                      options={LessonTypeOptions}
                    />
                    {lesson.type === 'TEXT' && (
                      <Textarea
                        label="Content (Text/Markdown)"
                        value={lesson.content}
                        onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'content', e.target.value)}
                        rows={5}
                      />
                    )}
                    {lesson.type === 'VIDEO' && (
                      <>
                        <Input
                          label="Video URL"
                          type="url"
                          value={lesson.videoUrl}
                          onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'videoUrl', e.target.value)}
                        />
                        <Input
                          label="Video Duration (seconds)"
                          type="number"
                          min="0"
                          value={lesson.videoDuration}
                          onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'videoDuration', e.target.value)}
                        />
                      </>
                    )}
                    <div className="lesson-item-controls">
                        <div className="form-group-checkbox lesson-preview-checkbox">
                            <input type="checkbox" id={`lesson-${lesson.clientId}-preview`} checked={lesson.isFreePreview} onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'isFreePreview', e.target.checked)} />
                            <label htmlFor={`lesson-${lesson.clientId}-preview`}>Free Preview?</label>
                        </div>
                        <div className="lesson-order-actions">
                            <Button type="button" onClick={() => moveLesson(module.clientId, lessonIndex, 'up')} disabled={lessonIndex === 0} variant="icon-subtle" title="Move Lesson Up"><FaArrowUp /></Button>
                            <Button type="button" onClick={() => moveLesson(module.clientId, lessonIndex, 'down')} disabled={lessonIndex === module.lessons.length - 1} variant="icon-subtle" title="Move Lesson Down"><FaArrowDown /></Button>
                            <Button type="button" onClick={() => handleRemoveLesson(module.clientId, lesson.clientId)} variant="danger-icon" size="small" title="Remove Lesson"><FaTrash /></Button>
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