import { useRef, useState } from 'react';
import { FileText, X, Loader2 } from 'lucide-react';

const MAX_PDF_COUNT = 2;
const MAX_PDF_SIZE_MB = 10;

/**
 * PdfUploadButton
 *
 * A self-contained PDF upload button. It enforces client-side validation
 * (file type, size, count) before POSTing to /upload-pdf as multipart form data.
 *
 * Props:
 *   accessToken  {string}    - Bearer token for auth header
 *   uploadedPdfs {Array}     - Current list of uploaded PDF metadata objects
 *   onUploadSuccess {fn}     - Called with the server response on success
 *   onUploadError   {fn}     - Called with an error message string on failure
 *   disabled     {boolean}   - Disable the button (e.g. while backend is not ready)
 */
const PdfUploadButton = ({
  accessToken,
  uploadedPdfs = [],
  onUploadSuccess,
  onUploadError,
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const isAtLimit = uploadedPdfs.length >= MAX_PDF_COUNT;

  const handleClick = () => {
    if (isAtLimit || isUploading || disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be re-selected after removal
    e.target.value = '';
    if (!file) return;

    // --- Client-side validation ---
    if (file.type !== 'application/pdf') {
      onUploadError?.('Only PDF files are supported.');
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_PDF_SIZE_MB) {
      onUploadError?.(`"${file.name}" is ${sizeMB.toFixed(1)} MB — exceeds the ${MAX_PDF_SIZE_MB} MB limit.`);
      return;
    }

    if (uploadedPdfs.length >= MAX_PDF_COUNT) {
      onUploadError?.(`Maximum ${MAX_PDF_COUNT} PDFs allowed per session.`);
      return;
    }

    // --- Upload ---
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8000/upload-pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      onUploadSuccess?.(data);
    } catch (err) {
      onUploadError?.(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".pdf,application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        id="pdf-file-input"
      />
      <button
        type="button"
        id="pdf-upload-btn"
        onClick={handleClick}
        disabled={isAtLimit || isUploading || disabled}
        title={
          isAtLimit
            ? `Max ${MAX_PDF_COUNT} PDFs reached`
            : 'Upload a PDF document (max 10 MB)'
        }
        className={`
          flex items-center justify-center h-10 w-10 rounded bg-gray-800
          border border-gray-700 text-gray-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          transition-colors duration-150
          ${isAtLimit || isUploading || disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-gray-700 hover:text-indigo-400 cursor-pointer'}
        `}
        style={{ marginRight: '-0.5rem' }}
        tabIndex={-1}
        aria-label="Upload PDF document"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-5 h-5" />
        )}
      </button>
    </>
  );
};

/**
 * PdfChips — display uploaded PDF names as removable badges.
 *
 * Props:
 *   uploadedPdfs {Array}  - List of { filename, chunks } objects
 *   onRemoveAll  {fn}     - Called when the user removes all PDFs (triggers session reset)
 */
export const PdfChips = ({ uploadedPdfs = [], onRemoveAll }) => {
  if (uploadedPdfs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2 px-1">
      {uploadedPdfs.map((pdf, idx) => (
        <span
          key={idx}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-700 text-indigo-300 text-xs font-medium max-w-[180px]"
          title={pdf.filename}
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate">{pdf.filename}</span>
        </span>
      ))}
      <button
        type="button"
        onClick={onRemoveAll}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-700 border border-gray-600 text-gray-400 text-xs hover:text-red-400 hover:border-red-600 transition-colors"
        title="Clear all uploaded PDFs (resets session)"
        aria-label="Clear all uploaded PDFs"
      >
        <X className="w-3 h-3" />
        Clear PDFs
      </button>
    </div>
  );
};

export default PdfUploadButton;
