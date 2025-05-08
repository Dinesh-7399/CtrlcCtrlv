 // client/src/components/common/NotesSection.jsx
 import React, { useState, useEffect, useCallback } from 'react';
 import './NotesSection.css'; // We will create this CSS file
 import { FaRegSave, FaSpinner } from 'react-icons/fa'; // Icons

 // Simple debounce function
 function debounce(func, wait) {
   let timeout;
   return function executedFunction(...args) {
     const later = () => {
       clearTimeout(timeout);
       func(...args);
     };
     clearTimeout(timeout);
     timeout = setTimeout(later, wait);
   };
 }

 const NotesSection = ({ courseId, lessonId }) => {
   const [notes, setNotes] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const localStorageKey = `notes-${courseId}-${lessonId}`;

   // Load notes from localStorage when component mounts or IDs change
   useEffect(() => {
     setIsLoading(true);
     console.log(`Loading notes for key: ${localStorageKey}`);
     try {
       const savedNotes = localStorage.getItem(localStorageKey);
       setNotes(savedNotes || ''); // Set to saved notes or empty string
     } catch (error) {
       console.error("Failed to load notes from localStorage:", error);
       setNotes(''); // Default to empty on error
     } finally {
        // Simulate slight delay for loading feel if needed, otherwise immediate
        // setTimeout(() => setIsLoading(false), 100);
        setIsLoading(false);
     }
   }, [localStorageKey]); // Rerun only if the key changes

   // Debounced save function
   const saveNotesToLocalStorage = useCallback(
     debounce((key, value) => {
       try {
         console.log(`Saving notes for key: ${key}`);
         localStorage.setItem(key, value);
         setIsSaving(false); // Indicate saving finished
       } catch (error) {
         console.error("Failed to save notes to localStorage:", error);
         setIsSaving(false); // Still finish saving state on error
         // Optionally show an error message to the user
       }
     }, 1000), // Save 1 second after user stops typing
     [] // useCallback dependency array is empty as debounce returns a stable function
   );

   // Handle changes in the textarea
   const handleNotesChange = (e) => {
     const newNotes = e.target.value;
     setNotes(newNotes);
     setIsSaving(true); // Indicate that we are planning to save
     saveNotesToLocalStorage(localStorageKey, newNotes);
   };

   return (
     <section className="notes-section-container course-section"> {/* Reuse course-section margin */}
       <h2 className="section-title notes-title">My Notes</h2>
       {isLoading ? (
         <div className="notes-loading">Loading notes...</div>
       ) : (
         <div className="notes-content">
           <textarea
             className="notes-textarea"
             placeholder="Take notes for this lesson here... Your notes are saved automatically in this browser."
             value={notes}
             onChange={handleNotesChange}
             rows={10} // Adjust initial height as needed
           />
           <div className={`notes-status ${isSaving ? 'saving' : 'saved'}`}>
             {isSaving ? (
                 <> <FaSpinner className="saving-icon" /> Saving...</>
             ) : (
                 <> <FaRegSave /> Notes saved locally</>
             )}
           </div>
         </div>
       )}
     </section>
   );
 };

 export default NotesSection;
 