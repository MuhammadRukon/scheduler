import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnMeta,
  type RowData,
} from "@tanstack/react-table";

import {
  CourseColorMap,
  Division,
  sortable,
  type Course,
  type Sortable,
  type Teacher,
} from "../types/sheduler";
import DataTable from "./data-table";

export interface CustomColumnMeta extends ColumnMeta<RowData, unknown> {
  color: string;
  group: string;
}

export function SchedulerGrid() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [refetch, setRefetch] = useState(false);

  const [data, setData] = useState<Teacher[]>([]);

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
  }, [refetch]);

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
        id: "preps",
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
        id: course.id,
        header: () => <p>{course.name}</p>,
        accessorFn: (row: Teacher) =>
          row.courses.find((c) => c.id === course.id)?.periods || 0,
        meta: { group: course.group, color: CourseColorMap[course.group] },
      })),
    ],
    [courses]
  );

  //refs for table containers. needed for virtualization
  const tableMsContainerRef = useRef<HTMLDivElement>(null);
  const tableHsContainerRef = useRef<HTMLDivElement>(null);

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
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const hsTable = useReactTable({
    data: hsTeachers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  //refetch function used after Patch / put request.
  const onRefetch = useCallback(() => setRefetch((prev) => !prev), []);

  const groups = [...new Set(courses?.map((course) => course.group))];

  return (
    <div className="space-y-4">
      <div className="absolute top-5 left-1/2 -translate-x-1/2 flex flex-wrap mb-4 gap-5">
        {groups.map((group) => {
          //check if all columns in the group are visible
          const isGroupVisible = msTable
            .getAllColumns()
            .filter(
              (c) => (c.columnDef.meta as CustomColumnMeta)?.group === group
            )
            .every((c) => c.getIsVisible());

          return (
            <label key={group} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={isGroupVisible}
                onChange={() => {
                  //next toggle state for the group
                  const nextToggle = !isGroupVisible;

                  msTable.setColumnVisibility((old) => {
                    const visibilityUpdate = { ...old };
                    msTable
                      .getAllColumns()
                      .filter(
                        (c) =>
                          (c.columnDef.meta as CustomColumnMeta)?.group ===
                          group
                      )
                      .forEach((c) => (visibilityUpdate[c.id] = nextToggle));
                    return visibilityUpdate;
                  });
                }}
              />
              {group}
            </label>
          );
        })}
      </div>

      <DataTable<Teacher, Sortable>
        title="MS Teachers"
        table={msTable}
        tableContainerRef={tableMsContainerRef as RefObject<HTMLDivElement>}
        sortable={sortable}
        refetch={onRefetch}
      />
      <DataTable<Teacher, Sortable>
        title="HS Teachers"
        table={hsTable}
        tableContainerRef={tableHsContainerRef as RefObject<HTMLDivElement>}
        sortable={sortable}
        refetch={onRefetch}
      />
    </div>
  );
}
