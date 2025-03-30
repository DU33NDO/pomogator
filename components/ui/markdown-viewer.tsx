import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";

interface MarkdownViewerProps {
  content: string;
  className?: string;
  isTeacherFeedback?: boolean;
}

export function MarkdownViewer({ content, className, isTeacherFeedback = false }: MarkdownViewerProps) {
  // Special styling for feedback content
  const feedbackClassNames = isTeacherFeedback ? "feedback-content p-5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100" : "";
  
  return (
    <div className={cn("markdown-content", feedbackClassNames, className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />,
          h2: ({ ...props }) => {
            // Add special styling for feedback section headings
            if (isTeacherFeedback && typeof props.children === 'string') {
              const text = props.children.toString();
              
              if (text.includes('Strength') || text.includes('✅') || text.includes('⭐')) {
                return (
                  <h2 className="text-xl font-bold mt-5 mb-3 text-green-700 flex items-center gap-2 pb-2 border-b border-green-200">
                    <span className="bg-green-100 text-green-800 rounded-full h-7 w-7 flex items-center justify-center">✓</span>
                    {props.children}
                  </h2>
                );
              }
              
              if (text.includes('Improvement') || text.includes('Area') || text.includes('📝')) {
                return (
                  <h2 className="text-xl font-bold mt-5 mb-3 text-amber-700 flex items-center gap-2 pb-2 border-b border-amber-200">
                    <span className="bg-amber-100 text-amber-800 rounded-full h-7 w-7 flex items-center justify-center">↗</span>
                    {props.children}
                  </h2>
                );
              }
              
              if (text.includes('Summary') || text.includes('Conclusion')) {
                return (
                  <h2 className="text-xl font-bold mt-5 mb-3 text-blue-700 flex items-center gap-2 pb-2 border-b border-blue-200">
                    <span className="bg-blue-100 text-blue-800 rounded-full h-7 w-7 flex items-center justify-center">✦</span>
                    {props.children}
                  </h2>
                );
              }
              
              if (text.includes('Checklist') || text.includes('Criteria')) {
                return (
                  <h2 className="text-xl font-bold mt-5 mb-3 text-purple-700 flex items-center gap-2 pb-2 border-b border-purple-200">
                    <span className="bg-purple-100 text-purple-800 rounded-full h-7 w-7 flex items-center justify-center">☑</span>
                    {props.children}
                  </h2>
                );
              }
            }
            
            return <h2 className="text-xl font-bold mt-5 mb-2" {...props} />;
          },
          h3: ({ ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
          h4: ({ ...props }) => <h4 className="text-base font-semibold mt-3 mb-1" {...props} />,
          p: ({ ...props }) => <p className="mb-4" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
          li: ({ ...props }) => {
            // Add special highlighting for important points in feedback
            if (isTeacherFeedback && typeof props.children === 'string') {
              const text = props.children.toString();
              
              if (text.includes('excellent') || text.includes('great') || text.includes('well done')) {
                return <li className="mb-1 pl-2 border-l-4 border-green-300 bg-green-50 py-1 rounded-r" {...props} />;
              }
              
              if (text.includes('improve') || text.includes('consider') || text.includes('better')) {
                return <li className="mb-1 pl-2 border-l-4 border-amber-300 bg-amber-50 py-1 rounded-r" {...props} />;
              }
            }
            
            return <li className="mb-1" {...props} />;
          },
          a: ({ ...props }) => (
            <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-4 text-gray-700 italic" {...props} />
          ),
          code: ({ inline, ...props }) =>
            inline ? (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
            ) : (
              <code className="block bg-gray-100 p-3 rounded-md text-sm font-mono overflow-x-auto mb-4" {...props} />
            ),
          hr: ({ ...props }) => <hr className="my-6 border-gray-300" {...props} />,
          img: ({ ...props }) => <img className="max-w-full h-auto my-4 rounded" {...props} />,
          table: ({ ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-300" {...props} />
            </div>
          ),
          thead: ({ ...props }) => <thead className="bg-gray-100" {...props} />,
          tbody: ({ ...props }) => <tbody className="divide-y divide-gray-300" {...props} />,
          tr: ({ ...props }) => <tr className="hover:bg-gray-50" {...props} />,
          th: ({ ...props }) => (
            <th className="border border-gray-300 px-4 py-2 text-left font-medium" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="border border-gray-300 px-4 py-2" {...props} />
          ),
          strong: ({ ...props }) => {
            // Add special styling for score highlights in feedback
            if (isTeacherFeedback && typeof props.children === 'string') {
              const text = props.children.toString();
              
              if (text.includes('Score')) {
                return <strong className="font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded" {...props} />;
              }
            }
            
            return <strong className="font-bold text-gray-900" {...props} />;
          },
          em: ({ ...props }) => <em className="italic" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 