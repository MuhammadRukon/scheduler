import type { HeaderGroup, Row, Table } from "@tanstack/react-table";
import type { VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";
import type { Teacher } from "../../types/sheduler";

export interface DataTableProps<T, S> {
  table: Table<T>;
  tableContainerRef: RefObject<HTMLDivElement>;
  sortable: S;
  title?: string;
  refetch: () => void;
}

export interface HeaderProps<T, S> {
  headerGroups: HeaderGroup<T>[];
  sortable: S;
}

export interface TableBodyProps<T> {
  table: Table<T>;
  tableContainerRef: RefObject<HTMLDivElement | null>;
  refetch: () => void;
}

export interface TableBodyRowProps<T> {
  row: Row<T>;
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  refetch: () => void;
}

export interface DragData {
  source: Teacher;
  courseId: string;
}
