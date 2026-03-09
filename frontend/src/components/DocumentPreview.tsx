'use client';

import { useState, useEffect } from 'react';
import { File as FileIcon, Download, FileText, FileSpreadsheet, FileCode, Eye, Maximize2, Minimize2 } from 'lucide-react';

type DocumentPreviewProps = {
    url: string;
    contentType: string | null;
    fileName?: string;
};

// Maps MIME types and extensions to preview categories
function getPreviewCategory(contentType: string | null, url?: string): string {
    const ct = (contentType || '').toLowerCase();

    if (ct.startsWith('image/')) return 'image';
    if (ct.startsWith('video/')) return 'video';
    if (ct.startsWith('audio/')) return 'audio';
    if (ct === 'application/pdf') return 'pdf';

    // Text-based formats
    if (ct.startsWith('text/csv') || ct === 'text/tab-separated-values') return 'csv';
    if (
        ct.startsWith('text/') ||
        ct === 'application/json' ||
        ct === 'application/xml' ||
        ct === 'application/javascript' ||
        ct === 'application/x-javascript' ||
        ct === 'application/x-sh' ||
        ct === 'application/x-python' ||
        ct === 'application/typescript'
    ) return 'text';

    // Office/document formats — not natively previewable in browser
    if (
        ct === 'application/msword' ||
        ct === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        ct === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        ct === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        ct === 'application/vnd.ms-excel' ||
        ct === 'application/vnd.ms-powerpoint'
    ) return 'office';

    return 'generic';
}

// Format file size for display
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// Get a readable label for the content type
function getTypeLabel(contentType: string | null): string {
    const ct = (contentType || '').toLowerCase();
    const map: Record<string, string> = {
        'image/jpeg': 'JPEG Image',
        'image/png': 'PNG Image',
        'image/gif': 'GIF Image',
        'image/webp': 'WebP Image',
        'image/svg+xml': 'SVG Image',
        'image/bmp': 'BMP Image',
        'video/mp4': 'MP4 Video',
        'video/webm': 'WebM Video',
        'video/ogg': 'OGG Video',
        'video/quicktime': 'QuickTime Video',
        'audio/mpeg': 'MP3 Audio',
        'audio/wav': 'WAV Audio',
        'audio/ogg': 'OGG Audio',
        'audio/webm': 'WebM Audio',
        'audio/aac': 'AAC Audio',
        'application/pdf': 'PDF Document',
        'application/json': 'JSON File',
        'application/xml': 'XML File',
        'text/plain': 'Plain Text',
        'text/html': 'HTML Document',
        'text/css': 'CSS Stylesheet',
        'text/csv': 'CSV Spreadsheet',
        'text/javascript': 'JavaScript',
        'text/markdown': 'Markdown',
        'application/msword': 'Word Document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
        'application/vnd.ms-excel': 'Excel Spreadsheet',
        'application/vnd.ms-powerpoint': 'PowerPoint',
    };
    return map[ct] || contentType || 'Unknown Format';
}

// Icon component based on category
function PreviewIcon({ category, className }: { category: string; className?: string }) {
    switch (category) {
        case 'text':
            return <FileCode className={className} />;
        case 'csv':
            return <FileSpreadsheet className={className} />;
        case 'pdf':
        case 'office':
            return <FileText className={className} />;
        default:
            return <FileIcon className={className} />;
    }
}

// ─── Text / Code Preview ────────────────────────────────────
function TextPreview({ url }: { url: string }) {
    const [text, setText] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(url);
                const content = await res.text();
                setText(content);
            } catch {
                setError(true);
            }
        })();
    }, [url]);

    if (error) return <FallbackPreview url={url} label="Failed to load text content" />;

    if (text === null) {
        return (
            <div className="flex items-center justify-center h-full">
                <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    const lines = text.split('\n');
    const displayLines = isExpanded ? lines : lines.slice(0, 200);
    const truncated = !isExpanded && lines.length > 200;

    return (
        <div className="relative w-full h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-zinc-800 shrink-0">
                <span className="text-xs text-zinc-500">{lines.length} lines</span>
                {lines.length > 200 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                    >
                        {isExpanded ? <><Minimize2 className="w-3 h-3 mr-1" /> Show less</> : <><Maximize2 className="w-3 h-3 mr-1" /> Show all</>}
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-auto">
                <pre className="text-xs text-zinc-300 p-4 font-mono leading-relaxed">
                    <code>
                        {displayLines.map((line, i) => (
                            <div key={i} className="flex hover:bg-white/[0.02]">
                                <span className="select-none text-zinc-600 w-12 text-right pr-4 shrink-0">{i + 1}</span>
                                <span className="break-all whitespace-pre-wrap">{line}</span>
                            </div>
                        ))}
                        {truncated && (
                            <div className="text-center text-zinc-500 py-2 italic">
                                ... {lines.length - 200} more lines ...
                            </div>
                        )}
                    </code>
                </pre>
            </div>
        </div>
    );
}

// ─── CSV Preview ────────────────────────────────────────────
function CsvPreview({ url }: { url: string }) {
    const [rows, setRows] = useState<string[][] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(url);
                const text = await res.text();
                const parsed = text
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        // Simple CSV parsing (handles quoted fields)
                        const result: string[] = [];
                        let current = '';
                        let inQuotes = false;
                        for (const char of line) {
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                                result.push(current.trim());
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        result.push(current.trim());
                        return result;
                    });
                setRows(parsed);
            } catch {
                setError(true);
            }
        })();
    }, [url]);

    if (error) return <FallbackPreview url={url} label="Failed to parse CSV" />;

    if (!rows) {
        return (
            <div className="flex items-center justify-center h-full">
                <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    const headerRow = rows[0] || [];
    const dataRows = rows.slice(1);
    const displayRows = dataRows.slice(0, 500);

    return (
        <div className="w-full h-full overflow-auto">
            <div className="px-4 py-2 bg-black/60 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500">{dataRows.length} rows × {headerRow.length} columns</span>
            </div>
            <div className="overflow-auto">
                <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-zinc-800/80 backdrop-blur-sm">
                            <th className="px-3 py-2 text-left text-zinc-500 font-medium border-b border-zinc-700 w-12">#</th>
                            {headerRow.map((h, i) => (
                                <th key={i} className="px-3 py-2 text-left text-zinc-300 font-medium border-b border-zinc-700 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayRows.map((row, ri) => (
                            <tr key={ri} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-3 py-1.5 text-zinc-600 border-b border-zinc-800/50">{ri + 1}</td>
                                {row.map((cell, ci) => (
                                    <td key={ci} className="px-3 py-1.5 text-zinc-400 border-b border-zinc-800/50 whitespace-nowrap max-w-[200px] truncate" title={cell}>
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {dataRows.length > 500 && (
                    <div className="text-center text-zinc-500 py-3 text-xs italic">
                        Showing first 500 of {dataRows.length} rows
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Fallback / Download Preview ────────────────────────────
function FallbackPreview({ url, label, contentType }: { url: string; label?: string; contentType?: string | null }) {
    const category = getPreviewCategory(contentType ?? null);
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
                <PreviewIcon category={category} className="w-10 h-10 text-zinc-500" />
            </div>
            <div className="text-center space-y-1">
                <p className="text-sm text-zinc-400">{getTypeLabel(contentType ?? null)}</p>
                {label && <p className="text-xs text-zinc-600">{label}</p>}
            </div>
            <a
                href={url}
                download="evidence"
                className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
                <Download className="w-4 h-4 mr-2" /> Download File
            </a>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
                <Eye className="w-3 h-3 mr-1" /> Open in new tab
            </a>
        </div>
    );
}

// ─── Main DocumentPreview Component ─────────────────────────
export default function DocumentPreview({ url, contentType, fileName }: DocumentPreviewProps) {
    const category = getPreviewCategory(contentType, url);

    switch (category) {
        case 'image':
            return (
                <div className="w-full h-full flex items-center justify-center p-4">
                    <img
                        src={url}
                        alt={fileName || 'Evidence'}
                        className="max-w-full max-h-full object-contain rounded-sm"
                    />
                </div>
            );

        case 'video':
            return (
                <div className="w-full h-full flex items-center justify-center bg-black">
                    <video
                        src={url}
                        controls
                        className="max-w-full max-h-full"
                        playsInline
                    />
                </div>
            );

        case 'audio':
            return (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-purple-400" />
                        </div>
                    </div>
                    <audio src={url} controls className="w-full max-w-md" />
                    <p className="text-xs text-zinc-600">{getTypeLabel(contentType)}</p>
                </div>
            );

        case 'pdf':
            return (
                <div className="w-full h-full flex flex-col">
                    <object
                        data={url}
                        type="application/pdf"
                        className="w-full flex-1"
                    >
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                            <FileText className="w-12 h-12 text-zinc-600" />
                            <p className="text-sm text-zinc-400">PDF preview not supported in this browser</p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                            >
                                <Eye className="w-4 h-4 mr-2" /> Open PDF
                            </a>
                        </div>
                    </object>
                </div>
            );

        case 'text':
            return <TextPreview url={url} />;

        case 'csv':
            return <CsvPreview url={url} />;

        case 'office':
            return (
                <FallbackPreview
                    url={url}
                    label="Office documents cannot be previewed inline. Download or open in a new tab."
                    contentType={contentType}
                />
            );

        default:
            return (
                <FallbackPreview
                    url={url}
                    label="Preview not available for this format"
                    contentType={contentType}
                />
            );
    }
}
