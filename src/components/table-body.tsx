import { flexRender, type Row, type Table } from "@tanstack/react-table";
import {
  useVirtualizer,
  Virtualizer,
  type VirtualItem,
} from "@tanstack/react-virtual";
import type { RefObject } from "react";
import type { CustomColumnMeta } from "./scheduler-grid";
import type { Teacher } from "../types/sheduler";

interface TableBodyProps<T> {
  table: Table<T>;
  tableContainerRef: RefObject<HTMLDivElement | null>;
  refetch: () => void;
}

export const TableBody = <T,>({
  table,
  tableContainerRef,
  refetch,
}: TableBodyProps<T>) => {
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
        const row = rows[virtualRow.index] as Row<T>;
        return (
          <TableBodyRow<T>
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

interface TableBodyRowProps<T> {
  row: Row<T>;
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  refetch: () => void;
}

interface DragData {
  source: Teacher;
  courseId: string;
}

function TableBodyRow<T>({
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const updatedSourceTeacher = await teacherRes.json();
        // console.log(updatedSourceTeacher);

        const targetTeacherRes = await fetch(
          `http://localhost:3000/teachers/${targetTeacher.id}`,
          {
            method: "PUT",
            body: JSON.stringify(targetTeacher),
          }
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const updatedTargetTeacher = await targetTeacherRes.json();
        // console.log(updatedTargetTeacher);

        refetch();
      } catch (error) {
        console.error(error);
        alert("Failed to assign course");
      }
    }

    assignCourse();
    console.log(row.original, data.source);
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
            className="px-2 py-2 text-center items-center justify-center flex"
            style={{
              width: cell.column.getSize(),
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
}
