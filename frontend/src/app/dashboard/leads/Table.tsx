"use client"
 
import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, ExternalLink, Phone, MapPin, Download, FileSpreadsheet } from "lucide-react"
 
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type Business = {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  maps_url?: string;
  place_id: string;
  rating?: number;
  total_reviews?: number;
  photo_reference?: string;
  business_status?: string;
}

interface DataTableProps {
  data: Business[];
}

export const columns: ColumnDef<Business>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Business Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const business = row.original;
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {business.photo_reference ? (
              <img
                src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${business.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                alt={business.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-xs">No Image</span>
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{business.name}</div>
            {business.rating && (
              <div className="text-sm text-gray-500">
                ⭐ {business.rating}/5 ({business.total_reviews || 0} reviews)
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Address
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const address = row.getValue("address") as string;
      return (
        <div className="max-w-xs">
          <div className="truncate" title={address}>
            {address}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return phone ? (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span>{phone}</span>
        </div>
      ) : (
        <span className="text-gray-400">No phone</span>
      );
    },
  },
  {
    accessorKey: "website",
    header: "Website",
    cell: ({ row }) => {
      const website = row.getValue("website") as string | undefined
      return website ? (
        <a 
          href={website} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors" 
          target="_blank" 
          rel="noopener noreferrer"
          title={website}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Visit Website
        </a>
      ) : (
        <span className="inline-flex items-center text-red-500 font-medium">
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          No website
        </span>
      )
    },
    filterFn: (row, id, value) => {
      const website = row.getValue(id) as string | undefined;
      if (value === "no-website") {
        return !website;
      }
      if (value === "has-website") {
        return !!website;
      }
      return true;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const business = row.original
   
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(business.place_id)}
            >
              Copy business ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {business.phone && (
              <DropdownMenuItem
                onClick={() => window.open(`tel:${business.phone}`, "_self")}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call Business
              </DropdownMenuItem>
            )}
            {business.website && (
              <DropdownMenuItem
                onClick={() => window.open(business.website, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Website
              </DropdownMenuItem>
            )}
            {business.maps_url && (
              <DropdownMenuItem
                onClick={() => window.open(business.maps_url, "_blank")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                View on Maps
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
   
// Export utility functions
const exportToCSV = (data: Business[], filename: string = 'leads-export.csv') => {
  const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Rating', 'Total Reviews', 'Status'];
  const csvContent = [
    headers.join(','),
    ...data.map(business => [
      `"${business.name.replace(/"/g, '""')}"`,
      `"${business.address.replace(/"/g, '""')}"`,
      `"${business.phone || 'N/A'}"`,
      `"${business.website || 'No Website'}"`,
      business.rating || 'N/A',
      business.total_reviews || 0,
      business.business_status || 'Unknown'
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportToExcel = (data: Business[], filename: string = 'leads-export.xlsx') => {
  // Create a simplified Excel-compatible CSV format
  const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Rating', 'Total Reviews', 'Status', 'Lead Potential'];
  const csvContent = [
    headers.join('\t'), // Use tab separation for Excel
    ...data.map(business => [
      business.name,
      business.address,
      business.phone || 'N/A',
      business.website || 'No Website',
      business.rating || 'N/A',
      business.total_reviews || 0,
      business.business_status || 'Unknown',
      business.website ? 'Low' : 'High'
    ].join('\t'))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function DataTable({ data }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
   
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const businessesWithoutWebsite = data.filter(business => !business.website).length;
  const businessesWithPhone = data.filter(business => business.phone).length;
      
  return (
    <div className="w-full">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{data.length}</div>
          <div className="text-sm text-gray-600">Total Businesses</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-500">{businessesWithoutWebsite}</div>
          <div className="text-sm text-gray-600">No Website</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{businessesWithPhone}</div>
          <div className="text-sm text-gray-600">With Phone</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {data.length > 0 ? Math.round((businessesWithoutWebsite / data.length) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600">Potential Leads</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Filter by business name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          
          {/* Website Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Website Filter <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => table.getColumn("website")?.setFilterValue(undefined)}
              >
                All Businesses
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => table.getColumn("website")?.setFilterValue("no-website")}
              >
                Without Website ({businessesWithoutWebsite})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => table.getColumn("website")?.setFilterValue("has-website")}
              >
                With Website ({data.length - businessesWithoutWebsite})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center space-x-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export All Data</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => exportToCSV(table.getFilteredRowModel().rows.map(row => row.original), 'all-leads.csv')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToExcel(table.getFilteredRowModel().rows.map(row => row.original), 'all-leads.xlsx')}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export Filtered Data</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  const filteredData = table.getFilteredRowModel().rows.map(row => row.original);
                  const leadsOnly = filteredData.filter(business => !business.website);
                  exportToCSV(leadsOnly, 'potential-leads-only.csv');
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Potential Leads Only
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const filteredData = table.getFilteredRowModel().rows.map(row => row.original);
                  const withPhone = filteredData.filter(business => business.phone);
                  exportToCSV(withPhone, 'businesses-with-phone.csv');
                }}
              >
                <Phone className="mr-2 h-4 w-4" />
                Export With Phone Numbers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination and Selection Info */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Export Selected */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">
                {table.getFilteredSelectedRowModel().rows.length} businesses selected
              </h4>
              <p className="text-sm text-blue-700">
                Export selected leads or take bulk actions
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedData = table.getFilteredSelectedRowModel().rows.map(row => row.original);
                  const csvContent = [
                    ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews'].join(','),
                    ...selectedData.map(business => [
                      `"${business.name}"`,
                      `"${business.address}"`,
                      `"${business.phone || ''}"`,
                      `"${business.website || ''}"`,
                      business.rating || '',
                      business.total_reviews || ''
                    ].join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'selected-leads.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedBusinesses = table.getFilteredSelectedRowModel().rows.map(row => row.original);
                  const businessesWithoutWebsite = selectedBusinesses.filter(b => !b.website);
                  alert(`Selected: ${selectedBusinesses.length} businesses\nPotential leads (no website): ${businessesWithoutWebsite.length}`);
                }}
              >
                Analyze Selection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}