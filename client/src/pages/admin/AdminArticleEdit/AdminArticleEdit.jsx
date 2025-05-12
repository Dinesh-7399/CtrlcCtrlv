// client/src/pages/admin/AdminArticleEdit/AdminArticleEdit.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  fetchAdminArticle,
  createAdminArticle,
  updateAdminArticle,
  uploadEditorImage,
  selectCurrentEditingArticle,
  selectAdminArticleEditStatus,
  selectAdminArticleEditError,
  selectAdminArticleSaveSuccessMessage,
  selectIsUploadingEditorImage,
  selectEditorImageUploadError,
  clearAdminArticleState,
  clearSaveSuccessMessage,
  clearAdminArticleError,
} from '../../../features/admin/adminArticlesSlice.js';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Select from '../../../components/common/Select';
import Spinner from '../../../components/common/Spinner';
import './AdminArticleEdit.css';
import {
    FaSave, FaTimes, FaBold, FaItalic, FaStrikethrough, FaParagraph,
    FaListUl, FaListOl, FaCode, FaHeading, FaImage, FaLink, FaUnlink, FaCheckCircle
} from 'react-icons/fa';

// Frontend equivalent for ContentStatus enum
const ContentStatusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

// MenuBar component remains the same as provided

const MenuBar = ({ editor, onImageUpload }) => {
  if (!editor) { return null; }

  const addImageViaToolbar = useCallback(async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const imageUrl = await onImageUpload(file);
        if (imageUrl) {
          editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
        }
      }
    };
    fileInput.click();
  }, [editor, onImageUpload]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const buttons = [
    { action: () => editor.chain().focus().toggleBold().run(), icon: FaBold, label: 'Bold', isActive: editor.isActive('bold') },
    { action: () => editor.chain().focus().toggleItalic().run(), icon: FaItalic, label: 'Italic', isActive: editor.isActive('italic') },
    { action: () => editor.chain().focus().toggleStrike().run(), icon: FaStrikethrough, label: 'Strike', isActive: editor.isActive('strike') },
    { action: setLink, icon: FaLink, label: 'Link', isActive: editor.isActive('link') },
    { action: () => editor.chain().focus().unsetLink().run(), icon: FaUnlink, label: 'Unlink', condition: editor.isActive('link') },
    { type: 'divider' },
    { action: () => editor.chain().focus().setParagraph().run(), icon: FaParagraph, label: 'Paragraph', isActive: editor.isActive('paragraph') },
    { action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), icon: FaHeading, label: 'H2', isActive: editor.isActive('heading', { level: 2 }) },
    { action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), icon: FaHeading, label: 'H3', isActive: editor.isActive('heading', { level: 3 }) },
    { action: () => editor.chain().focus().toggleBulletList().run(), icon: FaListUl, label: 'Bullet List', isActive: editor.isActive('bulletList') },
    { action: () => editor.chain().focus().toggleOrderedList().run(), icon: FaListOl, label: 'Ordered List', isActive: editor.isActive('orderedList') },
    { action: () => editor.chain().focus().toggleCodeBlock().run(), icon: FaCode, label: 'Code Block', isActive: editor.isActive('codeBlock') },
    { type: 'divider' },
    { action: addImageViaToolbar, icon: FaImage, label: 'Image', isActive: false },
  ];

  return (
    <div className="tiptap-toolbar">
      {buttons.map((btn, index) => {
        if (btn.type === 'divider') return <div key={index} className="toolbar-divider"></div>;
        if (btn.condition !== undefined && !btn.condition) return null;
        return (
          <button
            key={index}
            onClick={btn.action}
            className={`toolbar-button ${btn.isActive ? 'is-active' : ''}`}
            title={btn.label}
            type="button"
            disabled={!editor.isEditable || (btn.disabledCheck && btn.disabledCheck())}
          >
            <btn.icon />
          </button>
        );
      })}
    </div>
  );
};


const AdminArticleEdit = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const articleForEdit = useSelector(selectCurrentEditingArticle);
  const editStatus = useSelector(selectAdminArticleEditStatus);
  const saveError = useSelector(selectAdminArticleEditError);
  const saveSuccessMessage = useSelector(selectAdminArticleSaveSuccessMessage);
  const isUploadingImage = useSelector(selectIsUploadingEditorImage);
  const imageUploadError = useSelector(selectEditorImageUploadError);

  const isLoading = editStatus === 'loading' || (articleId && editStatus === 'idle' && !articleForEdit);
  const isSaving = editStatus === 'saving';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  // content state for Tiptap is handled by editor.getHTML() on submit
  const [excerpt, setExcerpt] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [categoryId, setCategoryId] = useState(''); // Assuming categories will be fetched for a dropdown
  const [tags, setTags] = useState(''); // Comma-separated string
  const [status, setStatus] = useState('DRAFT'); // Default to DRAFT
  const [isFeatured, setIsFeatured] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');

  // Placeholder for categories - fetch them similar to AdminCourseCreate
  const [categoriesOptions, setCategoriesOptions] = useState([{ value: '', label: 'Select Category' }]);
  // useEffect(() => { dispatch(fetchAdminCategoriesForArticleForm()); ... setCategoriesOptions }, [dispatch]);


  const editor = useEditor({
    extensions: [
      StarterKit, Image.configure({ inline: false, allowBase64: false }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Start writing your amazing article...' }),
    ],
    content: '', // Will be set by useEffect when articleForEdit loads
    editorProps: {
      attributes: { class: 'tiptap-editor-content' },
      handleDOMEvents: { /* ... (drop and paste handlers remain the same) ... */ 
        drop(view, event) {
          event.preventDefault();
          const files = event.dataTransfer?.files;
          if (!files || files.length === 0 || !view.editable) return false;
          const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
          if (imageFiles.length === 0) return false;

          imageFiles.forEach(file => handleImageUpload(file, view)); // Assuming handleImageUpload is defined
          return true;
        },
        paste(view, event) {
            const items = (event.clipboardData || event.originalEvent.clipboardData)?.items;
            if (!items || !view.editable) return false;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") === 0) {
                    event.preventDefault();
                    const file = items[i].getAsFile();
                    if (file) handleImageUpload(file, view); // Assuming handleImageUpload is defined
                    return true;
                }
            }
            return false;
        }
      },
    },
  });
  
  // Separated onUpdate for editor to avoid re-creating editor instance on content change
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      // This effect runs if editor is already initialized
      // If content needs to be set from state to editor (e.g. loading existing article)
      // That should be handled in the effect that populates form fields from `articleForEdit`
    }
  }, [editor]); // Only re-run if editor instance itself changes


  const handleImageUpload = useCallback(async (file, tiptapView) => {
    if (!file || !editor) return null; // Ensure editor is also available
    dispatch(clearAdminArticleError());
    try {
      const resultAction = await dispatch(uploadEditorImage(file)).unwrap();
      if (resultAction && resultAction.url && tiptapView && tiptapView.editable) {
        const { state } = tiptapView;
        const { tr } = state;
        const node = state.schema.nodes.image.create({ src: resultAction.url, alt: file.name });
        const transaction = tr.replaceSelectionWith(node);
        tiptapView.dispatch(transaction);
        return resultAction.url;
      }
    } catch (err) {
      console.error("Image upload failed in component:", err);
    }
    return null;
  }, [dispatch, editor]);


  useEffect(() => {
    if (articleId) {
      dispatch(fetchAdminArticle(articleId));
    } else {
      dispatch(clearAdminArticleState()); // Clear for new article form
      if (editor && !editor.isDestroyed) editor.commands.setContent('');
    }
    // Fetch categories for dropdown
    // dispatch(fetchCategoriesForAdminForm()).then(action => {
    //   if (action.payload) {
    //     setCategoriesOptions([{ value: '', label: 'Select Category' }, ...action.payload.map(c => ({ value: c.id.toString(), label: c.name }))]);
    //   }
    // });

    return () => {
      dispatch(clearAdminArticleState());
    };
  }, [dispatch, articleId]); // Removed editor from deps for this effect

  useEffect(() => {
    if (articleForEdit && editor && !editor.isDestroyed) {
      setTitle(articleForEdit.title || '');
      setSlug(articleForEdit.slug || '');
      const currentEditorContent = articleForEdit.content || '';
      if (editor.getHTML() !== currentEditorContent) {
         try {
            if(editor.isEditable) editor.commands.setContent(currentEditorContent, false);
         } catch(e) { console.error("Error setting editor content on load:", e)}
      }
      setExcerpt(articleForEdit.excerpt || '');
      setThumbnailUrl(articleForEdit.thumbnailUrl || '');
      setCategoryId(articleForEdit.categoryId?.toString() || '');
      setTags((articleForEdit.tags || []).join(', ')); // Assuming tags are stored as an array of strings or objects with 'name'
      setStatus(articleForEdit.status || 'DRAFT');
      setIsFeatured(articleForEdit.isFeatured || false);
      setPublishedAt(articleForEdit.publishedAt ? new Date(articleForEdit.publishedAt).toISOString().split('T')[0] : '');
    } else if (!articleId) { // Reset form for new article
        setTitle(''); setSlug('');
        if (editor && !editor.isDestroyed && editor.isEditable) editor.commands.setContent('', false);
        setExcerpt(''); setThumbnailUrl(''); setCategoryId('');
        setTags(''); setStatus('DRAFT'); setIsFeatured(false); setPublishedAt('');
    }
  }, [articleForEdit, editor, articleId]);

  const articleIdAfterSaveRef = useRef(null);

  useEffect(() => {
    if (saveSuccessMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSaveSuccessMessage());
        if (articleIdAfterSaveRef.current || !articleId) {
            navigate('/admin/articles');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccessMessage, dispatch, navigate, articleId]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editor) return;
    dispatch(clearAdminArticleError());

    const finalContent = editor.getHTML();
    const articleData = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      content: finalContent,
      excerpt: excerpt.trim(),
      thumbnailUrl: thumbnailUrl.trim() || null,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean), // Ensure tags are strings for backend
      status,
      isFeatured,
      publishedAt: publishedAt || null,
    };

    try {
      let resultAction;
      if (articleId) {
        resultAction = await dispatch(updateAdminArticle({ articleId, articleData })).unwrap();
      } else {
        resultAction = await dispatch(createAdminArticle(articleData)).unwrap();
        articleIdAfterSaveRef.current = resultAction.id;
      }
    } catch (rejectedValueOrSerializedError) {
      console.error('Failed to save article:', rejectedValueOrSerializedError);
    }
  };

  useEffect(() => {
    return () => { if(editor && !editor.isDestroyed) editor.destroy(); };
  }, [editor]);

  if (isLoading && articleId && !articleForEdit) {
    return <div className="admin-page-container page-loading-spinner"><Spinner size="large" label="Loading article..." /></div>;
  }
  if (saveError && editStatus === 'failed' && articleId && !articleForEdit) {
    return (
      <div className="admin-page-container admin-form-error-fullpage">
        <p>Error loading article: {typeof saveError === 'string' ? saveError : JSON.stringify(saveError)}</p>
        <RouterLink to="/admin/articles" className="button-link">Back to Article List</RouterLink>
      </div>
    );
  }

  return (
    <div className="admin-page-container admin-article-edit-form">
      <h1 className="admin-page-title">
        {articleId ? `Edit Article: ${articleForEdit?.title || 'Loading...'}` : 'Create New Article'}
      </h1>

      {editor && <MenuBar editor={editor} onImageUpload={(file) => handleImageUpload(file, editor.view)} />}
      {isUploadingImage && <p className="image-upload-indicator"><Spinner size="small" /> Uploading image...</p>}
      {imageUploadError && <p className="admin-form-error image-upload-error">Image upload failed: {typeof imageUploadError === 'string' ? imageUploadError : JSON.stringify(imageUploadError)}</p>}

      <form onSubmit={handleSubmit} className="article-form">
        {saveError && editStatus === 'failed' && (
          <div className="admin-form-error">
            <h4>Save Failed:</h4>
            {typeof saveError === 'string' ? <p>{saveError}</p> :
              Array.isArray(saveError) ? (
                <ul>{saveError.map((err, i) => <li key={i}>{err.field ? `${err.field}: ` : ''}{err.message}</li>)}</ul>
              ) : <p>An unexpected error occurred.</p>
            }
          </div>
        )}
        {saveSuccessMessage && <p className="admin-form-success"><FaCheckCircle /> {saveSuccessMessage}</p>}

        <Input label="Title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSaving}/>
        <Input label="Slug (optional)" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g., my-awesome-article" disabled={isSaving}/>
        <Textarea label="Excerpt (optional)" id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} disabled={isSaving}/>
        <Input label="Featured Image URL (optional)" id="thumbnailUrl" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://example.com/image.jpg" disabled={isSaving}/>

        <div className="form-row">
          <Select
            label="Category"
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categoriesOptions} // Use fetched categories
            disabled={isSaving /* || isLoadingCategories */}
          />
          <Input label="Tags (comma-separated)" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., tech,news,updates" disabled={isSaving}/>
        </div>

        <div className="form-row">
          <Input label="Publish Date (optional)" id="publishDate" type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} disabled={isSaving}/>
          <Select
            label="Status"
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={ContentStatusOptions} // Use defined options
            disabled={isSaving}
          />
        </div>
        <div className="form-group form-group-checkbox">
            <input type="checkbox" id="isFeatured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} disabled={isSaving} />
            <label htmlFor="isFeatured">Feature this article?</label>
        </div>

        <div className="form-group tiptap-container">
          <label htmlFor="tiptap-content">Content</label>
          {editor && <EditorContent editor={editor} id="tiptap-content" />}
        </div>

        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={isSaving || isUploadingImage || !editor || isLoading}>
            {isSaving ? <Spinner size="small"/> : <FaSave />} {articleId ? 'Save Changes' : 'Create Article'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/articles')} disabled={isSaving || isUploadingImage}>
            <FaTimes/> Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminArticleEdit;