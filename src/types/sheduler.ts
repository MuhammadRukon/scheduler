export enum Division {
  MS = "MS",
  HS = "HS",
}

export enum Color {
  C6 = "#F0DD86",
  C7 = "#A7D883",
  C8 = "#F4C0DB",
  C9 = "#FEF009",
  C10 = "#58A168",
  HL1 = "#4882E1",
  HL2 = "#00AA00",
  Other = "#4D9BF7",
}

export type Sortable = {
  availablePeriods: boolean;
  preps: boolean;
  students: boolean;
  maxLoad: boolean;
  otherRoles: boolean;
  id: boolean;
  name: boolean;
  division: boolean;
};

export enum CourseGroup {
  C6 = "C6",
  C7 = "C7",
  C8 = "C8",
  C9 = "C9",
  C10 = "C10",
  HL1 = "HL1",
  HL2 = "HL2",
  Other = "Other",
}

export const CourseColorMap: Record<CourseGroup, Color> = {
  [CourseGroup.C6]: Color.C6,
  [CourseGroup.C7]: Color.C7,
  [CourseGroup.C8]: Color.C8,
  [CourseGroup.C9]: Color.C9,
  [CourseGroup.C10]: Color.C10,
  [CourseGroup.HL1]: Color.HL1,
  [CourseGroup.HL2]: Color.HL2,
  [CourseGroup.Other]: Color.Other,
};

export interface Course {
  id: string;
  name: string;
  total_students: number | null;
  total_sections: number | null;
  total_periods: number | null;
  periods_per_cycle: number | null;
  students_per_section: number | null;
  group: CourseGroup;
}

//Teacher DTO
export interface Teacher {
  id: string;
  name: string;
  division: Division;
  otherRoles: string[];
  maxLoad: number;
  courses: (Course & { periods: number })[];
  // cpts: number;
}
