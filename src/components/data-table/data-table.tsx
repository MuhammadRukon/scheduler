import { useEffect, useState } from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { Teacher } from "../../types/sheduler";
import type { CustomColumnMeta } from "../scheduler-grid";
import type {
  DataTableProps,
  HeaderProps,
  TableBodyProps,
  TableBodyRowProps,
  DragData,
} from "./data-table.types";

import { formatText } from "../../utils";

export function DataTable<T, S>({
  table,
  tableContainerRef,
  sortable,
  title,
  refetch,
}: DataTableProps<T, S>) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (!title) return false;
    const titleFormatted = formatText(title);
    return localStorage.getItem(`${titleFormatted}-collapsed`) === "true";
  });

  useEffect(() => {
    if (!title) return;
    const titleFormatted = formatText(title);
    localStorage.setItem(`${titleFormatted}-collapsed`, collapsed.toString());
  }, [collapsed, title]);

  const headerGroups = table.getHeaderGroups();

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
          <DataTable.Header<T, S>
            headerGroups={headerGroups}
            sortable={sortable}
          />
          <DataTable.Body<T>
            table={table}
            tableContainerRef={tableContainerRef}
            refetch={refetch}
          />
        </table>
      </div>
    </>
  );
}

DataTable.Header = function Header<T, S>({
  headerGroups,
  sortable,
}: HeaderProps<T, S>) {
  return (
    <thead className="sticky top-0 z-10 bg-gray-200">
      {headerGroups.map((headerGroup) => (
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
  );
};

DataTable.Body = function TableBody<T>({
  table,
  tableContainerRef,
  refetch,
}: TableBodyProps<T>) {
  const { rows } = table.getRowModel();

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

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <tbody
      style={{
        display: "grid",
        height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
        position: "relative", //needed for absolute positioning of rows
      }}
    >
      {virtualItems.map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<T>;
        return (
          <DataTable.Row<T>
            key={row.id}
            row={row}
            virtualRow={virtualRow}
            rowVirtualizer={rowVirtualizer}
            refetch={refetch}
          />
        );
      })}
    </tbody>
  );
};

DataTable.Row = function TableRow<T>({
  row,
  virtualRow,
  rowVirtualizer,
  refetch,
}: TableBodyRowProps<T>) {
  const handleDragStart = (e: React.DragEvent, courseId: string) => {
    const data: DragData = { source: row.original as Teacher, courseId };
    e.dataTransfer.setData("text/plain", JSON.stringify(data));
  };

  const handleDrop = (e: React.DragEvent, courseId: string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain")) as DragData;

    if (data.courseId !== courseId) return alert("Invalid column"); // block horizontal drop

    const updatedCoursesForSource = (data.source as Teacher).courses.filter(
      (c) => c.id !== courseId
    );
    const assignableCourse = (data.source as Teacher).courses.filter(
      (c) => c.id == courseId
    );

    // update target teacher courses
    const targetTeacher = row.original as Teacher;
    targetTeacher.courses = [...targetTeacher.courses, ...assignableCourse];

    // update source teacher courses
    const sourceTeacher = data.source as Teacher;
    sourceTeacher.courses = updatedCoursesForSource;

    //This function does PUT request on teacher/:id to update teacher courses. in real life, this
    async function assignCourse() {
      try {
        const teacherRes = await fetch(
          `http://localhost:3000/teachers/${sourceTeacher.id}`,
          {
            method: "PUT",
            body: JSON.stringify(sourceTeacher),
          }
        );

        await teacherRes.json();

        const targetTeacherRes = await fetch(
          `http://localhost:3000/teachers/${targetTeacher.id}`,
          {
            method: "PUT",
            body: JSON.stringify(targetTeacher),
          }
        );

        await targetTeacherRes.json();

        refetch();
      } catch (error) {
        console.error(error);
        alert("Failed to assign course");
      }
    }

    assignCourse();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };
  return (
    <tr
      data-index={virtualRow.index} //needed for dynamic row height measurement
      ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
      key={row.id}
      className="select-none text-sm flex items-stretch justify-between border-t border-gray-300"
      style={{
        position: "absolute",
        transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
        width: "100%",
      }}
    >
      {row.getVisibleCells().map((cell) => {
        const isCourseColumn = Boolean(
          (cell.column.columnDef.meta as CustomColumnMeta)?.group
        );
        const cellValue = cell.getContext().getValue();

        return (
          <td
            key={cell.id}
            draggable={isCourseColumn && cellValue !== 0}
            onDragStart={(e) =>
              isCourseColumn &&
              cellValue !== 0 &&
              handleDragStart(e, cell.column.id)
            }
            onDragOver={(e) => isCourseColumn && handleDragOver(e)}
            onDrop={(e) => isCourseColumn && handleDrop(e, cell.column.id)}
            className="px-2 py-2 flex items-center w-full"
            style={{
              backgroundColor:
                (cell.column.columnDef.meta as CustomColumnMeta)?.color ??
                "transparent",
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
};
