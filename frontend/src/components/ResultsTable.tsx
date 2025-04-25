import { Business } from '@/lib/types';

interface ResultsTableProps {
  businesses: Business[];
}

export default function ResultsTable({ businesses }: ResultsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-left">Address</th>
            <th className="py-2 px-4 text-left">Phone</th>
            <th className="py-2 px-4 text-left">Website</th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => (
            <tr key={business.place_id} className="border-t">
              <td className="py-2 px-4">{business.name}</td>
              <td className="py-2 px-4">{business.address}</td>
              <td className="py-2 px-4">{business.phone}</td>
              <td className="py-2 px-4">
                {business.website ? (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Visit Website
                  </a>
                ) : (
                  'N/A'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
