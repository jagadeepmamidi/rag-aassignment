import React, { useRef, useState, DragEvent } from 'react';

interface FileUploadProps {
  resumeFile: File | null;
  jdFile: File | null;
  onResumeChange: (file: File) => void;
  onJdChange: (file: File) => void;
  onAnalyze: () => void;
  loading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  resumeFile, jdFile, onResumeChange, onJdChange, onAnalyze, loading,
}) => {
  const resumeRef = useRef<HTMLInputElement>(null);
  const jdRef = useRef<HTMLInputElement>(null);
  const [draggingResume, setDraggingResume] = useState(false);
  const [draggingJd, setDraggingJd] = useState(false);

  const handleDrop = (e: DragEvent, setter: (f: File) => void, setDrag: (b: boolean) => void) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.pdf') || file.name.endsWith('.txt'))) {
      setter(file);
    }
  };

  const prevent = (e: DragEvent) => e.preventDefault();

  return (
    <>
      <div className="upload-section">
        <div
          className={`upload-box ${resumeFile ? 'has-file' : ''} ${draggingResume ? 'dragging' : ''}`}
          onClick={() => resumeRef.current?.click()}
          onDragOver={prevent}
          onDragEnter={() => setDraggingResume(true)}
          onDragLeave={() => setDraggingResume(false)}
          onDrop={(e) => handleDrop(e, onResumeChange, setDraggingResume)}
        >
          <span className="upload-icon">{resumeFile ? '✅' : '📄'}</span>
          <div className="upload-label">Upload Resume</div>
          <div className="upload-hint">PDF or TXT • Drag & drop or click</div>
          {resumeFile && <div className="upload-filename">{resumeFile.name}</div>}
          <input
            ref={resumeRef}
            type="file"
            accept=".pdf,.txt"
            className="upload-input"
            onChange={(e) => e.target.files?.[0] && onResumeChange(e.target.files[0])}
          />
        </div>

        <div
          className={`upload-box ${jdFile ? 'has-file' : ''} ${draggingJd ? 'dragging' : ''}`}
          onClick={() => jdRef.current?.click()}
          onDragOver={prevent}
          onDragEnter={() => setDraggingJd(true)}
          onDragLeave={() => setDraggingJd(false)}
          onDrop={(e) => handleDrop(e, onJdChange, setDraggingJd)}
        >
          <span className="upload-icon">{jdFile ? '✅' : '💼'}</span>
          <div className="upload-label">Upload Job Description</div>
          <div className="upload-hint">PDF or TXT • Drag & drop or click</div>
          {jdFile && <div className="upload-filename">{jdFile.name}</div>}
          <input
            ref={jdRef}
            type="file"
            accept=".pdf,.txt"
            className="upload-input"
            onChange={(e) => e.target.files?.[0] && onJdChange(e.target.files[0])}
          />
        </div>
      </div>

      <button
        className="analyze-btn"
        onClick={onAnalyze}
        disabled={!resumeFile || !jdFile || loading}
      >
        {loading ? 'Analyzing...' : '🔍 Analyze Match'}
      </button>
    </>
  );
};

export default FileUpload;
