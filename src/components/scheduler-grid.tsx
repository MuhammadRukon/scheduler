import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type Table,
} from "@tanstack/react-table";

import {
  type VirtualItem,
  useVirtualizer,
  Virtualizer,
} from "@tanstack/react-virtual";
import { Division, type Course, type Teacher } from "../types/sheduler";

export function SchedulerGrid() {
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch("http://localhost:3000/courses");

        const data = await response.json();

        setCourses(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchCourses();
  }, []);

  const columns = useMemo<ColumnDef<Teacher>[]>(
    () => [
      {
        accessorFn: (row) => row.name,
        id: "name",
        header: () => <p>Teacher</p>,
      },
      {
        accessorFn: (row) => row.division,
        id: "division",
        header: () => <p>Division</p>,
      },
      {
        accessorFn: (row) =>
          row.otherRoles.length > 0 ? row.otherRoles.join(" + ") : "-",
        id: "otherRoles",
        header: () => <p>Other Roles</p>,
      },
      {
        accessorFn: (row) => row.maxLoad,
        id: "maxLoad",
        header: () => <p>Max Load</p>,
      },
      {
        accessorFn: (row) => {
          return (
            row.maxLoad -
            row.courses.reduce((acc, course) => acc + course.periods, 0)
          );
        },
        id: "availablePeriods",
        header: () => <p>Available Periods</p>,
      },
      {
        accessorFn: (row) => row.courses.length,
        id: "prep",
        header: () => <p>Preps</p>,
      },
      {
        id: "students",

        header: () => <p># of Students</p>,
        accessorFn: (row) => {
          if (!row.courses || row.courses.length === 0) return 0;
          let totalStudents = 0;
          //TODO: fix the calculation
          row.courses.forEach((course) => {
            if (course.students_per_section && course.periods_per_cycle) {
              totalStudents +=
                (course.periods / course.periods_per_cycle) *
                course.students_per_section;
            }
          });

          return totalStudents;
        },
      },
      ...courses.map((course) => ({
        accessorFn: (row: Teacher) => {
          return (
            row.courses.find((c: Course) => c.id === course.id)?.periods || 0
          );
        },
        id: course.id,
        header: () => <p>{course.name}</p>,
      })),
    ],
    [courses]
  );

  // The virtualizer will need a reference to the scrollable container element
  const tableMsContainerRef = useRef<HTMLDivElement>(null);
  const tableHsContainerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<Teacher[]>([]);

  type Sortable = {
    availablePeriods: boolean;
    preps: boolean;
    students: boolean;
    maxLoad: boolean;
    otherRoles: boolean;
    id: boolean;
    name: boolean;
    division: boolean;
  };

  const sortable: Sortable = {
    otherRoles: true,
    maxLoad: true,
    preps: true,
    availablePeriods: true,
    students: true,
    id: false,
    name: false,
    division: false,
  };

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const response = await fetch("http://localhost:3000/teachers");

        const data = await response.json();

        setData(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchTeachers();
  }, []);

  const msTeachers = useMemo(
    () => data.filter((t) => t.division === Division.MS || t.division === null),
    [data]
  );
  const hsTeachers = useMemo(
    () => data.filter((t) => t.division === Division.HS),
    [data]
  );

  const msTable = useReactTable({
    data: msTeachers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const hsTable = useReactTable({
    data: hsTeachers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  return (
    <div className="space-y-4">
      <div
        className="w-full border border-gray-300 rounded-lg overflow-auto relative h-[40vh]"
        ref={tableMsContainerRef}
      >
        <table className="grid">
          <thead className="sticky top-0 z-10 bg-gray-200">
            {msTable.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="px-3 py-3 font-semibold text-sm flex items-center gap-2"
              >
                {headerGroup.headers.map((header) => {
                  const isSortable =
                    sortable[header.column.id as keyof Sortable];
                  const sortState = header.column.getIsSorted();

                  // helper to get sort indicator
                  function getSortIndicator() {
                    if (!isSortable) return "";
                    if (sortState === "asc") return " 🔼";
                    if (sortState === "desc") return " 🔽";
                    return <span className="text-gray-500">🔼🔽</span>;
                  }

                  return (
                    <th key={header.id}>
                      <button
                        type="button"
                        onClick={
                          isSortable
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        className="cursor-pointer select-none min-w-20"
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
          <TableBody table={msTable} tableContainerRef={tableMsContainerRef} />
        </table>
      </div>

      <div
        className="w-full border border-gray-300 rounded-lg overflow-auto relative h-[40vh]"
        ref={tableHsContainerRef}
      >
        <table className="grid">
          <thead className="sticky top-0 z-10 bg-gray-200">
            {hsTable.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="px-3 py-3 font-semibold text-sm flex items-center gap-2"
              >
                {headerGroup.headers.map((header) => {
                  const isSortable =
                    sortable[header.column.id as keyof Sortable];
                  const sortState = header.column.getIsSorted();

                  // helper to get sort indicator
                  function getSortIndicator() {
                    if (!isSortable) return "";
                    if (sortState === "asc") return " 🔼";
                    if (sortState === "desc") return " 🔽";
                    return <span className="text-gray-500">🔼🔽</span>;
                  }

                  return (
                    <th key={header.id}>
                      <button
                        type="button"
                        onClick={
                          isSortable
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        className="cursor-pointer select-none min-w-20"
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
          <TableBody table={hsTable} tableContainerRef={tableHsContainerRef} />
        </table>
      </div>
    </div>
  );
}

interface TableBodyProps {
  table: Table<Teacher>;
  tableContainerRef: RefObject<HTMLDivElement | null>;
}

function TableBody({ table, tableContainerRef }: TableBodyProps) {
  const { rows } = table.getRowModel();

  // Important: Keep the row virtualizer in the lowest component possible to avoid unnecessary re-renders.
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return (
    <tbody
      style={{
        display: "grid",
        height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
        position: "relative", //needed for absolute positioning of rows
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<Teacher>;
        return (
          <TableBodyRow
            key={row.id}
            row={row}
            virtualRow={virtualRow}
            rowVirtualizer={rowVirtualizer}
          />
        );
      })}
    </tbody>
  );
}

interface TableBodyRowProps {
  row: Row<Teacher>;
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
}

function TableBodyRow({ row, virtualRow, rowVirtualizer }: TableBodyRowProps) {
  return (
    <tr
      data-index={virtualRow.index} //needed for dynamic row height measurement
      ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
      key={row.id}
      className="px-3 py-3  select-none text-sm flex items-center justify-between border-t border-gray-300 hover:bg-gray-50"
      style={{
        position: "absolute",
        transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
        width: "100%",
      }}
    >
      {row.getVisibleCells().map((cell) => {
        return (
          <td
            key={cell.id}
            className="text-center items-center justify-center flex"
            style={{ width: cell.column.getSize() }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
}
