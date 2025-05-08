// client/src/pages/admin/AdminArticleEdit.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
// Import EditorContent and useEditor (BubbleMenu is removed)
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link'; // Keep Link for general link handling
import Placeholder from '@tiptap/extension-placeholder';

// !! Ensure paths are correct !!
import { selectArticleById, articleUpdated } from '../../../features/articles/articlesSlice.js';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Select from '../../../components/common/Select';
import Spinner from '../../../components/common/Spinner';
import './AdminArticleEdit.css';
// Icons for Toolbar + Save/Cancel
import {
    FaSave, FaTimes, FaBold, FaItalic, FaStrikethrough, FaParagraph,
    FaListUl, FaListOl, FaCode, FaHeading, FaImage, FaLink, FaUnlink , FaCheckCircle // Added back FaImage, FaLink, FaUnlink
} from 'react-icons/fa';

// --- MenuBar Component (Restored Static Toolbar) ---
const MenuBar = ({ editor }) => {
  if (!editor) { return null; }

  // --- Function to add image via URL (Placeholder using prompt) ---
  // TODO: Replace with a proper modal and upload/URL logic
  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      const alt = window.prompt('Enter Alt text (optional):', '');
      editor.chain().focus().setImage({ src: url, alt: alt || null }).run();
    }
  }, [editor]);
  // --- End Image Function ---

  // --- Function to set/unset Link ---
   const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Enter URL:', previousUrl);
        if (url === null) return; // cancelled
        if (url === '') { // empty
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);
  // --- End Link Function ---


  // Define buttons for the toolbar
  const buttons = [
    { action: () => editor.chain().focus().toggleBold().run(), icon: FaBold, label: 'Bold', isActive: editor.isActive('bold') },
    { action: () => editor.chain().focus().toggleItalic().run(), icon: FaItalic, label: 'Italic', isActive: editor.isActive('italic') },
    { action: () => editor.chain().focus().toggleStrike().run(), icon: FaStrikethrough, label: 'Strike', isActive: editor.isActive('strike') },
    { action: setLink, icon: FaLink, label: 'Link', isActive: editor.isActive('link') }, // Add Link button
    { action: () => editor.chain().focus().unsetLink().run(), icon: FaUnlink, label: 'Unlink', isActive: false, condition: editor.isActive('link') }, // Add Unlink button conditional
    { type: 'divider' }, // Optional divider
    { action: () => editor.chain().focus().setParagraph().run(), icon: FaParagraph, label: 'Paragraph', isActive: editor.isActive('paragraph') },
    { action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), icon: FaHeading, label: 'H2', isActive: editor.isActive('heading', { level: 2 }) },
    { action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), icon: FaHeading, label: 'H3', isActive: editor.isActive('heading', { level: 3 }) },
    { action: () => editor.chain().focus().toggleBulletList().run(), icon: FaListUl, label: 'Bullet List', isActive: editor.isActive('bulletList') },
    { action: () => editor.chain().focus().toggleOrderedList().run(), icon: FaListOl, label: 'Ordered List', isActive: editor.isActive('orderedList') },
    { action: () => editor.chain().focus().toggleCodeBlock().run(), icon: FaCode, label: 'Code Block', isActive: editor.isActive('codeBlock') },
     { type: 'divider' },
    { action: addImage, icon: FaImage, label: 'Image', isActive: false }, // Add Image button
  ];

  return (
    <div className="tiptap-toolbar">
      {buttons.map((btn, index) => {
        // Render divider
        if (btn.type === 'divider') {
          return <div key={index} className="toolbar-divider"></div>;
        }
        // Conditionally render button (e.g., only show Unlink if Link is active)
        if (btn.condition !== undefined && !btn.condition) {
            return null;
        }
        // Render standard button
        return (
            <button
              key={index}
              onClick={btn.action}
              className={btn.isActive ? 'is-active' : ''}
              title={btn.label}
              type="button"
              disabled={!editor.isEditable || (btn.disabledCheck && btn.disabledCheck())} // Example: disable unlink if no link selected
            >
              <btn.icon />
            </button>
        );
       })}
    </div>
  );
};
// --- End MenuBar Component ---


const AdminArticleEdit = () => {
    const { articleId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const article = useSelector((state) => selectArticleById(state, articleId));

    // --- Component State ---
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [author, setAuthor] = useState('Admin');
    const [imageUrl, setImageUrl] = useState(''); // Featured image
    const [publishDate, setPublishDate] = useState('');
    const [status, setStatus] = useState('draft');
    const [content, setContent] = useState(''); // Tiptap content (HTML)
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false); // Keep for drag/drop upload state
    const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
    // --- End State ---

    // --- Tiptap Editor Setup ---
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image, // Keep Image for rendering and drag/drop
            Link.configure({ openOnClick: false, autolink: true }), // Keep Link
            Placeholder.configure({ placeholder: 'Start writing...' }) // Keep Placeholder
        ],
        editorProps: { // Keep editorProps for drag/drop
            handleDOMEvents: {
                drop(view, event) {
                    event.preventDefault();
                    const files = event.dataTransfer?.files;
                    if (!files || files.length === 0) return false;
                    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
                    if (imageFiles.length === 0) return false;

                    imageFiles.forEach(async (file) => {
                        setIsUploading(true);
                        try {
                            const url = await uploadImage(file); // Uses placeholder upload
                             if (url && view.editable) {
                                const { state } = view;
                                const { tr } = state;
                                const node = state.schema.nodes.image.create({ src: url, alt: file.name });
                                const transaction = tr.replaceSelectionWith(node);
                                view.dispatch(transaction);
                             }
                        } catch (uploadError) {
                            console.error("Image upload failed:", uploadError);
                            setError("Image upload failed. Please try again.");
                        } finally {
                            setIsUploading(false);
                        }
                    });
                    return true;
                },
            },
        },
        content: content,
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });
    // --- End Tiptap Setup ---

    // --- Effect to load article data (remains the same) ---
    useEffect(() => {
        if (article) {
           setTitle(article.title || '');
           setSlug(article.slug || '');
           setExcerpt(article.excerpt || '');
           setAuthor(article.author || 'Admin');
           setImageUrl(article.imageUrl || '');
           setPublishDate(article.publishDate ? article.publishDate.split('T')[0] : '');
           setStatus(article.status || 'draft');

           const initialContent = article.content || '';
           setContent(initialContent);
           if (editor && !editor.isDestroyed) {
                try {
                   if (editor.isEditable) editor.commands.setContent(initialContent, false);
                } catch(e) { console.error("Error setting initial content", e)}
           }
           setIsLoading(false);
       } else if (!isLoading) {
            setError(`Article with ID "${articleId}" not found.`);
            setIsLoading(false);
       }
   }, [article, articleId]); // Removed editor from dependencies for stability

    // --- Handle Form Submission (remains the same) ---
    const handleSubmit = (e) => {
         e.preventDefault();
        if (!editor) return;
        setIsSaving(true);
        setError('');
        setSaveSuccessMessage(''); // Clear previous success message
        const latestContent = editor.getHTML();
        const updatedArticleData = { _id: articleId, title, slug, excerpt, author, imageUrl, publishDate, status, content: latestContent };
        console.log("Submitting updated article data:", updatedArticleData);
        try {
            dispatch(articleUpdated(updatedArticleData));
            setSaveSuccessMessage('Article updated successfully!');
            navigate('/admin/articles');
            setTimeout(() => {
              navigate('/admin/articles'); // Redirect after a short delay
            }, 1500);
        } catch (err) {
            console.error("Failed to update article:", err);
            setError('Failed to save article.');
            setIsSaving(false);
        }
    };

    // --- Cleanup editor (remains the same) ---
    useEffect(() => { return () => { editor?.destroy(); }; }, [editor]);


    // --- Render ---
    if (isLoading) { return <div className="admin-page-container"><Spinner size="large" /></div>; }
    if (error && !article) { return <div className="admin-page-container admin-error-message">{error} <RouterLink to="/admin/articles">Back to list</RouterLink></div>; }

    return (
        <div className="admin-page-container admin-edit-form">
            <h1 className="admin-page-title">Edit Article: {article?.title || '...'}</h1>
            {/* Render the static MenuBar ABOVE the editor content */}
            {editor && <MenuBar editor={editor} />}
            <form onSubmit={handleSubmit}>
                 {error && article && <p className="admin-error-message">{error}</p>}
                 {/* Input fields for title, slug, excerpt, etc. */}
                 {saveSuccessMessage && <p className="admin-success-message"><FaCheckCircle /> {saveSuccessMessage}</p>}
                 <Input label="Title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                 <Input label="Slug" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                 <Textarea label="Excerpt" id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />
                 <Input label="Author" id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                 <Input label="Featured Image URL" id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                 <div className="form-row">
                     <Input label="Publish Date" id="publishDate" type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
                     <Select
                        label="Status"
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        options={[ { value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' } ]}
                     />
                 </div>

                 {/* Tiptap Editor Content Area */}
                 <div className="form-group">
                    <label>Content {isUploading ? '(Uploading image...)' : ''}</label>
                    {/* REMOVED BubbleMenu component */}
                    {/* Render the editor area */}
                     <EditorContent editor={editor} className={`tiptap-editor-content ${isUploading ? 'is-uploading' : ''}`} />
                 </div>

                {/* Action Buttons */}
                <div className="form-actions">
                    <Button type="submit" variant="primary" disabled={isSaving || isUploading || !editor}>
                        {isSaving ? <Spinner size="small"/> : <FaSave />} Save Changes
                    </Button>
                     <Button type="button" variant="secondary" onClick={() => navigate('/admin/articles')} disabled={isSaving || isUploading}>
                       <FaTimes/> Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AdminArticleEdit;