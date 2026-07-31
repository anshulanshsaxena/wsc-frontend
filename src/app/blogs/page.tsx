'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import ConsentPopup from '@/components/modals/ConsentPopup';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const q = query(collection(db, 'blogs'), where('status', '==', 'Published'));
        const querySnapshot = await getDocs(q);

        let list: any[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Sort by publish_date (newest first)
        list.sort(
          (a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
        );

        // Filter out future publish dates
        const now = new Date();
        list = list.filter((blog) => new Date(blog.publish_date) <= now);

        setBlogs(list);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <div className="bg-gray-50 font-sans min-h-screen flex flex-col justify-between overflow-x-hidden text-gray-900">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-10 pt-[100px] md:pt-[120px]">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Latest Insights & Stories
          </h1>
          <p className="text-gray-500 text-lg">Discover trends, tips, and inspiration.</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-[#6B0D24]">
            <i className="ph-bold ph-spinner animate-spin text-4xl mb-2"></i>
            <p className="font-bold">Fetching latest articles...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && blogs.length === 0 && (
          <div className="text-center py-20 text-gray-400 font-bold text-xl">
            No published articles found yet. Check back soon!
          </div>
        )}

        {/* Blog Cards Grid */}
        {!loading && blogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => {
              const defaultImg =
                'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop';
              const dateObj = new Date(blog.publish_date);
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <Link
                  key={blog.id}
                  href={`/blogs/${blog.id}`}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
                >
                  <div className="h-56 overflow-hidden relative bg-gray-200 shrink-0">
                    <img
                      src={blog.thumbnail_url || defaultImg}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-gray-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {blog.reading_time || 3} min read
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                      {formattedDate}
                    </p>
                    <h3 className="text-xl font-black text-gray-900 mb-3 line-clamp-2 group-hover:text-[#6B0D24] transition">
                      {blog.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                      {blog.meta_description || 'Read more about this topic inside...'}
                    </p>

                    <div className="mt-auto flex items-center text-[#6B0D24] font-bold text-sm group-hover:gap-2 transition-all">
                      <span>Read Article</span>
                      <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* User Consent */}
      <ConsentPopup />
    </div>
  );
}