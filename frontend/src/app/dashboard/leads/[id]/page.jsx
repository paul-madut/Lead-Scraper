// pages/blog/[id].js
"use client";
import {usePathname} from 'next/navigation';
import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function BlogPost() {

  const path = usePathname();
  const  id  = path.split("/").pop(); // This will be MxKFEZnyAytOL3SVTWrS from the URL
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getQuery() {
      if (!id) return; // Wait until we have the ID from the router
      console.log(id)
      console.log("attempt")
      
      try {
        // Here you use the document ID to fetch the specific document
        const docRef = doc(db, "searchQueries", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setQuery({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
          
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    }
    
    getQuery();
  }, [id, path]);


  if (!query) return <div>Post not found {id}</div>;

  const website_counter = query.results.reduce((count, business) => {
    if (business.website) {
      return count + 1;
    }
    return count;
  }, 0);

  return (
    
      <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      
      <p className="text-lg mb-8">
        {query.results.length} businesses found, {website_counter} without a website 
      </p>
      
      <div className="flex gap-2 mb-8">
        <button className="px-4 py-2 hover:bg-blue-500 hover:text-white bg-white rounded-full shadow-md font-medium">
          Without website
        </button>
        <button className="px-4 py-2 hover:bg-blue-500 hover:text-white bg-gray-100 rounded-full font-medium">
          Show all
        </button>
        <button className="px-4 py-2 hover:bg-gray-400 bg-blue-500 text-white rounded-full font-medium">
          Options
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-16 border-b pb-3 mb-2 font-medium text-gray-500">
          <div className="col-span-4">NAME</div>
          <div className="col-span-2"></div>
          <div className="col-span-3 text-center">TOTAL REVIEWS</div>
          <div className="col-span-3">ADDRESS</div>
          <div className="col-span-2 text-center">Website?</div>
          <div className="col-span-2">Phone</div>
        </div>

        {query.results.map((business) => (
          <div key={business.id} className="grid grid-cols-16 border-b py-3">
            <div className="col-span-2">
              <image
                src={`https://maps.googleapis.com/maps/api/place/photo
                  ?maxwidth=400
                  &photo_reference=${business.image_url}
                  &key=AIzaSyBZ4E0xOyqYBw5oTtD7c9t4hI3tW0vT6ZI`}
                alt={business.name}
                className="w-12 h-12 rounded-full"
                width={50}
                height={50}
              />
            </div>
            <div className="col-span-4">{business.name}</div>
            <div className="col-span-3 text-center">{business.total_reviews}</div>
            <div className="col-span-3">{business.address}</div>
            <div className="col-span-2 text-center">
            {business.website ? (
    <a 
      href={business.website} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex text-blue-600 hover:text-blue-800 transition-colors duration-200"
      title={business.website}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className="w-6 h-6"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" 
        />
      </svg>
    </a>
  ) : (
    <span className="text-gray-400" title="No website available">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className="w-6 h-6"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
    </span>
  )}

            </div>
            <div className="col-span-2">{business.phone}</div>
          </div>
        ))}

        


      </div>

    </div>
  );
}