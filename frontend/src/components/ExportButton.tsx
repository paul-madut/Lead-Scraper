import { Business } from '@/lib/types';

interface ExportButtonProps {
  data: Business[];
}

export default function ExportButton({ data }: ExportButtonProps) {
  const exportToCSV = () => {
    const headers = ['Name', 'Address', 'Phone', 'Website', 'Maps URL'];
    const csvRows = [
      headers.join(','),
      ...data.map(business => [
        `"${business.name.replace(/"/g, '""')}"`,
        `"${business.address.replace(/"/g, '""')}"`,
        `"${business.phone.replace(/"/g, '""')}"`,
        `"${business.website || ''}"`,
        `"${business.maps_url || ''}"`
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `business_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToCSV}
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    >
      Export to CSV
    </button>
  );
}