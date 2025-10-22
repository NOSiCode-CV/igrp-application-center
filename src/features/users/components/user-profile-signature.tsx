// 'use client';

// import Image from 'next/image';
// import type React from 'react';
// import { useState, useEffect } from 'react';

// interface SignaturePadProps {
//   value?: File | string | null;
//   onChange?: (file: File | null) => void;
// }

// export function ProfileSignature({
//   value = null,
//   onChange = () => {}, // Default no-op function
// }: SignaturePadProps) {
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const [preview, setPreview] = useState<string | null>(null);

//   // Handle initial value
//   useEffect(() => {
//     if (!value) {
//       setPreview(null);
//       return;
//     }

//     // If value is already a string URL, use it directly
//     if (typeof value === 'string') {
//       setPreview(value);
//       return;
//     }

//     // Otherwise create an object URL from the File
//     try {
//       const objectUrl = URL.createObjectURL(value);
//       setPreview(objectUrl);

//       return () => {
//         // Only revoke if we created an object URL (not for string URLs)
//         if (typeof value !== 'string') {
//           URL.revokeObjectURL(objectUrl);
//         }
//       };
//     } catch (error) {
//       console.error('Error creating object URL:', error);
//       return;
//     }
//   }, [value]);

//   // Completely rewritten function to avoid instanceof issues
//   const createSafeObjectURL = (file: File): string | null => {
//     // First check if file exists
//     if (!file) {
//       return null;
//     }

//     // Check if it has the necessary properties of a File or Blob
//     if (typeof file !== 'object' || !('size' in file) || !('type' in file)) {
//       return null;
//     }

//     try {
//       return URL.createObjectURL(file);
//     } catch (error) {
//       console.error('Error creating object URL:', error);
//       return null;
//     }
//   };

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0] || null;

//     // Clean up previous preview URL
//     if (previewUrl && previewUrl.startsWith('blob:')) {
//       URL.revokeObjectURL(previewUrl);
//     }

//     if (file) {
//       const url = createSafeObjectURL(file);
//       setPreviewUrl(url);
//       // Ensure onChange is a function before calling it
//       if (typeof onChange === 'function') {
//         onChange(file);
//       }
//     } else {
//       setPreviewUrl(null);
//       // Ensure onChange is a function before calling it
//       if (typeof onChange === 'function') {
//         onChange(null);
//       }
//     }
//   };

//   // Clean up on unmount
//   useEffect(() => {
//     return () => {
//       if (previewUrl && previewUrl.startsWith('blob:')) {
//         URL.revokeObjectURL(previewUrl);
//       }
//     };
//   }, [previewUrl]);

//   return (
//     <div className='flex flex-col gap-2'>
//       <input
//         type='file'
//         accept='image/*'
//         onChange={handleFileChange}
//         className='hidden'
//         id='signature-upload'
//       />
//       <div className='flex items-center gap-4'>
//         {preview ? (
//           <div className='relative h-20 w-40 overflow-hidden rounded border'>
//             {/* <img src={preview || '/placeholder.svg'} alt='Signature preview' className='h-full w-full object-contain' /> */}
//             <Image
//               src={preview || '/placeholder.svg'}
//               alt='Signature preview'
//               className='h-full w-full object-contain'
//             />
//           </div>
//         ) : (
//           <div className='flex h-20 w-40 items-center justify-center rounded border bg-muted'>
//             <span className='text-sm text-muted-foreground'>No signature</span>
//           </div>
//         )}
//         <div className='flex flex-col gap-2'>
//           <label
//             htmlFor='signature-upload'
//             className='inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90'
//           >
//             Upload signature
//           </label>
//           {preview && (
//             <button
//               type='button'
//               onClick={() => {
//                 if (previewUrl && previewUrl.startsWith('blob:')) {
//                   URL.revokeObjectURL(previewUrl);
//                 }
//                 setPreviewUrl(null);
//                 // Ensure onChange is a function before calling it
//                 if (typeof onChange === 'function') {
//                   onChange(null);
//                 }
//               }}
//               className='inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground'
//             >
//               Remove
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
