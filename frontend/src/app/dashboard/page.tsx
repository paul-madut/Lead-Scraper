import { Globe, Phone, Info } from "lucide-react";

export default function page() {
  const businesses = [
    {
      id: 1,
      name: "Abbot Roofing Inc",
      type: "Roofing contractor",
      reviews: 1,
      address: "199 Kent St",
      city: "Ottawa"
    },
    {
      id: 2,
      name: "Bellissimo Roofing & Exteriors",
      type: "Roofing contractor",
      reviews: 34,
      address: "1919 St. Laurent Blvd #803",
      city: "Ottawa"
    },
    {
      id: 3,
      name: "London Eco-Metal Manufacturing",
      type: "Roofing contractor",
      reviews: 1,
      address: "",
      city: ""
    },
    {
      id: 4,
      name: "1-800-NEW-ROOF Ottawa",
      type: "Roofing contractor",
      reviews: 13,
      address: "Suite 208, 1355 Wellington St. W",
      city: "Ottawa"
    },
    {
      id: 5,
      name: "Carbonneau Roofing",
      type: "Roofing contractor",
      reviews: 2,
      address: "256 Montfort St",
      city: "Vanier"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      
      <p className="text-lg mb-8">
        40 businesses found, 5 without a website and 1 may use a third-party platform instead of a dedicated site.
      </p>
      
      <div className="flex gap-2 mb-8">
        <button className="px-4 py-2 bg-white rounded-full shadow-md font-medium">
          Without website
        </button>
        <button className="px-4 py-2 bg-gray-100 rounded-full font-medium">
          Show all
        </button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium">
          Options
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-12 border-b pb-3 mb-2 font-medium text-gray-500">
          <div className="col-span-4">NAME</div>
          <div className="col-span-3 text-center">TOTAL REVIEWS</div>
          <div className="col-span-3">ADDRESS</div>
          <div className="col-span-2 text-right">ACTIONS</div>
        </div>
        
        {businesses.map((business) => (
          <div key={business.id} className="grid grid-cols-12 items-center py-4 border-b">
            <div className="col-span-4 flex items-center">
              <div className="w-12 h-12 rounded-md bg-gray-200 mr-3 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gray-300"></div>
              </div>
              <div>
                <div className="font-medium">{business.name}</div>
                <div className="text-gray-400 text-sm">{business.type}</div>
              </div>
            </div>
            
            <div className="col-span-3 flex justify-center items-center">
              <button className="mr-3 text-blue-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14L21 3"></path>
                </svg>
              </button>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                business.reviews > 10 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {business.reviews}
              </div>
            </div>
            
            <div className="col-span-3">
              {business.address && (
                <div>
                  <div>{business.address}</div>
                  <div className="text-gray-400">{business.city}</div>
                </div>
              )}
            </div>
            
            <div className="col-span-2 flex justify-end gap-1">
              <button className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                <Globe size={18} />
              </button>
              <button className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                <Phone size={18} />
              </button>
              <button className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                <Info size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-6 gap-2">
        <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          &lt;
        </button>
        <button className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center">
          1
        </button>
        <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          &gt;
        </button>
      </div>
    </div>
  );
}