import { useEffect, useState, type RefObject } from "react";

import { flexRender, type Table } from "@tanstack/react-table";
import { TableBody } from "./table-body";

interface DataTableProps<T, S> {
  table: Table<T>;
  tableContainerRef: RefObject<HTMLDivElement>;
  sortable: S;
  title?: string;
  refetch: () => void;
}

export default function DataTable<T, S>({
  table,
  tableContainerRef,
  sortable,
  title,
  refetch,
}: DataTableProps<T, S>) {
  function formatTitle(title: string) {
    return title.toLowerCase().split(" ").join("-") || "";
  }

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (!title) return false;
    const titleFormatted = formatTitle(title);
    return localStorage.getItem(`${titleFormatted}-collapsed`) === "true";
  });

  useEffect(() => {
    if (!title) return;
    const titleFormatted = formatTitle(title);
    localStorage.setItem(`${titleFormatted}-collapsed`, collapsed.toString());
  }, [collapsed, title]);

  return (
    <>
      <div className="flex items-center justify-between">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        <button
          className="rounded-md bg-gray-200 w-16 py-1 text-sm text-gray-800 cursor-pointer active:scale-95"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      <div
        className={`w-full border border-gray-300 rounded-lg overflow-auto relative transition-all duration-300 ${
          collapsed ? "h-0" : "h-[42vh]"
        }`}
        ref={tableContainerRef}
      >
        <table className="grid">
          <thead className="sticky top-0 z-10 bg-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="text-sm flex items-stretch justify-between px-2 py-2"
              >
                {headerGroup.headers.map((header) => {
                  const isSortable = sortable[header.column.id as keyof S];
                  const sortState = header.column.getIsSorted();

                  // helper to get sort indicator
                  function getSortIndicator() {
                    if (!isSortable) return "";
                    if (sortState === "asc") return " 🔼";
                    if (sortState === "desc") return " 🔽";
                    return <span className="text-gray-500">🔼🔽</span>;
                  }

                  return (
                    <th key={header.id} className="w-full">
                      <button
                        type="button"
                        onClick={
                          isSortable
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        className="cursor-pointer select-none font-medium min-w-26 w-full text-left"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {getSortIndicator()}
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <TableBody<T>
            table={table}
            tableContainerRef={tableContainerRef}
            refetch={refetch}
          />
        </table>
      </div>
    </>
  );
}
