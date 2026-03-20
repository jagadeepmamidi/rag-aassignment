import { useRef } from 'react';

interface FileUploadProps {
  onAnalyze: (resume: File, jobDescription: File) => void;
  isLoading: boolean;
  resumeFile: File | null;
  jdFile: File | null;
  setResumeFile: (f: File | null) => void;
  setJdFile: (f: File | null) => void;
}

export default function FileUpload({ onAnalyze, isLoading, resumeFile, jdFile, setResumeFile, setJdFile }: FileUploadProps) {
  const resumeRef = useRef<HTMLInputElement>(null);
  const jdRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent, setter: (f: File) => void) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setter(file);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div>
      <div className="upload-section">
        {/* Resume Upload */}
        <div
          className={`upload-card ${resumeFile ? 'has-file' : ''}`}
          onClick={() => resumeRef.current?.click()}
          onDrop={(e) => handleDrop(e, setResumeFile)}
          onDragOver={handleDragOver}
        >
          <input
            ref={resumeRef}
            type="file"
            accept=".pdf,.txt"
            hidden
            onChange={(e) => e.target.files?.[0] && setResumeFile(e.target.files[0])}
          />
          <div className="upload-card-icon">
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h3>Upload Resume</h3>
          <p>Drag & drop or click to browse</p>
          <span className="file-formats">PDF, TXT</span>
          {resumeFile && (
            <div className="file-name">
              <span className="check">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              {resumeFile.name}
            </div>
          )}
        </div>

        {/* JD Upload */}
        <div
          className={`upload-card ${jdFile ? 'has-file' : ''}`}
          onClick={() => jdRef.current?.click()}
          onDrop={(e) => handleDrop(e, setJdFile)}
          onDragOver={handleDragOver}
        >
          <input
            ref={jdRef}
            type="file"
            accept=".pdf,.txt"
            hidden
            onChange={(e) => e.target.files?.[0] && setJdFile(e.target.files[0])}
          />
          <div className="upload-card-icon">
            <svg viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h3>Upload Job Description</h3>
          <p>Drag & drop or click to browse</p>
          <span className="file-formats">PDF, TXT</span>
          {jdFile && (
            <div className="file-name">
              <span className="check">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              {jdFile.name}
            </div>
          )}
        </div>
      </div>

      <button
        className={`analyze-btn ${isLoading ? 'loading' : ''}`}
        onClick={() => resumeFile && jdFile && onAnalyze(resumeFile, jdFile)}
        disabled={!resumeFile || !jdFile || isLoading}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Match'}
      </button>
    </div>
  );
}
