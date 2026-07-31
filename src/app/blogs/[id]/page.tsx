'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import ConsentPopup from '@/components/modals/ConsentPopup';

export default function SingleArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const blogId = resolvedParams.id;

  const [blog, setBlog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!blogId) return;

    const fetchArticle = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'blogs', blogId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBlog(docSnap.data());
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [blogId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Article link copied to clipboard!');
    }
  };

  const formattedDate = blog?.publish_date
    ? new Date(blog.publish_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="bg-gray-50 text-gray-900 font-sans min-h-screen flex flex-col justify-between">
      {/* Navbar */}
      <Navbar />

      <nav className="bg-white border-b border-gray-200 py-4 px-6 sticky top-16 md:top-20 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/blogs"
            className="flex items-center gap-2 text-gray-600 font-bold hover:text-[#6B0D24] transition-colors text-sm"
          >
            <i className="ph-bold ph-arrow-left text-lg"></i> Back to Blogs
          </Link>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8 mt-4 md:mt-8 mb-20 bg-white md:rounded-3xl md:shadow-sm md:border border-gray-100">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-[#6B0D24]">
            <i className="ph-bold ph-spinner animate-spin text-4xl mb-2"></i>
            <p className="font-bold">Loading article...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Article Not Found</h2>
            <p className="text-gray-500 mb-6">The link might be broken or the article was removed.</p>
            <Link
              href="/blogs"
              className="bg-[#6B0D24] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#520a1a] transition inline-block text-sm"
            >
              Return to Blogs
            </Link>
          </div>
        )}

        {/* Article Body */}
        {!loading && !error && blog && (
          <article>
            {/* Header */}
            <header className="mb-10 text-center">
              <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                <span>{formattedDate}</span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                <span>{blog.reading_time || 3} MIN READ</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
                {blog.title}
              </h1>
            </header>

            {/* Thumbnail Image */}
            {blog.thumbnail_url && (
              <div className="w-full h-64 md:h-[400px] bg-gray-100 rounded-2xl md:rounded-3xl overflow-hidden mb-10 shadow-inner">
                <img
                  src={blog.thumbnail_url}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* AI Generated Article Content Container */}
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4
                         [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-black [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-4
                         [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-6 [&_h3]:mb-3
                         [&_p]:mb-6 [&_p]:text-base [&_p]:md:text-lg [&_p]:text-gray-600 [&_p]:leading-relaxed
                         [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6 [&_ul]:space-y-2
                         [&_blockquote]:border-l-4 [&_blockquote]:border-[#6B0D24] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:bg-[#FAF6F0] [&_blockquote]:p-4 [&_blockquote]:rounded-r-xl"
              dangerouslySetInnerHTML={{ __html: blog.content || '' }}
            />

            {/* Share Footer */}
            <div className="mt-16 pt-8 border-t border-gray-100 text-center">
              <p className="text-gray-500 font-bold mb-4">Enjoyed this article? Share it with your friends.</p>
              <button
                onClick={handleCopyLink}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 mx-auto text-sm"
              >
                <i className="ph-bold ph-link text-base"></i> Copy Article Link
              </button>
            </div>
          </article>
        )}
      </main>

      <ConsentPopup />
    </div>
  );
}