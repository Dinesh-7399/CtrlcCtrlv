// client/src/pages/admin/AdminCourseCreate/AdminCourseCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEditor, EditorContent } from '@tiptap/react'; // For lesson content if using Tiptap
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

import {
  createAdminCourse,
  fetchCategoriesForForm,
  fetchInstructorsForForm,
  selectAdminCourseCreateStatus,
  selectAdminCourseCreateError,
  selectAdminCourseCreateSuccessMessage,
  selectCategoriesForForm,
  selectInstructorsForForm,
  selectIsLoadingCategoriesForForm,
  selectIsLoadingInstructorsForForm,
  clearCreateCourseStatus,
} from '../../../features/admin/adminCoursesSlice.js'; // Adjust path

import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Select from '../../../components/common/Select';
import Spinner from '../../../components/common/Spinner';
import './AdminCourseCreate.css'; // We'll create this
import { FaPlus, FaTrash, FaSave, FaTimes, FaCheckCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { ContentStatus, Difficulty, LessonType } from '@prisma/client'; // For dropdown options - ensure this import works

// Helper to generate unique IDs for new modules/lessons on client-side before saving
const generateClientId = () => `client_${Math.random().toString(36).substr(2, 9)}`;

const AdminCourseCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const createStatus = useSelector(selectAdminCourseCreateStatus);
  const createError = useSelector(selectAdminCourseCreateError);
  const successMessage = useSelector(selectAdminCourseCreateSuccessMessage);
  const categories = useSelector(selectCategoriesForForm);
  const instructors = useSelector(selectInstructorsForForm);
  const isLoadingCategories = useSelector(selectIsLoadingCategoriesForForm);
  const isLoadingInstructors = useSelector(selectIsLoadingInstructorsForForm);

  // --- Form State ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [difficulty, setDifficulty] = useState(Difficulty.ALL_LEVELS);
  const [language, setLanguage] = useState('English');
  const [status, setStatus] = useState(ContentStatus.DRAFT);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  const [modules, setModules] = useState([
    // { clientId: generateClientId(), title: '', order: 0, lessons: [{ clientId: generateClientId(), title: '', order: 0, type: LessonType.TEXT, content: '' }] }
  ]);

  // --- Fetch data for dropdowns ---
  useEffect(() => {
    dispatch(fetchCategoriesForForm());
    dispatch(fetchInstructorsForForm());
    return () => { // Cleanup on unmount
        dispatch(clearCreateCourseStatus());
    }
  }, [dispatch]);

  // --- Success/Error Handling & Redirect ---
  useEffect(() => {
    if (createStatus === 'succeeded' && successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearCreateCourseStatus()); // Clear message
        navigate('/admin/courses');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [createStatus, successMessage, dispatch, navigate]);


  // --- Module Handlers ---
  const handleAddModule = () => {
    setModules([
      ...modules,
      { clientId: generateClientId(), title: '', order: modules.length, lessons: [] },
    ]);
  };

  const handleModuleChange = (moduleClientId, field, value) => {
    setModules(
      modules.map((mod) =>
        mod.clientId === moduleClientId ? { ...mod, [field]: value } : mod
      )
    );
  };

  const handleRemoveModule = (moduleClientId) => {
    setModules(modules.filter((mod) => mod.clientId !== moduleClientId));
  };

  const moveModule = (index, direction) => {
    const newModules = [...modules];
    const mod = newModules[index];
    if (direction === 'up' && index > 0) {
        newModules.splice(index, 1);
        newModules.splice(index - 1, 0, mod);
    } else if (direction === 'down' && index < newModules.length - 1) {
        newModules.splice(index, 1);
        newModules.splice(index + 1, 0, mod);
    }
    // Re-assign order based on new position
    setModules(newModules.map((m, i) => ({ ...m, order: i })));
  };


  // --- Lesson Handlers ---
  const handleAddLesson = (moduleClientId) => {
    setModules(
      modules.map((mod) => {
        if (mod.clientId === moduleClientId) {
          const newLesson = {
            clientId: generateClientId(),
            title: '',
            order: mod.lessons.length,
            type: LessonType.TEXT,
            content: '', // For TEXT type
            videoUrl: '', // For VIDEO type
            videoDuration: 0, // For VIDEO type
            isFreePreview: false,
          };
          return { ...mod, lessons: [...mod.lessons, newLesson] };
        }
        return mod;
      })
    );
  };

  const handleLessonChange = (moduleClientId, lessonClientId, field, value) => {
    setModules(
      modules.map((mod) => {
        if (mod.clientId === moduleClientId) {
          return {
            ...mod,
            lessons: mod.lessons.map((lesson) =>
              lesson.clientId === lessonClientId ? { ...lesson, [field]: value } : lesson
            ),
          };
        }
        return mod;
      })
    );
  };

  const handleRemoveLesson = (moduleClientId, lessonClientId) => {
    setModules(
      modules.map((mod) => {
        if (mod.clientId === moduleClientId) {
          return {
            ...mod,
            lessons: mod.lessons.filter((lesson) => lesson.clientId !== lessonClientId),
          };
        }
        return mod;
      })
    );
  };

    const moveLesson = (moduleClientId, lessonIndex, direction) => {
        setModules(modules.map(mod => {
            if (mod.clientId === moduleClientId) {
                const newLessons = [...mod.lessons];
                const lesson = newLessons[lessonIndex];
                if (direction === 'up' && lessonIndex > 0) {
                    newLessons.splice(lessonIndex, 1);
                    newLessons.splice(lessonIndex - 1, 0, lesson);
                } else if (direction === 'down' && lessonIndex < newLessons.length - 1) {
                    newLessons.splice(lessonIndex, 1);
                    newLessons.splice(lessonIndex + 1, 0, lesson);
                }
                return { ...mod, lessons: newLessons.map((l, i) => ({ ...l, order: i })) };
            }
            return mod;
        }));
    };


  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearCreateCourseStatus()); // Clear previous errors/success

    const courseData = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      categoryId: categoryId ? parseInt(categoryId) : null,
      instructorId: instructorId ? parseInt(instructorId) : null,
      difficulty,
      language: language.trim(),
      status,
      thumbnailUrl: thumbnailUrl.trim() || null,
      isFeatured,
      modules: modules.map(mod => ({
        title: mod.title.trim(),
        order: mod.order,
        lessons: mod.lessons.map(lesson => ({
          title: lesson.title.trim(),
          order: lesson.order,
          type: lesson.type,
          content: lesson.type === LessonType.TEXT ? lesson.content.trim() : null,
          videoUrl: lesson.type === LessonType.VIDEO ? lesson.videoUrl.trim() : null,
          videoDuration: lesson.type === LessonType.VIDEO ? (parseInt(lesson.videoDuration) || 0) : null,
          isFreePreview: lesson.isFreePreview,
        })),
      })),
    };
    console.log("Submitting Course Data:", courseData);
    dispatch(createAdminCourse(courseData));
  };


  if (isLoadingCategories || isLoadingInstructors) {
    return <div className="admin-page-container page-loading-spinner"><Spinner label="Loading form data..." /></div>;
  }

  return (
    <div className="admin-page-container admin-course-create-form">
      <h1 className="admin-page-title">Create New Course</h1>

      {createStatus === 'failed' && createError && (
        <div className="admin-form-error form-level-error">
          <h4>Failed to Create Course:</h4>
          {typeof createError === 'string' ? <p>{createError}</p> :
            Array.isArray(createError) ? (
              <ul>{createError.map((err, i) => <li key={i}>{err.field ? `${err.field}: ` : ''}{err.message}</li>)}</ul>
            ) : <p>An unexpected error occurred.</p>
          }
        </div>
      )}
      {createStatus === 'succeeded' && successMessage && (
        <p className="admin-form-success form-level-success"><FaCheckCircle /> {successMessage}</p>
      )}


      <form onSubmit={handleSubmit} className="course-creation-form">
        <fieldset className="form-section">
          <legend className="section-title">Basic Information</legend>
          <Input label="Course Title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
          <Input label="Thumbnail Image URL (optional)" id="thumbnailUrl" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://example.com/image.jpg"/>
          <div className="form-group form-group-checkbox">
            <input type="checkbox" id="isFeatured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            <label htmlFor="isFeatured">Feature this course?</label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="section-title">Course Content: Modules & Lessons</legend>
          {modules.map((module, moduleIndex) => (
            <div key={module.clientId} className="module-section">
              <div className="module-header">
                <h4 className="module-title">Module {moduleIndex + 1}</h4>
                <div className="module-actions">
                    <Button type="button" onClick={() => moveModule(moduleIndex, 'up')} disabled={moduleIndex === 0} variant="icon-subtle" title="Move Module Up"><FaArrowUp /></Button>
                    <Button type="button" onClick={() => moveModule(moduleIndex, 'down')} disabled={moduleIndex === modules.length - 1} variant="icon-subtle" title="Move Module Down"><FaArrowDown /></Button>
                    <Button type="button" onClick={() => handleRemoveModule(module.clientId)} variant="danger-outline" size="small"><FaTrash /> Remove Module</Button>
                </div>
              </div>
              <Input
                label={`Module ${moduleIndex + 1} Title`}
                value={module.title}
                onChange={(e) => handleModuleChange(module.clientId, 'title', e.target.value)}
                required
                className="module-title-input"
              />
              <div className="lessons-section">
                <h5 className="lessons-title">Lessons:</h5>
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.clientId} className="lesson-item">
                    <p className="lesson-item-title">Lesson {lessonIndex + 1}</p>
                    <Input
                      label={`Lesson Title`}
                      value={lesson.title}
                      onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'title', e.target.value)}
                      required
                    />
                    <Select
                      label="Lesson Type"
                      value={lesson.type}
                      onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'type', e.target.value)}
                      options={Object.values(LessonType).map(lt => ({ value: lt, label: lt.replace('_', ' ') }))}
                    />
                    {lesson.type === LessonType.TEXT && (
                      <Textarea
                        label="Lesson Content (Text)"
                        value={lesson.content}
                        onChange={(e) => handleLessonChange(module.clientId, lesson.clientId, 'content', e.target.value)}
                        rows={5}
                      />
                    )}
                    {lesson.type === LessonType.VIDEO && (
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
                <Button type="button" onClick={() => handleAddLesson(module.clientId)} variant="secondary-outline" size="small">
                  <FaPlus /> Add Lesson to Module {moduleIndex + 1}
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" onClick={handleAddModule} variant="secondary" className="add-module-btn">
            <FaPlus /> Add Module
          </Button>
        </fieldset>

        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={createStatus === 'loading'}>
            {createStatus === 'loading' ? <Spinner size="small" /> : <FaSave />} Create Course
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')} disabled={createStatus === 'loading'}>
            <FaTimes /> Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminCourseCreate;

// Note: For Tiptap editor in lessons, you would need a more complex state management
// if each lesson had its own Tiptap instance. This example uses simple textarea for TEXT lessons.
// If using Tiptap for each lesson:
// - Each lesson object in state would need its own `editor` instance or content string.
// - You'd map over lessons and render an <EditorContent editor={lesson.editorInstance} /> for each.
